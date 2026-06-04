import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Info, Truck } from '@phosphor-icons/react';
import { getOrderStatusBadgeClass, getPaymentStatusBadgeClass, formatStatusText } from '../../../utils/statusFormatter';

export interface AdminOrderListProps {
  orders: any[];
  loading: boolean;
  formatCurrency: (val: number) => string;
  setSelectedOrderId: (id: string) => void;
}

export const AdminOrderList: React.FC<AdminOrderListProps> = ({
  orders,
  loading,
  formatCurrency,
  setSelectedOrderId,
}) => {
  return (
    <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-zinc-500">
              <Clock className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2" />
              <p className="text-sm font-semibold">Loading platform orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center text-zinc-400">
              <Info className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
              <p className="text-sm font-semibold">No orders matched the specified filters.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-zinc-600">
              <thead className="bg-zinc-50 text-[10px] text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Seller / Shop</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-center">Payment Status</th>
                  <th className="px-6 py-3.5 text-center">Order Status</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5">Delivery Partner</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-zinc-800">
                      {order.orderNumber || order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-800">{order.customer?.name}</div>
                      <div className="text-xs text-zinc-400 font-medium">{order.customer?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-800">{order.seller?.shopName}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-800">
                      {formatCurrency(parseFloat(order.total))}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase border rounded-full ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getOrderStatusBadgeClass(order.status)}`}>
                        {formatStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500 font-medium">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {order.delivery?.partner?.user?.name ? (
                        <div className="flex items-center gap-1 text-zinc-700">
                          <Truck className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="font-medium">{order.delivery.partner.user.name}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => setSelectedOrderId(order.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold"
                      >
                        View details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
