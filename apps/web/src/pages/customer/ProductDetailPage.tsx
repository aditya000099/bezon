import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShieldCheck, Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedVariant, setSelectedVariant] = useState('black');
  const [isAdding, setIsAdding] = useState(false);

  // Mock product details that align with search/slug
  const product = {
    id: 'prod-headphones-uuid',
    title: 'Premium Wireless Headphones',
    brand: 'Acoustic',
    category: 'Electronics',
    rating: 4.8,
    reviewsCount: 42,
    basePrice: 4999,
    comparePrice: 6999,
    stock: 12,
    description: 'Experience premium acoustic definition with high-fidelity sound, custom drivers, and active noise cancellation (ANC). Designed with memory foam cushions for comfortable listening sessions over Bluetooth 5.2.',
    variants: [
      { id: 'var-1', name: 'Matte Black', color: 'black', sku: 'AC-HP-BLK', price: 4999 },
      { id: 'var-2', name: 'Silver White', color: 'white', sku: 'AC-HP-WHT', price: 5299 }
    ]
  };

  const currentPrice = selectedVariant === 'white' ? product.variants[1].price : product.variants[0].price;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const variantId = selectedVariant === 'white' ? product.variants[1].id : product.variants[0].id;
      await addItem(product.id, variantId, 1, currentPrice);
      toast.success(`${product.title} (${selectedVariant}) added to cart!`);
    } catch (error) {
      toast.error('Could not add item to cart. Try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToWishlist = () => {
    toast.success(`${product.title} saved to Wishlist!`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/shop">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Side: Images */}
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden border-slate-200 bg-white">
            <CardContent className="p-0 aspect-square flex items-center justify-center bg-slate-50 relative">
              <ShoppingBag className="h-24 w-24 text-slate-200" />
              <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                In Stock
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-xs font-semibold cursor-pointer hover:border-primary/50 transition-colors">
                View {i}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Product Details */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {product.category}
              </span>
              <span className="text-slate-400 text-xs font-semibold">Brand: {product.brand}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.title}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-amber-500 font-extrabold text-sm gap-1">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>{product.rating}</span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-sm font-medium hover:underline cursor-pointer">
                {product.reviewsCount} customer reviews
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-slate-900">₹{currentPrice.toLocaleString()}</span>
              {product.comparePrice && (
                <span className="text-slate-400 line-through text-sm">₹{product.comparePrice.toLocaleString()}</span>
              )}
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                Save 28%
              </span>
            </div>
            <p className="text-xs text-slate-400">Inclusive of all local dispatch taxes and fulfillment fees.</p>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Selected Edition
            </label>
            <div className="flex gap-3">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v.color)}
                  className={`flex-1 border rounded-lg p-3 text-left transition-all ${
                    selectedVariant === v.color
                      ? 'border-primary bg-primary/5 text-primary-foreground ring-2 ring-primary/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{v.name}</p>
                  <p className="text-sm font-extrabold mt-1 text-slate-900">₹{v.price.toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          {/* Delivery Promise */}
          <div className="flex gap-3 items-center bg-indigo-50/30 border border-indigo-50 rounded-xl p-4 text-xs text-slate-600">
            <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0" />
            <p>
              <strong>Fulfillment Promise:</strong> Dispatched within 24-48 hours. Eligible for return within 7 days of verified photographic delivery receipt.
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              className="flex-1 font-bold h-12 text-sm shadow-lg shadow-primary/10"
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              {isAdding ? 'Adding to Cart...' : 'Add to Shopping Cart'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 border-slate-200 hover:text-rose-500 hover:border-rose-200 transition-colors"
              onClick={handleAddToWishlist}
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

