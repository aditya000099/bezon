import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { ArrowLeft, User, Phone, Image as ImageIcon, Save, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// A list of cool, beautiful preset avatars the user can click to quickly choose a profile photo!
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop"
];

export const EditProfilePage: React.FC = () => {
  // We get the current user details and a way to refresh them from our Auth Context!
  const { user, checkAuth } = useAuth();
  // We get a notification toaster function to show cute popup alerts!
  const { toast } = useToast();
  // Navigation hook to let us change pages programmatically!
  const navigate = useNavigate();

  // Form states to store what the user types!
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fill in the inputs with existing user data when the page loads!
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  // When the user clicks the "Save Changes" button, this function runs!
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verification: Name cannot be empty!
    if (!name.trim()) {
      toast.warning("Please enter your name.");
      return;
    }

    setSubmitting(true);

    try {
      // Call the PUT API we just created on the backend to update our profile!
      const response = await api.put(API_ENDPOINTS.auth.updateProfile, {
        name,
        phone,
        avatarUrl
      });

      if (response.data.success) {
        toast.success("Your profile has been successfully updated!");
        // Refresh our Auth Context state so the entire header/app reflects our new profile details!
        await checkAuth();
        // Take us back to the profile dashboard page!
        navigate("/shop/profile");
      } else {
        toast.error(response.data.message || "Failed to update profile.");
      }
    } catch (err: any) {
      console.error("Profile update error:", err);
      toast.error(
        err.response?.data?.message || "An error occurred while saving your profile."
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
          to="/shop/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
          <CardTitle className="text-2xl font-extrabold text-slate-800">
            Edit Your Profile
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Update your personal details and customize your profile image.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 sm:p-8 flex flex-col gap-6">
            
            {/* Profile Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
              {/* Left Column: Avatar Preview */}
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar Preview"
                    className="h-20 w-20 rounded-full object-cover border-4 border-indigo-50 shadow-md"
                    onError={(e) => {
                      // Fallback if image URL is invalid or broken
                      (e.target as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
                    }}
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center text-indigo-500 text-2xl font-bold shadow-sm">
                    {name?.charAt(0).toUpperCase() || <User className="h-8 w-8" />}
                  </div>
                )}
              </div>

              {/* Right Column: Preset Choice Grid */}
              <div className="flex-1 text-center sm:text-left">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Select a Cool Profile Photo
                </label>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`h-11 w-11 rounded-full overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                        avatarUrl === url
                          ? "border-indigo-600 ring-2 ring-indigo-100 scale-105"
                          : "border-transparent hover:border-slate-300"
                      }`}
                    >
                      <img src={url} alt="preset avatar" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* General Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Full Name input field */}
              <div className="flex flex-col gap-2">
                <label htmlFor="name-input" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Full Name
                </label>
                <Input
                  id="name-input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-100 h-11"
                  required
                />
              </div>

              {/* Phone number input field */}
              <div className="flex flex-col gap-2">
                <label htmlFor="phone-input" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone Number
                </label>
                <Input
                  id="phone-input"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-100 h-11"
                />
              </div>

              {/* Profile Image custom URL input field */}
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label htmlFor="avatar-input" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> Custom Avatar Image URL
                </label>
                <Input
                  id="avatar-input"
                  placeholder="Paste any custom picture URL here..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-100 h-11 text-xs"
                />
              </div>

              {/* Email (Disabled, secure) */}
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-300" /> Secure Email Address
                </label>
                <Input
                  disabled
                  value={user?.email || ""}
                  className="rounded-xl border-slate-100 bg-slate-50 text-slate-400 h-11 cursor-not-allowed border"
                />
                <span className="text-[11px] font-semibold text-slate-400">
                  Your secure email address is used for password recovery and logins. To change it, please contact support.
                </span>
              </div>

            </div>

          </CardContent>

          <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-end gap-3">
            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/shop/profile")}
              className="w-full sm:w-auto rounded-xl border-slate-200 hover:bg-slate-100 font-bold"
            >
              Cancel
            </Button>
            {/* Save Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center justify-center gap-2 h-11 px-6 shadow-sm shadow-indigo-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
