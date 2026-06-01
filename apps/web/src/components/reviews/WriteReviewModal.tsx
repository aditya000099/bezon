import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Star, UploadCloud, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItemId: string;
  productId: string;
  productTitle: string;
  onSuccess: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  orderItemId,
  productId,
  productTitle,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState<{ url: string; s3Key?: string; sortOrder: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_REVIEW_IMAGES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    // Check how many more images we can add
    const remainingSlots = MAX_REVIEW_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast.warning(`You can upload a maximum of ${MAX_REVIEW_IMAGES} images.`);
      if (e.target) e.target.value = '';
      return;
    }

    // Take only as many files as remaining slots allow
    const selectedFiles = Array.from(e.target.files).slice(0, remainingSlots);

    // Validate each file before uploading
    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported format. Use JPG, PNG, or WEBP.`);
        if (e.target) e.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 5 MB size limit.`);
        if (e.target) e.target.value = '';
        return;
      }
    }

    setIsUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post(API_ENDPOINTS.media.upload, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return {
          url: res.data.data.url,
          s3Key: res.data.data.s3Key,
          sortOrder: images.length + index,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedImages]);
    } catch (err) {
      toast.error('Failed to upload image(s).');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.warning('Please select a rating from 1 to 5 stars.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/v1/reviews', {
        orderItemId,
        productId,
        rating,
        reviewText,
        images,
      });
      toast.success('Review submitted successfully! Note: Once created, reviews cannot be modified.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-slate-800">Write a Review</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 line-clamp-1">
            {productTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tap to Rate</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-100 text-slate-200'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Feedback</label>
            <textarea
              className="w-full h-24 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm text-slate-700"
              placeholder="What did you like or dislike?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={1000}
            />
            <span className="text-[10px] text-slate-400 text-right">{reviewText.length}/1000</span>
          </div>

          {/* Image Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Photos (Optional)</label>
            
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative h-16 w-16 rounded-xl border border-slate-200 overflow-hidden group">
                  <img src={img.url} alt="review" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="h-16 w-16 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500">Add</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4">
          <Button
            className="w-full font-bold h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || isUploading}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
