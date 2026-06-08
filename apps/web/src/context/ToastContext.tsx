import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  WarningCircle,
  Info,
  Warning,
  X,
} from '@phosphor-icons/react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg: string) => addToast(msg, 'success'),
      error: (msg: string) => addToast(msg, 'error'),
      info: (msg: string) => addToast(msg, 'info'),
      warning: (msg: string) => addToast(msg, 'warning'),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Render Overlay - Dynamic Island Style */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            let Icon = Info;
            let iconColor = 'text-blue-400';

            if (t.type === 'success') {
              Icon = CheckCircle;
              iconColor = 'text-emerald-400';
            } else if (t.type === 'error') {
              Icon = WarningCircle;
              iconColor = 'text-rose-400';
            } else if (t.type === 'warning') {
              Icon = Warning;
              iconColor = 'text-amber-400';
            }

            return (
              <motion.div
                key={t.id}
                layout
                initial={{
                  opacity: 0,
                  y: -25,
                  scale: 0.85,
                  filter: 'blur(10px)',
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: 'blur(0px)',
                }}
                exit={{
                  width: 42,
                  minWidth: 42,
                  paddingLeft: 8,
                  paddingRight: 8,
                  opacity: [1, 1, 0],
                  scale: [1, 0.9, 0.5],
                  transition: {
                    duration: 0.45,
                    times: [0, 0.8, 1],
                    ease: [0.4, 0, 0.2, 1],
                  },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 550,
                  damping: 35,
                }}
                className="pointer-events-auto flex items-center gap-3 bg-black/95 backdrop-blur-2xl border border-white/10 px-4 py-2.5 rounded-full shadow-2xl overflow-hidden justify-between max-w-[90vw] origin-center h-[42px]"
              >
                <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                  <motion.div layout>
                    <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
                  </motion.div>
                  <motion.span
                    layout
                    exit={{
                      opacity: 0,
                      width: 0,
                      marginRight: 0,
                      transition: {
                        duration: 0.12,
                      },
                    }}
                    className="text-white text-sm font-semibold tracking-tight truncate overflow-hidden"
                  >
                    {t.message}
                  </motion.span>
                </div>
                <motion.button
                  layout
                  exit={{
                    opacity: 0,
                    scale: 0.7,
                    width: 0,
                    marginLeft: 0,
                    transition: {
                      duration: 0.12,
                    },
                  }}
                >
                  <X className="h-3 w-3" />
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
