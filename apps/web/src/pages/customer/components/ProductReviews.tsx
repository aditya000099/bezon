import React from 'react';
import { SpinnerIcon, StarIcon } from '@phosphor-icons/react';

interface ProductReviewsProps {
  loadingReviews: boolean;
  reviewSummary: any;
  reviews: any[];
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  loadingReviews,
  reviewSummary,
  reviews,
}) => {
  return (
    <div className="mt-8 border-t border-zinc-100 pt-10">
      <h2 className="text-2xl font-extrabold text-zinc-900 mb-8">
        Customer Reviews
      </h2>

      {loadingReviews ? (
        <div className="flex items-center justify-center py-12">
          <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : !reviewSummary || reviewSummary.totalCount === 0 ? (
        <div className="bg-zinc-50/80 rounded-4xl p-12 flex flex-col items-center justify-center text-center">
          <StarIcon className="h-12 w-12 text-zinc-300 mb-3" />
          <h3 className="text-lg font-bold text-zinc-700">No reviews yet</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Be the first to review this product after your purchase is delivered!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Review Summary */}
          <div className="flex flex-col gap-6">
            <div className="bg-zinc-50/80 border-0 rounded-4xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl font-black text-zinc-900">
                  {reviewSummary.avgRating.toFixed(1)}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(reviewSummary.avgRating)
                            ? 'fill-amber-500 text-amber-500'
                            : 'fill-zinc-100 text-zinc-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-zinc-500">
                    {reviewSummary.totalCount} ratings
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewSummary.breakdown[star] || 0;
                  const percentage =
                    reviewSummary.totalCount > 0
                      ? Math.round((count / reviewSummary.totalCount) * 100)
                      : 0;

                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-zinc-700 w-4">{star}</span>
                      <StarIcon className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-zinc-500 w-8 text-right text-xs font-semibold">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-zinc-100 pb-6 last:border-0"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-teal-50 rounded-full flex items-center justify-center font-bold text-teal-500 shrink-0 overflow-hidden">
                    {review.user?.avatarUrl ? (
                      <img
                        src={review.user.avatarUrl}
                        alt={review.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      review.user?.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-800 text-sm">
                      {review.user?.name || 'Verified Buyer'}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? 'fill-amber-500 text-amber-500'
                          : 'fill-zinc-100 text-zinc-200'
                      }`}
                    />
                  ))}
                </div>

                {review.reviewText && (
                  <p className="text-sm text-zinc-700 leading-relaxed mb-4">
                    {review.reviewText}
                  </p>
                )}

                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {review.images.map((img: any) => (
                      <div
                        key={img.id}
                        className="h-20 w-20 rounded-xl overflow-hidden border border-zinc-200"
                      >
                        <img
                          src={img.url}
                          alt="Review attachment"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
