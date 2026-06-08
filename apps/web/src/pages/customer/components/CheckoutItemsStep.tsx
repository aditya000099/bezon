import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@bezon/ui';

interface CheckoutItemsStepProps {
  items: any[];
  groupedItems: Record<string, any[]>;
}

export const CheckoutItemsStep: React.FC<CheckoutItemsStepProps> = ({
  items,
  groupedItems,
}) => {
  return (
    <Card className="bg-zinc-50/80 border-0 rounded-4xl p-4 sm:p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-zinc-800">
          2. Review & Split Shipments
        </CardTitle>
        <CardDescription className="text-zinc-500 mt-1">
          Items from different sellers will be created as separate orders to facilitate direct merchant dispatch.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {items.length === 0 ? (
          <p className="text-zinc-400 text-sm">Your cart is empty.</p>
        ) : (
          Object.keys(groupedItems).map((seller) => (
            <div key={seller} className="border-0 rounded-3xl p-5 bg-white/60">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 mb-3">
                <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">
                  Seller Grouping
                </span>
                <span className="text-zinc-300">|</span>
                <span className="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded font-bold">
                  Direct Dispatch
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {groupedItems[seller].map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-800">{item.product?.title}</span>
                      <span className="text-xs text-zinc-400">
                        SKU: {item.product?.sku} · Qty: {item.qty}
                      </span>
                    </div>
                    <span className="font-extrabold text-zinc-900">
                      ₹{(Number(item.product?.basePrice) * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
