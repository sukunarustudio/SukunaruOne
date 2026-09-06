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
      // Limit to max 3 concurrent toasts to prevent screen clutter
      const filtered = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
      return [...filtered, { id, message: cleanMsg, type, createdAt: Date.now() }];
    });

    // Dynamic duration based on message length & type
    const duration = type === 'error' ? 3200 : cleanMsg.length > 45 ? 2800 : 2000;

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Unobtrusive Toast Container (Top Center on mobile, Top Right on desktop) */}
      <div
        id="toast-container"
        className="fixed top-3.5 sm:top-5 right-0 left-0 sm:left-auto sm:right-6 z-[100] flex flex-col items-center sm:items-end gap-2 pointer-events-none px-4 sm:px-0 max-w-full"
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
              className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-lg border backdrop-blur-xl text-xs font-semibold select-none transition-all duration-200 animate-in fade-in slide-in-from-top-3 max-w-[92vw] sm:max-w-sm ${
                isSuccess
                  ? 'bg-[#1E293B]/95 text-slate-100 border-emerald-500/30 shadow-emerald-950/20'
                  : isError
                  ? 'bg-[#1E293B]/95 text-slate-100 border-rose-500/30 shadow-rose-950/20'
                  : 'bg-[#1E293B]/95 text-slate-100 border-sky-500/30 shadow-sky-950/20'
              }`}
            >
              {/* Icon Indicator */}
              <div className="shrink-0">
                {isSuccess && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                {isError && (
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <ExclamationCircleIcon className="w-4 h-4 text-rose-400" />
                  </div>
                )}
                {isInfo && (
                  <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center">
                    <InformationCircleIcon className="w-4 h-4 text-sky-400" />
                  </div>
                )}
              </div>

              {/* Message */}
              <span className="leading-snug tracking-tight line-clamp-2 text-[12.5px] font-medium text-slate-200">
                {toast.message}
              </span>

              {/* Close Button */}
              <button
                id={`btn-close-toast-${toast.id}`}
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors ml-1 p-1 rounded-lg hover:bg-white/10 cursor-pointer shrink-0 active:scale-95"
                title="Tutup notifikasi"
                aria-label="Tutup notifikasi"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
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
