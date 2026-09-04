import React, { useState } from 'react';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { signUp } from '../../services/authService';
import { useToast } from '../../components/Toast';
import appLogo from '../../assets/app-logo.png';

interface SignUpViewProps {
  onSignUpSuccess: () => void;
  onNavigateToSignIn: () => void;
  onContinueOffline: () => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({
  onSignUpSuccess,
  onNavigateToSignIn,
  onContinueOffline,
}) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSignUp = async (e: React.FormEvent) => {
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
    if (password.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp(trimmedEmail, password);
      if (result.success) {
        try {
          sessionStorage.setItem('sukunaru_just_signed_in', 'true');
        } catch {}
        showToast('Akun berhasil dibuat! Selamat datang di BisnisUrang.', 'success');
        onSignUpSuccess();
      } else {
        setErrorMessage(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEFEF] dark:bg-[#0B0F17] flex flex-col justify-center items-center px-4 py-8 sm:px-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#151D2A] rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm mb-4 border border-[#BFC9D1]/30 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
            <img src={appLogo} alt="BisnisUrang" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#25343F] dark:text-white tracking-tight">
            Mulai dengan akun BisnisUrang
          </h1>
          <p className="text-xs sm:text-sm text-[#898989] dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
            Gunakan akunmu untuk mengakses bisnis dari perangkat yang terhubung.
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
        <form onSubmit={handleSignUp} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#25343F] dark:text-slate-200 mb-1.5">
              Email
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

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[#25343F] dark:text-slate-200 mb-1.5">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#898989] dark:text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#BFC9D1]/60 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#25343F] dark:text-white placeholder-[#CACACA] dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9B51] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#898989] dark:text-slate-400 hover:text-[#25343F] dark:hover:text-white transition cursor-pointer p-1"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-[#25343F] dark:text-slate-200 mb-1.5">
              Konfirmasi Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#898989] dark:text-slate-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Ketik ulang password"
                autoComplete="new-password"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#BFC9D1]/60 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#25343F] dark:text-white placeholder-[#CACACA] dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9B51] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#898989] dark:text-slate-400 hover:text-[#25343F] dark:hover:text-white transition cursor-pointer p-1"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
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
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <span>Daftar</span>
              )}
            </button>
          </div>
        </form>

        {/* Simple Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#BFC9D1]/30 dark:border-slate-800" />
          </div>
          <span className="relative bg-white dark:bg-[#151D2A] px-3 text-xs text-[#898989] dark:text-slate-500 font-medium">
            atau
          </span>
        </div>

        {/* Footer Link to Sign In */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-[#898989] dark:text-slate-400">
            Sudah punya akun?{' '}
            <button
              type="button"
              onClick={onNavigateToSignIn}
              className="font-bold text-[#FF6A00] dark:text-[#FF9B51] hover:underline focus:outline-none cursor-pointer"
            >
              Masuk
            </button>
          </p>
        </div>
      </div>

      {/* Offline Mode Option */}
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={onContinueOffline}
          className="text-xs text-[#898989] hover:text-[#25343F] dark:hover:text-slate-200 transition underline underline-offset-2 cursor-pointer"
        >
          Lanjutkan tanpa akun (mode offline)
        </button>
      </div>

      <div className="mt-4 text-center">
        <span className="text-[10px] text-[#CACACA] dark:text-slate-600">
          BisnisUrang Studio OS · Aman &amp; Terenkripsi
        </span>
      </div>
    </div>
  );
};
