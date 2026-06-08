import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PaperPlaneRightIcon,
  RobotIcon,
  User as UserIcon,
  SpinnerIcon,
  PackageIcon,
  ArrowCounterClockwiseIcon,
  QuestionIcon,
  SparkleIcon,
  CaretDownIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { API_ENDPOINTS } from '../config/api.config';
import { useAuth } from '../context/AuthContext';
import { AskAiButton } from './ui/AskAiButton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SupportChatWidgetProps {
  context?:
    | { type: 'order'; orderId: string; orderNumber: string }
    | {
        type: 'product';
        productId: string;
        productSlug: string;
        productTitle: string;
      };
}

export const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({
  context,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [threadId, setThreadId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derive unique thread key based on current page/resource context
  const getThreadKey = useCallback(() => {
    if (!user?.id) return '';
    if (!context) return `support_thread_general_${user.id}`;
    if (context.type === 'order') {
      return `support_thread_order_${context.orderId}_${user.id}`;
    }
    return `support_thread_product_${context.productId}_${user.id}`;
  }, [context, user?.id]);

  // Load or create thread ID and restore messages on mount/context change
  useEffect(() => {
    const key = getThreadKey();
    if (!key) return;

    // Load thread ID
    let currentThreadId = localStorage.getItem(`${key}_id`);
    if (!currentThreadId) {
      currentThreadId = crypto.randomUUID();
      localStorage.setItem(`${key}_id`, currentThreadId);
    }
    setThreadId(currentThreadId);

    // Load saved messages
    const savedMessages = localStorage.getItem(`${key}_messages`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(parsed);
      } catch (e) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }

    // Cancel any active stream when changing contexts
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, [getThreadKey]);

  // Save messages to localStorage when they change
  useEffect(() => {
    const key = getThreadKey();
    if (!key || messages.length === 0) return;
    localStorage.setItem(`${key}_messages`, JSON.stringify(messages));
  }, [messages, getThreadKey]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput('');
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        abortControllerRef.current = new AbortController();

        // Build messages array for the API (strip local properties)
        const apiMessages = nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || ''}${API_ENDPOINTS.support.chat}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              messages: apiMessages,
              threadId: threadId || undefined,
              context: context || undefined,
            }),
            signal: abortControllerRef.current.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No reader available');

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'text' && data.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + data.content }
                      : m,
                  ),
                );
              } else if (data.type === 'error') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content:
                            'Sorry, something went wrong. Please try again.',
                        }
                      : m,
                  ),
                );
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "I'm sorry, I couldn't connect right now. Please try again in a moment.",
                  }
                : m,
            ),
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, messages, threadId, context],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear conversation history?')) {
      const key = getThreadKey();
      if (key) {
        localStorage.removeItem(`${key}_messages`);
        localStorage.removeItem(`${key}_id`);
        // Regenerate thread ID
        const newId = crypto.randomUUID();
        localStorage.setItem(`${key}_id`, newId);
        setThreadId(newId);
      }
      setMessages([]);
    }
  };

  // Determine actions and labels based on context
  const getContextActions = () => {
    if (!context) {
      return [
        {
          icon: PackageIcon,
          label: "Where's my order?",
          message: "Where's my order? Can you help me track it?",
        },
        {
          icon: ArrowCounterClockwiseIcon,
          label: 'Return / Refund',
          message: 'I need help with a return or refund for my order.',
        },
        {
          icon: QuestionIcon,
          label: 'Product question',
          message: 'I have a question about a product.',
        },
      ];
    }

    if (context.type === 'order') {
      return [
        {
          icon: PackageIcon,
          label: 'Where is my delivery?',
          message: `Where is my delivery for order #${context.orderNumber}?`,
        },
        {
          icon: ArrowCounterClockwiseIcon,
          label: 'Check return eligibility',
          message: `Can you check if order #${context.orderNumber} is eligible for a return, refund, or replacement?`,
        },
        {
          icon: QuestionIcon,
          label: 'Delivery partner details',
          message: `Can you show me the delivery guy details for order #${context.orderNumber}?`,
        },
      ];
    }

    return [
      {
        icon: QuestionIcon,
        label: 'Product specifications',
        message: `Can you give me the details and specifications for product "${context.productTitle}"?`,
      },
      {
        icon: ArrowCounterClockwiseIcon,
        label: 'Return policy duration',
        message: `What return or refund policies apply to product "${context.productTitle}"?`,
      },
      {
        icon: SparkleIcon,
        label: 'Check rating reviews',
        message: `What are reviews and ratings saying about product "${context.productTitle}"?`,
      },
    ];
  };

  const getWelcomeMessage = () => {
    const firstName = user?.name?.split(' ')[0] ?? 'there';
    if (!context) {
      return `Hi ${firstName}! 👋 I'm your Bezon support assistant. How can I help you today?`;
    }
    if (context.type === 'order') {
      return `Hi ${firstName}! 👋 I'm here to help with your order #${context.orderNumber}. You can track delivery, check policy timelines, or review courier details!`;
    }
    return `Hi ${firstName}! 👋 I'm here to answer any questions about the product "${context.productTitle}". Ask me about its specifications, customer reviews, or return windows!`;
  };

  if (!user) return null;

  const quickActions = getContextActions();

  return (
    <div className="w-full h-[500px] rounded-3xl bg-secondary/20 flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center">
              <RobotIcon className="h-5 w-5 text-zinc-600" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-800">Bezon AI</h3>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            title="Reset Chat"
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-rose-500 transition-colors"
          >
            <TrashIcon className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth bg-transparent"
        style={{
          scrollbarWidth: 'none',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center mb-4">
              <SparkleIcon className="h-7 w-7 text-zinc-400" />
            </div>
            <h4 className="text-zinc-800 font-bold text-base mb-2">
              Bezon Support AI
            </h4>
            <p className="text-zinc-500 text-xs mb-6 leading-relaxed">
              {getWelcomeMessage()}
            </p>
            <div className="w-full space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.message)}
                  className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl bg-white text-left text-xs font-bold text-zinc-700 hover:bg-white/80 transition-all group"
                >
                  <action.icon className="h-4.5 w-4.5 text-zinc-400 group-hover:text-zinc-600 shrink-0" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-2xl bg-white flex items-center justify-center mt-0.5">
                  <RobotIcon className="h-3.5 w-3.5 text-zinc-600" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 text-white rounded-br-md'
                    : 'bg-white text-zinc-700 rounded-bl-md'
                }`}
              >
                {msg.content || (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <SpinnerIcon className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                    <span className="text-[10px] text-zinc-500">
                      Checking data...
                    </span>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="shrink-0 w-8 h-8 rounded-2xl bg-zinc-200 flex items-center justify-center mt-0.5">
                  <UserIcon className="h-3.5 w-3.5 text-zinc-600" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
        <div className="absolute bottom-18 left-1/2 -translate-x-1/2">
          <button
            onClick={() => scrollToBottom()}
            className="p-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
          >
            <CaretDownIcon className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="px-6 py-4 bg-transparent mt-auto"
      >
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this order or product..."
            disabled={isStreaming}
            className="flex-1 bg-transparent text-xs text-zinc-800 placeholder-zinc-400 outline-none py-1.5"
          />
          <AskAiButton
            type="submit"
            isGenerating={isStreaming || !input.trim()}
          />
        </div>
      </form>
    </div>
  );
};
