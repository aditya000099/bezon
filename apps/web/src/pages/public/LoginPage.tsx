import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { loginSchema } from '@bezon/validation';
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
import { Storefront, Envelope, Key, Info } from '@phosphor-icons/react';

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

      let redirectPath = '/shop';
      if (user.role === 'admin') redirectPath = '/admin';
      else if (user.role === 'seller') redirectPath = '/seller';
      else if (user.role === 'delivery') redirectPath = '/delivery';

      // Use 'from' if it's a specific deep link, otherwise default to role dashboard
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
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md border border-zinc-200 shadow-lg bg-white">
        <CardHeader className="space-y-1 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary mb-2">
            <Storefront className="h-7 w-7 text-primary" />
            <span>Bezon</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            Sign in to manage your e-commerce operations
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-zinc-700">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <Envelope className="h-4 w-4" />
                </span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="name@bezon.app"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-zinc-700">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <Key className="h-4 w-4" />
                </span>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full font-bold mt-2"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-2">
              <Info className="h-4 w-4 text-zinc-400" />
              <span>Click to auto-fill demo credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  fillCredentials('customer1@bezon.app', 'Customer@1234')
                }
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left"
              >
                Customer Account
              </button>
              <button
                onClick={() =>
                  fillCredentials('seller1@bezon.app', 'Seller@1234')
                }
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left"
              >
                Seller Account
              </button>
              <button
                onClick={() =>
                  fillCredentials('delivery1@bezon.app', 'Delivery@1234')
                }
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left"
              >
                Delivery Partner
              </button>
              <button
                onClick={() => fillCredentials('admin@bezon.app', 'Admin@1234')}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left"
              >
                Platform Admin
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t border-zinc-100 pt-4 text-center">
          <p className="text-xs text-zinc-500">
            New customer?{' '}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline"
            >
              Create account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
