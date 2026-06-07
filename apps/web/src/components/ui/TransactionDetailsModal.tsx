import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Database, Receipt, User, Clock, ArrowRight, Wallet, ShoppingCart, Tag, TagChevron } from '@phosphor-icons/react';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  if (!transaction) return null;

  const isCredit = transaction.type === 'credit';
  const order = transaction.orderDetails;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-zinc-200 p-0 overflow-hidden shadow-xl">
        <DialogHeader className="bg-zinc-50 border-b border-zinc-100 p-5">
          <DialogTitle className="text-zinc-800 flex items-center gap-2 font-bold font-mono">
            <Receipt className="h-5 w-5 text-zinc-500" />
            Transaction Record
          </DialogTitle>
          <div className="text-xs text-zinc-500 font-mono mt-1 flex justify-between items-center">
            <span>TXN ID: {transaction.id}</span>
            <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
              isCredit ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
              {transaction.type}
            </span>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-6">
          {/* Main Amount */}
          <div className="flex justify-between items-center bg-zinc-50 rounded-xl p-4 border border-zinc-100">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Amount</p>
              <p className={`text-2xl font-black mt-1 font-mono ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isCredit ? '+' : '-'}₹{Number(transaction.amount).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Reference</p>
              <p className="text-sm font-semibold text-zinc-800 mt-1 capitalize">
                {transaction.referenceType.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="h-3 w-3"/> Timestamp</p>
              <p className="text-zinc-700 font-medium">
                {new Date(transaction.createdAt).toLocaleString()}
              </p>
            </div>
            {order?.customerName && (
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1"><User className="h-3 w-3"/> Customer</p>
                <p className="text-zinc-700 font-medium">{order.customerName}</p>
              </div>
            )}
            {order?.shopName && (
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Tag className="h-3 w-3"/> Seller</p>
                <p className="text-zinc-700 font-medium">{order.shopName}</p>
              </div>
            )}
          </div>

          {/* Order Financial Breakdown */}
          {order && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <div className="bg-zinc-50 border-b border-zinc-200 p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4" /> Order Breakdown
                </span>
                <span className="text-xs font-mono font-bold text-zinc-500">#{order.orderNumber}</span>
              </div>
              
              <div className="p-4 space-y-3 bg-white text-sm">
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Gross Order Amount</span>
                  <span className="font-semibold text-zinc-800">₹{order.orderTotal?.toLocaleString() || 0}</span>
                </div>
                
                {order.commissionDeducted > 0 && (
                  <div className="flex justify-between items-center text-rose-600">
                    <span className="flex items-center gap-1">Platform Commission</span>
                    <span className="font-semibold">-₹{order.commissionDeducted?.toLocaleString() || 0}</span>
                  </div>
                )}
                
                {order.refundAmount > 0 && (
                  <div className="flex justify-between items-center text-amber-600">
                    <span className="flex items-center gap-1">Refund Processed</span>
                    <span className="font-semibold">₹{order.refundAmount?.toLocaleString() || 0}</span>
                  </div>
                )}
                
                <div className="pt-3 mt-1 border-t border-zinc-100 flex justify-between items-center">
                  <span className="font-bold text-zinc-800">Final Settlement</span>
                  <span className="font-black text-emerald-600 text-base">₹{order.settlementAmount?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Balances */}
          <div className="bg-zinc-50 p-4 rounded-xl flex items-center justify-between text-sm border border-zinc-100">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Prior Balance</p>
              <p className="font-mono text-zinc-600">₹{Number(transaction.balanceBefore).toLocaleString()}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-300" />
            <div className="text-right">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">New Balance</p>
              <p className="font-mono font-bold text-zinc-800">₹{Number(transaction.balanceAfter).toLocaleString()}</p>
            </div>
          </div>
          
          {transaction.description && (
            <div className="text-xs text-zinc-500 bg-zinc-50 p-3 rounded-lg border border-zinc-100 italic">
              Note: {transaction.description}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
