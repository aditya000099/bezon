import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadSimple, FileCsv, FilePdf } from '@phosphor-icons/react';
import { useToast } from '../../../context/ToastContext';
import api from '../../../lib/api';

export interface AdminOrderExportControlsProps {
  filters: {
    searchTerm: string;
    statusFilter: string;
    paymentFilter: string;
    sellerFilter: string;
    partnerFilter: string;
    customerFilter: string;
    startDate: string;
    endDate: string;
  };
}

export const AdminOrderExportControls: React.FC<AdminOrderExportControlsProps> = ({ filters }) => {
  const { toast } = useToast();
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const handleExport = async (type: 'pdf' | 'csv') => {
    const isPdf = type === 'pdf';
    const setExporting = isPdf ? setExportingPdf : setExportingCsv;
    
    try {
      setExporting(true);
      
      const response = await api.post(`/api/v1/orders/export/${type}`, filters, {
        responseType: 'blob', // Important for downloading files
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: isPdf ? 'application/pdf' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_report_${new Date().toISOString().split('T')[0]}.${type}`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      link.remove();
      
      toast.success(`${type.toUpperCase()} report exported successfully.`);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
         toast.error('No orders found for selected filters.');
      } else {
         toast.error(`Failed to export ${type.toUpperCase()}`);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        disabled={exportingPdf || exportingCsv}
        className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
      >
        <FilePdf className="h-4 w-4" />
        {exportingPdf ? 'Generating...' : 'Export PDF'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={exportingPdf || exportingCsv}
        className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      >
        <FileCsv className="h-4 w-4" />
        {exportingCsv ? 'Generating...' : 'Export CSV'}
      </Button>
    </div>
  );
};
