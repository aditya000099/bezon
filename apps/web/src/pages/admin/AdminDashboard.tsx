import React, { useState } from 'react';
import { Users, ShoppingBag, ShieldCheck, DollarSign, ArrowUpRight, Search, CheckCircle, AlertTriangle, Truck, Ban } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '../../context/ToastContext';

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);

  // Mock platform sellers
  const [sellers, setSellers] = useState([
    { id: 'sel-101', name: 'Acoustic Labs', email: 'contact@acoustic.io', status: 'approved', products: 14, sales: 245900 },
    { id: 'sel-102', name: 'Sartorial Goods', email: 'support@sartorial.co', status: 'pending', products: 8, sales: 0 },
    { id: 'sel-103', name: 'FitPulse Tech', email: 'sales@fitpulse.net', status: 'approved', products: 22, sales: 180030 }
  ]);

  // Mock active shipments/orders for reassignment override
  const [orders, setOrders] = useState([
    { id: 'BZN-ORD-9021', customer: 'Alice Smith', seller: 'Acoustic Labs', courier: 'John Doe (Bike)', status: 'placed' },
    { id: 'BZN-ORD-4491', customer: 'Bob Jones', seller: 'Sartorial Goods', courier: 'Unassigned', status: 'ready_for_pickup' }
  ]);

  const [availableCouriers] = useState([
    { id: 'c-1', name: 'Devon Webb', vehicle: 'Bike', rating: '4.9' },
    { id: 'c-2', name: 'Sara Connor', vehicle: 'Electric Scooter', rating: '4.7' }
  ]);

  const handleApproveSeller = (sellerId: string) => {
    setSellers((prev) =>
      prev.map((s) => (s.id === sellerId ? { ...s, status: 'approved' } : s))
    );
    toast.success(`Seller registration approved! Dispatch notifications fired.`);
  };

  const handleSuspendSeller = (sellerId: string) => {
    setSellers((prev) =>
      prev.map((s) => (s.id === sellerId ? { ...s, status: 'suspended' } : s))
    );
    toast.warning(`Seller suspension active. Listings deactivated.`);
  };

  const openReassignDialog = (order: any) => {
    setSelectedOrder(order);
    setIsReassignOpen(true);
  };

  const handleReassignCourier = (courierName: string) => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? { ...o, courier: courierName } : o))
    );
    toast.success(`Courier reassigned for ${selectedOrder.id}: ${courierName}`);
    setIsReassignOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm flex items-center justify-between p-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform GMV</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹4,25,930.00</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center mt-1">
              +12.4% vs last week <ArrowUpRight className="h-3.5 w-3.5 inline ml-0.5" />
            </span>
          </div>
          <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm flex items-center justify-between p-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Vendors</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">3 Registered</h3>
            <span className="text-[10px] text-amber-500 font-bold flex items-center mt-1">
              1 pending review
            </span>
          </div>
          <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm flex items-center justify-between p-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Couriers Available</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">5 Agents</h3>
            <span className="text-[10px] text-indigo-600 font-bold flex items-center mt-1">
              3 active deliveries
            </span>
          </div>
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Users className="h-6 w-6" />
          </div>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm flex items-center justify-between p-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Health</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">Normal</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center mt-1">
              All Docker microservices healthy
            </span>
          </div>
          <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Sellers Oversight List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Merchant Oversight</CardTitle>
                <CardDescription>Approve vendor registrations and adjust merchant permissions.</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute inset-y-0 left-3 flex items-center text-slate-400 h-4 w-4 mt-3" />
                <Input
                  placeholder="Filter sellers..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="bg-slate-50 text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Vendor / Shop</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Catalog</th>
                      <th className="px-6 py-3">Revenue</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sellers
                      .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((seller) => (
                        <tr key={seller.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{seller.name}</div>
                            <div className="text-xs text-slate-400">{seller.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              seller.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : seller.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 animate-pulse'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {seller.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">{seller.products} items</td>
                          <td className="px-6 py-4 font-bold text-slate-900">₹{seller.sales.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right flex justify-end gap-1.5">
                            {seller.status !== 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                onClick={() => handleApproveSeller(seller.id)}
                              >
                                Approve
                              </Button>
                            )}
                            {seller.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                onClick={() => handleSuspendSeller(seller.id)}
                              >
                                Suspend
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courier dispatch assignment panel */}
        <div className="flex flex-col gap-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">Dispatch Logistics Override</CardTitle>
              <CardDescription>Manually reassign delivery agents to shipments encountering delays.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-900">{o.id}</span>
                    <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded capitalize">{o.status}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    <p><strong>Merchant:</strong> {o.seller}</p>
                    <p className="mt-0.5"><strong>Agent:</strong> {o.courier}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold mt-2"
                    onClick={() => openReassignDialog(o)}
                  >
                    Reassign Courier
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Courier Reassignment Dialog */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-lg font-bold text-slate-900">Manual Courier Assignment</DialogTitle>
            <DialogDescription>
              Assign or override the shipping courier agent for order <strong className="text-slate-800">{selectedOrder?.id}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-[11px] text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p>Reassigning a courier interrupts standard auto-dispatch algorithms and fires real-time alerts to the customer.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Available Courier Partner</label>
              <div className="flex flex-col gap-2">
                {availableCouriers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleReassignCourier(`${c.name} (${c.vehicle})`)}
                    className="border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10 rounded-xl p-3 flex items-center justify-between text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 text-slate-600 rounded-full p-2">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">Vehicle: {c.vehicle}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-amber-500 bg-amber-50 px-2 py-0.5 rounded">
                      ★ {c.rating}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-3 pt-4 border-t border-slate-100 w-full">
            <Button variant="outline" className="flex-1 font-bold text-xs h-10" onClick={() => setIsReassignOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

