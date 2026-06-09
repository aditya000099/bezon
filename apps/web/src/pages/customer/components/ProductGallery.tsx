import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@bezon/ui';
import { ShoppingBagIcon } from '@phosphor-icons/react';

interface ProductGalleryProps {
  images: any[];
  title: string;
  stock: number;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  title,
  stock,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const primaryIdx = images.findIndex((img) => img.isPrimary);
    setActiveImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
  }, [images]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden bg-white">
        <CardContent className="p-0 aspect-square flex items-center justify-center bg-zinc-50 relative overflow-hidden">
          {images.length > 0 ? (
            <img
              src={images[activeImageIndex]?.url || images[0].url}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <ShoppingBagIcon className="h-24 w-24 text-zinc-200" />
          )}
          {stock > 0 ? (
            <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              In Stock
            </div>
          ) : (
            <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </div>
          )}
        </CardContent>
      </Card>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img: any, i: number) => (
            <div
              key={img.id || i}
              onClick={() => setActiveImageIndex(i)}
              className={`aspect-square bg-white border rounded-lg flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${
                activeImageIndex === i
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <img
                src={img.url}
                alt={`View ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
