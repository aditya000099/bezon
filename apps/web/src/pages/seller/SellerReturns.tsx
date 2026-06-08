import { Card, CardHeader, CardTitle, CardContent, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@bezon/ui';
import React, { useState, useEffect, useMemo } from 'react';
;
;
;
import { SpinnerIcon, ArrowCounterClockwiseIcon, MagnifyingGlassIcon, DownloadSimpleIcon, EyeIcon } from '@phosphor-icons/react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { Link, useSearchParams } from 'react-router-dom';

type TabKey = 'action-required' | 'in-progress' | 'completed';
type FilterKey = 'all' | 'pending-inspection' | 'damaged' | 'restocked' | 'disposed';
type SortKey = 'newest' | 'oldest' | 'recently-returned' | 'pending-inspection';

export const SellerReturns: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey;
  
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || 'action-required');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [activeSort, setActiveSort] = useState<SortKey>('newest');
  
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Update URL param when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.orders.sellerMe);
      if (res.data.success) {
        setAllOrders(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const allReturns = useMemo(() => {
    return allOrders.filter(o => o.returnStatus && o.returnStatus !== 'NONE');
  }, [allOrders]);

  const metrics = useMemo(() => {
    const totalOrders = allOrders.length;
    const totalReturns = allReturns.length;
    const pendingRequests = allReturns.filter(o => o.returnStatus === 'REQUESTED').length;
    const inTransit = allReturns.filter(o => ['ASSIGNED', 'PICKED_UP'].includes(o.returnStatus)).length;
    const pendingInspection = allReturns.filter(o => o.returnStatus === 'COMPLETED' && o.returnInspectionStatus === 'PENDING_INSPECTION').length;
    const restocked = allReturns.filter(o => o.returnInspectionStatus === 'RESTOCKED').length;
    const damaged = allReturns.filter(o => o.returnInspectionStatus === 'DAMAGED').length;
    const disposed = allReturns.filter(o => o.returnInspectionStatus === 'DISPOSED').length;
    const returnRate = totalOrders > 0 ? ((totalReturns / totalOrders) * 100).toFixed(1) : '0.0';

    return { totalReturns, pendingRequests, inTransit, pendingInspection, restocked, damaged, disposed, returnRate };
  }, [allOrders, allReturns]);

  const filteredOrders = useMemo(() => {
    let list = allReturns.filter(o => {
      if (activeTab === 'action-required') {
        return o.returnStatus === 'REQUESTED' || (o.returnStatus === 'COMPLETED' && o.returnInspectionStatus === 'PENDING_INSPECTION');
      }
      if (activeTab === 'in-progress') {
        return ['APPROVED', 'ASSIGNED', 'PICKED_UP'].includes(o.returnStatus);
      }
      if (activeTab === 'completed') {
        return o.returnStatus === 'COMPLETED' && ['RESTOCKED', 'DAMAGED', 'DISPOSED'].includes(o.returnInspectionStatus);
      }
      return false;
    });

    if (activeFilter !== 'all') {
      if (activeFilter === 'pending-inspection') {
        list = list.filter(o => o.returnInspectionStatus === 'PENDING_INSPECTION');
      } else if (activeFilter === 'damaged') {
        list = list.filter(o => o.returnInspectionStatus === 'DAMAGED');
      } else if (activeFilter === 'restocked') {
        list = list.filter(o => o.returnInspectionStatus === 'RESTOCKED');
      } else if (activeFilter === 'disposed') {
        list = list.filter(o => o.returnInspectionStatus === 'DISPOSED');
      }
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(o => 
        o.orderNumber?.toLowerCase().includes(lower) ||
        o.customer?.name?.toLowerCase().includes(lower) ||
        o.items?.[0]?.product?.name?.toLowerCase().includes(lower) ||
        o.returnInspectionStatus?.toLowerCase().includes(lower) ||
        o.returnStatus?.toLowerCase().includes(lower)
      );
    }

    list = [...list].sort((a, b) => {
      if (activeSort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (activeSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (activeSort === 'recently-returned') return new Date(b.returnCompletedAt || 0).getTime() - new Date(a.returnCompletedAt || 0).getTime();
      if (activeSort === 'pending-inspection') {
        if (a.returnInspectionStatus === 'PENDING_INSPECTION' && b.returnInspectionStatus !== 'PENDING_INSPECTION') return -1;
        if (b.returnInspectionStatus === 'PENDING_INSPECTION' && a.returnInspectionStatus !== 'PENDING_INSPECTION') return 1;
        return 0;
      }
      return 0;
    });

    return list;
  }, [allReturns, activeTab, activeFilter, activeSort, searchTerm]);

  const exportCSV = () => {
    const csvContent = [
      ['Order Number', 'Customer Name', 'Product Name', 'Return Status', 'Inspection Status', 'Date'],
      ...filteredOrders.map(o => [
        o.orderNumber,
        o.customer?.name || '',
        o.items?.[0]?.product?.name?.replace(/,/g, ' ') || '',
        o.returnStatus || '',
        o.returnInspectionStatus || '',
        new Date(o.createdAt).toLocaleDateString()
      ])
    ].map(e => e.join(',')).join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `returns_${activeTab.toLowerCase()}.csv`;
    link.click();
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'REQUESTED': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'ASSIGNED': return 'bg-orange-100 text-orange-800';
      case 'PICKED_UP': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      
      case 'PENDING_INSPECTION': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'RESTOCKED': return 'bg-emerald-100 text-emerald-800';
      case 'DAMAGED': return 'bg-red-100 text-red-800';
      case 'DISPOSED': return 'bg-zinc-100 text-zinc-800';
      default: return 'bg-zinc-100 text-zinc-800';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Returns Management</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-zinc-500">Total Returns</p><p className="text-xl font-bold">{metrics.totalReturns}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-zinc-500">Return Rate</p><p className="text-xl font-bold">{metrics.returnRate}%</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-blue-600">Pending Req.</p><p className="text-xl font-bold text-blue-700">{metrics.pendingRequests}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-orange-600">In Transit</p><p className="text-xl font-bold text-orange-700">{metrics.inTransit}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-yellow-600">Pending Insp.</p><p className="text-xl font-bold text-yellow-700">{metrics.pendingInspection}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-red-600">Damaged/Disp.</p><p className="text-xl font-bold text-red-700">{metrics.damaged + metrics.disposed}</p></CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 bg-zinc-100 p-1 rounded-lg">
          {[
            { key: 'action-required', label: 'Action Required' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as TabKey); setActiveFilter('all'); }}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-500">Filter:</span>
            <select 
              className="text-sm border rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
              value={activeFilter}
              onChange={e => setActiveFilter(e.target.value as FilterKey)}
            >
              <option value="all">All</option>
              <option value="pending-inspection">Pending Inspection</option>
              <option value="damaged">Damaged</option>
              <option value="restocked">Restocked</option>
              <option value="disposed">Disposed</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-500">Sort:</span>
            <select 
              className="text-sm border rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
              value={activeSort}
              onChange={e => setActiveSort(e.target.value as SortKey)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="recently-returned">Recently Returned</option>
              <option value="pending-inspection">Pending Inspection First</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search returns..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="shrink-0">
            <DownloadSimpleIcon className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <SpinnerIcon className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
              <ArrowCounterClockwiseIcon className="h-12 w-12 mb-4 opacity-20" />
              <p>No returns found in this view.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-medium text-zinc-500">Order</span>
                        <p className="font-semibold text-zinc-900">{order.orderNumber}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(order.returnStatus)}`}>
                          {order.returnStatus?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <p className="font-medium">{order.customer?.name}</p>
                      <p className="text-zinc-500 truncate">{order.items?.[0]?.product?.name}</p>
                    </div>

                    {order.returnInspectionStatus && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Inspection:</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(order.returnInspectionStatus)}`}>
                          {order.returnInspectionStatus?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}

                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to={`/seller/returns/${order.id}`}>
                        <EyeIcon className="mr-2 h-4 w-4" /> View Details
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Info</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Return Status</TableHead>
                      <TableHead>Inspection Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-zinc-900">{order.orderNumber}</span>
                            <span className="text-xs text-zinc-500 max-w-[200px] truncate mt-0.5">
                              {order.items?.[0]?.product?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium text-zinc-900">{order.customer?.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(order.returnStatus)}`}>
                            {order.returnStatus?.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {order.returnInspectionStatus ? (
                            <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(order.returnInspectionStatus)}`}>
                              {order.returnInspectionStatus?.replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="default" className="bg-teal-600 hover:bg-teal-700">
                            <Link to={`/seller/returns/${order.id}`}>
                              <EyeIcon className="mr-1.5 h-4 w-4" /> View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
