import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  SwatchIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  EyeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { ViewType, ThemeSettings, ThemeMode } from '../types';
import {
  getThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  applyTheme,
  ACCENT_PRESETS,
  HERO_PRESETS,
  THEME_PRESETS,
  getEffectiveMode,
  hexToRgba,
  getContrastTextColor,
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
  const [customHexInput, setCustomHexInput] = useState(theme.accentColor);

  useEffect(() => {
    setCustomHexInput(theme.accentColor);
  }, [theme.accentColor]);

  const updateTheme = (updater: (prev: ThemeSettings) => ThemeSettings) => {
    setTheme(prev => {
      const next = updater(prev);
      saveThemeSettings(next);
      return next;
    });
  };

  const handleModeChange = (mode: ThemeMode) => {
    updateTheme(prev => ({ ...prev, mode, presetId: undefined }));
    showToast(`Mode tampilan diubah ke ${mode === 'light' ? 'Siang (Terang)' : mode === 'dark' ? 'Malam (Gelap)' : 'Mengikuti Sistem'}`, 'info');
  };

  const handleAccentChange = (hex: string) => {
    updateTheme(prev => ({ ...prev, accentColor: hex, presetId: undefined }));
  };

  const handleCustomHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hex = customHexInput.trim();
    if (!hex.startsWith('#')) hex = `#${hex}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      handleAccentChange(hex);
      showToast(`Warna aksen kustom diterapkan (${hex.toUpperCase()})`, 'success');
    } else {
      showToast('Format HEX tidak valid. Contoh: #FF9B51 atau #0890FE', 'error');
    }
  };

  const handleHeroPresetChange = (preset: (typeof HERO_PRESETS)[0]) => {
    updateTheme(prev => ({
      ...prev,
      heroCard: {
        ...prev.heroCard,
        presetId: preset.id,
        gradient: preset.gradient,
        glow: preset.glow,
        pattern: preset.pattern,
        border: preset.border,
        accent: preset.accent,
        shadow: preset.shadow,
        lightStart: preset.lightStart,
        lightEnd: preset.lightEnd,
        darkStart: preset.darkStart,
        darkEnd: preset.darkEnd,
      },
    }));
    showToast(`Hero Card "${preset.label}" diterapkan`, 'info');
  };

  const handleApplyPreset = (preset: (typeof THEME_PRESETS)[0]) => {
    updateTheme(() => ({
      mode: preset.mode,
      accentColor: preset.accentColor,
      heroCard: {
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
    HERO_PRESETS.find(p => p.id === theme.heroCard.presetId) ||
    HERO_PRESETS.find(p => p.lightStart === theme.heroCard.lightStart) ||
    HERO_PRESETS[0];

  const previewGradient = theme.heroCard.gradient || activeHeroPreset.gradient;
  const previewGlow = theme.heroCard.glow || activeHeroPreset.glow;
  const previewPattern = theme.heroCard.pattern || activeHeroPreset.pattern;
  const previewBorder = theme.heroCard.border || activeHeroPreset.border;
  const previewAccent = theme.heroCard.accent || activeHeroPreset.accent;
  const previewShadow = theme.heroCard.shadow || activeHeroPreset.shadow;

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-24">
      {/* ── STICKY TOP HEADER ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate(previousView)}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
            title="Kembali"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Tampilan &amp; Tema
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Atur mode gelap, warna aksen &amp; preferensi visual aplikasi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="h-9 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0 active:scale-95"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
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
                Sukunaru Studio
              </span>
              <span
                className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-xs border border-white/10"
                style={{ color: previewAccent }}
              >
                ● {activeHeroPreset.label.replace(/^\d+\.\s*/, '')}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black tracking-tight drop-shadow-xs">
              Sukunaru Studio
            </h3>
            <p className="text-xs text-white/90 max-w-sm leading-relaxed">
              Pratinjau langsung kartu saldo, tombol aksen, dan gradasi warna yang Anda pilih.
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
                ? 'bg-[#FFF0E6] dark:bg-slate-800 border-[#FF6A00] ring-2 ring-[#FF6A00] shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/40 border-[#BFC9D1]/25 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <SunIcon className={`w-5 h-5 ${theme.mode === 'light' ? 'text-[#FF6A00]' : 'text-[#898989]'}`} />
            <span className="font-bold text-xs text-[#25343F] dark:text-white">Siang</span>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
              theme.mode === 'dark'
                ? 'bg-zinc-900 border-[#FF6A00] ring-2 ring-[#FF6A00] shadow-xs text-white'
                : 'bg-slate-50 dark:bg-slate-800/40 border-[#BFC9D1]/25 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <MoonIcon className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-[#FF6A00]' : 'text-[#898989]'}`} />
            <span className="font-bold text-xs text-[#25343F] dark:text-white">Malam</span>
          </button>

          {/* System Mode */}
          <button
            type="button"
            onClick={() => handleModeChange('system')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
              theme.mode === 'system'
                ? 'bg-[#FFF0E6] dark:bg-slate-800 border-[#FF6A00] ring-2 ring-[#FF6A00] shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/40 border-[#BFC9D1]/25 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <ComputerDesktopIcon className={`w-5 h-5 ${theme.mode === 'system' ? 'text-[#FF6A00]' : 'text-[#898989]'}`} />
            <span className="font-bold text-xs text-[#25343F] dark:text-white">Sistem</span>
          </button>
        </div>
      </div>

      {/* ── 2. WARNA AKSEN UTAMA ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
        <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white">2. Warna Aksen Utama</h3>

        {/* Accent Preset Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ACCENT_PRESETS.map(preset => {
            const isSelected = theme.accentColor.toUpperCase() === preset.hex.toUpperCase();
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => handleAccentChange(preset.hex)}
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#25343F] dark:border-white bg-[#EAEFEF] dark:bg-slate-800 ring-2 ring-[#25343F] dark:ring-white shadow-xs'
                    : 'border-[#BFC9D1]/30 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full shrink-0 shadow-2xs flex items-center justify-center text-white"
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <CheckIcon className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="font-bold text-xs text-[#25343F] dark:text-white truncate">
                  {preset.label.replace('Sukunaru ', '').replace('Royal ', '')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compact Custom Color Picker & HEX Input */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.accentColor}
              onChange={e => handleAccentChange(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-[#BFC9D1]/30 dark:border-slate-700 p-0.5 bg-white shadow-2xs"
              title="Pilih warna custom"
            />
            <span className="text-xs text-[#898989] font-medium">Kustom Picker</span>
          </div>

          <form onSubmit={handleCustomHexSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={customHexInput}
              onChange={e => setCustomHexInput(e.target.value)}
              placeholder="#FF6A00"
              maxLength={7}
              className="w-24 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-[#BFC9D1]/30 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-[#25343F] dark:text-white uppercase focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#25343F] dark:bg-slate-700 hover:bg-black text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              OK
            </button>
          </form>
        </div>
      </div>

      {/* ── 3. GAYA KARTU HERO (7 PRESETS) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white">3. Gaya Kartu Hero</h3>

          {/* Toggle: Same in both modes */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-[#EAEFEF]/60 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-[#BFC9D1]/25 dark:border-slate-700">
            <input
              type="checkbox"
              checked={theme.heroCard.sameInBothModes}
              onChange={e =>
                updateTheme(prev => ({
                  ...prev,
                  heroCard: { ...prev.heroCard, sameInBothModes: e.target.checked },
                }))
              }
              className="rounded text-[#FF6A00] focus:ring-[#FF6A00] w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-[#25343F] dark:text-slate-300">Warna sama di mode siang & malam</span>
          </label>
        </div>

        {/* 7 Hero Presets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {HERO_PRESETS.map(preset => {
            const isSelected = (theme.heroCard.presetId || 'orange') === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleHeroPresetChange(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 group relative overflow-hidden ${
                  isSelected
                    ? 'border-[#25343F] dark:border-white ring-2 ring-[#FF6A00] shadow-sm bg-slate-50 dark:bg-slate-800'
                    : 'border-[#BFC9D1]/30 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#FF6A00]/50'
                }`}
              >
                {/* Mini Visual Gradient Tile */}
                <div
                  className="h-12 rounded-lg relative overflow-hidden p-1.5 flex items-center justify-between border"
                  style={{
                    background: `radial-gradient(circle at 18% 22%, ${preset.glow} 0%, transparent 50%), ${preset.gradient}`,
                    borderColor: preset.border,
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none opacity-80"
                    style={{
                      backgroundImage: `radial-gradient(${preset.pattern} 1px, transparent 1px)`,
                      backgroundSize: '14px 14px',
                    }}
                  />
                  <span
                    className="relative z-10 text-[8px] font-black px-1 py-0.2 rounded bg-black/40 backdrop-blur-xs leading-none"
                    style={{ color: preset.accent }}
                  >
                    ●
                  </span>
                  {isSelected && (
                    <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-white text-[#25343F] flex items-center justify-center shadow-xs">
                      <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="font-bold text-[11px] text-[#25343F] dark:text-white truncate">
                  {preset.label.replace(/^\d+\.\s*/, '')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. PRESET TEMA SIAP PAKAI ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
        <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white">4. Paket Tema Siap Pakai</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {THEME_PRESETS.map(p => {
            const isPresetActive = theme.presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isPresetActive
                    ? 'border-[#25343F] dark:border-white bg-[#EAEFEF] dark:bg-slate-800 ring-2 ring-[#25343F] dark:ring-white shadow-xs'
                    : 'border-[#BFC9D1]/25 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: p.accentColor }}
                    />
                    <span className="font-bold text-xs text-[#25343F] dark:text-white truncate">{p.name}</span>
                  </div>
                  {isPresetActive && (
                    <span className="text-[9px] font-black text-white bg-[#25343F] dark:bg-slate-600 px-1.5 py-0.2 rounded-full">
                      ✓
                    </span>
                  )}
                </div>
                <div
                  className="h-1.5 rounded-full w-full opacity-80"
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
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-[#BFC9D1]/30 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-[#25343F]">Reset Tampilan ke Default?</h3>
              <p className="text-xs text-[#898989] leading-relaxed">
                Semua preferensi warna aksen, mode tampilan, dan gradasi hero card akan dikembalikan ke setelan awal aplikasi.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#BFC9D1]/30 font-bold text-xs text-[#25343F] hover:bg-slate-50 transition-colors cursor-pointer"
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
