import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { addressSchema } from '@bezon/validation';
import { MapPin, Phone, User, Home, ShieldCheck, ArrowLeft, Landmark, CreditCard, Wallet, AlertCircle, Loader2, Tag, CheckCircle2, X, BadgePercent, Plus } from 'lucide-react';

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
  const [label, setLabel] = useState('Home');

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
      } catch {}
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
        console.error('Failed to load addresses', err);
        setSelectedAddressId('manual');
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, []);

  const populateForm = (addr: any) => {
    setLabel(addr.label || 'Home');
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
    setLabel('Home');
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
    const sellerName = item.product?.title.includes('Headphones') ? 'Acoustic Labs' : 'Sartorial Goods';
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
        setRazorpayOrderId(response.data.data.razorpayOrderId);
        setIsRazorpayOpen(true);
        toast.info('Connecting to Razorpay Secure Payment Server...');
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
      const res = await api.post(API_ENDPOINTS.coupons.apply, { code: couponCode.trim().toUpperCase() });
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
        navigate('/shop/orders');
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
      <div className="flex items-center gap-4">
        <Link to="/shop/cart">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </Button>
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fulfillment Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Shipping address & items details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">1. Shipping Address</CardTitle>
              <CardDescription>Select a saved address or enter a new delivery destination.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Saved Addresses List */}
              {loadingAddresses ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        populateForm(addr);
                      }}
                      className={`cursor-pointer border rounded-2xl p-4 transition-all flex flex-col gap-3 ${
                        selectedAddressId === addr.id
                          ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:border-indigo-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg border ${
                            selectedAddressId === addr.id ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {addr.label === 'Home' ? <Home className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                          </div>
                          <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">{addr.label}</span>
                        </div>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">Default</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 flex flex-col gap-1">
                        <span className="font-bold text-slate-800">{addr.fullName} <span className="font-medium text-slate-500">({addr.phone})</span></span>
                        <span className="leading-relaxed mt-1">{addr.line1}{addr.line2 && `, ${addr.line2}`}</span>
                        <span>{addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span></span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add New Address Option */}
                  <div
                    onClick={() => {
                      setSelectedAddressId('manual');
                      resetForm();
                    }}
                    className={`cursor-pointer border border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px] ${
                      selectedAddressId === 'manual'
                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700'
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50 text-slate-500'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${selectedAddressId === 'manual' ? 'bg-indigo-100' : 'bg-white shadow-sm'}`}>
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-sm">Deliver to a different address</span>
                  </div>
                </div>
              )}

              {/* Manual Input Form */}
              {(selectedAddressId === 'manual') && (
                <div className="pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4">Enter New Delivery Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Jane Doe"
                          className="pl-9 rounded-xl border-slate-200"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                      {validationErrors.fullName && <p className="text-rose-500 text-xs font-medium">{validationErrors.fullName}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="9876543210"
                          className="pl-9 rounded-xl border-slate-200"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      {validationErrors.phone && <p className="text-rose-500 text-xs font-medium">{validationErrors.phone}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address Tag / Label</label>
                      <div className="relative">
                        <Home className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="e.g. Home, Office"
                          className="pl-9 rounded-xl border-slate-200"
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                        />
                      </div>
                      {validationErrors.label && <p className="text-rose-500 text-xs font-medium">{validationErrors.label}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Street Address (Line 1)</label>
                      <Input
                        placeholder="Flat, House no., Building, Company"
                        value={line1}
                        onChange={(e) => setLine1(e.target.value)}
                        className="rounded-xl border-slate-200"
                      />
                      {validationErrors.line1 && <p className="text-rose-500 text-xs font-medium">{validationErrors.line1}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Apartment, Suite, Unit (Line 2)</label>
                      <Input
                        placeholder="Area, Colony, Street, Sector"
                        value={line2}
                        onChange={(e) => setLine2(e.target.value)}
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</label>
                      <Input
                        placeholder="Mumbai"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="rounded-xl border-slate-200"
                      />
                      {validationErrors.city && <p className="text-rose-500 text-xs font-medium">{validationErrors.city}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State</label>
                      <Input
                        placeholder="Maharashtra"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="rounded-xl border-slate-200"
                      />
                      {validationErrors.state && <p className="text-rose-500 text-xs font-medium">{validationErrors.state}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pincode</label>
                      <Input
                        placeholder="400001"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="rounded-xl border-slate-200"
                      />
                      {validationErrors.pincode && <p className="text-rose-500 text-xs font-medium">{validationErrors.pincode}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country</label>
                      <Input
                        value="India"
                        disabled
                        className="bg-slate-50 border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grouped orders display (Multi-Seller Cart) */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">2. Review & Split Shipments</CardTitle>
              <CardDescription>
                Items from different sellers will be created as separate orders to facilitate direct merchant dispatch.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {items.length === 0 ? (
                <p className="text-slate-400 text-sm">Your cart is empty.</p>
              ) : (
                Object.keys(groupedItems).map((seller) => (
                  <div key={seller} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Seller Grouping</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">Direct Dispatch</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {groupedItems[seller].map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{item.product?.title}</span>
                            <span className="text-xs text-slate-400">SKU: {item.product?.sku} · Qty: {item.qty}</span>
                          </div>
                          <span className="font-extrabold text-slate-900">₹{(Number(item.product?.basePrice) * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">3. Apply Coupon</CardTitle>
              <CardDescription>Select an available coupon or enter a code manually.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-bold text-emerald-800 text-sm">{appliedCoupon.code}</p>
                      <p className="text-xs text-emerald-600">{appliedCoupon.description} — You save ₹{appliedCoupon.discount.toLocaleString()}</p>
                    </div>
                  </div>
                  <button onClick={removeCoupon} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  {availableCoupons.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {availableCoupons.map((c) => (
                        <div
                          key={c.id}
                          className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-3 flex items-center justify-between hover:border-indigo-300 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="bg-white border border-dashed border-indigo-300 rounded-lg px-2.5 py-1.5 shrink-0">
                              <span className="font-mono font-extrabold text-indigo-700 text-xs tracking-wider">{c.code}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-700 truncate">{c.description}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {c.discountType === 'percentage'
                                  ? `${Number(c.discountValue)}% off${c.maxDiscount ? ` (up to ₹${Number(c.maxDiscount)})` : ''}`
                                  : `₹${Number(c.discountValue)} off`}
                                {Number(c.minOrderValue) > 0 && ` · Min ₹${Number(c.minOrderValue)}`}
                                {c.seller?.shopName && ` · ${c.seller.shopName}`}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 ml-3 font-bold text-xs h-8 px-4 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                            disabled={couponLoading}
                            onClick={() => {
                              setCouponCode(c.code);
                              setCouponError('');
                              setCouponLoading(true);
                              api.post(API_ENDPOINTS.coupons.apply, { code: c.code })
                                .then((res) => {
                                  if (res.data.success) {
                                    setAppliedCoupon({
                                      code: res.data.data.code,
                                      discount: res.data.data.discount,
                                      description: res.data.data.description,
                                      finalTotal: res.data.data.finalTotal,
                                    });
                                    toast.success(`Coupon ${res.data.data.code} applied! You save ₹${res.data.data.discount}`);
                                  }
                                })
                                .catch((err: any) => {
                                  const msg = err.response?.data?.message || 'Could not apply this coupon.';
                                  setCouponError(msg);
                                  toast.error(msg);
                                })
                                .finally(() => setCouponLoading(false));
                            }}
                          >
                            {couponLoading && couponCode === c.code ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {couponError && <p className="text-rose-500 text-xs font-medium">{couponError}</p>}

                  {!showManualInput && availableCoupons.length > 0 ? (
                    <button
                      onClick={() => setShowManualInput(true)}
                      className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 mt-1"
                    >
                      <Tag className="h-3 w-3" /> Have a different code?
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Enter coupon code"
                            className="pl-9 uppercase"
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="font-bold px-6"
                        >
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                      {couponError && <p className="text-rose-500 text-xs">{couponError}</p>}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order total & CTA */}
        <div className="flex flex-col gap-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800 font-sans">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{cartTotal.toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span className="font-semibold">-₹{appliedCoupon.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600">
                <span>Fulfillment Charges</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>
              <div className="border-t border-slate-100 pt-4 flex justify-between text-base font-extrabold text-slate-900">
                <span>Grand Total</span>
                <span>₹{(appliedCoupon ? appliedCoupon.finalTotal : cartTotal).toLocaleString()}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full font-bold h-11"
                onClick={handlePlaceOrder}
                disabled={isProcessing || items.length === 0}
              >
                {isProcessing ? 'Generating Orders...' : `Place Order & Pay (₹${(appliedCoupon ? appliedCoupon.finalTotal : cartTotal).toLocaleString()})`}
              </Button>
            </CardFooter>
          </Card>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-xs text-slate-600">
            <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0" />
            <p>
              Your orders are created before payment verification. Successful sandbox processing confirms your allocation.
            </p>
          </div>
        </div>
      </div>

      {/* Razorpay Sandbox Simulation Modal */}
      <Dialog open={isRazorpayOpen} onOpenChange={setIsRazorpayOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-extrabold text-slate-900 text-lg uppercase tracking-tight font-sans">Razorpay <span className="text-indigo-600">Sandbox</span></span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase">Test Mode</span>
            </div>
            <DialogDescription className="text-left mt-2">
              Order Reference ID: <strong className="text-slate-800 font-mono">{razorpayOrderId}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 space-y-4">
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Amount Payable</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{(appliedCoupon ? appliedCoupon.finalTotal : cartTotal).toLocaleString()}</p>
              </div>
              <div className="bg-indigo-600 text-white rounded-lg p-2.5 font-bold text-xs">
                INR
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Choose Sandbox Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs font-bold">Card</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="text-xs font-bold">UPI</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Landmark className="h-5 w-5" />
                  <span className="text-xs font-bold">Netbank</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                This is a secure developer sandbox mimicking the Razorpay checkout overlay. You can trigger payment verification success or failure.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-3 pt-4 border-t border-slate-100 w-full">
            <Button
              variant="destructive"
              className="flex-1 font-bold text-xs h-10 flex items-center justify-center gap-2"
              onClick={handlePaymentFailure}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simulate Failure'}
            </Button>
            <Button
              className="flex-1 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 h-10 flex items-center justify-center gap-2"
              onClick={handlePaymentSuccess}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simulate Success'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
