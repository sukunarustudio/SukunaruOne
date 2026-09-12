import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { ViewType, ThemeSettings, ThemePreset } from '../types';
import {
  getThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  HERO_PRESETS,
  THEME_PRESETS,
  getEffectiveMode,
} from '../services/themeManager';
import { useToast } from '../components/Toast';

interface AppearanceViewProps {
  onNavigate: (view: ViewType) => void;
  previousView?: ViewType;
}

export const AppearanceView: React.FC<AppearanceViewProps> = ({
  onNavigate,
  previousView = 'settings',
}) => {
  const { showToast } = useToast();
  const [theme, setTheme] = useState<ThemeSettings>(() => getThemeSettings());
  const [showResetModal, setShowResetModal] = useState(false);

  const updateTheme = (updater: (prev: ThemeSettings) => ThemeSettings) => {
    setTheme(prev => {
      const next = updater(prev);
      saveThemeSettings(next);
      return next;
    });
  };

  const handleApplyPreset = (preset: ThemePreset) => {
    updateTheme(prev => ({
      ...prev,
      accentColor: preset.accentColor,
      heroCard: {
        ...prev.heroCard,
        mode: 'auto',
        presetId: preset.id,
        lightStart: preset.heroLightStart,
        lightEnd: preset.heroLightEnd,
        darkStart: preset.heroDarkStart,
        darkEnd: preset.heroDarkEnd,
        sameInBothModes: false,
        gradient: preset.heroGradient,
        glow: preset.heroGlow,
        pattern: preset.heroPattern,
        border: preset.heroBorder,
        accent: preset.heroAccent,
        shadow: preset.heroShadow,
      },
      presetId: preset.id,
    }));
    showToast(`Tema "${preset.name}" berhasil diterapkan.`, 'success');
  };

  const handleResetConfirm = () => {
    const def = resetThemeSettings();
    setTheme(def);
    setShowResetModal(false);
    showToast('Tampilan berhasil dikembalikan ke pengaturan default.', 'success');
  };

  const effectiveMode = getEffectiveMode(theme.mode);
  const isDarkEffective = effectiveMode === 'dark';

  const activeHeroPreset =
    HERO_PRESETS.find(p => p.id === theme.heroCard?.presetId) ||
    HERO_PRESETS.find(p => p.lightStart === theme.heroCard?.lightStart) ||
    HERO_PRESETS[0];

  const previewGradient = theme.heroCard?.gradient || activeHeroPreset.gradient;
  const previewGlow = theme.heroCard?.glow || activeHeroPreset.glow;
  const previewPattern = theme.heroCard?.pattern || activeHeroPreset.pattern;
  const previewBorder = theme.heroCard?.border || activeHeroPreset.border;
  const previewAccent = theme.heroCard?.accent || activeHeroPreset.accent;
  const previewShadow = theme.heroCard?.shadow || activeHeroPreset.shadow;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 animate-fade-in pb-28">
      {/* ── APPLE FROSTED TOP HEADER ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF]/85 dark:bg-[#0B0F17]/85 backdrop-blur-xl py-3 -mx-3 px-3 sm:-mx-4 sm:px-4 flex items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.06] transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate(previousView)}
            className="p-2 -ml-2 text-[#25343F] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer active:scale-90 shrink-0"
            title="Kembali"
          >
            <ArrowLeftIcon className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] dark:text-white leading-tight tracking-tight truncate">
              Tampilan &amp; Tema
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] dark:text-slate-400 font-medium mt-0.5 truncate hidden sm:block">
              Pilih paket tema visual siap pakai untuk aplikasi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="h-9 px-3.5 bg-black/[0.04] hover:bg-rose-500/10 text-[#25343F] hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 dark:bg-white/[0.06] dark:hover:bg-rose-500/20 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 border border-black/[0.04] dark:border-white/[0.08]"
        >
          <ArrowPathIcon className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Atur Ulang</span>
        </button>
      </div>

      {/* ── 1. APPLE LIVE INTERACTIVE PREVIEW ── */}
      <div className="bg-white dark:bg-[#151C24] rounded-3xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center">
              <EyeIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-[#25343F] dark:text-white block leading-tight">
                Live Preview
              </span>
              <span className="text-[11px] text-[#898989] dark:text-slate-400">
                Pratinjau langsung tema visual yang Anda pilih
              </span>
            </div>
          </div>

          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#EAEFEF] dark:bg-white/[0.08] text-[#25343F] dark:text-slate-200 border border-black/[0.04] dark:border-white/[0.06]">
            {theme.mode === 'system'
              ? `⚡ Auto (${isDarkEffective ? 'Gelap' : 'Terang'})`
              : isDarkEffective
              ? '🌙 Mode Gelap'
              : '☀️ Mode Terang'}
          </span>
        </div>

        {/* Device Frame Simulation */}
        <div className="bg-[#EAEFEF] dark:bg-[#0E141D] rounded-2xl p-3 sm:p-4 border border-[#BFC9D1]/30 dark:border-white/[0.06] space-y-3">
          {/* Simulated Mini App Bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-[#25343F] dark:text-white">Bisnis Urang 2.0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-2xs"
                style={{ backgroundColor: theme.accentColor }}
              >
                Aksen Aktif
              </span>
            </div>
          </div>

          {/* Hero Banner Sample */}
          <div
            className="rounded-2xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden border"
            style={{
              background: `radial-gradient(circle at 18% 22%, ${previewGlow} 0%, transparent 45%), radial-gradient(circle at 82% 82%, ${previewGlow} 0%, transparent 50%), ${previewGradient}`,
              borderColor: previewBorder,
              boxShadow: `0 10px 25px -5px ${previewShadow}`,
              color: '#FFFFFF',
            }}
          >
            {/* Dot Grid Layer */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(${previewPattern} 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }}
            />

            {/* Ambient Wave */}
            <div className="absolute right-0 bottom-0 w-44 h-20 opacity-20 pointer-events-none mix-blend-overlay">
              <svg className="w-full h-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 80 C 50 50, 100 110, 200 60" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 85 C 60 55, 110 115, 200 65" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                  Dashboard Studio
                </span>
                <span
                  className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-xs border border-white/15"
                  style={{ color: previewAccent }}
                >
                  ● {activeHeroPreset.label.replace(/^\d+\.\s*/, '')}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black tracking-tight drop-shadow-xs">
                Bisnis Urang Studio
              </h3>
              <p className="text-[11px] text-white/90 leading-relaxed max-w-sm">
                Harmonisasi tema visual modern dengan kenyamanan membaca di segala kondisi cahaya.
              </p>
            </div>
          </div>

          {/* Quick Mockup Metrics Row */}
          <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
            <div className="bg-white dark:bg-[#151C24] p-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] shadow-2xs">
              <span className="text-[10px] text-[#898989] dark:text-slate-400 block font-medium">Kasir POS</span>
              <span className="text-xs font-black text-[#25343F] dark:text-white">Siap Transaksi</span>
            </div>
            <div className="bg-white dark:bg-[#151C24] p-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] shadow-2xs">
              <span className="text-[10px] text-[#898989] dark:text-slate-400 block font-medium">Pesanan SPK</span>
              <span className="text-xs font-black text-[#25343F] dark:text-white">Otomatis Sync</span>
            </div>
            <div className="bg-white dark:bg-[#151C24] p-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] shadow-2xs">
              <span className="text-[10px] text-[#898989] dark:text-slate-400 block font-medium">Buku Kas</span>
              <span
                className="text-xs font-black"
                style={{ color: theme.accentColor }}
              >
                Sinkron 100%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. TEMA SIAP PAKAI (APPLE MINIMALIST INSET LIST) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white leading-tight">
                Pilihan Tema Siap Pakai
              </h3>
              <p className="text-[11px] text-[#898989] dark:text-slate-400">
                Sentuh salah satu tema untuk langsung menerapkan warna &amp; tampilan
              </p>
            </div>
          </div>
        </div>

        {/* Minimalist Apple Grouped Inset Card */}
        <div className="bg-white dark:bg-[#151C24] rounded-3xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden">
          {THEME_PRESETS.map(p => {
            const isPresetActive = theme.presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`w-full p-3.5 sm:p-4 text-left transition-all cursor-pointer flex items-center justify-between gap-3.5 group relative ${
                  isPresetActive
                    ? 'bg-[#FF9B51]/[0.06] dark:bg-white/[0.04]'
                    : 'hover:bg-black/[0.015] dark:hover:bg-white/[0.02] active:bg-black/[0.04] dark:active:bg-white/[0.05]'
                }`}
              >
                {/* Left Swatch Preview */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shrink-0 relative overflow-hidden shadow-xs border border-black/[0.06] dark:border-white/[0.1] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                    style={{
                      background: p.heroGradient || `linear-gradient(135deg, ${p.heroLightStart} 0%, ${p.heroLightEnd} 100%)`,
                    }}
                  >
                    {/* Micro dot indicator on swatch */}
                    <div
                      className="w-3 h-3 rounded-full border border-white/60 shadow-xs"
                      style={{ backgroundColor: p.accentColor }}
                    />
                  </div>

                  {/* Information */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-[#25343F] dark:text-white truncate">
                        {p.name}
                      </span>
                      {isPresetActive && (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#898989] dark:text-slate-400 font-medium truncate mt-0.5">
                      {p.description}
                    </p>
                  </div>
                </div>

                {/* Right Apple Radio Indicator */}
                <div className="shrink-0 flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isPresetActive
                        ? 'bg-[var(--color-accent)] text-white shadow-xs scale-100 ring-2 ring-[var(--color-accent)]/25'
                        : 'border border-slate-300 dark:border-slate-600 bg-transparent opacity-60 group-hover:opacity-100'
                    }`}
                  >
                    {isPresetActive && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MODAL KONFIRMASI RESET (APPLE ALERT SHEET) ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1C232D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-black/[0.06] dark:border-white/[0.1] animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto shadow-2xs">
              <ExclamationTriangleIcon className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-black text-base text-[#25343F] dark:text-white">
                Atur Ulang Tampilan?
              </h3>
              <p className="text-xs text-[#898989] dark:text-slate-400 leading-relaxed">
                Preferensi tema visual akan dikembalikan ke setelan default aplikasi.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] font-bold text-xs text-[#25343F] dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-md transition-all cursor-pointer active:scale-95"
              >
                Atur Ulang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppearanceView;
