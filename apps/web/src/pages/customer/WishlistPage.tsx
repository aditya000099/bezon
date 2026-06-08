import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from '@bezon/ui';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
;
;
import {
  ShoppingBagIcon,
  StarIcon,
  HeartIcon,
  SpinnerIcon,
  ArrowRightIcon,
  EyeIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export const WishlistPage: React.FC = () => {
  const { wishlistItems, loading, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  const handleAddToCart = async (
    productId: string,
    productTitle: string,
    basePrice: number,
  ) => {
    setAddingToCart((prev) => ({ ...prev, [productId]: true }));
    try {
      await addItem(productId, 1, basePrice);
      toast.success(`Added ${productTitle} to your shopping cart!`);
    } catch (err) {
      toast.error('Failed to add item to cart. Try again.');
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (loading && wishlistItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-400 gap-2">
        <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
        <p className="text-sm font-semibold">Loading your saved items...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Your Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Keep track of the products you love and want to purchase later.
          </p>
        </div>
        <span className="bg-zinc-100 text-zinc-700 text-xs font-bold px-3 py-1.5 rounded-full">
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {wishlistItems.length === 0 ? (
        /* Empty State */
        <Card className="flex flex-col items-center justify-center min-h-[350px] text-zinc-400 p-8 bg-zinc-50/80 border-0 max-w-lg mx-auto w-full mt-6 rounded-[2rem]">
          <div className="p-4 rounded-full bg-zinc-50 border border-zinc-100 mb-4 shadow-inner">
            <HeartIcon className="h-10 w-10 text-zinc-300 fill-zinc-50" />
          </div>
          <p className="font-bold text-zinc-800 text-lg">
            No items in your wishlist yet.
          </p>
          <p className="text-xs text-zinc-500 text-center max-w-xs mt-1 leading-relaxed">
            Explore our curated catalog and tap the heart icon on any product to
            save it here.
          </p>
          <Link to="/" className="mt-6 w-full sm:w-auto">
            <Button
              size="sm"
              className="w-full sm:w-auto font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm gap-2"
            >
              Continue Shopping <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      ) : (
        /* Grid catalogue */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            const p = item.product;
            if (!p) return null;

            const primaryImg =
              p.images?.find((img: any) => img.isPrimary) || p.images?.[0];
            const isOutOfStock = p.totalStock <= 0;

            return (
              <Card
                key={item.id}
                className="overflow-hidden border-0 bg-zinc-50/80 rounded-3xl transition-all flex flex-col justify-between relative group hover:bg-zinc-100/60"
              >
                {/* Floating HeartIcon Button to Remove */}
                <button
                  onClick={() => toggleWishlist(p.id, p.title)}
                  className="absolute top-3 right-3 z-10 h-8 w-8 bg-white/90 hover:bg-white text-rose-500 rounded-full flex items-center justify-center backdrop-blur-xl transition-transform hover:scale-105 active:scale-95"
                  title="Remove from wishlist"
                >
                  <HeartIcon className="h-4 w-4 fill-rose-500 text-rose-500" />
                </button>

                {/* Image Container */}
                <Link to={`/products/${p.slug}`}>
                  <div className="aspect-square bg-white flex items-center justify-center overflow-hidden select-none cursor-pointer relative">
                    {primaryImg ? (
                      <img
                        src={primaryImg.url}
                        alt={p.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ShoppingBagIcon className="h-10 w-10 text-zinc-300 opacity-40" />
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
                        Out of Stock
                      </div>
                    )}
                  </div>
                </Link>

                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                      {p.brand || 'Unbranded'}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                        isOutOfStock
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                    </span>
                  </div>
                  <Link to={`/products/${p.slug}`}>
                    <CardTitle className="text-sm font-bold text-zinc-800 line-clamp-1 mt-1 hover:text-teal-600 transition-colors">
                      {p.title}
                    </CardTitle>
                  </Link>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500 font-bold">
                    <StarIcon className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>
                      {p.avgRating ? Number(p.avgRating).toFixed(1) : '0.0'}
                    </span>
                    <span className="text-zinc-400 font-normal">
                      ({p.reviewCount || 0})
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2">
                  <span className="text-base font-extrabold text-zinc-900">
                    ₹{Number(p.basePrice).toLocaleString()}
                  </span>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex gap-2 mt-auto">
                  <Link to={`/products/${p.slug}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-bold text-zinc-600 border-zinc-200 hover:text-teal-600 hover:border-teal-200 transition-colors gap-1"
                    >
                      <EyeIcon className="h-3.5 w-3.5" /> Details
                    </Button>
                  </Link>
                  {!isOutOfStock ? (
                    <Button
                      className="flex-1 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm gap-1"
                      size="sm"
                      onClick={() =>
                        handleAddToCart(p.id, p.title, Number(p.basePrice))
                      }
                      disabled={addingToCart[p.id]}
                    >
                      {addingToCart[p.id] ? (
                        <SpinnerIcon className="h-3 w-3 animate-spin text-white" />
                      ) : (
                        <ShoppingBagIcon className="h-3.5 w-3.5" />
                      )}
                      Add to Cart
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="flex-1 text-xs font-bold text-zinc-400 bg-zinc-50 cursor-not-allowed hover:bg-zinc-50"
                      size="sm"
                      disabled
                    >
                      Unavailable
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
