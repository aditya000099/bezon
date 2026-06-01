import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Heart,
  ShoppingBag,
  Loader2,
  BadgePercent,
  MessageSquare,
  Send,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCart } from "../../context/CartContext";
import { useAuth } from '../../context/AuthContext';
import { useToast } from "../../context/ToastContext";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import type { Product } from "@bezon/types";

interface ProductCoupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number;
  validUntil: string;
  scopeType: string;
}

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState<
    (Product & { familyMembers?: Product[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [coupons, setCoupons] = useState<ProductCoupon[]>([]);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Q&A state
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsTotalCount, setQuestionsTotalCount] = useState(0);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionSort, setQuestionSort] = useState('recent');
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const response = await api.get(API_ENDPOINTS.products.detail(slug));
        if (response.data.success) {
          const prodData = response.data.data;
          setProduct(prodData);
          setSelectedProduct(prodData);

          const images = prodData.images || [];
          const primaryIdx = images.findIndex((img: any) => img.isPrimary);
          setActiveImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
        }
        const couponRes = await api.get(API_ENDPOINTS.products.coupons(slug));
        if (couponRes.data.success) {
          setCoupons(couponRes.data.data);
        }
      } catch (err) {
        toast.error("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [slug]);

  const currentProduct = selectedProduct || product;

  useEffect(() => {
    const fetchReviews = async () => {
      if (!currentProduct?.id) return;
      setLoadingReviews(true);
      try {
        const [summaryRes, listRes] = await Promise.all([
          api.get(API_ENDPOINTS.reviews.summary(currentProduct.id)),
          api.get(API_ENDPOINTS.reviews.list(currentProduct.id)),
        ]);
        if (summaryRes.data.success) {
          setReviewSummary(summaryRes.data.data);
        }
        if (listRes.data.success) {
          setReviews(listRes.data.data.reviews);
        }
      } catch (err) {
        console.error('Failed to fetch reviews', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [currentProduct?.id]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!currentProduct?.id) return;
      setLoadingQuestions(true);
      try {
        const res = await api.get(API_ENDPOINTS.qa.list(currentProduct.id), {
          params: { page: questionsPage, limit: 5, sort: questionSort },
        });
        if (res.data.success) {
          if (questionsPage === 1) {
            setQuestions(res.data.data.questions);
          } else {
            setQuestions(prev => [...prev, ...res.data.data.questions]);
          }
          setQuestionsTotalCount(res.data.data.pagination.totalCount);
        }
      } catch (err) {
        console.error('Failed to fetch questions', err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, [currentProduct?.id, questionsPage, questionSort]);

  const handleSelectProduct = (p: Product) => {
    if (p.slug !== slug) {
      navigate(`/shop/products/${p.slug}`, { replace: true });
    }
  };

  const currentImages = currentProduct?.images || [];

  const currentPrice = currentProduct ? Number(currentProduct.basePrice) : 0;
  const currentComparePrice = currentProduct?.comparePrice
    ? Number(currentProduct.comparePrice)
    : null;
  const currentStock = currentProduct ? currentProduct.totalStock : 0;
  const currentSku = currentProduct ? currentProduct.sku : "N/A";
  const allEditions = product
    ? [product, ...(product.familyMembers || [])]
    : [];

  const calcCouponDiscount = (coupon: ProductCoupon) => {
    if (coupon.discountType === "percentage") {
      let disc = (Number(coupon.discountValue) / 100) * currentPrice;
      if (coupon.maxDiscount) disc = Math.min(disc, Number(coupon.maxDiscount));
      return Math.round(disc * 100) / 100;
    }
    return Math.min(Number(coupon.discountValue), currentPrice);
  };

  const handleAddToCart = async () => {
    if (!currentProduct) return;
    setIsAdding(true);
    try {
      await addItem(currentProduct.id, 1, currentPrice);
      const attrs = currentProduct.attributes as any;
      const varName = attrs?.color ? ` (${attrs.color})` : "";
      toast.success(`${currentProduct.title}${varName} added to cart!`);
    } catch (error) {
      toast.error("Could not add item to cart. Try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToWishlist = () => {
    if (!currentProduct) return;
    toast.success(`${currentProduct.title} saved to Wishlist!`);
  };

  const handleAskQuestion = async () => {
    if (!currentProduct || newQuestion.trim().length < 10) {
      toast.warning('Question must be at least 10 characters long.');
      return;
    }
    setAskingQuestion(true);
    try {
      await api.post(API_ENDPOINTS.qa.ask, {
        productId: currentProduct.id,
        question: newQuestion.trim(),
      });
      toast.success('Your question has been posted!');
      setNewQuestion('');
      setAskModalOpen(false);
      setQuestionsPage(1);
      // Refetch
      const res = await api.get(API_ENDPOINTS.qa.list(currentProduct.id), { params: { page: 1, limit: 5, sort: questionSort } });
      if (res.data.success) {
        setQuestions(res.data.data.questions);
        setQuestionsTotalCount(res.data.data.pagination.totalCount);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post question.');
    } finally {
      setAskingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (answerText.trim().length < 2) {
      toast.warning('Answer must be at least 2 characters.');
      return;
    }
    setSubmittingAnswer(true);
    try {
      const res = await api.post(API_ENDPOINTS.qa.answer, {
        questionId,
        answer: answerText.trim(),
      });
      toast.success('Answer posted!');
      setAnswerText('');
      setAnsweringId(null);
      // Update the question in the list with the new answer
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          return { ...q, answers: [...(q.answers || []), res.data.data] };
        }
        return q;
      }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-slate-400 gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold">
          Loading product specifications...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-slate-400 text-center gap-4">
        <ShoppingBag className="h-16 w-16 text-slate-200" />
        <h2 className="text-xl font-bold text-slate-700">Product not found</h2>
        <Link to="/shop">
          <Button variant="default">Return to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/shop">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden border border-slate-200 bg-white">
            <CardContent className="p-0 aspect-square flex items-center justify-center bg-slate-50 relative overflow-hidden">
              {currentImages.length > 0 ? (
                <img
                  src={
                    currentImages[activeImageIndex]?.url || currentImages[0].url
                  }
                  alt={currentProduct?.title || product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-24 w-24 text-slate-200" />
              )}
              {currentStock > 0 ? (
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
          {currentImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {currentImages.map((img: any, i: number) => (
                <div
                  key={img.id || i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`aspect-square bg-white border rounded-lg flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${
                    activeImageIndex === i
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-slate-200 hover:border-slate-300"
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

        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {product.category?.name || "Catalogue Item"}
              </span>
              {product.brand && (
                <span className="text-slate-400 text-xs font-semibold">
                  Brand: {product.brand}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {currentProduct?.title || product.title}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(product.avgRating ? Number(product.avgRating) : 0)
                        ? "fill-amber-500 text-amber-500"
                        : "fill-slate-100 text-slate-200"
                    }`}
                  />
                ))}
                <span className="text-amber-500 font-extrabold text-sm ml-1.5">
                  {product.avgRating ? Number(product.avgRating).toFixed(1) : "0.0"}
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-sm font-medium hover:underline cursor-pointer">
                {product.reviewCount || 0} reviews
              </span>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-slate-900">
                ₹{currentPrice.toLocaleString()}
              </span>
              {currentComparePrice && (
                <span className="text-slate-400 line-through text-sm">
                  ₹{currentComparePrice.toLocaleString()}
                </span>
              )}
              {currentComparePrice && currentComparePrice > currentPrice && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                  Save{" "}
                  {Math.round(
                    ((currentComparePrice - currentPrice) /
                      currentComparePrice) *
                      100,
                  )}
                  %
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              SKU: <span className="font-mono">{currentSku}</span>
            </p>
          </div>

          {coupons.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <BadgePercent className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Available Coupons
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {coupons.map((coupon) => {
                  const disc = calcCouponDiscount(coupon);
                  const priceAfter = Math.max(0, currentPrice - disc);
                  const meetsMin = currentPrice >= Number(coupon.minOrderValue);
                  return (
                    <div
                      key={coupon.id}
                      className={`border rounded-xl p-3.5 flex items-center justify-between transition-all ${
                        meetsMin
                          ? "border-indigo-200 bg-indigo-50/30 hover:border-indigo-300"
                          : "border-slate-100 bg-slate-50/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-white border border-dashed border-indigo-300 rounded-lg px-2.5 py-1.5 shrink-0">
                          <span className="font-mono font-extrabold text-indigo-700 text-xs tracking-wider">
                            {coupon.code}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {coupon.description}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {coupon.discountType === "percentage"
                              ? `${Number(coupon.discountValue)}% off${coupon.maxDiscount ? ` (up to ₹${Number(coupon.maxDiscount)})` : ""}`
                              : `₹${Number(coupon.discountValue)} off`}
                            {Number(coupon.minOrderValue) > 0 &&
                              ` · Min ₹${Number(coupon.minOrderValue)}`}
                          </p>
                        </div>
                      </div>
                      {meetsMin ? (
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-extrabold text-emerald-700">
                            ₹{priceAfter.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-semibold">
                            save ₹{disc.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium shrink-0 ml-3">
                          Min ₹{Number(coupon.minOrderValue)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {allEditions.length > 1 && (
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Edition
              </label>
              <div className="flex gap-3 flex-wrap">
                {allEditions.map((p) => {
                  const attrs = p.attributes as any;
                  const labelStr = attrs?.color || p.sku;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className={`min-w-30 border rounded-lg p-3 text-left transition-all ${
                        currentProduct?.id === p.id
                          ? "border-primary bg-primary/5 text-primary-foreground ring-2 ring-primary/20"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <p className="text-xs font-bold">{labelStr}</p>
                      <p className="text-sm font-extrabold mt-1 text-slate-900">
                        ₹{Number(p.basePrice).toLocaleString()}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-sm text-slate-600 leading-relaxed">
            {currentProduct?.description ||
              product.description ||
              "No description available for this product."}
          </p>

          <div className="flex gap-3 items-center bg-indigo-50/30 border border-indigo-50 rounded-xl p-4 text-xs text-slate-600">
            <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0" />
            <p>
              <strong>Fulfillment Promise:</strong> Direct merchant dispatch.
              Eligible for return within 7 days of verified photographic
              delivery receipt.
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            {currentStock > 0 ? (
              <Button
                className="flex-1 font-bold h-12 text-sm shadow-lg shadow-primary/10"
                onClick={handleAddToCart}
                disabled={isAdding}
              >
                {isAdding ? "Adding to Cart..." : "Add to Shopping Cart"}
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="flex-1 font-bold h-12 text-sm text-rose-500 bg-rose-50 border-rose-100 hover:bg-rose-50 cursor-not-allowed"
                disabled
              >
                Out of Stock
              </Button>
            )}
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

      {/* Customer Reviews Section */}
      <div className="mt-8 border-t border-slate-100 pt-10">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Customer Reviews</h2>
        
        {loadingReviews ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : !reviewSummary || reviewSummary.totalCount === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <Star className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No reviews yet</h3>
            <p className="text-sm text-slate-500 mt-1">Be the first to review this product after your purchase is delivered!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Review Summary */}
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl font-black text-slate-900">{reviewSummary.avgRating.toFixed(1)}</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(reviewSummary.avgRating)
                              ? "fill-amber-500 text-amber-500"
                              : "fill-slate-100 text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-slate-500">{reviewSummary.totalCount} ratings</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewSummary.breakdown[star] || 0;
                    const percentage = reviewSummary.totalCount > 0 
                      ? Math.round((count / reviewSummary.totalCount) * 100) 
                      : 0;
                    
                    return (
                      <div key={star} className="flex items-center gap-3 text-sm">
                        <span className="font-bold text-slate-700 w-4">{star}</span>
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-slate-500 w-8 text-right text-xs font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 shrink-0 overflow-hidden">
                      {review.user?.avatarUrl ? (
                        <img src={review.user.avatarUrl} alt={review.user.name} className="h-full w-full object-cover" />
                      ) : (
                        review.user?.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{review.user?.name || 'Verified Buyer'}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-amber-500 text-amber-500"
                            : "fill-slate-100 text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  
                  {review.reviewText && (
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">{review.reviewText}</p>
                  )}
                  
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images.map((img: any) => (
                        <div key={img.id} className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200">
                          <img src={img.url} alt="Review attachment" className="h-full w-full object-cover" />
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

      {/* Questions & Answers Section */}
      <div className="mt-8 border-t border-slate-100 pt-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-indigo-500" />
              Questions & Answers
            </h2>
            <p className="text-sm text-slate-500 mt-1">{questionsTotalCount} question{questionsTotalCount !== 1 ? 's' : ''} about this product</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={questionSort}
              onChange={(e) => { setQuestionSort(e.target.value); setQuestionsPage(1); setQuestions([]); }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="recent">Most Recent</option>
              <option value="answered">Answered</option>
              <option value="unanswered">Unanswered</option>
            </select>
            {user && (
              <Button
                onClick={() => setAskModalOpen(true)}
                className="font-bold gap-2"
              >
                <MessageSquare className="h-4 w-4" /> Ask a Question
              </Button>
            )}
          </div>
        </div>

        {loadingQuestions && questions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No questions yet</h3>
            <p className="text-sm text-slate-500 mt-1">Be the first to ask a question about this product!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {questions.map((q) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                {/* Question */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 shrink-0 text-sm">
                    Q
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Asked by <span className="font-medium text-slate-500">{q.user?.name || 'Anonymous'}</span>
                      {' · '}
                      {new Date(q.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Answers */}
                {q.answers && q.answers.length > 0 && (
                  <div className="ml-11 flex flex-col gap-3 mb-4">
                    {q.answers.map((a: any) => (
                      <div key={a.id} className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-700">{a.user?.name || 'Anonymous'}</span>
                          {a.badge === 'seller' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              <Store className="h-3 w-3" /> Seller
                            </span>
                          )}
                          {a.badge === 'verified_buyer' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <ShieldCheck className="h-3 w-3" /> Verified Buyer
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{a.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer input */}
                {user && answeringId === q.id ? (
                  <div className="ml-11 flex gap-2">
                    <input
                      type="text"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Write your answer..."
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer(q.id)}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSubmitAnswer(q.id)}
                      disabled={submittingAnswer}
                      className="gap-1 font-bold"
                    >
                      {submittingAnswer ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                      className="text-slate-400"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : user ? (
                  <button
                    onClick={() => setAnsweringId(q.id)}
                    className="ml-11 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Answer this question
                  </button>
                ) : null}
              </div>
            ))}

            {/* Load More */}
            {questions.length < questionsTotalCount && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setQuestionsPage(prev => prev + 1)}
                  disabled={loadingQuestions}
                  className="font-bold gap-2"
                >
                  {loadingQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Load More Questions
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ask Question Modal */}
      <Dialog open={askModalOpen} onOpenChange={(open) => !open && setAskModalOpen(false)}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-800">Ask a Question</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What would you like to know about this product?"
              className="w-full h-28 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm text-slate-700"
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">Minimum 10 characters</span>
              <span className="text-[10px] text-slate-400">{newQuestion.length}/500</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full font-bold h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleAskQuestion}
              disabled={askingQuestion || newQuestion.trim().length < 10}
            >
              {askingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
