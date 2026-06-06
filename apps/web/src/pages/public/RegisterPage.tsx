import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { registerSchema } from '@bezon/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Storefront,
  UserPlus,
  Key,
  Envelope,
  Phone,
  User as UserIcon,
} from '@phosphor-icons/react';

export const RegisterPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = registerSchema.safeParse({
      name,
      email,
      phone,
      password,
    });
    if (!validationResult.success) {
      toast.warning(validationResult.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(API_ENDPOINTS.auth.register, {
        name,
        email,
        phone: phone || undefined,
        password,
      });
      if (response.data.success) {
        toast.success('Registration successful! Please login.');
        navigate('/login');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
            <Storefront className="h-10 w-10 text-teal-400" />
            <span>Bezon</span>
          </div>

          <div className="relative z-10 max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">
              Start Shopping Today.
            </h1>
            <p className="text-teal-100/70 text-lg leading-relaxed">
              Create your account to unlock exclusive member offers, track your
              orders, and enjoy faster checkout.
            </p>
          </div>

          <div className="relative z-10 text-sm text-teal-500 font-medium">
            &copy; {new Date().getFullYear()} Bezon Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex items-center justify-center lg:col-span-2 p-6 sm:p-12 relative overflow-y-auto max-h-screen">
        <Link
          to="/"
          className="absolute top-8 right-8 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:block"
        >
          Back to Shop
        </Link>
        <div className="w-full max-w-md flex flex-col justify-center py-8">
          <div className="lg:hidden flex items-center gap-2 font-bold text-2xl text-teal-800 mb-8">
            <Storefront className="h-8 w-8 text-teal-700" />
            <span>Bezon</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Create an account
            </h2>
            <p className="text-zinc-500 mt-2">
              Join the Bezon multi-actor marketplace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-zinc-900">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <UserIcon className="h-5 w-5" />
                </span>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500 rounded-xl text-base"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-zinc-900">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <Envelope className="h-5 w-5" />
                </span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500 rounded-xl text-base"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-zinc-900">
                Phone Number{' '}
                <span className="text-zinc-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <Phone className="h-5 w-5" />
                </span>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500 rounded-xl text-base"
                  placeholder="+919876543210"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-zinc-900">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <Key className="h-5 w-5" />
                </span>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500 rounded-xl text-base"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 font-bold text-base mt-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg shadow-zinc-900/10 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <p className="text-sm text-zinc-500 text-center mt-8">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-teal-700 font-extrabold hover:text-teal-800 transition-colors hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
