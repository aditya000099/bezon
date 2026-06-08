import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUp, 
  ArrowDown, 
  CurrencyDollar, 
  Funnel, 
  CaretLeft, 
  CaretRight, 
  Receipt 
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '../../lib/api';
import API_ENDPOINTS from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { TransactionDetailsModal } from '@/components/ui/TransactionDetailsModal';

export const SellerWallet: React.FC = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterRef, setFilterRef] = useState('');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const { toast } = useToast();

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.wallet.me);
      if (res.data.success) {
        setWallet(res.data.data);
      }
      
      const txRes = await api.get(API_ENDPOINTS.wallet.transactions, {
        params: { page, limit: 10, type: filterType, referenceType: filterRef }
      });
      if (txRes.data.success) {
        setTransactions(txRes.data.data.transactions);
        setTotalPages(txRes.data.data.totalPages);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [page, filterType, filterRef]);

  const getReferenceTypeLabel = (ref: string) => {
    const map: Record<string, string> = {
      order_payout: 'Order Payout',
      ad_spend: 'Ad Spend',
      refund_debit: 'Refund Debit',
      manual_credit: 'Manual Credit',
      manual_debit: 'Manual Debit',
      withdrawal: 'Withdrawal'
    };
    return map[ref] || ref;
  };

  if (loading && !wallet) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Wallet & Earnings</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your payouts and ad spends</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Wallet weight="duotone" className="w-32 h-32" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex items-center gap-3 mb-2 opacity-80">
            <CurrencyDollar className="w-5 h-5" />
            <span className="font-medium">Available Balance</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight">
              ₹{Number(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-zinc-400 font-medium">INR</span>
          </div>
          <div className="mt-8 flex gap-4">
            <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
              Withdraw Funds
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transaction History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant={filterType === '' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => { setFilterType(''); setPage(1); }}
            >
              All
            </Button>
            <Button 
              variant={filterType === 'credit' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => { setFilterType('credit'); setPage(1); }}
              className={filterType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Credits
            </Button>
            <Button 
              variant={filterType === 'debit' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => { setFilterType('debit'); setPage(1); }}
              className={filterType === 'debit' ? 'bg-rose-600 hover:bg-rose-700' : ''}
            >
              Debits
            </Button>
            <div className="h-6 w-px bg-zinc-200 mx-2"></div>
            <select 
              className="text-sm border border-zinc-200 rounded-md px-2 py-1 outline-none"
              value={filterRef}
              onChange={(e) => { setFilterRef(e.target.value); setPage(1); }}
            >
              <option value="">All Sources</option>
              <option value="order_payout">Order Payouts</option>
              <option value="ad_spend">Ad Spends</option>
              <option value="refund_debit">Refunds</option>
              <option value="manual_credit">Manual Credits</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium text-right">Balance After</th>
                    <th className="px-6 py-3 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-zinc-900">{tx.description}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{getReferenceTypeLabel(tx.referenceType)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tx.type === 'credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tx.type === 'credit' ? <ArrowDown weight="bold" /> : <ArrowUp weight="bold" />}
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-zinc-900">
                        ₹{Number(tx.balanceAfter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          onClick={() => {
                            setSelectedTx(tx);
                            setShowTxModal(true);
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100">
              <span className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <CaretLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next <CaretRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <TransactionDetailsModal 
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        transaction={selectedTx}
      />
    </div>
  );
};
