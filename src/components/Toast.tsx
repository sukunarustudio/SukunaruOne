import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Format and sanitize message to ensure clean, professional, concise copywriting.
 * Strips raw stack traces, database codes, or excessively long strings.
 */
function sanitizeToastMessage(raw: string): string {
  if (!raw) return 'Operasi berhasil dilakukan.';
  let text = String(raw).trim();

  // Remove common technical prefixes
  text = text.replace(/^(Error:\s*|TypeError:\s*|UnhandledRejection:\s*)/i, '');
  text = text.replace(/^PGRST\d+:\s*/i, '');
  text = text.replace(/^PostgreSQL error:\s*/i, '');

  // Friendly fallback for common technical errors
  if (/Failed to fetch|NetworkError|Network request failed/i.test(text)) {
    return 'Gagal terhubung ke jaringan. Periksa koneksi internet Anda.';
  }
  if (/JWT expired|invalid claim/i.test(text)) {
    return 'Sesi login telah berakhir. Silakan masuk kembali.';
  }

  // Cap extremely long text at 95 characters with clean ellipsis
  if (text.length > 95) {
    return text.slice(0, 92).trim() + '...';
  }

  return text;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const cleanMsg = sanitizeToastMessage(message);
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);

    setToasts(prev => {
      // Limit to max 2 concurrent toasts to prevent screen clutter
      const filtered = prev.length >= 2 ? prev.slice(prev.length - 1) : prev;
      return [...filtered, { id, message: cleanMsg, type, createdAt: Date.now() }];
    });

    // Dynamic duration based on message length & type
    const duration = type === 'error' ? 3000 : cleanMsg.length > 45 ? 2600 : 1900;

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Low-Opacity Minimal Toast Container */}
      <div
        id="toast-container"
        className="fixed top-3 sm:top-5 right-0 left-0 sm:left-auto sm:right-6 z-[100] flex flex-col items-center sm:items-end gap-1.5 pointer-events-none px-4 sm:px-0 max-w-full"
        aria-live="polite"
      >
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              id={`toast-${toast.id}`}
              role="alert"
              className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full apple-glass-toast text-[#25343F] dark:text-white text-[12px] font-semibold select-none transition-all duration-200 animate-in fade-in slide-in-from-top-2 max-w-[92vw] sm:max-w-md"
            >
              {/* Minimal Clean Dot/Icon Indicator */}
              <div className="shrink-0 flex items-center justify-center">
                {isSuccess && (
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 drop-shadow-xs" />
                )}
                {isError && (
                  <ExclamationCircleIcon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 drop-shadow-xs" />
                )}
                {isInfo && (
                  <InformationCircleIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 drop-shadow-xs" />
                )}
              </div>

              {/* Message text */}
              <span className="leading-snug tracking-tight text-[#25343F] dark:text-slate-100 truncate">
                {toast.message}
              </span>

              {/* Minimal Close 'x' */}
              <button
                id={`btn-close-toast-${toast.id}`}
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-[#25343F] dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-0.5 p-0.5 rounded-full cursor-pointer shrink-0 active:scale-90"
                title="Tutup notifikasi"
                aria-label="Tutup notifikasi"
              >
                <XMarkIcon className="w-3 h-3 stroke-[2]" />
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
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
