import { logger } from '@/utils/logger';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
} from '@bezon/ui';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  SpinnerIcon,
  MapPinIcon,
  HouseIcon,
} from '@phosphor-icons/react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import type { Product } from '@bezon/types';
import { SupportChatWidget } from '../../components/SupportChatWidget';

import { ProductGallery } from './components/ProductGallery';
import { ProductInfo } from './components/ProductInfo';
import { ProductDeliveryEstimate } from './components/ProductDeliveryEstimate';
import { ProductReviews } from './components/ProductReviews';
import { ProductQA } from './components/ProductQA';

interface ProductCoupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
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
  const [coupons, setCoupons] = useState<ProductCoupon[]>([]);

  // Shipping and delivery estimate states
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [customPincode, setCustomPincode] = useState('110001'); // Default fallback pincode
  const [pincodeInput, setPincodeInput] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<any | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState('');

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
        logger.error('Failed to load saved addresses', err);
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
      setEstimateError('');
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
        logger.error('Failed to fetch delivery estimate', err);
        setEstimateError(
          err.response?.data?.message ||
            'Failed to calculate delivery estimate.',
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
      toast.error('Please enter a valid 6-digit pincode.');
      return;
    }
    setSelectedAddress(null);
    setCustomPincode(trimmed);
    setPincodeInput('');
    setAddressModalOpen(false);
    toast.success(`Checking delivery estimate for pincode ${trimmed}`);
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
        }
        const couponRes = await api.get(API_ENDPOINTS.products.coupons(slug));
        if (couponRes.data.success) {
          setCoupons(couponRes.data.data);
        }
      } catch (err) {
        logger.error(err);
        toast.error('Failed to load product details.');
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
        if (summaryRes.data.success) setReviewSummary(summaryRes.data.data);
        if (listRes.data.success) setReviews(listRes.data.data.reviews);
      } catch (err) {
        logger.error('Failed to fetch reviews', err);
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
        logger.error('Failed to fetch questions', err);
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

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart.');
      navigate('/login');
      return;
    }
    if (!currentProduct) return;
    setIsAdding(true);
    try {
      await addItem(currentProduct.id, 1, Number(currentProduct.basePrice));
      const attrs = currentProduct.attributes as any;
      const varName = attrs?.color ? ` (${attrs.color})` : '';
      toast.success(`${currentProduct.title}${varName} added to cart!`);
    } catch (error) {
      logger.error(error);
      toast.error('Could not add item to cart. Try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToWishlist = () => {
    if (!user) {
      toast.error('Please login to use your wishlist.');
      navigate('/login');
      return;
    }
    if (!currentProduct) return;
    toggleWishlist(currentProduct.id, currentProduct.title);
  };

  const handleAskQuestion = async () => {
    if (!user) {
      toast.error('Please login to ask a question.');
      navigate('/login');
      return;
    }
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
      const res = await api.get(API_ENDPOINTS.qa.list(currentProduct.id), {
        params: { page: 1, limit: 5, sort: questionSort },
      });
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
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === questionId) {
            return { ...q, answers: [...(q.answers || []), res.data.data] };
          }
          return q;
        }),
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post answer.');
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

  if (!product || !currentProduct) {
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

  const currentPrice = Number(currentProduct.basePrice);
  const currentComparePrice = currentProduct.comparePrice
    ? Number(currentProduct.comparePrice)
    : null;
  const currentStock = currentProduct.totalStock;
  const currentSku = currentProduct.sku;
  const allEditions = [product, ...(product.familyMembers || [])];

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
        <ProductGallery
          images={currentProduct?.images || []}
          title={currentProduct.title}
          stock={currentStock}
        />

        <div className="flex flex-col gap-6">
          <ProductInfo
            product={product}
            currentProduct={currentProduct}
            currentPrice={currentPrice}
            currentComparePrice={currentComparePrice}
            currentStock={currentStock}
            currentSku={currentSku}
            allEditions={allEditions}
            coupons={coupons}
            isAdding={isAdding}
            isInWishlist={isInWishlist}
            onSelectProduct={handleSelectProduct}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
          />

          <ProductDeliveryEstimate
            selectedAddress={selectedAddress}
            customPincode={customPincode}
            deliveryEstimate={deliveryEstimate}
            loadingEstimate={loadingEstimate}
            estimateError={estimateError}
            onOpenAddressModal={() => {
              setPincodeInput('');
              setAddressModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* AI Support Chat Section */}
      <div className="mt-12 rounded-4xl p-4 sm:p-2 bg-white/50 relative overflow-hidden w-full">
        <div className=" bg-white/5 backdrop-blur-xl rounded-4xl border border-white/10 p-2">
          <SupportChatWidget
            context={{
              type: 'product',
              productId: currentProduct.id,
              productSlug: currentProduct.slug,
              productTitle: currentProduct.title,
            }}
          />
        </div>
      </div>

      <ProductReviews
        loadingReviews={loadingReviews}
        reviewSummary={reviewSummary}
        reviews={reviews}
      />

      <ProductQA
        user={user}
        questionsTotalCount={questionsTotalCount}
        questionSort={questionSort}
        setQuestionSort={setQuestionSort}
        questionsPage={questionsPage}
        setQuestionsPage={setQuestionsPage}
        setQuestions={setQuestions}
        setAskModalOpen={setAskModalOpen}
        loadingQuestions={loadingQuestions}
        questions={questions}
        answeringId={answeringId}
        setAnsweringId={setAnsweringId}
        answerText={answerText}
        setAnswerText={setAnswerText}
        submittingAnswer={submittingAnswer}
        handleSubmitAnswer={handleSubmitAnswer}
      />

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
                'Post Question'
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
            <div className="flex gap-2">
              <Input
                placeholder="Enter 6-digit Pincode"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) =>
                  setPincodeInput(e.target.value.replace(/\D/g, ''))
                }
                className="rounded-2xl border-slate-200"
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleApplyCustomPincode(pincodeInput)
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
                            ? 'border-indigo-500 bg-indigo-50/40 shadow-sm'
                            : 'border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-800">
                            {addr.fullName}{' '}
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
