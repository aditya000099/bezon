import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '@bezon/ui';
import { HouseIcon, MapPinIcon, PlusIcon, SpinnerIcon, UserIcon, PhoneIcon } from '@phosphor-icons/react';

interface CheckoutAddressStepProps {
  loadingAddresses: boolean;
  savedAddresses: any[];
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
  populateForm: (addr: any) => void;
  resetForm: () => void;
  fullName: string;
  setFullName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  label: string;
  setLabel: (val: string) => void;
  line1: string;
  setLine1: (val: string) => void;
  line2: string;
  setLine2: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  state: string;
  setState: (val: string) => void;
  pincode: string;
  setPincode: (val: string) => void;
  validationErrors: Record<string, string>;
}

export const CheckoutAddressStep: React.FC<CheckoutAddressStepProps> = ({
  loadingAddresses,
  savedAddresses,
  selectedAddressId,
  setSelectedAddressId,
  populateForm,
  resetForm,
  fullName,
  setFullName,
  phone,
  setPhone,
  label,
  setLabel,
  line1,
  setLine1,
  line2,
  setLine2,
  city,
  setCity,
  state,
  setState,
  pincode,
  setPincode,
  validationErrors,
}) => {
  return (
    <Card className="bg-zinc-50/80 border-0 rounded-4xl p-4 sm:p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-zinc-800">
          1. Shipping Address
        </CardTitle>
        <CardDescription className="text-zinc-500 mt-1">
          Select a saved address or enter a new delivery destination.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {loadingAddresses ? (
          <div className="flex justify-center p-8">
            <SpinnerIcon className="h-6 w-6 animate-spin text-teal-600" />
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
                className={`cursor-pointer border-0 rounded-3xl p-5 transition-all flex flex-col gap-3 ${
                  selectedAddressId === addr.id
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                    : 'bg-white/60 hover:bg-white text-zinc-700'
                }`}
              >
                <div
                  className={`flex justify-between items-center border-b pb-3 ${
                    selectedAddressId === addr.id ? 'border-teal-500/50' : 'border-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-xl ${
                        selectedAddressId === addr.id
                          ? 'bg-white/20 text-white'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {addr.label === 'HouseIcon' ? (
                        <HouseIcon className="h-3.5 w-3.5" />
                      ) : (
                        <MapPinIcon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">
                      {addr.label}
                    </span>
                  </div>
                  {addr.isDefault && (
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        selectedAddressId === addr.id ? 'bg-white text-teal-600' : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      Default
                    </span>
                  )}
                </div>
                <div
                  className={`text-sm flex flex-col gap-1.5 ${
                    selectedAddressId === addr.id ? 'text-teal-50' : 'text-zinc-500'
                  }`}
                >
                  <span
                    className={`font-bold ${
                      selectedAddressId === addr.id ? 'text-white' : 'text-zinc-800'
                    }`}
                  >
                    {addr.fullName}{' '}
                    <span className="font-medium text-zinc-500">
                      ({addr.phone})
                    </span>
                  </span>
                  <span className="leading-relaxed mt-1">
                    {addr.line1}
                    {addr.line2 && `, ${addr.line2}`}
                  </span>
                  <span>
                    {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                  </span>
                </div>
              </div>
            ))}

            {/* Add New Address Option */}
            <div
              onClick={() => {
                setSelectedAddressId('manual');
                resetForm();
              }}
              className={`cursor-pointer border-0 rounded-3xl p-5 transition-all flex flex-col items-center justify-center gap-3 min-h-35 ${
                selectedAddressId === 'manual'
                  ? 'bg-zinc-800 text-white shadow-xl shadow-zinc-800/20'
                  : 'bg-zinc-200/50 hover:bg-zinc-200 text-zinc-500'
              }`}
            >
              <div
                className={`p-3 rounded-2xl ${
                  selectedAddressId === 'manual' ? 'bg-white/10 text-white' : 'bg-white text-zinc-400 shadow-sm'
                }`}
              >
                <PlusIcon className="h-5 w-5" />
              </div>
              <span className="font-bold text-sm">Deliver to a different address</span>
            </div>
          </div>
        )}

        {/* Manual Input Form */}
        {selectedAddressId === 'manual' && (
          <div className="pt-6 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider mb-4">
              Enter New Delivery Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Jane Doe"
                    className="pl-9 rounded-xl border-zinc-200"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                {validationErrors.fullName && (
                  <p className="text-rose-500 text-xs font-medium">{validationErrors.fullName}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="9876543210"
                    className="pl-9 rounded-xl border-zinc-200"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-rose-500 text-xs font-medium">{validationErrors.phone}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Address Tag / Label
                </label>
                <div className="relative">
                  <HouseIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="e.g. House, Office"
                    className="pl-9 rounded-xl border-zinc-200"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
                {validationErrors.label && (
                  <p className="text-rose-500 text-xs font-medium">{validationErrors.label}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Street Address (Line 1)
                </label>
                <Input
                  placeholder="Flat, House no., Building, Company"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="rounded-xl border-zinc-200"
                />
                {validationErrors.line1 && (
                  <p className="text-rose-500 text-xs font-medium">{validationErrors.line1}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Apartment, Suite, Unit (Line 2)
                </label>
                <Input
                  placeholder="Area, Colony, Street, Sector"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className="rounded-xl border-zinc-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">City</label>
                <Input
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl border-zinc-200"
                />
                {validationErrors.city && (
                  <p className="text-rose-500 text-xs font-medium">{validationErrors.city}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">State</label>
                <Input
                  placeholder="Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="rounded-xl border-zinc-200"
                />
                {validationErrors.state && (
                  <p className="text-rose-500 text-xs font-medium">{validationErrors.state}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pincode</label>
                <Input
                  placeholder="400001"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="rounded-xl border-zinc-200"
                />
                {validationErrors.pincode && (
                  <p className="text-rose-500 text-xs font-medium">{validationErrors.pincode}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Country</label>
                <Input value="India" disabled className="bg-zinc-50 border-zinc-200 rounded-xl" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
