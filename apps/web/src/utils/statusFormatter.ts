export const formatStatusText = (status: string | null | undefined): string => {
  if (!status) return 'Unknown';
  
  // Convert camelCase, snake_case, UPPERCASE_SNAKE_CASE to space-separated words
  const spaced = status
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to camel Case
    .replace(/[_-]/g, ' ')               // snake_case/kebab-case to space
    .toLowerCase();
    
  // Capitalize first letter of each word
  return spaced.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const getOrderStatusBadgeClass = (status: string | null | undefined): string => {
  if (!status) return 'bg-slate-50 text-slate-700 border-slate-200 whitespace-nowrap px-2.5 py-1 text-[10px] font-bold border rounded-full';
  
  const normalized = status.toLowerCase();
  
  let colors = 'bg-purple-50 text-purple-700 border-purple-200';
  
  switch (normalized) {
    case 'placed':
    case 'confirmed':
      colors = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'packed':
    case 'ready_for_pickup':
    case 'ready for pickup':
      colors = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'shipped':
    case 'out_for_delivery':
    case 'out for delivery':
      colors = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'delivered':
      colors = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'cancelled':
    case 'delivery_failed':
    case 'delivery failed':
    case 'rejected':
      colors = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'pending':
      colors = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'approved':
      colors = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'suspended':
      colors = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
  }
  
  return `${colors} whitespace-nowrap px-2.5 py-1 text-[10px] font-bold border rounded-full`;
};

export const getPaymentStatusBadgeClass = (status: string | null | undefined): string => {
  if (!status) return 'bg-slate-50 text-slate-700 border-slate-200 whitespace-nowrap px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase';
  
  const normalized = status.toLowerCase();
  let colors = 'bg-slate-50 text-slate-700 border-slate-200';
  
  switch (normalized) {
    case 'paid':
      colors = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'pending':
      colors = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'failed':
      colors = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'refunded':
      colors = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'refund_initiated':
    case 'refund initiated':
      colors = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
  }
  
  return `${colors} whitespace-nowrap px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase`;
};
