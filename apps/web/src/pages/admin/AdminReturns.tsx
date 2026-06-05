import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner, ArrowCounterClockwise, CheckCircle, XCircle, Clock } from '@phosphor-icons/react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const AdminReturns: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'REQUESTED' | 'APPROVED' | 'REJECTED'>('REQUESTED');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  const fetchReturns = async () => {
    setLoading(true);
    try {
      // For MVP, we'll fetch the active tab data.
      // To get real stats, we should fetch all return statuses, but this is fine for now.
      const [reqRes, appRes, rejRes] = await Promise.all([
        api.get(API_ENDPOINTS.orders.base, { params: { returnStatus: 'REQUESTED' } }),
        api.get(API_ENDPOINTS.orders.base, { params: { returnStatus: 'APPROVED' } }),
        api.get(API_ENDPOINTS.orders.base, { params: { returnStatus: 'REJECTED' } })
      ]);

      const requested = reqRes.data.data || [];
      const approved = appRes.data.data || [];
      const rejected = rejRes.data.data || [];

      setStats({
        pending: requested.length,
        approved: approved.length,
        rejected: rejected.length,
        total: requested.length + approved.length + rejected.length
      });

      if (activeTab === 'REQUESTED') setOrders(requested);
      else if (activeTab === 'APPROVED') setOrders(approved);
      else if (activeTab === 'REJECTED') setOrders(rejected);

    } catch (err: any) {
      toast.error('Failed to fetch returns data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Returns Management</h1>
        <p className="text-sm text-zinc-500 mt-1">Monitor and review all customer return requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 border-rose-100">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-rose-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-50 border-zinc-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-zinc-700 flex items-center gap-2">
              <ArrowCounterClockwise className="h-4 w-4" /> Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{stats.total}</div>
          </CardContent>
        </Card>
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
                    <TableHead>Seller</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested On</TableHead>
                    {activeTab === 'REJECTED' && <TableHead>Rejection Reason</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link to={`/admin/orders/${order.id}`} className="font-medium text-teal-600 hover:underline">
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-zinc-900">{order.customer?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-zinc-900">{order.seller?.shopName}</p>
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
