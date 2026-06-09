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
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import {
  ArrowLeftIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  PencilSimpleIcon,
  CheckCircleIcon,
  HouseIcon,
  BriefcaseIcon,
  GlobeIcon,
  SpinnerIcon,
  UserIcon,
  PhoneIcon,
  CompassIcon,
} from '@phosphor-icons/react';
import { GoogleAddressInput } from '../../components/ui/GoogleAddressInput';

// Types representing what an Address looks like, matching our database schema!
interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  lat?: number | null;
  lng?: number | null;
}

export const AddressesPage: React.FC = () => {
  const { toast } = useToast();

  // State for storing the list of addresses fetched from the backend database!
  const [addresses, setAddresses] = useState<Address[]>([]);
  // Loading state so we can display a cool spinner while downloading data!
  const [loading, setLoading] = useState(true);

  // States to manage the address creation / editing form!
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form input field states!
  const [label, setLabel] = useState('House');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [isDefault, setIsDefault] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // When the page loads, fetch all addresses from the backend database!
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Download all addresses from the backend
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.addresses.base);
      if (response.data.success) {
        setAddresses(response.data.data);
      }
    } catch (err: any) {
      logger.error('Failed to load addresses:', err);
      toast.error(
        err.response?.data?.message || 'Failed to load saved addresses.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Resets all form fields to default/empty values
  const resetForm = () => {
    setLabel('House');
    setFullName('');
    setPhone('');
    setLine1('');
    setLine2('');
    setCity('');
    setState('');
    setPincode('');
    setCountry('India');
    setIsDefault(false);
    setLat(null);
    setLng(null);
    setShowForm(false);
    setEditingAddress(null);
  };

  // Fills the form fields with an address we want to edit
  const startEdit = (address: Address) => {
    setEditingAddress(address);
    setLabel(address.label || 'House');
    setFullName(address.fullName || '');
    setPhone(address.phone || '');
    setLine1(address.line1 || '');
    setLine2(address.line2 || '');
    setCity(address.city || '');
    setState(address.state || '');
    setPincode(address.pincode || '');
    setCountry(address.country || 'India');
    setIsDefault(address.isDefault || false);
    setLat(address.lat || null);
    setLng(address.lng || null);
    setShowForm(true);
  };

  // Submits the address form (Save or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side quick validation to prevent typing errors!
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !line1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim()
    ) {
      toast.warning('Please fill out all required fields marked with *');
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      toast.warning('Pincode must be exactly 6 digits.');
      return;
    }

    if (phone.length < 7) {
      toast.warning('PhoneIcon number must be at least 7 digits.');
      return;
    }

    setSaving(true);
    const payload = {
      label,
      fullName,
      phone,
      line1,
      line2: line2 || undefined,
      city,
      state,
      pincode,
      country,
      isDefault,
      lat: lat || undefined,
      lng: lng || undefined,
    };

    try {
      if (editingAddress) {
        // CALL BACKEND PUT API to update existing address details!
        const response = await api.put(
          API_ENDPOINTS.addresses.byId(editingAddress.id),
          payload,
        );
        if (response.data.success) {
          toast.success('Address updated successfully!');
          resetForm();
          fetchAddresses();
        }
      } else {
        // CALL BACKEND POST API to create a brand new address!
        const response = await api.post(API_ENDPOINTS.addresses.base, payload);
        if (response.data.success) {
          toast.success('New address saved successfully!');
          resetForm();
          fetchAddresses();
        }
      }
    } catch (err: any) {
      logger.error('Failed to save address:', err);
      toast.error(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  // Delete a saved address after a quick check
  const handleDelete = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await api.delete(
        API_ENDPOINTS.addresses.byId(addressId),
      );
      if (response.data.success) {
        toast.success('Address deleted successfully.');
        fetchAddresses();
      }
    } catch (err: any) {
      logger.error('Failed to delete address:', err);
      toast.error(err.response?.data?.message || 'Could not delete address.');
    }
  };

  // Set an address as the user's default delivery address
  const handleSetDefault = async (address: Address) => {
    if (address.isDefault) return; // already default

    try {
      const response = await api.put(API_ENDPOINTS.addresses.byId(address.id), {
        isDefault: true,
      });
      if (response.data.success) {
        toast.success(
          `"${address.label}" set as your default shipping address.`,
        );
        fetchAddresses();
      }
    } catch (err: any) {
      logger.error('Failed to set default address:', err);
      toast.error(
        err.response?.data?.message || 'Could not update default address.',
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header back navigation link */}
      <div className="flex items-center justify-between">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Profile
        </Link>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold inline-flex items-center gap-2 shadow-sm"
          >
            <PlusIcon className="h-4 w-4" /> Add Address
          </Button>
        )}
      </div>

      {/* Address Edit/Add Form Container */}
      {showForm && (
        <Card className="border-0 bg-zinc-50/80 shadow-none rounded-4xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-250">
          <CardHeader className="bg-zinc-100/50 p-6">
            <CardTitle className="text-xl font-bold text-zinc-800">
              {editingAddress ? 'Edit Saved Address' : 'Add New Saved Address'}
            </CardTitle>
            <CardDescription className="text-zinc-500 font-medium">
              Provide your delivery coordinates so we can ship your orders
              directly to you.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 flex flex-col gap-5">
              {/* Address Label (House / Work / Other) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Address Label / Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {['House', 'Work', 'Other'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLabel(item)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        label === item
                          ? 'bg-teal-600 text-white border-2 border-teal-600'
                          : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {item === 'House' && (
                          <HouseIcon className="h-3.5 w-3.5" />
                        )}
                        {item === 'Work' && (
                          <BriefcaseIcon className="h-3.5 w-3.5" />
                        )}
                        {item === 'Other' && (
                          <MapPinIcon className="h-3.5 w-3.5" />
                        )}
                        {item}
                      </div>
                    </button>
                  ))}
                  {label !== 'Housen' &&
                    label !== 'Work' &&
                    label !== 'Other' && (
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-2 rounded-xl">
                        Custom: {label}
                      </span>
                    )}
                </div>
                {/* Text input if they want to name it something custom like "Parent's House" */}
                {label === 'Other' && (
                  <Input
                    placeholder="Enter custom label (e.g. My Cabin)"
                    onChange={(e) => setLabel(e.target.value)}
                    className="rounded-xl border-zinc-200 text-xs mt-2"
                  />
                )}
              </div>

              {/* Google Maps Places Autocomplete Search */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CompassIcon className="h-3.5 w-3.5 text-teal-500" /> Search
                  Address on Google Maps (Auto-fills inputs)
                </label>
                <GoogleAddressInput
                  onAddressSelect={(selected) => {
                    setLine1(selected.addressLine);
                    setCity(selected.city);
                    setState(selected.state);
                    setPincode(selected.pincode);
                    setLat(selected.lat);
                    setLng(selected.lng);
                  }}
                  defaultValue={
                    editingAddress
                      ? `${editingAddress.line1}, ${editingAddress.city}, ${editingAddress.state}`
                      : ''
                  }
                />
                {lat && lng && (
                  <span className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1 bg-emerald-50/50 self-start px-2 py-0.5 rounded-md border border-emerald-100">
                    <CheckCircleIcon className="h-3 w-3" /> Location Geocoded:{' '}
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </span>
                )}
              </div>

              {/* Grid of Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name input */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="fullname-input"
                    className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-zinc-400" />{' '}
                    Receiver's Full Name *
                  </label>
                  <Input
                    id="fullname-input"
                    placeholder="e.g. Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-xl border-zinc-200"
                    required
                  />
                </div>

                {/* PhoneIcon Number input */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="phone-input"
                    className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <PhoneIcon className="h-3.5 w-3.5 text-zinc-400" /> Delivery
                    Phone *
                  </label>
                  <Input
                    id="phone-input"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl border-zinc-200"
                    required
                  />
                </div>

                {/* Street Address Line 1 */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label
                    htmlFor="line1-input"
                    className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <MapPinIcon className="h-3.5 w-3.5 text-zinc-400" /> Street
                    Address (Line 1) *
                  </label>
                  <Input
                    id="line1-input"
                    placeholder="Flat number, building name, street name"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className="rounded-xl border-zinc-200"
                    required
                  />
                </div>

                {/* Street Address Line 2 */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label
                    htmlFor="line2-input"
                    className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <MapPinIcon className="h-3.5 w-3.5 text-zinc-300" />{' '}
                    Landmark / Apartment Name (Line 2)
                  </label>
                  <Input
                    id="line2-input"
                    placeholder="e.g. Near Big Bazaar"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    className="rounded-xl border-zinc-200"
                  />
                </div>

                {/* City */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="city-input"
                    className="text-xs font-bold text-zinc-500 uppercase tracking-wider"
                  >
                    City / Town *
                  </label>
                  <Input
                    id="city-input"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-xl border-zinc-200"
                    required
                  />
                </div>

                {/* State */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="state-input"
                    className="text-xs font-bold text-zinc-500 uppercase tracking-wider"
                  >
                    State *
                  </label>
                  <Input
                    id="state-input"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="rounded-xl border-zinc-200"
                    required
                  />
                </div>

                {/* Pincode */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="pincode-input"
                    className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <CompassIcon className="h-3.5 w-3.5 text-zinc-400" />{' '}
                    Pincode (6 Digits) *
                  </label>
                  <Input
                    id="pincode-input"
                    placeholder="e.g. 400054"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="rounded-xl border-zinc-200"
                    required
                  />
                </div>

                {/* Country */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="country-input"
                    className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <GlobeIcon className="h-3.5 w-3.5 text-zinc-400" /> Country
                  </label>
                  <Input
                    id="country-input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="rounded-xl border-zinc-200"
                    required
                  />
                </div>
              </div>

              {/* Set Default Address Switch */}
              <div className="flex items-center gap-3.5 py-3 border-t border-zinc-100 mt-2">
                <input
                  id="default-address-checkbox"
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-5 w-5 text-teal-600 border-zinc-300 rounded focus:ring-teal-500 cursor-pointer"
                />
                <label
                  htmlFor="default-address-checkbox"
                  className="text-sm font-semibold text-zinc-700 cursor-pointer select-none"
                >
                  Set as my default shipping address
                </label>
              </div>
            </CardContent>

            <CardFooter className="bg-zinc-100/50 p-6 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="w-full sm:w-auto rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto rounded-xl bg-teal-600 hover:bg-teal-700 font-bold inline-flex items-center justify-center gap-2 px-6"
              >
                {saving ? (
                  <>
                    <SpinnerIcon className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Address'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Main Address List Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-50/80 rounded-4xl">
          <SpinnerIcon className="h-10 w-10 text-teal-600 animate-spin" />
          <p className="text-zinc-500 font-bold mt-4">
            Loading your saved addresses...
          </p>
        </div>
      ) : addresses.length === 0 ? (
        // Empty state UI if there are no addresses!
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-zinc-50/80 rounded-4xl">
          <div className="p-4 bg-zinc-50 rounded-full text-zinc-400">
            <MapPinIcon className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-bold text-zinc-800 mt-4">
            No Saved Addresses Found
          </h3>
          <p className="text-zinc-500 text-sm max-w-sm mt-2">
            You haven't registered any addresses yet. Add an address now to make
            checkouts incredibly fast!
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold mt-6 inline-flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" /> Add Your First Address
          </Button>
        </div>
      ) : (
        // Grid display of Saved Address cards!
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <Card
              key={addr.id}
              className={`border-0 transition-all rounded-4xl overflow-hidden flex flex-col justify-between ${
                addr.isDefault
                  ? 'bg-zinc-100/80 ring-4 ring-teal-50/50'
                  : 'bg-zinc-50/80 hover:bg-zinc-100/60'
              }`}
            >
              <CardHeader className="pb-3 flex flex-row items-center justify-between p-6 bg-zinc-100/50">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      addr.isDefault
                        ? 'bg-teal-50 text-teal-600 border-teal-100'
                        : 'bg-white text-zinc-500 border-zinc-200'
                    }`}
                  >
                    {addr.label === 'House' && (
                      <HouseIcon className="h-4 w-4" />
                    )}
                    {addr.label === 'Work' && (
                      <BriefcaseIcon className="h-4 w-4" />
                    )}
                    {addr.label !== 'House' && addr.label !== 'Work' && (
                      <MapPinIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">
                    {addr.label}
                  </span>
                </div>
                {addr.isDefault && (
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <CheckCircleIcon className="h-3 w-3" /> Default
                  </span>
                )}
              </CardHeader>

              <CardContent className="p-6 flex-1 flex flex-col gap-4">
                {/* Receiver Name */}
                <div className="flex items-start gap-3">
                  <UserIcon className="h-4.5 w-4.5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-zinc-800 text-sm">
                      {addr.fullName}
                    </p>
                    <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                      Receiver
                    </span>
                  </div>
                </div>

                {/* Receiver PhoneIcon */}
                <div className="flex items-start gap-3">
                  <PhoneIcon className="h-4.5 w-4.5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-zinc-700 text-sm">
                      {addr.phone}
                    </p>
                    <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                      Contact Number
                    </span>
                  </div>
                </div>

                {/* Address lines */}
                <div className="flex items-start gap-3 mt-1.5 pt-2.5 border-t border-zinc-100">
                  <MapPinIcon className="h-4.5 w-4.5 text-teal-500 mt-0.5" />
                  <div className="text-zinc-600 text-xs font-semibold leading-relaxed">
                    <p>{addr.line1}</p>
                    {addr.line2 && (
                      <p className="text-zinc-500">{addr.line2}</p>
                    )}
                    <p className="mt-1 font-bold text-zinc-800">
                      {addr.city}, {addr.state} – {addr.pincode}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      {addr.country}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-zinc-100/50 p-5 flex items-center justify-between gap-2">
                {/* Set default option */}
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr)}
                    className="text-xs font-bold text-zinc-500 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-xs font-bold text-teal-600 flex items-center gap-1">
                    <CheckCircleIcon className="h-3.5 w-3.5" /> Primary Address
                  </span>
                )}

                {/* Actions (Edit and Delete) */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEdit(addr)}
                    className="p-1.5 text-zinc-500 hover:text-teal-600 hover:bg-zinc-100 rounded-lg transition-all"
                    title="Edit Address"
                  >
                    <PencilSimpleIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete Address"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
