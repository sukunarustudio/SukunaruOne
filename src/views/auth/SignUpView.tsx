import React, { useState } from 'react';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm-email'>('form');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Masukkan nama Anda.'); return; }
    if (!email.trim()) { setError('Masukkan alamat email.'); return; }
    if (password.length < 6) { setError('Password minimal 6 karakter.'); return; }
    if (password !== confirmPassword) { setError('Konfirmasi password tidak cocok.'); return; }

    setIsLoading(true);
    try {
      const result = await signUp(email, password, name);
      if (result.success) {
        if (result.requiresEmailConfirmation) {
          setSubmittedEmail(email);
          setStep('confirm-email');
        } else {
          showToast('Akun berhasil dibuat!', 'success');
          onSignUpSuccess();
        }
      } else {
        setError(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'confirm-email') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Cek Email Anda</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Link konfirmasi dikirim ke:
          </p>
          <p className="text-sm font-semibold text-[var(--accent)] mb-4">{submittedEmail}</p>
          <p className="text-xs text-[var(--text-tertiary)] mb-6">
            Klik link di email tersebut untuk mengaktifkan akun Anda, lalu kembali ke aplikasi dan masuk.
          </p>
          <button
            onClick={onNavigateToSignIn}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Sudah konfirmasi? Masuk sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-sm mb-4">
        <button
          onClick={onNavigateToSignIn}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Sudah punya akun? Masuk
        </button>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg mb-3 border border-[var(--border-primary)]">
          <img src={appLogo} alt="BisnisUrang" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Daftar Akun Baru</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Gratis selamanya · Data aman &amp; terenkripsi</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Nama Lengkap
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
                autoComplete="name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
              />
            </div>
          </div>

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
                placeholder="Min. 6 karakter"
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              >
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Konfirmasi Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              >
                {showConfirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

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
                Buat Akun Gratis
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-[10px] text-center text-[var(--text-tertiary)]">
          Dengan mendaftar, Anda menyetujui Syarat &amp; Ketentuan penggunaan BisnisUrang.
        </p>
      </div>

      {/* Offline */}
      <button
        onClick={onContinueOffline}
        className="mt-5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline transition"
      >
        Lanjutkan tanpa akun (mode offline)
      </button>
    </div>
  );
};
