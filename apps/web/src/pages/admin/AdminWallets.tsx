import React, { useState, useEffect } from 'react';
import {
  Wallet,
  MagnifyingGlass,
  Plus,
  CaretLeft,
  CaretRight,
  CurrencyDollar,
  SpinnerIcon,
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import api from '../../lib/api';
import API_ENDPOINTS from '../../config/api.config';
import { useToast } from '../../context/ToastContext';

export const AdminWallets: React.FC = () => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [showCredit, setShowCredit] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');
  const [crediting, setCrediting] = useState(false);

  const { toast } = useToast();

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.wallet.all, {
        params: { page, limit: 20, search },
      });
      if (res.data.success) {
        setWallets(res.data.data.wallets);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleManualCredit = async () => {
    if (!creditAmount || !creditDesc || !selectedWallet) {
      return toast.error('Amount and description are required');
    }

    setCrediting(true);
    try {
      const res = await api.post(API_ENDPOINTS.wallet.manualCredit, {
        userId: selectedWallet.userId,
        amount: Number(creditAmount),
        description: creditDesc,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowCredit(false);
        setCreditAmount('');
        setCreditDesc('');
        fetchWallets(); // Refresh balance
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to credit wallet');
    } finally {
      setCrediting(false);
    }
  };

  const openCreditDialog = (wallet: any) => {
    setSelectedWallet(wallet);
    setCreditAmount('');
    setCreditDesc('');
    setShowCredit(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Wallet Management
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Monitor and manage platform wallets
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-72">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 bg-white"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </div>

      <Card className="border-zinc-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <SpinnerIcon className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : wallets.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              No wallets found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900 text-zinc-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Role / Shop</th>
                    <th className="px-6 py-3 font-medium text-right">
                      Balance (INR)
                    </th>
                    <th className="px-6 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {wallets.map((wallet) => (
                    <tr
                      key={wallet.id}
                      className="hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 font-bold shrink-0">
                            {wallet.user.avatarUrl ? (
                              <img
                                src={wallet.user.avatarUrl}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              wallet.user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900">
                              {wallet.user.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {wallet.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              wallet.user.role === 'seller'
                                ? 'bg-amber-100 text-amber-800'
                                : wallet.user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-zinc-100 text-zinc-800'
                            }`}
                          >
                            {wallet.user.role}
                          </span>
                          {wallet.user.seller && (
                            <span className="text-xs font-medium text-zinc-700">
                              {wallet.user.seller.shopName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-base text-zinc-900">
                          ₹
                          {Number(wallet.balance).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCreditDialog(wallet)}
                          className="gap-2"
                        >
                          <Plus weight="bold" /> Credit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 bg-white">
              <span className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <CaretLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <CaretRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Credit Dialog */}
      <Dialog open={showCredit} onOpenChange={setShowCredit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Wallet Credit</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex items-center gap-3">
              <Wallet className="w-6 h-6 text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500">Crediting wallet for:</p>
                <p className="font-semibold text-zinc-900">
                  {selectedWallet?.user.name} ({selectedWallet?.user.email})
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 500"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason / Description
              </label>
              <Input
                placeholder="e.g., Promotional credit, Refund adjustment"
                value={creditDesc}
                onChange={(e) => setCreditDesc(e.target.value)}
              />
              <p className="text-xs text-zinc-500">
                This will be visible to the user in their transaction history.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCredit(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualCredit} disabled={crediting}>
              {crediting ? (
                <SpinnerIcon className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirm Credit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
