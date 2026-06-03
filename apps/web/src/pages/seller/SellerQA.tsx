import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Spinner,
  ChatTeardropText,
  Storefront,
  ShieldCheck,
  PaperPlaneRight,
  Question,
  Faders,
} from '@phosphor-icons/react';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';

interface ProductOption {
  id: string;
  title: string;
  image?: string;
}

interface AnswerUser {
  id: string;
  name: string;
}

interface Answer {
  id: string;
  answer: string;
  badge: 'seller' | 'verified_buyer' | null;
  user: AnswerUser;
  createdAt: string;
}

interface QuestionProduct {
  id: string;
  title: string;
  image?: string;
}

interface QuestionUser {
  id: string;
  name: string;
}

interface Question {
  id: string;
  question: string;
  product: QuestionProduct;
  user: QuestionUser;
  answers: Answer[];
  answerCount: number;
  createdAt: string;
}

const LIMIT = 10;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const BadgePill: React.FC<{ badge: 'seller' | 'verified_buyer' | null }> = ({
  badge,
}) => {
  if (!badge) return null;
  if (badge === 'seller') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
        <Storefront className="h-3 w-3" />
        Seller
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
      <ShieldCheck className="h-3 w-3" />
      Verified Buyer
    </span>
  );
};

export const SellerQA: React.FC = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const targetQuestionId = searchParams.get('questionId');

  // Filters
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Quick reply state per question
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<
    Record<string, boolean>
  >({});

  // Fetch product options for filter
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.qa.sellerProducts);
        if (res.data.success) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load seller products for Q&A filter', err);
      }
    };
    fetchProducts();
  }, []);

  // Fetch questions
  const fetchQuestions = async (pageNum: number, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: Record<string, any> = {
        page: pageNum,
        limit: LIMIT,
      };
      if (selectedProduct) params.productId = selectedProduct;
      if (statusFilter !== 'all') params.filter = statusFilter;

      const res = await api.get(API_ENDPOINTS.qa.sellerQuestions, { params });
      if (res.data.success) {
        const responseData = res.data.data;
        const newQuestions: Question[] = Array.isArray(responseData?.questions)
          ? responseData.questions
          : Array.isArray(responseData)
            ? responseData
            : [];

        if (append) {
          setQuestions((prev) => [
            ...(Array.isArray(prev) ? prev : []),
            ...newQuestions,
          ]);
        } else {
          setQuestions(newQuestions);
        }
        setHasMore(newQuestions.length === LIMIT);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not fetch questions.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchQuestions(1, false);
  }, [selectedProduct, statusFilter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchQuestions(nextPage, true);
  };

  // Quick reply
  const handleReply = async (questionId: string) => {
    const text = replyTexts[questionId]?.trim();
    if (!text) {
      toast.error('Please enter a reply.');
      return;
    }

    setSubmittingReply((prev) => ({ ...prev, [questionId]: true }));
    try {
      const res = await api.post(API_ENDPOINTS.qa.answer, {
        questionId,
        answer: text,
      });
      if (res.data.success) {
        toast.success('Reply posted successfully.');
        setReplyTexts((prev) => ({ ...prev, [questionId]: '' }));
        // Refresh questions to show the new answer
        fetchQuestions(1, false);
        setPage(1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post reply.');
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'unanswered', label: 'Unanswered' },
    { value: 'answered', label: 'Answered' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <ChatTeardropText className="h-5 w-5 text-teal-500" />
            Product Q&A
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage and respond to customer questions about your products.
          </p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 text-zinc-500">
          <Faders className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Filters
          </span>
        </div>

        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="w-full sm:w-64 bg-white border border-zinc-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-zinc-600 cursor-pointer h-10"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === opt.value
                  ? 'bg-teal-100 text-teal-700 border border-teal-200'
                  : 'bg-zinc-50 text-zinc-500 border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-75 text-zinc-400 gap-2">
          <Spinner className="h-8 w-8 animate-spin text-teal-500" />
          <p className="text-sm font-semibold">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-75 text-zinc-400 p-8 border-dashed border-2 bg-white/50">
          <Question className="h-12 w-12 text-zinc-300 mb-2" />
          <p className="font-bold text-zinc-700">
            {selectedProduct || statusFilter !== 'all'
              ? 'No questions match your filters'
              : 'No questions yet'}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {selectedProduct || statusFilter !== 'all'
              ? 'Try adjusting your filters to see more questions.'
              : 'Questions from customers will appear here when they ask about your products.'}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.isArray(questions) &&
            questions.map((q) => (
              <Card
                key={q.id}
                className={`bg-white shadow-sm transition-colors ${q.id === targetQuestionId ? 'border-2 border-teal-500 ring-2 ring-teal-50' : 'border-zinc-200'}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {/* Product thumbnail */}
                    {q.product?.image ? (
                      <img
                        src={q.product.image}
                        alt={q.product.title}
                        className="h-12 w-12 rounded-lg object-cover border border-zinc-200 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                        <Question className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate">
                        {q.product?.title || 'Unknown Product'}
                      </p>
                      <CardTitle className="text-sm font-bold text-zinc-800 mt-0.5 leading-snug">
                        {q.question}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                        <span>
                          Asked by{' '}
                          <span className="font-semibold text-zinc-700">
                            {q.user?.name || 'Anonymous'}
                          </span>
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span>{formatDate(q.createdAt)}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="flex items-center gap-1">
                          <ChatTeardropText className="h-3 w-3" />
                          {q.answerCount || q.answers?.length || 0}{' '}
                          {(q.answerCount || q.answers?.length || 0) === 1
                            ? 'answer'
                            : 'answers'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Existing answers */}
                  {q.answers && q.answers.length > 0 && (
                    <div className="space-y-2">
                      {q.answers.map((a) => (
                        <div
                          key={a.id}
                          className="bg-zinc-50 rounded-lg p-3 border border-zinc-100"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-zinc-700">
                              {a.user?.name || 'Anonymous'}
                            </span>
                            <BadgePill badge={a.badge} />
                            <span className="text-[10px] text-zinc-400 ml-auto">
                              {formatDate(a.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-600 leading-relaxed">
                            {a.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick reply */}
                  <div className="flex gap-2 pt-2 border-t border-zinc-100">
                    <textarea
                      value={replyTexts[q.id] || ''}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder="Write your reply..."
                      rows={2}
                      className="flex-1 bg-white border border-zinc-200 rounded-lg text-sm px-3 py-2 outline-none text-zinc-700 placeholder:text-zinc-400 resize-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all"
                    />
                    <Button
                      size="sm"
                      className="self-end flex items-center gap-1.5 font-bold"
                      onClick={() => handleReply(q.id)}
                      disabled={
                        submittingReply[q.id] || !replyTexts[q.id]?.trim()
                      }
                    >
                      {submittingReply[q.id] ? (
                        <Spinner className="h-4 w-4 animate-spin" />
                      ) : (
                        <PaperPlaneRight className="h-4 w-4" />
                      )}
                      Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="font-bold"
              >
                {loadingMore ? (
                  <>
                    <Spinner className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Questions'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
