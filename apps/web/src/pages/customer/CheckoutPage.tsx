import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@bezon/ui';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { addressSchema } from '@bezon/validation';
import { ArrowLeftIcon } from '@phosphor-icons/react';

import { CheckoutAddressStep } from './components/CheckoutAddressStep';
import { CheckoutItemsStep } from './components/CheckoutItemsStep';
import { CheckoutCouponStep } from './components/CheckoutCouponStep';
import { CheckoutSummaryPanel } from './components/CheckoutSummaryPanel';
import { CheckoutRazorpayModal } from './components/CheckoutRazorpayModal';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, cartTotal, clearCart } = useCart();
  const { toast } = useToast();

  // Address form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [label, setLabel] = useState('HouseIcon');

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Interactive UI state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [razorpayOrderId, setRazorpayOrderId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    description: string;
    finalTotal: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.coupons.forCart);
        if (res.data.success) setAvailableCoupons(res.data.data);
      } catch (err: any) {
        logger.error(err);
      }
    };
    if (items.length > 0) fetchCoupons();
  }, [items.length]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const res = await api.get(API_ENDPOINTS.addresses.base);
        if (res.data.success) {
          const addresses = res.data.data;
          setSavedAddresses(addresses);
          if (addresses.length > 0) {
            const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr.id);
            populateForm(defaultAddr);
          } else {
            setSelectedAddressId('manual');
          }
        }
      } catch (err) {
        logger.error('Failed to load addresses', err);
        setSelectedAddressId('manual');
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, []);

  const populateForm = (addr: any) => {
    setLabel(addr.label || 'HouseIcon');
    setFullName(addr.fullName || '');
    setPhone(addr.phone || '');
    setLine1(addr.line1 || '');
    setLine2(addr.line2 || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setPincode(addr.pincode || '');
    setValidationErrors({});
  };

  const resetForm = () => {
    setLabel('HouseIcon');
    setFullName('');
    setPhone('');
    setLine1('');
    setLine2('');
    setCity('');
    setState('');
    setPincode('');
    setValidationErrors({});
  };

  // Group cart items by seller
  const groupedItems = items.reduce((acc, item) => {
    const sellerName = item.product?.title.includes('Headphones')
      ? 'Acoustic Labs'
      : 'Sartorial Goods';
    if (!acc[sellerName]) {
      acc[sellerName] = [];
    }
    acc[sellerName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const formData = {
      label,
      fullName,
      phone,
      line1,
      line2: line2 || undefined,
      city,
      state,
      pincode,
      country: 'India',
    };

    // Validate shipping address
    const result = addressSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setValidationErrors(errors);
      toast.warning('Please fix the shipping address details before checkout.');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty. Add items to checkout.');
      return;
    }

    setIsProcessing(true);
    try {
      const payload: any = {
        couponCode: appliedCoupon?.code || undefined,
      };

      if (selectedAddressId && selectedAddressId !== 'manual') {
        payload.addressId = selectedAddressId;
      } else {
        payload.address = formData;
      }

      const response = await api.post(API_ENDPOINTS.payments.createOrder, payload);

      if (response.data.success) {
        const { razorpayOrderId: newOrderId, amount, keyId, isMock } = response.data.data;
        
        if (isMock) {
          // Fallback to custom checkout modal
          setRazorpayOrderId(newOrderId);
          setIsRazorpayOpen(true);
          toast.info('Connecting to Razorpay Simulated Server...');
          setIsProcessing(false);
          return;
        }

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Razorpay SDK failed to load. Are you online?');
          setIsProcessing(false);
          return;
        }

        const options = {
          key: keyId,
          amount: Math.round(amount * 100),
          currency: 'INR',
          name: 'Bezon',
          description: 'Order Payment',
          order_id: newOrderId,
          handler: async function (response: any) {
            setIsProcessing(true);
            try {
              const verifyRes = await api.post(API_ENDPOINTS.payments.verify, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyRes.data.success) {
                toast.success('Payment Verified Successfully!');
                clearCart();
                navigate('/orders');
              }
            } catch (err: any) {
              toast.error(err.response?.data?.message || 'Payment verification failed.');
              setIsProcessing(false);
            }
          },
          prefill: {
            name: fullName,
            contact: phone,
          },
          theme: {
            color: '#14b8a6', // teal-500
          },
          modal: {
            ondismiss: async function () {
              setIsProcessing(true);
              try {
                await api.post(API_ENDPOINTS.payments.verify, {
                  razorpayOrderId: newOrderId,
                });
              } catch (err: any) {
                console.log('Payment cancelled by user');
              } finally {
                setIsProcessing(false);
                toast.error('Payment cancelled.');
              }
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          toast.error(response.error.description || 'Payment Failed');
        });
        rzp.open();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place orders. Out of stock?');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await api.post(API_ENDPOINTS.coupons.apply, {
        code: couponCode.trim().toUpperCase(),
      });
      if (res.data.success) {
        setAppliedCoupon({
          code: res.data.data.code,
          discount: res.data.data.discount,
          description: res.data.data.description,
          finalTotal: res.data.data.finalTotal,
        });
        toast.success(`Coupon ${res.data.data.code} applied! You save ₹${res.data.data.discount}`);
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    try {
      const verifyRes = await api.post(API_ENDPOINTS.payments.verify, {
        razorpayOrderId,
        razorpayPaymentId: 'pay_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        razorpaySignature: 'sig_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      });

      if (verifyRes.data.success) {
        setIsRazorpayOpen(false);
        toast.success('Payment Verified Successfully via Razorpay Sandbox!');
        clearCart();
        navigate('/orders');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentFailure = async () => {
    setIsProcessing(true);
    try {
      await api.post(API_ENDPOINTS.payments.verify, {
        razorpayOrderId,
      });
    } catch (err: any) {
      console.log('Sandbox payment failed expectedly:', err.response?.data?.message);
    } finally {
      setIsRazorpayOpen(false);
      setIsProcessing(false);
      toast.error('Razorpay sandbox payment verification failed. Inventory released.');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 items-start">
        <Link to="/cart">
          <Button variant="ghost" size="sm" className="gap-2 text-zinc-500 hover:text-zinc-900 -ml-3">
            <ArrowLeftIcon className="h-4 w-4" /> Back to Cart
          </Button>
        </Link>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          Fulfillment Checkout
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <CheckoutAddressStep
            loadingAddresses={loadingAddresses}
            savedAddresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            setSelectedAddressId={setSelectedAddressId}
            populateForm={populateForm}
            resetForm={resetForm}
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            label={label}
            setLabel={setLabel}
            line1={line1}
            setLine1={setLine1}
            line2={line2}
            setLine2={setLine2}
            city={city}
            setCity={setCity}
            state={state}
            setState={setState}
            pincode={pincode}
            setPincode={setPincode}
            validationErrors={validationErrors}
          />

          <CheckoutItemsStep items={items} groupedItems={groupedItems} />

          <CheckoutCouponStep
            appliedCoupon={appliedCoupon}
            setAppliedCoupon={setAppliedCoupon}
            availableCoupons={availableCoupons}
            couponLoading={couponLoading}
            setCouponLoading={setCouponLoading}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            couponError={couponError}
            setCouponError={setCouponError}
            showManualInput={showManualInput}
            setShowManualInput={setShowManualInput}
            handleApplyCoupon={handleApplyCoupon}
            removeCoupon={removeCoupon}
          />
        </div>

        <CheckoutSummaryPanel
          cartTotal={cartTotal}
          appliedCoupon={appliedCoupon}
          isProcessing={isProcessing}
          itemsCount={items.length}
          handlePlaceOrder={handlePlaceOrder}
        />
      </div>

      <CheckoutRazorpayModal
        isRazorpayOpen={isRazorpayOpen}
        setIsRazorpayOpen={setIsRazorpayOpen}
        razorpayOrderId={razorpayOrderId}
        cartTotal={cartTotal}
        appliedCoupon={appliedCoupon}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isProcessing={isProcessing}
        handlePaymentFailure={handlePaymentFailure}
        handlePaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
