import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from '@bezon/ui';
import React, { useState } from 'react';
;
;
import { SpinnerIcon, StarIcon, CloudArrowUpIcon, XIcon } from '@phosphor-icons/react';
import { useToast } from '../../context/ToastContext';
import { useDispatch, useSelector } from 'react-redux';
import { uploadReviewImages, submitReview, updateReview } from '../../store/reviewSlice';
import type { AppDispatch, RootState } from '../../store';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItemId: string;
  productId: string;
  productTitle: string;
  existingReview?: any;
  onSuccess: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  orderItemId,
  productId,
  productTitle,
  existingReview,
  onSuccess,
}) => {
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const { isSubmitting, isUploading } = useSelector((state: RootState) => state.review);

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState<
    { url: string; s3Key?: string; sortOrder: number }[]
  >([]);

  const MAX_REVIEW_IMAGES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Initialize state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setRating(existingReview.rating || 0);
        setReviewText(existingReview.reviewText || '');
        setImages(existingReview.images || []);
      } else {
        setRating(0);
        setReviewText('');
        setImages([]);
      }
      setHoverRating(0);
    }
  }, [isOpen, existingReview]);

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
        toast.error(
          `"${file.name}" is not a supported format. Use JPG, PNG, or WEBP.`,
        );
        if (e.target) e.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 5 MB size limit.`);
        if (e.target) e.target.value = '';
        return;
      }
    }

    try {
      const uploadedImages = await dispatch(uploadReviewImages(selectedFiles)).unwrap();
      setImages((prev) => [
        ...prev,
        ...uploadedImages.map((img: any, idx: number) => ({
          ...img,
          sortOrder: prev.length + idx,
        })),
      ]);
    } catch (err: any) {
      toast.error(err || 'Failed to upload image(s).');
    } finally {
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

    try {
      if (existingReview) {
        await dispatch(updateReview({
          id: existingReview.id,
          rating,
          reviewText,
          images: images.map((img, i) => ({ ...img, sortOrder: i })),
        })).unwrap();
        toast.success('Review updated successfully!');
      } else {
        await dispatch(submitReview({
          orderItemId,
          productId,
          rating,
          reviewText,
          images: images.map((img, i) => ({ ...img, sortOrder: i })),
        })).unwrap();
        toast.success('Review submitted successfully!');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err || 'Failed to submit review.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white border border-zinc-200 shadow-2xl p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-zinc-800">
            Write a Review
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 line-clamp-1">
            {productTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* StarIcon Rating */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Tap to Rate
            </span>
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
                  <StarIcon
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-zinc-100 text-zinc-200'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Your Feedback
            </label>
            <textarea
              className="w-full h-24 p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-sm text-zinc-700"
              placeholder="What did you like or dislike?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={1000}
            />
            <span className="text-[10px] text-zinc-400 text-right">
              {reviewText.length}/1000
            </span>
          </div>

          {/* Image Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Add Photos (Optional)
            </label>

            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative h-16 w-16 rounded-xl border border-zinc-200 overflow-hidden group"
                >
                  <img
                    src={img.url}
                    alt="review"
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="h-16 w-16 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                  {isUploading ? (
                    <SpinnerIcon className="h-4 w-4 animate-spin text-teal-500" />
                  ) : (
                    <>
                      <CloudArrowUpIcon className="h-4 w-4 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-500">
                        Add
                      </span>
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

        <DialogFooter className="border-t border-zinc-100 pt-4">
          <Button
            className="w-full font-bold h-11 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || isUploading}
          >
            {isSubmitting ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : (
              'Submit Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
