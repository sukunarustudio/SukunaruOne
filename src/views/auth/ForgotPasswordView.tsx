import React, { useState } from 'react';
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { resetPassword } from '../../services/authService';
import { useToast } from '../../components/Toast';

interface ForgotPasswordViewProps {
  onNavigateToSignIn: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onNavigateToSignIn,
}) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Masukkan alamat email Anda.');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Format email belum sesuai.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(trimmedEmail);
      if (result.success) {
        setIsSubmitted(true);
        showToast('Tautan reset password berhasil dikirim!', 'success');
      } else {
        setErrorMessage(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#EAEFEF] dark:bg-[#0B0F17] flex flex-col justify-center items-center px-4 py-8 sm:px-6 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-[#151D2A] rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-800 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-[#25343F] dark:text-white mb-2">
            Periksa Email Anda
          </h2>
          <p className="text-xs sm:text-sm text-[#898989] dark:text-slate-400 mb-2 leading-relaxed">
            Tautan untuk mengatur ulang password telah dikirimkan ke:
          </p>
          <div className="bg-[#EAEFEF] dark:bg-slate-900 border border-[#BFC9D1]/30 dark:border-slate-800 rounded-xl py-2 px-3 mb-5 inline-block max-w-full truncate">
            <span className="text-xs font-semibold text-[#25343F] dark:text-white">
              {email.trim()}
            </span>
          </div>
          <p className="text-xs text-[#898989] dark:text-slate-400 leading-relaxed mb-6">
            Buka tautan dalam email tersebut untuk membuat password baru. Jika tidak menemukan email, periksa folder spam Anda.
          </p>
          <button
            type="button"
            onClick={onNavigateToSignIn}
            className="w-full py-3 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#e65c00] active:scale-[0.99] text-white font-bold text-sm shadow-sm transition cursor-pointer"
          >
            Kembali ke Halaman Masuk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAEFEF] dark:bg-[#0B0F17] flex flex-col justify-center items-center px-4 py-8 sm:px-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#151D2A] rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        
        {/* Back Link */}
        <div className="mb-5">
          <button
            type="button"
            onClick={onNavigateToSignIn}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#898989] hover:text-[#25343F] dark:hover:text-white transition cursor-pointer"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#25343F] dark:text-white tracking-tight">
            Lupa Password
          </h1>
          <p className="text-xs sm:text-sm text-[#898989] dark:text-slate-400 mt-1 leading-relaxed">
            Masukkan alamat email akun Anda. Kami akan mengirimkan tautan untuk membuat kata sandi baru.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-[#25343F] dark:text-slate-200 mb-1.5">
              Email Akun
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#898989] dark:text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="nama@email.com"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#BFC9D1]/60 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#25343F] dark:text-white placeholder-[#CACACA] dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9B51] focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#e65c00] active:scale-[0.99] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Mengirim Tautan...</span>
                </>
              ) : (
                <span>Kirim Tautan Reset</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
