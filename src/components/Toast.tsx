import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Minimalist Translucent Toast Container: Centered at top */}
      <div id="toast-container" className="fixed top-4 sm:top-5 inset-x-0 z-50 flex flex-col items-center gap-1.5 pointer-events-none px-4">
        {toasts.map(toast => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md border border-white/10 bg-[#25343F]/80 backdrop-blur-md text-white/95 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-150 max-w-[90vw] sm:max-w-md select-none"
          >
            {toast.type === 'success' && <CheckCircleIcon className="w-3.5 h-3.5 text-[#FF9B51] shrink-0" />}
            {toast.type === 'error' && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <InformationCircleIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
            <span className="truncate">{toast.message}</span>
            <button
              id={`btn-close-toast-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white transition-colors ml-0.5 p-0.5 rounded-full hover:bg-white/10 cursor-pointer shrink-0"
              aria-label="Tutup notifikasi"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
