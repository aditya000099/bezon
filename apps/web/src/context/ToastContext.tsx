import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const toast = useMemo(() => ({
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
    warning: (msg: string) => addToast(msg, 'warning'),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Render Overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => {
          let bg = 'bg-blue-600 text-white';
          if (t.type === 'success') bg = 'bg-emerald-600 text-white';
          if (t.type === 'error') bg = 'bg-rose-600 text-white';
          if (t.type === 'warning') bg = 'bg-amber-500 text-black';

          return (
            <div
              key={t.id}
              className={`${bg} px-4 py-3 rounded-lg shadow-lg flex items-center justify-between transition-all duration-300 transform translate-y-0 opacity-100 font-medium`}
            >
              <span>{t.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="ml-4 text-sm font-bold opacity-75 hover:opacity-100"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
