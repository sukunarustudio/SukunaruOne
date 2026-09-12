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
  PaintBrushIcon,
  SwatchIcon,
  RectangleStackIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { ViewType, ThemeSettings, ThemeMode, ThemePreset } from '../types';
import {
  getThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  ACCENT_PRESETS,
  HERO_PRESETS,
  THEME_PRESETS,
  getEffectiveMode,
  HeroPresetItem,
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
      `Mode tampilan diatur ke ${
        mode === 'light' ? 'Terang' : mode === 'dark' ? 'Gelap' : 'Otomatis (Sistem)'
      }`,
      'info'
    );
  };

  const handleAccentChange = (accentColor: string) => {
    updateTheme(prev => ({
      ...prev,
      accentColor,
    }));
  };

  const handleApplyHeroPreset = (hero: HeroPresetItem) => {
    updateTheme(prev => ({
      ...prev,
      heroCard: {
        ...prev.heroCard,
        mode: 'auto',
        presetId: hero.id,
        lightStart: hero.lightStart,
        lightEnd: hero.lightEnd,
        darkStart: hero.darkStart,
        darkEnd: hero.darkEnd,
        sameInBothModes: false,
        gradient: hero.gradient,
        glow: hero.glow,
        pattern: hero.pattern,
        border: hero.border,
        accent: hero.accent,
        shadow: hero.shadow,
      },
    }));
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
              Kustomisasi mode gelap, aksen warna, dan tema visual aplikasi
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
                Pratinjau langsung tampilan UI yang Anda pilih
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

      {/* ── 2. MODE TAMPILAN (APPLE DISPLAY & BRIGHTNESS STYLE) ── */}
      <div className="bg-white dark:bg-[#151C24] rounded-3xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <SunIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white leading-tight">
              Mode Tampilan
            </h3>
            <p className="text-[11px] text-[#898989] dark:text-slate-400">
              Pilih pencahayaan antarmuka sesuai preferensi kenyamanan mata
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {/* Light Mode Mockup */}
          <button
            type="button"
            onClick={() => handleModeChange('light')}
            className={`group p-2.5 sm:p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2.5 relative ${
              theme.mode === 'light'
                ? 'border-[var(--color-accent)] bg-[#FF9B51]/5 dark:bg-[#FF9B51]/10 ring-2 ring-[var(--color-accent)] shadow-sm'
                : 'border-[#BFC9D1]/30 dark:border-white/[0.08] bg-[#EAEFEF]/50 dark:bg-white/[0.03] hover:bg-[#EAEFEF] dark:hover:bg-white/[0.06]'
            }`}
          >
            {/* Visual Phone Frame - Light */}
            <div className="w-full aspect-[4/5] max-w-[120px] rounded-xl bg-white border border-slate-200 shadow-xs p-2 flex flex-col justify-between overflow-hidden">
              <div className="space-y-1">
                <div className="w-8 h-1.5 rounded-full bg-slate-200 mx-auto" />
                <div className="w-full h-4 rounded-md bg-orange-100/70 border border-orange-200/50 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-orange-600">BisnisUrang</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-2 rounded-xs bg-slate-100" />
                <div className="w-3/4 h-2 rounded-xs bg-slate-100" />
              </div>
              <div className="w-full h-2.5 rounded-md bg-slate-200" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1">
                <SunIcon className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                <span className="font-bold text-xs text-[#25343F] dark:text-white">Terang</span>
              </div>
              <span className="text-[10px] text-[#898989] dark:text-slate-400 block">Siang Hari</span>
            </div>

            {/* Apple Check Indicator */}
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                theme.mode === 'light'
                  ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]/30'
                  : 'border border-slate-300 dark:border-slate-600 bg-transparent'
              }`}
            >
              {theme.mode === 'light' && <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>

          {/* Dark Mode Mockup */}
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            className={`group p-2.5 sm:p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2.5 relative ${
              theme.mode === 'dark'
                ? 'border-[var(--color-accent)] bg-[#FF9B51]/5 dark:bg-[#FF9B51]/10 ring-2 ring-[var(--color-accent)] shadow-sm'
                : 'border-[#BFC9D1]/30 dark:border-white/[0.08] bg-[#EAEFEF]/50 dark:bg-white/[0.03] hover:bg-[#EAEFEF] dark:hover:bg-white/[0.06]'
            }`}
          >
            {/* Visual Phone Frame - Dark */}
            <div className="w-full aspect-[4/5] max-w-[120px] rounded-xl bg-[#0B0F17] border border-slate-800 shadow-xs p-2 flex flex-col justify-between overflow-hidden">
              <div className="space-y-1">
                <div className="w-8 h-1.5 rounded-full bg-slate-700 mx-auto" />
                <div className="w-full h-4 rounded-md bg-orange-950/60 border border-orange-800/40 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-orange-400">BisnisUrang</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-2 rounded-xs bg-slate-800" />
                <div className="w-3/4 h-2 rounded-xs bg-slate-800" />
              </div>
              <div className="w-full h-2.5 rounded-md bg-slate-800" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1">
                <MoonIcon className="w-3.5 h-3.5 text-indigo-400 stroke-[2.5]" />
                <span className="font-bold text-xs text-[#25343F] dark:text-white">Gelap</span>
              </div>
              <span className="text-[10px] text-[#898989] dark:text-slate-400 block">Malam Hari</span>
            </div>

            {/* Apple Check Indicator */}
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                theme.mode === 'dark'
                  ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]/30'
                  : 'border border-slate-300 dark:border-slate-600 bg-transparent'
              }`}
            >
              {theme.mode === 'dark' && <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>

          {/* System Mode Mockup */}
          <button
            type="button"
            onClick={() => handleModeChange('system')}
            className={`group p-2.5 sm:p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2.5 relative ${
              theme.mode === 'system'
                ? 'border-[var(--color-accent)] bg-[#FF9B51]/5 dark:bg-[#FF9B51]/10 ring-2 ring-[var(--color-accent)] shadow-sm'
                : 'border-[#BFC9D1]/30 dark:border-white/[0.08] bg-[#EAEFEF]/50 dark:bg-white/[0.03] hover:bg-[#EAEFEF] dark:hover:bg-white/[0.06]'
            }`}
          >
            {/* Visual Phone Frame - Split System */}
            <div className="w-full aspect-[4/5] max-w-[120px] rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs p-2 flex flex-col justify-between overflow-hidden relative bg-gradient-to-r from-white via-white 50% to-[#0B0F17] 50%">
              <div className="space-y-1 relative z-10">
                <div className="w-8 h-1.5 rounded-full bg-slate-400 mx-auto" />
                <div className="w-full h-4 rounded-md bg-white/80 dark:bg-black/80 backdrop-blur-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-[#25343F] dark:text-white">Auto</span>
                </div>
              </div>
              <div className="space-y-1 relative z-10">
                <div className="w-full h-2 rounded-xs bg-slate-300/60 dark:bg-slate-700/60" />
                <div className="w-3/4 h-2 rounded-xs bg-slate-300/60 dark:bg-slate-700/60" />
              </div>
              <div className="w-full h-2.5 rounded-md bg-slate-400/50" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1">
                <ComputerDesktopIcon className="w-3.5 h-3.5 text-sky-500 stroke-[2.5]" />
                <span className="font-bold text-xs text-[#25343F] dark:text-white">Otomatis</span>
              </div>
              <span className="text-[10px] text-[#898989] dark:text-slate-400 block">Ikuti HP</span>
            </div>

            {/* Apple Check Indicator */}
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                theme.mode === 'system'
                  ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]/30'
                  : 'border border-slate-300 dark:border-slate-600 bg-transparent'
              }`}
            >
              {theme.mode === 'system' && <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>

      {/* ── 3. WARNA AKSEN APLIKASI (APPLE ACCENT PALETTE) ── */}
      <div className="bg-white dark:bg-[#151C24] rounded-3xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <SwatchIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white leading-tight">
                Warna Aksen Aplikasi
              </h3>
              <p className="text-[11px] text-[#898989] dark:text-slate-400">
                Pilih warna utama untuk tombol aksi, indikator, dan navigasi
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
          {ACCENT_PRESETS.map(preset => {
            const isSelected = theme.accentColor?.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => handleAccentChange(preset.hex)}
                className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all cursor-pointer active:scale-90 ${
                  isSelected
                    ? 'bg-[#EAEFEF] dark:bg-white/[0.08] ring-1 ring-black/[0.08] dark:ring-white/[0.12]'
                    : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                }`}
                title={preset.label}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105 ${
                    isSelected ? 'ring-3 ring-offset-2 ring-[var(--color-accent)] ring-offset-white dark:ring-offset-[#151C24]' : ''
                  }`}
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <CheckIcon className="w-4 h-4 text-white stroke-[3] drop-shadow-xs" />}
                </div>
                <span className="text-[10px] font-bold text-[#25343F] dark:text-slate-300 truncate max-w-full text-center">
                  {preset.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. KOLEKSI TEMA STUDIO (CURATED THEME PRESETS) ── */}
      <div className="bg-white dark:bg-[#151C24] rounded-3xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white leading-tight">
                Koleksi Tema Siap Pakai
              </h3>
              <p className="text-[11px] text-[#898989] dark:text-slate-400">
                Paket kombinasi visual lengkap yang dirancang harmonis
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEME_PRESETS.map(p => {
            const isPresetActive = theme.presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group relative active:scale-[0.98] ${
                  isPresetActive
                    ? 'border-[#25343F] dark:border-white bg-[#EAEFEF]/90 dark:bg-white/[0.08] ring-2 ring-[#25343F] dark:ring-white shadow-xs'
                    : 'border-[#BFC9D1]/30 dark:border-white/[0.08] bg-white dark:bg-[#121820] hover:bg-[#EAEFEF]/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: p.accentColor }}
                    />
                    <span className="font-bold text-xs text-[#25343F] dark:text-white truncate">
                      {p.name}
                    </span>
                  </div>
                  {isPresetActive && (
                    <span className="text-[10px] font-black text-white bg-[#25343F] dark:bg-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <CheckIcon className="w-3 h-3 stroke-[3]" /> Aktif
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#898989] dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                {/* Theme Ribbon */}
                <div
                  className="h-2.5 rounded-full w-full opacity-90 shadow-2xs"
                  style={{
                    background: `linear-gradient(90deg, ${p.heroLightStart} 0%, ${p.accentColor} 50%, ${p.heroLightEnd} 100%)`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. GAYA BANNER BERANDA (HERO CARDS) ── */}
      <div className="bg-white dark:bg-[#151C24] rounded-3xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <RectangleStackIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white leading-tight">
                Gaya Banner Beranda
              </h3>
              <p className="text-[11px] text-[#898989] dark:text-slate-400">
                Pilih gradasi kartu selamat datang pada halaman Dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {HERO_PRESETS.map(hero => {
            const isHeroActive = theme.heroCard?.presetId === hero.id;
            return (
              <button
                key={hero.id}
                type="button"
                onClick={() => handleApplyHeroPreset(hero)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative active:scale-95 ${
                  isHeroActive
                    ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] bg-[#EAEFEF] dark:bg-white/[0.08] shadow-xs'
                    : 'border-[#BFC9D1]/30 dark:border-white/[0.08] bg-white dark:bg-[#121820] hover:bg-[#EAEFEF]/40'
                }`}
              >
                <div
                  className="h-10 rounded-xl w-full relative overflow-hidden shadow-xs flex items-center justify-center"
                  style={{ background: hero.gradient }}
                >
                  {isHeroActive && (
                    <div className="w-5 h-5 rounded-full bg-white/90 text-[#25343F] flex items-center justify-center shadow-xs">
                      <CheckIcon className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between min-w-0">
                  <span className="font-bold text-[11px] text-[#25343F] dark:text-white truncate">
                    {hero.label.replace(/^\d+\.\s*/, '')}
                  </span>
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
                Preferensi mode tampilan, warna aksen, dan tema akan dikembalikan ke setelan default aplikasi.
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
