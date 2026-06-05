import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
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

export const BecomeDeliveryPartnerPage: React.FC = () => {
  const { user, checkAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleType: 'bike',
    vehicleNumber: '',
    aadhaarNumber: '',
    panNumber: '',
    drivingLicense: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (user?.deliveryPartner) {
      setFormData({
        vehicleType: user.deliveryPartner.vehicleType || 'bike',
        vehicleNumber: user.deliveryPartner.vehicleNumber || '',
        aadhaarNumber: user.deliveryPartner.aadhaarNumber || '',
        panNumber: user.deliveryPartner.panNumber || '',
        drivingLicense: user.deliveryPartner.drivingLicense || '',
        emergencyContactName: user.deliveryPartner.emergencyContactName || '',
        emergencyContactPhone: user.deliveryPartner.emergencyContactPhone || '',
        addressLine: user.deliveryPartner.addressLine || '',
        city: user.deliveryPartner.city || '',
        state: user.deliveryPartner.state || '',
        pincode: user.deliveryPartner.pincode || '',
      });
    }
  }, [user]);

  // If already approved, redirect to delivery dashboard
  useEffect(() => {
    if (user?.deliveryPartner?.status === 'approved') {
      navigate('/delivery');
    }
  }, [user, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post(
        '/api/v1/applications/delivery/apply',
        formData,
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await checkAuth(); // Refresh user data
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

  if (user?.deliveryPartner?.status === 'suspended') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <Card className="border-rose-100 bg-rose-50/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-rose-800 flex items-center gap-2">
              <ShieldWarning className="h-6 w-6 text-rose-600" />
              Delivery Partner Account Suspended
            </CardTitle>
            <CardDescription>
              You are currently unable to apply or access the delivery portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-700 text-sm">
              Your delivery partner account has been suspended by an
              administrator due to policy violations or review guidelines.
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

  if (user?.deliveryPartner?.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Application Pending</CardTitle>
            <CardDescription>
              Your application to become a delivery partner is currently under
              review by our administrators.
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
          <CardTitle className="text-2xl">Become a Delivery Partner</CardTitle>
          <CardDescription>
            {user?.deliveryPartner?.status === 'rejected'
              ? 'Your previous application was rejected. You can re-apply by submitting updated information below.'
              : 'Fill out the form below to apply to deliver orders on our platform.'}
          </CardDescription>
          {user?.deliveryPartner?.status === 'rejected' &&
            user?.deliveryPartner?.rejectionReason && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
                <span className="font-semibold">Rejection Reason: </span>
                {user.deliveryPartner.rejectionReason}
              </div>
            )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Identity & Documentation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Aadhaar Number *
                  </label>
                  <Input
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleChange}
                    placeholder="12-digit Aadhaar"
                    required
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
              <h3 className="text-lg font-medium">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vehicle Type *</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Vehicle Registration Number
                  </label>
                  <Input
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    placeholder="E.g., KA-01-AB-1234"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    Driving License Number
                  </label>
                  <Input
                    name="drivingLicense"
                    value={formData.drivingLicense}
                    onChange={handleChange}
                    placeholder="DL Number"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Name *</label>
                  <Input
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Phone *</label>
                  <Input
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address</h3>
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
