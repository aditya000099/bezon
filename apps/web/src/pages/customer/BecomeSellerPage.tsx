import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { ShieldWarning } from '@phosphor-icons/react';

export const BecomeSellerPage: React.FC = () => {
  const { user, checkAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    shopSlug: '',
    description: '',
    gstin: '',
    panNumber: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (user?.seller) {
      setFormData({
        shopName: user.seller.shopName || '',
        shopSlug: user.seller.shopSlug || '',
        description: user.seller.description || '',
        gstin: user.seller.gstin || '',
        panNumber: user.seller.panNumber || '',
        addressLine: user.seller.addressLine || '',
        city: user.seller.city || '',
        state: user.seller.state || '',
        pincode: user.seller.pincode || '',
      });
    }
  }, [user]);

  // If already approved, redirect to seller dashboard
  useEffect(() => {
    if (user?.seller?.status === 'approved') {
      navigate('/seller');
    }
  }, [user, navigate]);

  // If pending, just show a message, but let them read it.
  // Actually, we should probably let them know if it's pending.

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const generateSlug = () => {
    if (formData.shopName) {
      setFormData((prev) => ({
        ...prev,
        shopSlug: formData.shopName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/v1/applications/apply', formData);
      if (response.data.success) {
        toast.success(response.data.message);
        await checkAuth(); // Refresh user data to get updated seller status
        navigate('/shop/profile');
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to submit application.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (user?.seller?.status === 'suspended') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <Card className="border-rose-100 bg-rose-50/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-rose-800 flex items-center gap-2">
              <ShieldWarning className="h-6 w-6 text-rose-600" />
              Seller Account Suspended
            </CardTitle>
            <CardDescription>
              You are currently unable to apply or access the seller portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-700 text-sm">
              Your seller account has been suspended by an administrator due to
              policy violations or review guidelines.
            </p>
            <p className="text-zinc-400 text-xs mt-2">
              To appeal this suspension, or to get more information, please
              contact our support team.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => navigate('/shop/profile')}
              variant="outline"
              className="w-full"
            >
              Return to Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (user?.seller?.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Application Pending</CardTitle>
            <CardDescription>
              Your application to become a seller is currently under review by
              our administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              We will notify you once a decision has been made. Thank you for
              your patience!
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/shop/profile')} variant="outline">
              Return to Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Become a Seller</CardTitle>
          <CardDescription>
            {user?.seller?.status === 'rejected'
              ? 'Your previous application was rejected. You can re-apply by submitting updated information below.'
              : 'Fill out the form below to apply to sell your products on our platform.'}
          </CardDescription>
          {user?.seller?.status === 'rejected' &&
            user?.seller?.rejectionReason && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
                <span className="font-semibold">Rejection Reason: </span>
                {user.seller.rejectionReason}
              </div>
            )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Store Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name *</label>
                  <Input
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    onBlur={generateSlug}
                    placeholder="E.g., Acme Electronics"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Store URL Slug *
                  </label>
                  <Input
                    name="shopSlug"
                    value={formData.shopSlug}
                    onChange={handleChange}
                    placeholder="acme-electronics"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your store and what you sell..."
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    GST Number (Optional)
                  </label>
                  <Input
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="15-character GSTIN"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">PAN Number *</label>
                  <Input
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="10-character PAN"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Address</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address Line *</label>
                <Input
                  name="addressLine"
                  value={formData.addressLine}
                  onChange={handleChange}
                  placeholder="Street address, building, floor"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City *</label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">State *</label>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">PIN Code *</label>
                  <Input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/shop/profile')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
