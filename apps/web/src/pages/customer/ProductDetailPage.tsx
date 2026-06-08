import { logger } from "@/utils/logger";
import { Button, Card, CardContent, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@bezon/ui';
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  StarIcon,
  ShieldCheckeredIcon,
  HeartIcon,
  ShoppingBagIcon,
  SpinnerIcon,
  SealPercentIcon,
  ChatTeardropTextIcon,
  PaperPlaneRightIcon,
  ArrowCounterClockwiseIcon,
  MoneyIcon,
  ArrowsClockwiseIcon,
  SparkleIcon,
  StorefrontIcon,
  ShieldCheckIcon,
  MapPinIcon,
  TruckIcon,
  HouseIcon,
  CalendarIcon,
} from "@phosphor-icons/react";
;
;
;
;

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useWishlist } from "../../context/WishlistContext";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import type { Product } from "@bezon/types";
import { SupportChatWidget } from "../../components/SupportChatWidget";

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
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<
    | (Product & {
        familyMembers?: Product[];
        seller?: { id: string; shopName: string; shopSlug: string };
      })
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const currentProduct = selectedProduct || product;

  const [isAdding, setIsAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [coupons, setCoupons] = useState<ProductCoupon[]>([]);

  // Shipping and delivery estimate states
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [customPincode, setCustomPincode] = useState("110001"); // Default fallback pincode
  const [pincodeInput, setPincodeInput] = useState(""); // For typing in the modal/section
  const [deliveryEstimate, setDeliveryEstimate] = useState<{
    distanceKm: number;
    deliveryDays: number;
    sellerPincode: string;
    destinationPincode: string;
  } | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  // Fetch saved addresses if logged in
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) {
        setSavedAddresses([]);
        setSelectedAddress(null);
        return;
      }
      setLoadingAddresses(true);
      try {
        const res = await api.get(API_ENDPOINTS.addresses.base);
        if (res.data.success) {
          const addresses = res.data.data;
          setSavedAddresses(addresses);
          if (addresses.length > 0) {
            const defaultAddr =
              addresses.find((a: any) => a.isDefault) || addresses[0];
            setSelectedAddress(defaultAddr);
            setCustomPincode(defaultAddr.pincode);
          }
        }
      } catch (err) {
        logger.error("Failed to load saved addresses", err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [user]);

  // Fetch delivery estimate
  useEffect(() => {
    const fetchEstimate = async () => {
      if (!currentProduct?.id) return;

      const hasAddress = !!selectedAddress;
      const hasValidPincode =
        customPincode && customPincode.trim().length === 6;

      if (!hasAddress && !hasValidPincode) {
        setDeliveryEstimate(null);
        return;
      }

      setLoadingEstimate(true);
      setEstimateError("");
      try {
        const params: any = {};
        if (hasAddress) {
          params.addressId = selectedAddress.id;
        } else {
          params.pincode = customPincode.trim();
        }

        const res = await api.get(
          API_ENDPOINTS.products.deliveryEstimate(currentProduct.id),
          { params },
        );
        if (res.data.success) {
          setDeliveryEstimate(res.data.data);
        }
      } catch (err: any) {
        logger.error("Failed to fetch delivery estimate", err);
        setEstimateError(
          err.response?.data?.message ||
            "Failed to calculate delivery estimate.",
        );
        setDeliveryEstimate(null);
      } finally {
        setLoadingEstimate(false);
      }
    };

    fetchEstimate();
  }, [currentProduct?.id, selectedAddress?.id, customPincode]);

  const handleApplyCustomPincode = (pincodeStr: string) => {
    const trimmed = pincodeStr.trim();
    if (trimmed.length !== 6 || isNaN(Number(trimmed))) {
      toast.error("Please enter a valid 6-digit pincode.");
      return;
    }
    setSelectedAddress(null);
    setCustomPincode(trimmed);
    setPincodeInput("");
    setAddressModalOpen(false);
    toast.success(`Checking delivery estimate for pincode ${trimmed}`);
  };

  const getDeliveryDateString = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Reviews state

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Q&A state
  const [questions, setQuestions] = useState<any[]>([]);

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsTotalCount, setQuestionsTotalCount] = useState(0);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionSort, setQuestionSort] = useState("recent");
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
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
        logger.error("Failed to fetch reviews", err);
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
            setQuestions((prev) => [...prev, ...res.data.data.questions]);
          }
          setQuestionsTotalCount(res.data.data.pagination.totalCount);
        }
      } catch (err) {
        logger.error("Failed to fetch questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, [currentProduct?.id, questionsPage, questionSort]);

  const handleSelectProduct = (p: Product) => {
    if (p.slug !== slug) {
      navigate(`/products/${p.slug}`, { replace: true });
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
    if (!user) {
      toast.error("Please login to add items to cart.");
      navigate("/login");
      return;
    }
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
    if (!user) {
      toast.error("Please login to use your wishlist.");
      navigate("/login");
      return;
    }
    if (!currentProduct) return;
    toggleWishlist(currentProduct.id, currentProduct.title);
  };

  const handleAskQuestion = async () => {
    if (!user) {
      toast.error("Please login to ask a question.");
      navigate("/login");
      return;
    }
    if (!currentProduct || newQuestion.trim().length < 10) {
      toast.warning("Question must be at least 10 characters long.");
      return;
    }
    setAskingQuestion(true);
    try {
      await api.post(API_ENDPOINTS.qa.ask, {
        productId: currentProduct.id,
        question: newQuestion.trim(),
      });
      toast.success("Your question has been posted!");
      setNewQuestion("");
      setAskModalOpen(false);
      setQuestionsPage(1);
      // Refetch
      const res = await api.get(API_ENDPOINTS.qa.list(currentProduct.id), {
        params: { page: 1, limit: 5, sort: questionSort },
      });
      if (res.data.success) {
        setQuestions(res.data.data.questions);
        setQuestionsTotalCount(res.data.data.pagination.totalCount);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post question.");
    } finally {
      setAskingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (answerText.trim().length < 2) {
      toast.warning("Answer must be at least 2 characters.");
      return;
    }
    setSubmittingAnswer(true);
    try {
      const res = await api.post(API_ENDPOINTS.qa.answer, {
        questionId,
        answer: answerText.trim(),
      });
      toast.success("Answer posted!");
      setAnswerText("");
      setAnsweringId(null);
      // Update the question in the list with the new answer
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === questionId) {
            return { ...q, answers: [...(q.answers || []), res.data.data] };
          }
          return q;
        }),
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post answer.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-400 gap-2">
        <SpinnerIcon className="h-10 w-10 animate-spin text-teal-500" />
        <p className="text-sm font-semibold">
          Loading product specifications...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-400 text-center gap-4">
        <ShoppingBagIcon className="h-16 w-16 text-zinc-200" />
        <h2 className="text-xl font-bold text-zinc-700">Product not found</h2>
        <Link to="/">
          <Button variant="default">Return to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back to Shop
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden bg-white">
            <CardContent className="p-0 aspect-square flex items-center justify-center bg-zinc-50 relative overflow-hidden">
              {currentImages.length > 0 ? (
                <img
                  src={
                    currentImages[activeImageIndex]?.url || currentImages[0].url
                  }
                  alt={currentProduct?.title || product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBagIcon className="h-24 w-24 text-zinc-200" />
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
                      : "border-zinc-200 hover:border-zinc-300"
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
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {product.category?.name || "Catalogue Item"}
              </span>
              {product.brand && (
                <span className="text-zinc-400 text-xs font-semibold">
                  Brand: {product.brand}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
              {currentProduct?.title || product.title}
            </h1>
            {product.seller && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-zinc-500">
                <span>Sold by:</span>
                <Link
                  to={`/sellers/${product.seller.shopSlug}`}
                  className="font-bold text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-1"
                >
                  <StorefrontIcon className="h-4 w-4 shrink-0 text-teal-500" />
                  {product.seller.shopName}
                </Link>
              </div>
            )}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-4 w-4 ${
                      star <=
                      Math.round(
                        product.avgRating ? Number(product.avgRating) : 0,
                      )
                        ? "fill-amber-500 text-amber-500"
                        : "fill-zinc-100 text-zinc-200"
                    }`}
                  />
                ))}
                <span className="text-amber-500 font-extrabold text-sm ml-1.5">
                  {product.avgRating
                    ? Number(product.avgRating).toFixed(1)
                    : "0.0"}
                </span>
              </div>
              <span className="text-zinc-300">|</span>
              <span className="text-zinc-500 text-sm font-medium hover:underline cursor-pointer">
                {product.reviewCount || 0} reviews
              </span>
            </div>
          </div>

          <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-zinc-900">
                ₹{currentPrice.toLocaleString()}
              </span>
              {currentPrice && (
                <span className="text-zinc-400 line-through text-sm">
                  ₹{(currentComparePrice ?? currentPrice ?? 0).toLocaleString()}
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
            <p className="text-xs text-zinc-400">
              SKU: <span className="font-mono">{currentSku}</span>
            </p>
          </div>

          {coupons.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <SealPercentIcon className="h-4 w-4 text-teal-500" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
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
                          ? "border-teal-200 bg-teal-50/30 hover:border-teal-300"
                          : "border-zinc-100 bg-zinc-50/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-white border border-dashed border-teal-300 rounded-lg px-2.5 py-1.5 shrink-0">
                          <span className="font-mono font-extrabold text-teal-700 text-xs tracking-wider">
                            {coupon.code}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-700 truncate">
                            {coupon.description}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
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
                        <p className="text-[10px] text-zinc-400 font-medium shrink-0 ml-3">
                          Min ₹{Number(coupon.minOrderValue)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deliver At Section */}
          <div className="bg-white/60 backdrop-blur-md rounded-4xl p-5 border border-slate-100/50 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 mt-0.5">
                  <MapPinIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Deliver At
                  </span>
                  {selectedAddress ? (
                    <div className="mt-0.5">
                      <p className="text-sm font-extrabold text-slate-800 truncate">
                        {selectedAddress.fullName} · {selectedAddress.label}
                      </p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {selectedAddress.line1}, {selectedAddress.city} -{" "}
                        {selectedAddress.pincode}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-0.5">
                      <p className="text-sm font-extrabold text-slate-800">
                        Pincode: {customPincode}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Custom location estimate
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPincodeInput("");
                  setAddressModalOpen(true);
                }}
                className="rounded-xl border-slate-200 text-xs font-bold hover:bg-slate-100/80 shrink-0 self-center"
              >
                Change
              </Button>
            </div>

            <div className="border-t border-slate-100/80 pt-4 flex items-center justify-between gap-4">
              {loadingEstimate ? (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <SpinnerIcon className="h-4 w-4 animate-spin text-indigo-600" />
                  <span>Calculating shipping estimate...</span>
                </div>
              ) : estimateError ? (
                <p className="text-xs text-rose-500 font-semibold">
                  {estimateError}
                </p>
              ) : deliveryEstimate ? (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                    <TruckIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-emerald-800">
                      Delivered by{" "}
                      {getDeliveryDateString(deliveryEstimate.deliveryDays)}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Est. time: {deliveryEstimate.deliveryDays} days ·{" "}
                      {deliveryEstimate.distanceKm.toLocaleString()} kms from
                      seller
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">
                  Enter a valid address or pincode to check delivery times.
                </p>
              )}
            </div>
          </div>

          {allEditions.length > 1 && (
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
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
                          : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700"
                      }`}
                    >
                      <p className="text-xs font-bold text-black">{labelStr}</p>
                      <p className="text-sm font-extrabold mt-1 text-zinc-900">
                        ₹{Number(p.basePrice).toLocaleString()}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-sm text-zinc-600 leading-relaxed">
            {currentProduct?.description ||
              product.description ||
              "No description available for this product."}
          </p>

          {/* Product Policies */}
          {currentProduct?.policies &&
          (currentProduct.policies as any[]).length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheckIcon className="h-4 w-4 text-teal-500" />
                Product Policies
              </p>
              <div className="flex flex-wrap gap-2">
                {(currentProduct.policies as any[]).map((pp: any) => {
                  const policy = pp.policy;
                  if (!policy) return null;
                  const config: Record<
                    string,
                    { icon: any; bg: string; text: string; border: string }
                  > = {
                    return: {
                      icon: ArrowCounterClockwiseIcon,
                      bg: "bg-blue-50",
                      text: "text-blue-700",
                      border: "border-blue-100",
                    },
                    refund: {
                      icon: MoneyIcon,
                      bg: "bg-emerald-50",
                      text: "text-emerald-700",
                      border: "border-emerald-100",
                    },
                    replace: {
                      icon: ArrowsClockwiseIcon,
                      bg: "bg-amber-50",
                      text: "text-amber-700",
                      border: "border-amber-100",
                    },
                  };
                  const c = config[policy.type] || config.return;
                  const Icon = c.icon;
                  return (
                    <div
                      key={pp.id}
                      className={`flex items-center gap-2 ${c.bg} ${c.border} border rounded-lg px-3 py-2 text-xs ${c.text}`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-semibold">{policy.title}</span>
                      <span className="opacity-70">
                        {policy.durationDays} days
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex gap-3 items-center bg-teal-50/30 border border-teal-50 rounded-xl p-4 text-xs text-zinc-600">
              <ShieldCheckIcon className="h-5 w-5 text-teal-500 shrink-0" />
              <p>
                <strong>Fulfillment Promise:</strong> Direct merchant dispatch.
                Standard platform policies apply.
              </p>
            </div>
          )}

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
              className={`h-12 w-12 border-zinc-200 hover:text-rose-500 hover:border-rose-200 transition-colors ${
                currentProduct && isInWishlist(currentProduct.id)
                  ? "bg-rose-50/50 border-rose-200 text-rose-500 hover:bg-rose-100/50"
                  : ""
              }`}
              onClick={handleAddToWishlist}
            >
              <HeartIcon
                className={`h-5 w-5 ${currentProduct && isInWishlist(currentProduct.id) ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Support Chat Section */}
      <div className="mt-12 rounded-4xl p-4 sm:p-2 bg-white/50 relative overflow-hidden w-full">
        <div className=" bg-white/5 backdrop-blur-xl rounded-4xl border border-white/10 p-2">
          <SupportChatWidget
            context={{
              type: "product",
              productId: currentProduct?.id ?? "",
              productSlug: currentProduct?.slug ?? "",
              productTitle: currentProduct?.title ?? "",
            }}
          />
        </div>
      </div>
      {/* </div> */}

      {/* Customer Reviews Section */}
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
              Be the first to review this product after your purchase is
              delivered!
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
                              ? "fill-amber-500 text-amber-500"
                              : "fill-zinc-100 text-zinc-200"
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
                      <div
                        key={star}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="font-bold text-zinc-700 w-4">
                          {star}
                        </span>
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
                        {review.user?.name || "Verified Buyer"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "long", day: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-amber-500 text-amber-500"
                            : "fill-zinc-100 text-zinc-200"
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

      {/* Questions & Answers Section */}
      <div className="mt-8 border-t border-zinc-100 pt-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-zinc-900 flex items-center gap-3">
              <ChatTeardropTextIcon className="h-6 w-6 text-teal-500" />
              Questions & Answers
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {questionsTotalCount} question
              {questionsTotalCount !== 1 ? "s" : ""} about this product
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={questionSort}
              onChange={(e) => {
                setQuestionSort(e.target.value);
                setQuestionsPage(1);
                setQuestions([]);
              }}
              className="text-sm border border-zinc-200 rounded-lg px-3 py-2 text-zinc-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                <ChatTeardropTextIcon className="h-4 w-4" /> Ask a Question
              </Button>
            )}
          </div>
        </div>

        {loadingQuestions && questions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-zinc-50/80 rounded-4xl p-12 flex flex-col items-center justify-center text-center">
            <ChatTeardropTextIcon className="h-12 w-12 text-zinc-300 mb-3" />
            <h3 className="text-lg font-bold text-zinc-700">
              No questions yet
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Be the first to ask a question about this product!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {questions.map((q) => (
              <div
                key={q.id}
                className="bg-zinc-50/80 border-0 rounded-4xl p-8"
              >
                {/* Question */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-8 w-8 bg-teal-100 rounded-full flex items-center justify-center font-bold text-teal-700 shrink-0 text-sm">
                    Q
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-800">
                      {q.question}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Asked by{" "}
                      <span className="font-medium text-zinc-500">
                        {q.user?.name || "Anonymous"}
                      </span>
                      {" · "}
                      {new Date(q.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Answers */}
                {q.answers && q.answers.length > 0 && (
                  <div className="ml-11 flex flex-col gap-3 mb-4">
                    {q.answers.map((a: any) => (
                      <div key={a.id} className="bg-white/60 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-zinc-700">
                            {a.user?.name || "Anonymous"}
                          </span>
                          {a.badge === "seller" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700">
                              <StorefrontIcon className="h-3 w-3" /> Seller
                            </span>
                          )}
                          {a.badge === "verified_buyer" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <ShieldCheckIcon className="h-3 w-3" /> Verified
                              Buyer
                            </span>
                          )}
                          <span className="text-xs text-zinc-400">
                            {new Date(a.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600">{a.answer}</p>
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
                      className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSubmitAnswer(q.id)
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSubmitAnswer(q.id)}
                      disabled={submittingAnswer}
                      className="gap-1 font-bold"
                    >
                      {submittingAnswer ? (
                        <SpinnerIcon className="h-3 w-3 animate-spin" />
                      ) : (
                        <PaperPlaneRightIcon className="h-3 w-3" />
                      )}
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAnsweringId(null);
                        setAnswerText("");
                      }}
                      className="text-zinc-400"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : user ? (
                  <button
                    onClick={() => setAnsweringId(q.id)}
                    className="ml-11 text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
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
                  onClick={() => setQuestionsPage((prev) => prev + 1)}
                  disabled={loadingQuestions}
                  className="font-bold gap-2 rounded-xl h-12 border-0 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {loadingQuestions ? (
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                  ) : null}
                  Load More Questions
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ask Question Modal */}
      <Dialog
        open={askModalOpen}
        onOpenChange={(open) => !open && setAskModalOpen(false)}
      >
        <DialogContent className="max-w-md bg-white border-0 shadow-2xl p-8 rounded-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-zinc-800">
              Ask a Question
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What would you like to know about this product?"
              className="w-full h-28 p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-sm text-zinc-700"
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-zinc-400">
                Minimum 10 characters
              </span>
              <span className="text-[10px] text-zinc-400">
                {newQuestion.length}/500
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full font-bold h-11 bg-teal-600 hover:bg-teal-700 text-white"
              onClick={handleAskQuestion}
              disabled={askingQuestion || newQuestion.trim().length < 10}
            >
              {askingQuestion ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : (
                "Post Question"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Selection Modal */}
      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-2xl border border-slate-100/50 shadow-2xl p-6 rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-indigo-600" />
              Select Delivery Address
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {/* Pincode Quick Search/Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter 6-digit Pincode"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) =>
                  setPincodeInput(e.target.value.replace(/\D/g, ""))
                }
                className="rounded-2xl border-slate-200"
                onKeyDown={(e) =>
                  e.key === "Enter" && handleApplyCustomPincode(pincodeInput)
                }
              />
              <Button
                onClick={() => handleApplyCustomPincode(pincodeInput)}
                disabled={pincodeInput.length !== 6}
                className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold px-5"
              >
                Check
              </Button>
            </div>

            {/* Saved Addresses */}
            {user ? (
              <div className="space-y-2.5 max-h-62.5 overflow-y-auto pr-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Saved Addresses
                </span>
                {loadingAddresses ? (
                  <div className="p-4 flex justify-center">
                    <SpinnerIcon className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                ) : savedAddresses.length > 0 ? (
                  savedAddresses.map((addr) => {
                    const isSelected = selectedAddress?.id === addr.id;
                    return (
                      <button
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddress(addr);
                          setCustomPincode(addr.pincode);
                          setAddressModalOpen(false);
                          toast.success(
                            `Delivery address changed to ${addr.label}`,
                          );
                        }}
                        className={`w-full text-left p-4 rounded-3xl border transition-all flex items-start gap-3 ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/40 shadow-sm"
                            : "border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-800">
                            {addr.fullName}{" "}
                            <span className="text-xs font-normal text-zinc-400">
                              ({addr.label})
                            </span>
                          </p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {addr.line1}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center p-6 border border-dashed border-slate-200 rounded-3xl">
                    <HouseIcon className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500 font-medium">
                      No saved addresses found.
                    </p>
                    <Link
                      to="/addresses"
                      className="text-xs text-indigo-600 font-bold hover:underline mt-1 inline-block"
                    >
                      Manage Addresses
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <p className="text-xs text-zinc-500">
                  Sign in to choose from your saved addresses.
                </p>
                <Link
                  to="/auth/login"
                  className="mt-3 inline-block text-xs bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-between items-center sm:justify-between">
            {user && (
              <Link
                to="/addresses"
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Manage Addresses
              </Link>
            )}
            <Button
              variant="ghost"
              onClick={() => setAddressModalOpen(false)}
              className="rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
