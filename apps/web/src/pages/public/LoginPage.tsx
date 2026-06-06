import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { loginSchema } from '@bezon/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Envelope,
  Key,
  Info,
  ShieldCheck,
  Lightning,
  StorefrontIcon,
} from '@phosphor-icons/react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      toast.warning(validationResult.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Successfully logged in!');

      let redirectPath = '/';
      if (user.role === 'admin') redirectPath = '/admin';
      else if (user.role === 'seller') redirectPath = '/seller';
      else if (user.role === 'delivery') redirectPath = '/delivery';

      const finalRedirect =
        from === '/' || from === '/login' ? redirectPath : from;
      navigate(finalRedirect, { replace: true });
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          'Login failed. Please check credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
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
              Your Ultimate Shopping Destination.
            </h1>
            <p className="text-teal-100/70 text-lg leading-relaxed">
              Discover millions of products, unbeatable deals, and fast delivery—all in one place.
            </p>
          </div>

          <div className="relative z-10 text-sm text-teal-500 font-medium">
            &copy; {new Date().getFullYear()} Bezon Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex items-center justify-center lg:col-span-2 p-6 sm:p-12 relative">
        <Link
          to="/"
          className="absolute top-8 right-8 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Back to Shop
        </Link>
        <div className="w-full max-w-md flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-2 font-bold text-2xl text-teal-800 mb-8">
            <StorefrontIcon className="h-8 w-8 text-teal-700" />
            <span>Bezon</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Welcome back
            </h2>
            <p className="text-zinc-500 mt-2">
              Sign in to manage your e-commerce operations
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="name@bezon.app"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-zinc-900">
                  Password
                </label>
                <Link
                  to="#"
                  className="text-xs font-bold text-teal-600 hover:text-teal-700"
                >
                  Forgot password?
                </Link>
              </div>
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
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-8 border-t border-zinc-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
              <Info className="h-4 w-4 text-teal-600" />
              <span>Quick demo accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  fillCredentials('customer1@bezon.app', 'Customer@1234')
                }
                className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-sm px-4 py-2.5 rounded-xl font-bold transition-colors text-left flex items-center justify-between group"
              >
                Customer{' '}
                <span className="text-[10px] text-zinc-400 font-semibold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  Fill
                </span>
              </button>
              <button
                onClick={() =>
                  fillCredentials('seller1@bezon.app', 'Seller@1234')
                }
                className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-sm px-4 py-2.5 rounded-xl font-bold transition-colors text-left flex items-center justify-between group"
              >
                Seller{' '}
                <span className="text-[10px] text-zinc-400 font-semibold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  Fill
                </span>
              </button>
              <button
                onClick={() =>
                  fillCredentials('delivery1@bezon.app', 'Delivery@1234')
                }
                className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-sm px-4 py-2.5 rounded-xl font-bold transition-colors text-left flex items-center justify-between group"
              >
                Delivery{' '}
                <span className="text-[10px] text-zinc-400 font-semibold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  Fill
                </span>
              </button>
              <button
                onClick={() => fillCredentials('admin@bezon.app', 'Admin@1234')}
                className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-sm px-4 py-2.5 rounded-xl font-bold transition-colors text-left flex items-center justify-between group"
              >
                Admin{' '}
                <span className="text-[10px] text-zinc-400 font-semibold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  Fill
                </span>
              </button>
            </div>
          </div>

          <p className="text-sm text-zinc-500 text-center mt-8">
            New to Bezon?{' '}
            <Link
              to="/register"
              className="text-teal-700 font-extrabold hover:text-teal-800 transition-colors hover:underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
