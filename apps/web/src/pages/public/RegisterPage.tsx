import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { Store, UserPlus, KeyRound, Mail, Phone, User } from 'lucide-react';

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
    if (!name || !email || !password) {
      toast.warning('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('/api/v1/auth/register', {
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Left Banner */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-white">
          <Store className="h-8 w-8 text-primary" />
          <span>Bezon</span>
        </Link>
        <div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">Start Your Shopping Journey</h2>
          <p className="text-slate-400 text-lg">Create a shopper profile and explore thousands of items from certified sellers with local instant dispatch.</p>
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
            <h1 className="text-2xl font-bold text-slate-800">Create Shopper Account</h1>
            <p className="text-sm text-slate-500 mt-1">Join the Bezon multi-actor marketplace</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="h-5 w-5" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="+919876543210"
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
                  <UserPlus className="h-5 w-5" />
                  <span>Register</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
