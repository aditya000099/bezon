import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner, ArrowCounterClockwise, CheckCircle, XCircle } from '@phosphor-icons/react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const SellerReturns: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'REQUESTED' | 'APPROVED' | 'REJECTED'>('REQUESTED');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.orders.sellerMe, {
        params: { returnStatus: activeTab }
      });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [activeTab]);

  const handleApprove = async (orderId: string) => {
    try {
      const res = await api.post(API_ENDPOINTS.orders.sellerApproveReturn(orderId));
      if (res.data.success) {
        toast.success('Return approved successfully');
        fetchReturns();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve return');
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const res = await api.post(API_ENDPOINTS.orders.sellerRejectReturn(orderId), {
        rejectionReason: reason
      });
      if (res.data.success) {
        toast.success('Return rejected successfully');
        fetchReturns();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject return');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Returns Management</h1>
      </div>

      <div className="flex space-x-1 bg-zinc-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('REQUESTED')}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'REQUESTED' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Pending Requests
        </button>
        <button
          onClick={() => setActiveTab('APPROVED')}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'APPROVED' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'REJECTED' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Rejected
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Spinner className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
              <ArrowCounterClockwise className="h-12 w-12 mb-4 opacity-20" />
              <p>No {activeTab.toLowerCase()} returns found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested On</TableHead>
                    {activeTab === 'REQUESTED' && <TableHead className="text-right">Actions</TableHead>}
                    {activeTab === 'REJECTED' && <TableHead>Rejection Reason</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link to={`/seller/orders/${order.id}`} className="font-medium text-teal-600 hover:underline">
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-zinc-900">{order.customer?.name}</p>
                          <p className="text-zinc-500">{order.customer?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{order.returnReason?.replace('_', ' ')}</span>
                        {order.returnNotes && (
                          <p className="text-xs text-zinc-500 mt-1 max-w-[200px] truncate" title={order.returnNotes}>
                            Note: {order.returnNotes}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.returnRequestedAt ? new Date(order.returnRequestedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      {activeTab === 'REQUESTED' && (
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                            onClick={() => handleApprove(order.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300"
                            onClick={() => handleReject(order.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </TableCell>
                      )}
                      {activeTab === 'REJECTED' && (
                        <TableCell className="max-w-[200px] truncate" title={order.returnRejectedReason}>
                          {order.returnRejectedReason}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
