import React, { useState } from 'react';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
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
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Masukkan alamat email Anda.'); return; }

    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSent(true);
        showToast('Email reset dikirim!', 'success');
      } else {
        setError(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Email Dikirim!</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Link reset password telah dikirim ke <strong>{email}</strong>. Cek inbox atau folder spam Anda.
          </p>
          <button
            onClick={onNavigateToSignIn}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Kembali ke Halaman Masuk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm mb-4">
        <button
          onClick={onNavigateToSignIn}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali ke Masuk
        </button>
      </div>

      <div className="flex flex-col items-center mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Lupa Password</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 text-center max-w-xs">
          Masukkan email Anda. Kami akan mengirimkan link untuk mereset password.
        </p>
      </div>

      <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

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
                Mengirim...
              </>
            ) : (
              'Kirim Link Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
