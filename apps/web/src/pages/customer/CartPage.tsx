import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  ArrowRight,
  Trash,
  Plus,
  Minus,
  Spinner,
} from '@phosphor-icons/react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export const CartPage: React.FC = () => {
  const { toast } = useToast();
  const { items, loading, updateQty, removeItem, cartTotal } = useCart();
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const handleUpdateQty = async (
    itemId: string,
    currentQty: number,
    change: number,
  ) => {
    const newQty = currentQty + change;
    if (newQty <= 0) return;

    setUpdatingItemId(itemId);
    try {
      await updateQty(itemId, newQty);
      toast.success('Cart updated.');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to update item quantity.',
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItemId(itemId);
    try {
      await removeItem(itemId);
      toast.success('Item removed from cart.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not remove item.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
        Your Shopping Cart
      </h1>

      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-75 text-zinc-400 gap-2">
          <Spinner className="h-8 w-8 animate-spin text-teal-500" />
          <p className="text-sm font-semibold">Loading shopping cart...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Empty State */}
          <Card className="flex-1 bg-zinc-50/80 border-0 flex flex-col items-center justify-center min-h-[300px] p-6 rounded-[2rem]">
            <ShoppingBag className="h-12 w-12 text-zinc-300 mb-4 animate-bounce" />
            <CardTitle className="text-lg font-bold text-zinc-700">
              Your cart is empty
            </CardTitle>
            <p className="text-zinc-400 text-xs mt-1 max-w-xs text-center">
              Add premium items from the marketplace to check out.
            </p>
            <Link to="/shop">
              <Button className="mt-6 font-bold" size="sm">
                Start Shopping
              </Button>
            </Link>
          </Card>

          {/* Checkout Summaries */}
          <Card className="w-full lg:w-80 bg-zinc-50/80 border-0 h-fit p-8 flex flex-col gap-4 rounded-[2rem]">
            <CardHeader className="p-0 border-b border-zinc-200/50 pb-4">
              <CardTitle className="text-base font-bold text-zinc-800">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-zinc-900">₹0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment Charge</span>
                <span className="text-zinc-400 text-xs">Calculated next</span>
              </div>
            </CardContent>
            <CardFooter className="p-0 border-t border-zinc-200/50 pt-5 flex flex-col gap-4 w-full">
              <div className="flex justify-between font-bold text-base text-zinc-950 w-full">
                <span>Total Amount</span>
                <span>₹0.00</span>
              </div>
              <Button disabled className="w-full font-bold" variant="secondary">
                Proceed <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Item Cards List */}
          <div className="flex-1 space-y-4">
            {items.map((item) => {
              const primaryImg =
                (item.product as any)?.images?.find(
                  (img: any) => img.isPrimary,
                ) || (item.product as any)?.images?.[0];
              const attrText = Object.entries(item.product?.attributes || {})
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');

              return (
                <Card
                  key={item.id}
                  className="bg-zinc-50/80 border-0 flex flex-col sm:flex-row gap-4 p-5 items-center justify-between relative overflow-hidden rounded-3xl hover:bg-zinc-100/60 transition-colors"
                >
                  {updatingItemId === item.id && (
                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                      <Spinner className="h-6 w-6 animate-spin text-teal-600" />
                    </div>
                  )}

                  <div className="flex gap-4 items-center w-full sm:w-auto">
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                      {primaryImg ? (
                        <img
                          src={primaryImg.url}
                          alt={item.product?.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-zinc-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-800 line-clamp-1">
                        {item.product?.title}
                      </h4>
                      {attrText && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {attrText}
                        </p>
                      )}
                      <p className="text-[10px] text-mono font-mono text-zinc-400 mt-1 uppercase tracking-wider">
                        SKU: {item.product?.sku}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-200/50">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-0 bg-white shadow-sm"
                        onClick={() => handleUpdateQty(item.id, item.qty, -1)}
                        disabled={item.qty <= 1}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold text-zinc-800">
                        {item.qty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-0 bg-white shadow-sm"
                        onClick={() => handleUpdateQty(item.id, item.qty, 1)}
                        disabled={item.qty >= (item.product as any).totalStock}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-extrabold text-zinc-900">
                        ₹
                        {(
                          Number(item.product?.basePrice) * item.qty
                        ).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        ₹{Number(item.product?.basePrice).toLocaleString()} each
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-full h-9 w-9 shrink-0"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Summary Panel */}
          <Card className="w-full lg:w-80 bg-zinc-50/80 border-0 h-fit p-8 flex flex-col gap-4 shrink-0 rounded-[2rem]">
            <CardHeader className="p-0 border-b border-zinc-200/50 pb-4">
              <CardTitle className="text-base font-bold text-zinc-800">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-zinc-900">
                  ₹{cartTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment Charge</span>
                <span className="text-zinc-500 font-semibold text-xs">
                  FREE
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-0 border-t border-zinc-200/50 pt-5 flex flex-col gap-4 w-full">
              <div className="flex justify-between font-bold text-base text-zinc-950 w-full">
                <span>Total Amount</span>
                <span>₹{cartTotal.toLocaleString()}</span>
              </div>
              <Link to="/shop/checkout" className="w-full">
                <Button className="w-full font-bold">
                  Proceed to Checkout <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};
