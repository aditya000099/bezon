import { Card, CardContent, CardHeader, CardTitle, Button } from '@bezon/ui';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PlusCircleIcon } from '@phosphor-icons/react';
;
;
import { ProductForm } from './components/ProductForm';

export const SellerAddProduct: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
            Seller Products
          </p>
          <h1 className="text-xl font-extrabold text-zinc-800 mt-1 flex items-center gap-2">
            <PlusCircleIcon className="h-5 w-5 text-teal-500" /> Add Product
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create a new product listing with the same catalog controls used in
            the product dialog.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/seller/products')}
          className="w-full sm:w-auto font-bold flex items-center gap-2 hover:cursor-pointer"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Products
        </Button>
      </div>

      <Card className="bg-white border border-zinc-200 shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl font-bold text-zinc-800">
            Register New Product
          </CardTitle>
          <p className="text-zinc-500 text-sm mt-1">
            Publish item attributes, pricing details, manage variants, and
            upload gallery imagery.
          </p>
        </CardHeader>
        <CardContent>
          <ProductForm
            onCancel={() => navigate('/seller/products')}
            onSuccess={() => navigate('/seller/products')}
          />
        </CardContent>
      </Card>
    </div>
  );
};
