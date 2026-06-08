import React from 'react';
import { Button } from '@bezon/ui';
import {
  ChatTeardropTextIcon,
  StorefrontIcon,
  ShieldCheckIcon,
  SpinnerIcon,
} from '@phosphor-icons/react';

interface ProductQAProps {
  user: any;
  questionsTotalCount: number;
  questionSort: string;
  setQuestionSort: (sort: string) => void;
  questionsPage: number;
  setQuestionsPage: React.Dispatch<React.SetStateAction<number>>;
  setQuestions: React.Dispatch<React.SetStateAction<any[]>>;
  setAskModalOpen: (open: boolean) => void;
  loadingQuestions: boolean;
  questions: any[];
  answeringId: string | null;
  setAnsweringId: (id: string | null) => void;
  answerText: string;
  setAnswerText: (text: string) => void;
  submittingAnswer: boolean;
  handleSubmitAnswer: (id: string) => void;
}

export const ProductQA: React.FC<ProductQAProps> = ({
  user,
  questionsTotalCount,
  questionSort,
  setQuestionSort,
  questionsPage,
  setQuestionsPage,
  setQuestions,
  setAskModalOpen,
  loadingQuestions,
  questions,
  answeringId,
  setAnsweringId,
  answerText,
  setAnswerText,
  submittingAnswer,
  handleSubmitAnswer,
}) => {
  return (
    <div className="mt-8 border-t border-zinc-100 pt-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-zinc-900 flex items-center gap-3">
            <ChatTeardropTextIcon className="h-6 w-6 text-teal-500" />
            Questions & Answers
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {questionsTotalCount} question
            {questionsTotalCount !== 1 ? 's' : ''} about this product
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
          <h3 className="text-lg font-bold text-zinc-700">No questions yet</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Be the first to ask a question about this product!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {questions.map((q) => (
            <div key={q.id} className="bg-zinc-50/80 border-0 rounded-4xl p-8">
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
                    Asked by{' '}
                    <span className="font-medium text-zinc-500">
                      {q.user?.name || 'Anonymous'}
                    </span>
                    {' · '}
                    {new Date(q.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
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
                          {a.user?.name || 'Anonymous'}
                        </span>
                        {a.badge === 'seller' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700">
                            <StorefrontIcon className="h-3 w-3" /> Seller
                          </span>
                        )}
                        {a.badge === 'verified_buyer' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <ShieldCheckIcon className="h-3 w-3" /> Verified Buyer
                          </span>
                        )}
                        <span className="text-xs text-zinc-400">
                          {new Date(a.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
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
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSubmitAnswer(q.id)}
                    disabled={submittingAnswer || !answerText.trim()}
                  >
                    {submittingAnswer ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : 'Submit'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAnsweringId(null);
                      setAnswerText('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : user ? (
                <button
                  onClick={() => {
                    setAnsweringId(q.id);
                    setAnswerText('');
                  }}
                  className="ml-11 text-xs font-bold text-teal-600 hover:text-teal-800"
                >
                  Reply to this question
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {questions.length < questionsTotalCount && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setQuestionsPage((prev) => prev + 1)}
            disabled={loadingQuestions}
          >
            {loadingQuestions ? 'Loading...' : 'Load More Questions'}
          </Button>
        </div>
      )}
    </div>
  );
};
