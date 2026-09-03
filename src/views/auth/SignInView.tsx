import React, { useState } from 'react';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { signIn } from '../../services/authService';
import { useToast } from '../../components/Toast';
import appLogo from '../../assets/app-logo.png';

interface SignInViewProps {
  onSignInSuccess: () => void;
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
  onContinueOffline: () => void;
}

export const SignInView: React.FC<SignInViewProps> = ({
  onSignInSuccess,
  onNavigateToSignUp,
  onNavigateToForgotPassword,
  onContinueOffline,
}) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Masukkan alamat email Anda.');
      return;
    }
    if (!password) {
      setError('Masukkan password Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.success) {
        showToast('Berhasil masuk!', 'success');
        onSignInSuccess();
      } else {
        setError(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 py-8">
      {/* Logo + Brand */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg mb-3 border border-[var(--border-primary)]">
          <img src={appLogo} alt="BisnisUrang" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">BisnisUrang</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Masuk ke akun Anda</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition"
              >
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Forgot Password */}
          <div className="text-right">
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Lupa password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-4 h-4" />
                Masuk
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[var(--border-primary)]" />
          <span className="text-xs text-[var(--text-tertiary)]">atau</span>
          <div className="flex-1 h-px bg-[var(--border-primary)]" />
        </div>

        {/* Sign Up */}
        <button
          onClick={onNavigateToSignUp}
          className="w-full py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-hover)] transition flex items-center justify-center gap-2"
        >
          <SparklesIcon className="w-4 h-4 text-[var(--accent)]" />
          Daftar Akun Baru
        </button>
      </div>

      {/* Offline mode */}
      <button
        onClick={onContinueOffline}
        className="mt-5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline transition"
      >
        Lanjutkan tanpa akun (mode offline)
      </button>

      <p className="mt-6 text-[10px] text-[var(--text-tertiary)] text-center">
        BisnisUrang v2.0 · Data Anda aman &amp; terenkripsi
      </p>
    </div>
  );
};
