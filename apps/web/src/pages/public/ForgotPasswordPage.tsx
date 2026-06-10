import { Button, Input } from "@bezon/ui";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import {
  EnvelopeIcon,
  KeyIcon,
  StorefrontIcon,
  LockKeyIcon,
  NumberCircleOne,
  NumberCircleTwo,
  NumberCircleThree
} from "@phosphor-icons/react";

export const ForgotPasswordPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Recover email from local storage if page reloads
  useEffect(() => {
    const savedEmail = localStorage.getItem("reset_email");
    const savedStep = localStorage.getItem("reset_step");
    if (savedEmail) setEmail(savedEmail);
    if (savedStep) setStep(parseInt(savedStep) as any);
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.auth.forgotPassword, { email });
      toast.success("If an account exists, an OTP has been sent to your email.");
      localStorage.setItem("reset_email", email);
      localStorage.setItem("reset_step", "2");
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to request OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) return;

    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.auth.verifyOtp, { email, otp });
      toast.success("OTP verified successfully!");
      localStorage.setItem("reset_step", "3");
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !password) return;

    if (password.length < 8) {
      toast.warning("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.auth.resetPassword, { email, otp, password });
      toast.success("Password reset successful! You can now log in.");
      localStorage.removeItem("reset_email");
      localStorage.removeItem("reset_step");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-5 bg-white">
      {/* Left side - Visual/Brand */}
      <div className="hidden lg:flex lg:col-span-3 p-4">
        <div className="w-full h-full flex flex-col justify-between bg-teal-950 p-12 text-white relative overflow-hidden rounded-[2.5rem]">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/40 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

          <div className="relative z-10 flex items-center gap-2 font-bold text-3xl">
            <StorefrontIcon className="h-10 w-10 text-teal-400" />
            <span>Bezon</span>
          </div>

          <div className="relative z-10 max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">
              Password Recovery
            </h1>
            <p className="text-teal-100/70 text-lg leading-relaxed">
              Don't worry, happens to the best of us. Let's get you back into your account securely.
            </p>
            
            <div className="mt-12 space-y-6">
              <div className={"flex items-center gap-4 " + (step >= 1 ? 'opacity-100' : 'opacity-40')}>
                <NumberCircleOne weight={step >= 1 ? "fill" : "regular"} className={"h-8 w-8 " + (step >= 1 ? 'text-teal-400' : 'text-teal-600')} />
                <span className="text-lg font-medium">Verify your email address</span>
              </div>
              <div className={"flex items-center gap-4 " + (step >= 2 ? 'opacity-100' : 'opacity-40')}>
                <NumberCircleTwo weight={step >= 2 ? "fill" : "regular"} className={"h-8 w-8 " + (step >= 2 ? 'text-teal-400' : 'text-teal-600')} />
                <span className="text-lg font-medium">Enter 6-digit OTP code</span>
              </div>
              <div className={"flex items-center gap-4 " + (step >= 3 ? 'opacity-100' : 'opacity-40')}>
                <NumberCircleThree weight={step >= 3 ? "fill" : "regular"} className={"h-8 w-8 " + (step >= 3 ? 'text-teal-400' : 'text-teal-600')} />
                <span className="text-lg font-medium">Create a new password</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-sm text-teal-500 font-medium">
            &copy; {new Date().getFullYear()} Bezon Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center lg:col-span-2 p-6 sm:p-12 relative">
        <Link
          to="/login"
          className="absolute top-8 right-8 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Back to Login
        </Link>

        <div className="w-full max-w-md flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-2 font-bold text-2xl text-teal-800 mb-8">
            <StorefrontIcon className="h-8 w-8 text-teal-700" />
            <span>Bezon</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              {step === 1 && "Forgot password?"}
              {step === 2 && "Enter OTP"}
              {step === 3 && "Set new password"}
            </h2>
            <p className="text-zinc-500 mt-2">
              {step === 1 && "Enter your email address to receive a 6-digit verification code."}
              {step === 2 && "We've sent a code to " + email + ". Valid for 5 minutes."}
              {step === 3 && "Create a new strong password for your account."}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-zinc-900">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <EnvelopeIcon className="h-5 w-5" />
                  </span>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500 rounded-xl text-base"
                    placeholder="name@bezon.app"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 font-bold text-base mt-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg shadow-zinc-900/10 transition-all active:scale-[0.98]"
                disabled={loading || !email}
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-zinc-900">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <KeyIcon className="h-5 w-5" />
                  </span>
                  <Input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500 rounded-xl text-base tracking-widest font-mono text-center"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 font-bold text-base mt-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg shadow-zinc-900/10 transition-all active:scale-[0.98]"
                disabled={loading || otp.length < 6}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-zinc-500 hover:text-zinc-900 font-semibold transition-colors"
                >
                  Didn't receive a code? Try again
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-zinc-900">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <LockKeyIcon className="h-5 w-5" />
                  </span>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500 rounded-xl text-base"
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 font-bold text-base mt-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg shadow-zinc-900/10 transition-all active:scale-[0.98]"
                disabled={loading || password.length < 8}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
