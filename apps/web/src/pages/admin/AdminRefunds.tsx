import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyDollar, Spinner, CheckCircle } from '@phosphor-icons/react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export const AdminRefunds: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { toast } = useToast();

  const fetchRefunds = async (tab: 'pending' | 'completed') => {
    try {
      setLoading(true);
      const paymentStatus = tab === 'pending' ? 'refund_initiated' : 'refunded';
      const response = await api.get(`${API_ENDPOINTS.orders.base}?paymentStatus=${paymentStatus}`);
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds(activeTab);
  }, [activeTab]);

  const handleMarkRefundedClick = (order: any) => {
    setSelectedOrder(order);
    setConfirmModalOpen(true);
  };

  const handleConfirmRefund = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const res = await api.post(API_ENDPOINTS.orders.markRefundCompleted(selectedOrder.id));
      if (res.data.success) {
        toast.success('Refund marked as completed');
        setConfirmModalOpen(false);
        setSelectedOrder(null);
        fetchRefunds(activeTab);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete refund');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <CurrencyDollar className="h-6 w-6 text-emerald-600" />
            Refund Management
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage and track customer refunds for cancelled orders.
          </p>
        </div>
      </div>

      <div className="flex border-b border-zinc-200">
        <button
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'pending'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Refunds
        </button>
        <button
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'completed'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Refunds
        </button>
      </div>

      <Card className="bg-white border-zinc-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-zinc-100">
          <CardTitle className="text-lg">
            {activeTab === 'pending' ? 'Pending Refund Requests' : 'Completed Refunds'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'pending'
              ? 'Orders that have been cancelled and require refund processing.'
              : 'Orders where the refund has been successfully processed.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Spinner className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              No {activeTab} refunds found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-zinc-600">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-zinc-600 text-xs whitespace-nowrap">Order Number</th>
                    <th className="px-6 py-3 font-semibold text-zinc-600 text-xs">Customer</th>
                    <th className="px-6 py-3 font-semibold text-zinc-600 text-xs">Seller</th>
                    <th className="px-6 py-3 font-semibold text-zinc-600 text-xs">Amount</th>
                    <th className="px-6 py-3 font-semibold text-zinc-600 text-xs">Reason</th>
                    <th className="px-6 py-3 font-semibold text-zinc-600 text-xs">Date</th>
                    {activeTab === 'pending' && <th className="px-6 py-3 font-semibold text-zinc-600 text-xs text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-zinc-900 text-sm">{order.customer?.name}</p>
                        <p className="text-xs text-zinc-500">{order.customer?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
                          {order.seller?.shopName}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900">
                        ₹{order.total}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-600">
                        {order.cancelReason || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {new Date(order.cancelledAt || order.createdAt).toLocaleDateString()}
                      </td>
                      {activeTab === 'pending' && (
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            onClick={() => handleMarkRefundedClick(order)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Mark Refunded
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {confirmModalOpen && selectedOrder && (
        <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-emerald-700 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Confirm Refund Completion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to mark the refund for Order #{selectedOrder.orderNumber} as completed?
                This indicates that the funds have been successfully returned to the customer.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-zinc-50 p-4 rounded-lg my-2 border border-zinc-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-zinc-500">Refund Amount</span>
                <span className="text-lg font-extrabold text-zinc-900">₹{selectedOrder.total}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-zinc-500">Customer</span>
                <span className="text-zinc-800">{selectedOrder.customer?.email}</span>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setConfirmModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRefund}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {actionLoading ? <Spinner className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Completion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
