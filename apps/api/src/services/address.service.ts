import { Prisma } from '@prisma/client';
import prisma from '../db/client.js';

export class AddressService {
  /**
   * Fetch all addresses for a given user
   */
  static async getUserAddresses(userId: string) {
    return await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' }, // default first
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Create a new address for a user
   */
  static async createAddress(userId: string, data: {
    label: string;
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isDefault?: boolean;
    lat?: number | null;
    lng?: number | null;
  }) {
    const { label, fullName, phone, line1, line2, city, state, pincode, country, isDefault = false, lat, lng } = data;

    // Check if this is the first address of the user. If so, force it to be default.
    const addressCount = await prisma.address.count({ where: { userId } });
    const shouldBeDefault = addressCount === 0 ? true : isDefault;

    return await prisma.$transaction(async (tx) => {
      // If this address is set as default, clear default status for all other addresses of the user
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return await tx.address.create({
        data: {
          userId,
          label,
          fullName,
          phone,
          line1,
          line2: line2 || null,
          city,
          state,
          pincode,
          country: country || 'India',
          isDefault: shouldBeDefault,
          lat: lat !== undefined && lat !== null ? new Prisma.Decimal(lat) : null,
          lng: lng !== undefined && lng !== null ? new Prisma.Decimal(lng) : null,
        },
      });
    });
  }

  /**
   * Update an address for a user
   */
  static async updateAddress(userId: string, addressId: string, data: {
    label?: string;
    fullName?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    isDefault?: boolean;
    lat?: number | null;
    lng?: number | null;
  }) {
    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) {
      const err = new Error('Address not found or unauthorized.');
      (err as any).status = 404;
      throw err;
    }

    const { label, fullName, phone, line1, line2, city, state, pincode, country, isDefault, lat, lng } = data;

    return await prisma.$transaction(async (tx) => {
      // If setting this address as default, unset other defaults
      if (isDefault === true) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return await tx.address.update({
        where: { id: addressId },
        data: {
          label: label !== undefined ? label : existing.label,
          fullName: fullName !== undefined ? fullName : existing.fullName,
          phone: phone !== undefined ? phone : existing.phone,
          line1: line1 !== undefined ? line1 : existing.line1,
          line2: line2 !== undefined ? line2 : existing.line2,
          city: city !== undefined ? city : existing.city,
          state: state !== undefined ? state : existing.state,
          pincode: pincode !== undefined ? pincode : existing.pincode,
          country: country !== undefined ? country : existing.country,
          isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
          lat: lat !== undefined ? (lat !== null ? new Prisma.Decimal(lat) : null) : existing.lat,
          lng: lng !== undefined ? (lng !== null ? new Prisma.Decimal(lng) : null) : existing.lng,
        },
      });
    });
  }

  /**
   * Delete an address
   */
  static async deleteAddress(userId: string, addressId: string) {
    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) {
      const err = new Error('Address not found or unauthorized.');
      (err as any).status = 404;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: addressId } });

      // If the deleted address was default, set another remaining address as default
      if (existing.isDefault) {
        const remaining = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (remaining) {
          await tx.address.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }
    });
  }
}
