import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Store, LogIn, KeyRound, Mail, Info } from 'lucide-react';

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
    if (!email || !password) {
      toast.warning('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in!');
      navigate(from === '/' ? '/login' : from, { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Left Banner */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-white">
          <Store className="h-8 w-8 text-primary" />
          <span>Bezon</span>
        </Link>
        <div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">Unified Login for the Entire Ecosystem</h2>
          <p className="text-slate-400 text-lg">One portal for Customers, Sellers, Couriers, and Platform Operators. Connect your operations in real time.</p>
        </div>
        <p className="text-slate-500 text-sm">Powered by TypeScript, Express, Prisma, and PostgreSQL.</p>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="md:hidden flex items-center gap-2 font-bold text-2xl text-primary mb-4">
              <Store className="h-7 w-7 text-primary" />
              <span>Bezon</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to manage your e-commerce operations</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="name@bezon.app"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/95 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-md shadow-primary/10 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-3">
              <Info className="h-4 w-4 text-slate-400" />
              <span>Click to auto-fill demo credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fillCredentials('customer1@bezon.app', 'Customer@1234')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left"
              >
                Customer Account
              </button>
              <button
                onClick={() => fillCredentials('seller1@bezon.app', 'Seller@1234')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left"
              >
                Seller Account
              </button>
              <button
                onClick={() => fillCredentials('delivery1@bezon.app', 'Delivery@1234')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left"
              >
                Delivery Courier
              </button>
              <button
                onClick={() => fillCredentials('admin@bezon.app', 'Admin@1234')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left"
              >
                Platform Admin
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            New customer? <Link to="/register" className="text-primary font-semibold hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
