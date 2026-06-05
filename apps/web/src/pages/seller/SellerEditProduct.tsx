import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PencilSimple } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@phosphor-icons/react';
import { ProductForm } from './components/ProductForm';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import type { Product } from '@bezon/types';

export const SellerEditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get(API_ENDPOINTS.products.getById(id));
        if (res.data.success) {
          setProduct(res.data.data);
        }
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || 'Failed to load product details.',
        );
        navigate('/seller/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 gap-2">
        <Spinner className="h-8 w-8 animate-spin text-teal-500" />
        <p className="text-sm font-semibold">
          Loading product listing details...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
            Seller Products
          </p>
          <h1 className="text-xl font-extrabold text-zinc-800 mt-1 flex items-center gap-2">
            <PencilSimple className="h-5 w-5 text-teal-500" />
            Product
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Update pricing, specifications, variants, and gallery imagery for
            this item.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/seller/products')}
          className="w-full sm:w-auto font-bold flex items-center gap-2 hover:cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Button>
      </div>

      <Card className="bg-white border border-zinc-200 shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl font-bold text-zinc-800">
            Modify Product Listing
          </CardTitle>
          <p className="text-zinc-500 text-sm mt-1">
            Modify the product characteristics below. Ensure all changes are
            validated before saving.
          </p>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={product}
            onCancel={() => navigate('/seller/products')}
            onSuccess={() => navigate('/seller/products')}
          />
        </CardContent>
      </Card>
    </div>
  );
};
