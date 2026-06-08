import { logger } from '@/utils/logger';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@bezon/ui';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  Image as ImageIcon,
  FloppyDiskIcon,
  EnvelopeIcon,
  SpinnerIcon,
} from '@phosphor-icons/react';
// A list of cool, beautiful preset avatars the user can click to quickly choose a profile photo!
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop',
];

export const EditProfilePage: React.FC = () => {
  // We get the current user details and a way to refresh them from our Auth Context!
  const { user, checkAuth } = useAuth();
  // We get a notification toaster function to show cute popup alerts!
  const { toast } = useToast();
  // Navigation hook to let us change pages programmatically!
  const navigate = useNavigate();

  // Form states to store what the user types!
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fill in the inputs with existing user data when the page loads!
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // When the user clicks the "FloppyDiskIcon Changes" button, this function runs!
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verification: Name cannot be empty!
    if (!name.trim()) {
      toast.warning('Please enter your name.');
      return;
    }

    setSubmitting(true);

    try {
      // Call the PUT API we just created on the backend to update our profile!
      const response = await api.put(API_ENDPOINTS.auth.updateProfile, {
        name,
        phone,
        avatarUrl,
      });

      if (response.data.success) {
        toast.success('Your profile has been successfully updated!');
        // Refresh our Auth Context state so the entire header/app reflects our new profile details!
        await checkAuth();
        // Take us back to the profile dashboard page!
        navigate('/profile');
      } else {
        toast.error(response.data.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      logger.error('Profile update error:', err);
      toast.error(
        err.response?.data?.message ||
          'An error occurred while saving your profile.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Back button link to return to the profile view */}
      <div className="flex items-center">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <Card className="border-0 shadow-none rounded-4xl overflow-hidden bg-zinc-50/80">
        <CardHeader className="bg-zinc-100/50 p-6 sm:p-10">
          <CardTitle className="text-2xl font-extrabold text-zinc-800">
            Edit Your Profile
          </CardTitle>
          <CardDescription className="text-zinc-500 font-medium">
            Update your personal details and customize your profile image.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 sm:p-8 flex flex-col gap-6">
            {/* Profile Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-zinc-200/50">
              {/* Left Column: Avatar Preview */}
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar Preview"
                    className="h-24 w-24 rounded-full object-cover border-[6px] border-white shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)]"
                    onError={(e) => {
                      // Fallback if image URL is invalid or broken
                      (e.target as any).src =
                        `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
                    }}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-teal-50 border-[6px] border-white flex items-center justify-center text-teal-500 text-3xl font-extrabold shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)]">
                    {name?.charAt(0).toUpperCase() || (
                      <UserIcon className="h-8 w-8" />
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Preset Choice Grid */}
              <div className="flex-1 text-center sm:text-left">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  Select a Cool Profile Photo
                </label>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`h-12 w-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${
                        avatarUrl === url
                          ? 'border-white ring-4 ring-teal-500/20 scale-110 shadow-md'
                          : 'border-white shadow-sm hover:border-zinc-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt="preset avatar"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* General Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name input field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="name-input"
                  className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <UserIcon className="h-3.5 w-3.5 text-zinc-400" /> Full Name
                </label>
                <Input
                  id="name-input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-zinc-200 bg-white focus:border-teal-500 focus:ring-teal-100 h-12 shadow-sm"
                  required
                />
              </div>

              {/* PhoneIcon number input field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="phone-input"
                  className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <PhoneIcon className="h-3.5 w-3.5 text-zinc-400" /> Phone
                  Number
                </label>
                <Input
                  id="phone-input"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border-zinc-200 bg-white focus:border-teal-500 focus:ring-teal-100 h-12 shadow-sm"
                />
              </div>

              {/* Profile Image custom URL input field */}
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label
                  htmlFor="avatar-input"
                  className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-zinc-400" /> Custom
                  Avatar Image URL
                </label>
                <Input
                  id="avatar-input"
                  placeholder="Paste any custom picture URL here..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="rounded-xl border-zinc-200 bg-white focus:border-teal-500 focus:ring-teal-100 h-12 text-xs shadow-sm"
                />
              </div>

              {/* Email (Disabled, secure) */}
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <EnvelopeIcon className="h-3.5 w-3.5 text-zinc-300" /> Secure
                  Email Address
                </label>
                <Input
                  disabled
                  value={user?.email || ''}
                  className="rounded-xl border-0 bg-zinc-100 text-zinc-400 h-12 cursor-not-allowed shadow-inner"
                />
                <span className="text-[11px] font-semibold text-zinc-400">
                  Your secure email address is used for password recovery and
                  logins. To change it, please contact support.
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-zinc-100/50 p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-end gap-4">
            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto rounded-xl border-0 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 font-bold h-12 px-6 shadow-sm"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold inline-flex items-center justify-center gap-2 h-11 px-6 shadow-sm shadow-teal-100"
            >
              {submitting ? (
                <>
                  <SpinnerIcon className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FloppyDiskIcon className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
