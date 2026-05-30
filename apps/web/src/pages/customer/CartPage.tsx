import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const CartPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart items list */}
        <Card className="flex-1 bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] p-6">
          <ShoppingBag className="h-12 w-12 text-slate-300 mb-4 animate-bounce" />
          <CardTitle className="text-lg font-bold text-slate-700">Your cart is empty</CardTitle>
          <p className="text-slate-400 text-xs mt-1 max-w-xs text-center">Add premium items from the marketplace to check out.</p>
          <Link to="/shop">
            <Button className="mt-6 font-bold" size="sm">
              Start Shopping
            </Button>
          </Link>
        </Card>

        {/* Order Summary */}
        <Card className="w-full lg:w-80 bg-white border border-slate-200 shadow-sm h-fit p-6 flex flex-col gap-4">
          <CardHeader className="p-0 border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-bold text-slate-800">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹0.00</span>
            </div>
            <div className="flex justify-between">
              <span>Fulfillment Charge</span>
              <span className="text-slate-400 text-xs">Calculated next</span>
            </div>
          </CardContent>
          <CardFooter className="p-0 border-t border-slate-100 pt-4 flex flex-col gap-4 w-full">
            <div className="flex justify-between font-bold text-base text-slate-950 w-full">
              <span>Total Amount</span>
              <span>₹0.00</span>
            </div>
            <Button disabled className="w-full font-bold" variant="secondary">
              Proceed <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
