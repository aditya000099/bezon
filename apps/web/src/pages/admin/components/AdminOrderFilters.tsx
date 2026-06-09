import { Card, CardContent, Button, Input } from '@bezon/ui';
import React from 'react';
;
;
;
import { MagnifyingGlassIcon, FunnelIcon, CalendarBlankIcon } from '@phosphor-icons/react';

export interface AdminOrderFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  paymentFilter: string;
  setPaymentFilter: (val: string) => void;
  sellerFilter: string;
  setSellerFilter: (val: string) => void;
  partnerFilter: string;
  setPartnerFilter: (val: string) => void;
  customerFilter: string;
  setCustomerFilter: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  uniqueSellers: string[];
  uniquePartners: string[];
  uniqueCustomers: string[];
}

export const AdminOrderFilters: React.FC<AdminOrderFiltersProps> = ({
  searchTerm, setSearchTerm,
  statusFilter, setStatusFilter,
  paymentFilter, setPaymentFilter,
  sellerFilter, setSellerFilter,
  partnerFilter, setPartnerFilter,
  customerFilter, setCustomerFilter,
  startDate, setStartDate,
  endDate, setEndDate,
  uniqueSellers, uniquePartners, uniqueCustomers,
}) => {
  return (
    <Card className="bg-white border-zinc-200 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <FunnelIcon className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-800">Advanced Filter Console</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </span>
            <Input
              type="text"
              placeholder="Search Order ID, Customer, Shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Order Statuses</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="packed">Packed</option>
            <option value="ready_for_pickup">Ready For Pickup</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out For Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="delivery_failed">Delivery Failed</option>
            <option value="return_requested">Return Requested</option>
            <option value="return_approved">Return Approved</option>
            <option value="returned_to_origin">Returned to Origin</option>
            <option value="return_rejected">Return Rejected</option>
            <option value="refund_requested">Refund Requested</option>
            <option value="refund_approved">Refund Approved</option>
            <option value="refunding">Refunding</option>
            <option value="refunded">Refunded</option>
            <option value="refund_rejected">Refund Rejected</option>
            <option value="replacement_requested">Replacement Requested</option>
            <option value="replacement_approved">Replacement Approved</option>
            <option value="replacement_shipped">Replacement Shipped</option>
            <option value="replaced">Replaced</option>
            <option value="replacement_rejected">Replacement Rejected</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Payment Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refund_initiated">Refund Initiated</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Sellers</option>
            {uniqueSellers.map((seller) => (
              <option key={seller} value={seller}>{seller}</option>
            ))}
          </select>

          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Delivery Partners</option>
            {uniquePartners.map((partner) => (
              <option key={partner} value={partner}>{partner}</option>
            ))}
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Customers</option>
            {uniqueCustomers.map((cust) => (
              <option key={cust} value={cust}>{cust}</option>
            ))}
          </select>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
              <CalendarBlankIcon className="h-4 w-4" />
            </span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
              <CalendarBlankIcon className="h-4 w-4" />
            </span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setPaymentFilter('');
              setSellerFilter('');
              setPartnerFilter('');
              setCustomerFilter('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-zinc-500 font-semibold"
          >
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
