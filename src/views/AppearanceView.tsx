import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  CheckIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { ViewType, ThemeSettings, ThemeMode } from '../types';
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

  const handleModeChange = (mode: ThemeMode) => {
    updateTheme(prev => ({ ...prev, mode }));
    showToast(
      `Mode tampilan diubah ke ${
        mode === 'light' ? 'Siang (Terang)' : mode === 'dark' ? 'Malam (Gelap)' : 'Mengikuti Sistem'
      }`,
      'info'
    );
  };

  const handleApplyPreset = (preset: (typeof THEME_PRESETS)[0]) => {
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
    showToast(`Preset tema "${preset.name}" berhasil diterapkan!`, 'success');
  };

  const handleResetConfirm = () => {
    const def = resetThemeSettings();
    setTheme(def);
    setShowResetModal(false);
    showToast('Tampilan berhasil dikembalikan ke setelan default!', 'success');
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
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-24">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF]/90 dark:bg-[#0B0F17]/90 backdrop-blur-xl py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 flex items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
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
              Atur mode gelap &amp; paket tema visual aplikasi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="h-9 px-3.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <ArrowPathIcon className="w-4 h-4 stroke-[2]" />
          <span className="hidden sm:inline">Reset Default</span>
        </button>
      </div>

      {/* ── LIVE INTERACTIVE PREVIEW CARD ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeIcon className="w-4 h-4 text-[#898989]" />
            <span className="font-extrabold text-xs text-[#25343F] dark:text-white">Live Preview Tampilan</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAEFEF] dark:bg-slate-800 text-[#898989] dark:text-slate-300">
            {isDarkEffective ? '🌙 Mode Malam' : '☀️ Mode Siang'}
          </span>
        </div>

        {/* Simulated Hero Banner */}
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
              backgroundSize: '24px 24px',
            }}
          />

          {/* Ambient Wave */}
          <div className="absolute right-0 bottom-0 w-48 h-24 opacity-15 pointer-events-none mix-blend-overlay">
            <svg className="w-full h-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 80 C 50 50, 100 110, 200 60" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 85 C 60 55, 110 115, 200 65" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M20 90 C 70 60, 120 120, 200 70" stroke="white" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>

          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                BisnisUrang Studio
              </span>
              <span
                className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-xs border border-white/10"
                style={{ color: previewAccent }}
              >
                ● {activeHeroPreset.label.replace(/^\d+\.\s*/, '')}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black tracking-tight drop-shadow-xs">
              BisnisUrang Studio
            </h3>
            <p className="text-xs text-white/90 max-w-sm leading-relaxed">
              Pratinjau kartu beranda dan nuansa warna tema yang Anda pilih.
            </p>
          </div>
        </div>
      </div>

      {/* ── 1. MODE TAMPILAN ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
        <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white">1. Mode Tampilan</h3>

        <div className="grid grid-cols-3 gap-2">
          {/* Light Mode */}
          <button
            type="button"
            onClick={() => handleModeChange('light')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
              theme.mode === 'light'
                ? 'bg-[#FFF0E6] dark:bg-slate-800 border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/40 border-[#BFC9D1]/25 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <SunIcon className={`w-5 h-5 ${theme.mode === 'light' ? 'text-[var(--color-accent)]' : 'text-[#898989]'}`} />
            <span className="font-bold text-xs text-[#25343F] dark:text-white">Siang</span>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
              theme.mode === 'dark'
                ? 'bg-zinc-900 border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] shadow-xs text-white'
                : 'bg-slate-50 dark:bg-slate-800/40 border-[#BFC9D1]/25 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <MoonIcon className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-[var(--color-accent)]' : 'text-[#898989]'}`} />
            <span className="font-bold text-xs text-[#25343F] dark:text-white">Malam</span>
          </button>

          {/* System Mode */}
          <button
            type="button"
            onClick={() => handleModeChange('system')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
              theme.mode === 'system'
                ? 'bg-[#FFF0E6] dark:bg-slate-800 border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/40 border-[#BFC9D1]/25 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <ComputerDesktopIcon className={`w-5 h-5 ${theme.mode === 'system' ? 'text-[var(--color-accent)]' : 'text-[#898989]'}`} />
            <span className="font-bold text-xs text-[#25343F] dark:text-white">Sistem</span>
          </button>
        </div>
      </div>

      {/* ── 2. PRESET TEMA ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white">2. Preset Tema</h3>
          <span className="text-[11px] text-[#898989] dark:text-slate-400 font-medium">
            Pilih paket tema siap pakai
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {THEME_PRESETS.map(p => {
            const isPresetActive = theme.presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isPresetActive
                    ? 'border-[#25343F] dark:border-white bg-[#EAEFEF] dark:bg-slate-800 ring-2 ring-[#25343F] dark:ring-white shadow-xs'
                    : 'border-[#BFC9D1]/25 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: p.accentColor }}
                    />
                    <span className="font-bold text-xs text-[#25343F] dark:text-white truncate">{p.name}</span>
                  </div>
                  {isPresetActive ? (
                    <span className="text-[9px] font-black text-white bg-[#25343F] dark:bg-slate-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <CheckIcon className="w-2.5 h-2.5 stroke-[3]" /> Aktif
                    </span>
                  ) : null}
                </div>

                <p className="text-[11px] text-[#898989] dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div
                  className="h-2 rounded-full w-full opacity-90 shadow-2xs"
                  style={{
                    background: `linear-gradient(90deg, ${p.heroLightStart} 0%, ${p.accentColor} 50%, ${p.heroLightEnd} 100%)`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MODAL KONFIRMASI RESET ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-[#BFC9D1]/30 dark:border-slate-800 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-[#25343F] dark:text-white">Reset Tampilan ke Default?</h3>
              <p className="text-xs text-[#898989] dark:text-slate-400 leading-relaxed">
                Semua preferensi mode tampilan dan preset tema akan dikembalikan ke setelan awal aplikasi.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#BFC9D1]/30 dark:border-slate-700 font-bold text-xs text-[#25343F] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-md transition-colors cursor-pointer active:scale-95"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
