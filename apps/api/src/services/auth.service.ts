import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db/client.js";
import type { UserRole } from "@bezon/types";
import { config } from "../config/env.config.js";

const JWT_SECRET = config.JWT_SECRET;

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export class AuthService {
  /**
   * Registers a new user and configures associated profiles (seller/delivery)
   */
  static async registerUser(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: string;
  }) {
    const { name, email, phone, password, role } = data;

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const err = new Error(
        "A user account with this email address already exists.",
      );
      (err as any).status = 409;
      throw err;
    }

    const VALID_ROLES = ["customer", "seller", "delivery", "admin"];
    const userRole = VALID_ROLES.includes(role)
      ? (role as UserRole)
      : "customer";

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and profile in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          passwordHash,
          role: userRole,
          isActive: true,
        },
      });

      // Automatically provision auxiliary profiles
      if (userRole === "seller") {
        const slug =
          name.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
          "-" +
          Math.random().toString(36).substring(2, 6);
        await tx.seller.create({
          data: {
            userId: user.id,
            shopName: `${name}'s Shop`,
            shopSlug: slug,
            status: "pending",
          },
        });
      }

      return user;
    });

    // Send Welcome Email
    try {
      const { sendEmail } = await import("./email.service.js");
      const subject = "Welcome to Bezon!";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #0f766e; text-align: center;">Welcome to Bezon!</h2>
          <p>Hi ${newUser.name},</p>
          <p>Thank you for creating an account with Bezon. We are thrilled to have you on board!</p>
          <p>Get ready to explore the best products at the best prices.</p>
          <p>Happy Shopping!</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 40px; text-align: center;">&copy; ${new Date().getFullYear()} Bezon Inc.</p>
        </div>
      `;
      // We don't want to fail the registration if the email fails to send,
      // so we use .catch() to handle the promise rejection.
      sendEmail(newUser.email, subject, html).catch((err) => {
        console.error("Failed to send welcome email:", err);
      });
    } catch (error) {
      console.error("Error setting up welcome email:", error);
    }

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };
  }

  /**
   * Log user in, verifying credentials and active status
   */
  static async loginUser(email: string, passwordPlain: string) {
    if (!email) {
      const err = new Error("Email is required for sign in.");
      (err as any).status = 400;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        seller: true,
        deliveryPartner: true,
      },
    });

    if (!user) {
      const err = new Error(
        "Invalid credentials. Please verify your email and password.",
      );
      (err as any).status = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error("Your account has been deactivated.");
      (err as any).status = 403;
      throw err;
    }

    // Verify password
    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      const err = new Error(
        "Invalid credentials. Please verify your email and password.",
      );
      (err as any).status = 401;
      throw err;
    }

    // Sign JWT token
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        seller: user.seller,
        deliveryPartner: user.deliveryPartner,
      },
      token,
    };
  }

  /**
   * Retrieves profile details for a logged-in user
   */
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        seller: {
          select: {
            id: true,
            shopName: true,
            shopSlug: true,
            status: true,
            rejectionReason: true,
            description: true,
            gstin: true,
            panNumber: true,
            addressLine: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
      },
    });

    if (!user) {
      const err = new Error("User account not found.");
      (err as any).status = 404;
      throw err;
    }

    let deliveryPartner = null;
    try {
      deliveryPartner = await prisma.deliveryPartner.findUnique({
        where: { userId },
        select: {
          id: true,
          status: true,
          vehicleType: true,
          vehicleNumber: true,
          isAvailable: true,
          aadhaarNumber: true,
          panNumber: true,
          drivingLicense: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          rejectionReason: true,
          addressLine: true,
          city: true,
          state: true,
          pincode: true,
        },
      });
    } catch (e: any) {
      // Gracefully handle unmigrated database columns so other user features don't crash
      console.warn(
        `DeliveryPartner query failed (likely pending DB migration): ${e.message}`,
      );
    }

    return { ...user, deliveryPartner };
  }

  /**
   * Updates user details (name, phone, avatarUrl)
   */
  static async updateUserProfile(
    userId: string,
    data: { name?: string; phone?: string; avatarUrl?: string },
  ) {
    const { name, phone, avatarUrl } = data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err = new Error("User account not found.");
      (err as any).status = 404;
      throw err;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : user.name,
        phone: phone !== undefined ? phone : user.phone,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    return updatedUser;
  }

  // --- Password Reset Flow ---

  /**
   * Generates a 6-digit OTP, stores it in memory (5 min expiry), and sends it to user email.
   */
  static async generatePasswordResetOtp(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success silently for security, or throw an error based on preference
      // In many systems, we pretend it worked to prevent email enumeration.
      return;
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(email, { otp, expiresAt });

    // Send email via mailgun
    try {
      const { sendEmail } = await import("./email.service.js");

      const subject = "Your Password Reset OTP";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #0f766e; text-align: center;">Bezon Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password. Use the OTP below to proceed. It is valid for 5 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; background-color: #f3f4f6; padding: 10px 20px; border-radius: 8px; letter-spacing: 5px; color: #1f2937;">${otp}</span>
          </div>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 40px; text-align: center;">&copy; ${new Date().getFullYear()} Bezon Inc.</p>
        </div>
      `;
      // In development mode, always log the OTP to console so testing is easy
      if (process.env.NODE_ENV === "development") {
        console.log(`\n=========================================`);
        console.log(`[DEV] Password Reset OTP for ${email}: ${otp}`);
        console.log(`=========================================\n`);
      }

      await sendEmail(email, subject, html);
    } catch (error: any) {
      console.error("Email Error:", error);
      
      // If we are in development, allow the flow to continue even if email sending fails
      if (process.env.NODE_ENV === "development") {
        console.warn("Continuing password reset flow despite email error (Development Mode).");
        return;
      }

      const err = new Error(
        "Failed to send email. Please check email service configuration.",
      );
      (err as any).status = 500;
      throw err;
    }
  }

  /**
   * Verifies if the provided OTP matches the one in the store and hasn't expired.
   */
  static verifyPasswordResetOtp(email: string, otp: string) {
    const record = otpStore.get(email);
    if (!record) {
      const err = new Error(
        "OTP not found or expired. Please request a new one.",
      );
      (err as any).status = 400;
      throw err;
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      const err = new Error("OTP has expired. Please request a new one.");
      (err as any).status = 400;
      throw err;
    }

    if (record.otp !== otp) {
      const err = new Error("Invalid OTP. Please try again.");
      (err as any).status = 400;
      throw err;
    }

    return true;
  }

  /**
   * Resets the user's password using the verified OTP, then removes it from the store.
   */
  static async resetPasswordWithOtp(
    email: string,
    otp: string,
    newPasswordPlain: string,
  ) {
    // Re-verify just to be safe
    this.verifyPasswordResetOtp(email, otp);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const err = new Error("User not found.");
      (err as any).status = 404;
      throw err;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPasswordPlain, salt);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Delete the OTP after successful reset
    otpStore.delete(email);
  }
}
