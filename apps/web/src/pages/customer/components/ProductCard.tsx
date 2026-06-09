import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
} from '@bezon/ui';
import { HeartIcon, ShoppingBagIcon, StarIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: any;
  addingToCart?: boolean;
  isInWishlist: boolean;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (id: string, title: string) => void;
  onClick?: (e: React.MouseEvent, product: any) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product: p,
  addingToCart,
  isInWishlist,
  onAddToCart,
  onToggleWishlist,
  onClick,
}) => {
  const primaryImg =
    p.images?.find((img: any) => img.isPrimary) || p.images?.[0];

  const handleImageClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e, p);
  };

  const imageContent = (
    <div className="aspect-square bg-secondary flex items-center justify-center text-zinc-300 font-semibold text-xs select-none cursor-pointer overflow-hidden rounded-2xl">
      {primaryImg ? (
        <img
          src={primaryImg.url}
          alt={p.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <ShoppingBagIcon className="h-10 w-10 opacity-40 mb-2 block mx-auto text-zinc-400" />
      )}
    </div>
  );

  return (
    <Card className="overflow-hidden flex flex-col justify-between bg-card relative group border border-zinc-100 hover:border-zinc-300 transition-all rounded-2xl">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleWishlist(p.id, p.title);
        }}
        className="absolute top-3 right-3 z-10 h-8 w-8 bg-white/80 hover:bg-white text-zinc-400 hover:text-rose-500 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors border border-zinc-100 shadow-xs"
      >
        <HeartIcon
          className={`h-4 w-4 ${
            isInWishlist ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
          }`}
        />
      </button>

      {p.isSponsored && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-zinc-900/80 backdrop-blur text-[9px] font-bold tracking-widest text-white rounded uppercase shadow-sm">
          Sponsored
        </div>
      )}

      {onClick ? (
        <div onClick={handleImageClick}>{imageContent}</div>
      ) : (
        <Link to={`/products/${p.slug}`}>{imageContent}</Link>
      )}

      <CardHeader className="p-4 pb-0">
        <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest">
          {p.brand || 'Seller Direct'}
        </span>
        {onClick ? (
          <div onClick={(e) => onClick(e, p)} className="cursor-pointer">
            <CardTitle className="text-sm sm:text-base font-bold text-zinc-800 line-clamp-1 mt-0.5 hover:text-teal-600 transition-colors">
              {p.title}
            </CardTitle>
          </div>
        ) : (
          <Link to={`/products/${p.slug}`}>
            <CardTitle className="text-sm sm:text-base font-bold text-zinc-800 line-clamp-1 mt-0.5 hover:text-teal-600 transition-colors">
              {p.title}
            </CardTitle>
          </Link>
        )}

        <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500 font-bold">
          <StarIcon className="h-3 w-3 fill-amber-500 text-amber-500" />
          <span>{p.avgRating ? Number(p.avgRating).toFixed(1) : '0.0'}</span>
          <span className="text-zinc-400 font-normal">
            ({p.reviewCount || 0})
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3 flex items-baseline gap-2">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex gap-2 justify-center items-center">
            <span className="text-base sm:text-lg font-extrabold text-zinc-900">
              ₹{Number(p.basePrice).toLocaleString()}
            </span>
            {p.comparePrice && Number(p.comparePrice) > Number(p.basePrice) && (
              <span className="text-xs font-medium text-zinc-500 line-through">
                ₹{Number(p.comparePrice).toLocaleString()}
              </span>
            )}
          </div>
          <div>
            {p.comparePrice && Number(p.comparePrice) > Number(p.basePrice) && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded">
                Save{' '}
                {Math.round(
                  ((p.comparePrice - p.basePrice) / p.comparePrice) * 100,
                )}
                %
              </span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {p.totalStock > 0 ? (
          <Button
            className="w-full text-xs font-bold rounded-xl"
            size="sm"
            onClick={() => onAddToCart(p)}
            disabled={addingToCart}
          >
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-full text-xs font-bold text-rose-500 bg-rose-50 border-rose-100 hover:bg-rose-50 cursor-not-allowed rounded-xl"
            size="sm"
            disabled
          >
            Out of Stock
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
