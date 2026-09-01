import { ThemeSettings, ThemeMode, ThemePreset } from '../types';

export const THEME_STORAGE_KEY = 'sukunaru_theme_settings';

export const ACCENT_PRESETS = [
  { label: 'Sukunaru Orange', hex: '#FF9B51' },
  { label: 'Royal Blue', hex: '#0890FE' },
  { label: 'Emerald Green', hex: '#10B981' },
  { label: 'Royal Purple', hex: '#8B5CF6' },
  { label: 'Vivid Amber', hex: '#FB6B18' },
  { label: 'Rose Crimson', hex: '#FF4267' },
  { label: 'Teal Cyan', hex: '#0D9488' },
  { label: 'Slate Navy', hex: '#25343F' },
];

export interface HeroPresetItem {
  id: string;
  label: string;
  primary: string;
  gradient: string;
  glow: string;
  pattern: string;
  border: string;
  accent: string;
  shadow: string;
  lightStart: string;
  lightEnd: string;
  darkStart: string;
  darkEnd: string;
}

export const HERO_PRESETS: HeroPresetItem[] = [
  {
    id: 'orange',
    label: '1. Orange — Default SKNR',
    primary: '#FF6A00',
    gradient: 'linear-gradient(135deg, #FF8A1F 0%, #FF5A0A 50%, #D93600 100%)',
    glow: '#FFD166',
    pattern: 'rgba(255,255,255,0.14)',
    border: 'rgba(255,255,255,0.30)',
    accent: '#B7FF4A',
    shadow: 'rgba(255, 90, 10, 0.38)',
    lightStart: '#FF8A1F',
    lightEnd: '#D93600',
    darkStart: '#FF5A0A',
    darkEnd: '#7C1A00',
  },
  {
    id: 'green',
    label: '2. Green / Emerald',
    primary: '#22C55E',
    gradient: 'linear-gradient(135deg, #22C55E 0%, #129447 50%, #087F5B 100%)',
    glow: '#86EFAC',
    pattern: 'rgba(255,255,255,0.13)',
    border: 'rgba(255,255,255,0.28)',
    accent: '#D9F99D',
    shadow: 'rgba(18, 148, 71, 0.38)',
    lightStart: '#22C55E',
    lightEnd: '#087F5B',
    darkStart: '#129447',
    darkEnd: '#044330',
  },
  {
    id: 'blue',
    label: '3. Blue — Professional',
    primary: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
    glow: '#93C5FD',
    pattern: 'rgba(255,255,255,0.13)',
    border: 'rgba(255,255,255,0.28)',
    accent: '#A7F3D0',
    shadow: 'rgba(37, 99, 235, 0.38)',
    lightStart: '#3B82F6',
    lightEnd: '#1D4ED8',
    darkStart: '#2563EB',
    darkEnd: '#0F2B7A',
  },
  {
    id: 'purple',
    label: '4. Purple — Premium',
    primary: '#A855F7',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 50%, #5B21B6 100%)',
    glow: '#D8B4FE',
    pattern: 'rgba(255,255,255,0.13)',
    border: 'rgba(255,255,255,0.28)',
    accent: '#D9F99D',
    shadow: 'rgba(124, 58, 237, 0.38)',
    lightStart: '#A855F7',
    lightEnd: '#5B21B6',
    darkStart: '#7C3AED',
    darkEnd: '#2E1065',
  },
  {
    id: 'rose',
    label: '5. Red / Rose — Elegant',
    primary: '#FB7185',
    gradient: 'linear-gradient(135deg, #FB7185 0%, #E11D48 50%, #BE123C 100%)',
    glow: '#FDA4AF',
    pattern: 'rgba(255,255,255,0.13)',
    border: 'rgba(255,255,255,0.28)',
    accent: '#D9F99D',
    shadow: 'rgba(225, 29, 72, 0.38)',
    lightStart: '#FB7185',
    lightEnd: '#BE123C',
    darkStart: '#E11D48',
    darkEnd: '#4C0519',
  },
  {
    id: 'cyan',
    label: '6. Cyan — Modern Clean',
    primary: '#22D3EE',
    gradient: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 50%, #0E7490 100%)',
    glow: '#A5F3FC',
    pattern: 'rgba(255,255,255,0.13)',
    border: 'rgba(255,255,255,0.28)',
    accent: '#ECFCCB',
    shadow: 'rgba(8, 145, 178, 0.38)',
    lightStart: '#22D3EE',
    lightEnd: '#0E7490',
    darkStart: '#0891B2',
    darkEnd: '#083344',
  },
  {
    id: 'dark-carbon',
    label: '7. Dark / Midnight',
    primary: '#334155',
    gradient: 'linear-gradient(135deg, #334155 0%, #1E293B 50%, #0F172A 100%)',
    glow: '#64748B',
    pattern: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.16)',
    accent: '#A3E635',
    shadow: 'rgba(15, 23, 42, 0.50)',
    lightStart: '#334155',
    lightEnd: '#0F172A',
    darkStart: '#1E293B',
    darkEnd: '#020617',
  },
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default Sukunaru',
    description: 'Vibrant orange, warm & premium khas studio percetakan',
    accentColor: '#FF6A00',
    mode: 'system',
    heroLightStart: '#FF8A1F',
    heroLightEnd: '#D93600',
    heroDarkStart: '#FF5A0A',
    heroDarkEnd: '#7C1A00',
    heroGradient: 'linear-gradient(135deg, #FF8A1F 0%, #FF5A0A 50%, #D93600 100%)',
    heroGlow: '#FFD166',
    heroPattern: 'rgba(255,255,255,0.14)',
    heroBorder: 'rgba(255,255,255,0.30)',
    heroAccent: '#B7FF4A',
    heroShadow: 'rgba(255, 90, 10, 0.38)',
  },
  {
    id: 'green',
    name: 'Emerald Fresh',
    description: 'Fresh, trustworthy & elegant untuk operasional harian',
    accentColor: '#22C55E',
    mode: 'system',
    heroLightStart: '#22C55E',
    heroLightEnd: '#087F5B',
    heroDarkStart: '#129447',
    heroDarkEnd: '#044330',
    heroGradient: 'linear-gradient(135deg, #22C55E 0%, #129447 50%, #087F5B 100%)',
    heroGlow: '#86EFAC',
    heroPattern: 'rgba(255,255,255,0.13)',
    heroBorder: 'rgba(255,255,255,0.28)',
    heroAccent: '#D9F99D',
    heroShadow: 'rgba(18, 148, 71, 0.38)',
  },
  {
    id: 'blue',
    name: 'Oceanic Blue',
    description: 'Tema biru berkelas profesional dan technological',
    accentColor: '#3B82F6',
    mode: 'system',
    heroLightStart: '#3B82F6',
    heroLightEnd: '#1D4ED8',
    heroDarkStart: '#2563EB',
    heroDarkEnd: '#0F2B7A',
    heroGradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
    heroGlow: '#93C5FD',
    heroPattern: 'rgba(255,255,255,0.13)',
    heroBorder: 'rgba(255,255,255,0.28)',
    heroAccent: '#A7F3D0',
    heroShadow: 'rgba(37, 99, 235, 0.38)',
  },
  {
    id: 'purple',
    name: 'Sunset Purple',
    description: 'Nuansa ungu elegan dan berkelas premium',
    accentColor: '#A855F7',
    mode: 'system',
    heroLightStart: '#A855F7',
    heroLightEnd: '#5B21B6',
    heroDarkStart: '#7C3AED',
    heroDarkEnd: '#2E1065',
    heroGradient: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 50%, #5B21B6 100%)',
    heroGlow: '#D8B4FE',
    heroPattern: 'rgba(255,255,255,0.13)',
    heroBorder: 'rgba(255,255,255,0.28)',
    heroAccent: '#D9F99D',
    heroShadow: 'rgba(124, 58, 237, 0.38)',
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    description: 'Aksen rose lembut yang elegan, tidak norak',
    accentColor: '#FB7185',
    mode: 'system',
    heroLightStart: '#FB7185',
    heroLightEnd: '#BE123C',
    heroDarkStart: '#E11D48',
    heroDarkEnd: '#4C0519',
    heroGradient: 'linear-gradient(135deg, #FB7185 0%, #E11D48 50%, #BE123C 100%)',
    heroGlow: '#FDA4AF',
    heroPattern: 'rgba(255,255,255,0.13)',
    heroBorder: 'rgba(255,255,255,0.28)',
    heroAccent: '#D9F99D',
    heroShadow: 'rgba(225, 29, 72, 0.38)',
  },
  {
    id: 'cyan',
    name: 'Cyan Clean Tech',
    description: 'Aksen cyan cerah, modern dan futuristik',
    accentColor: '#22D3EE',
    mode: 'system',
    heroLightStart: '#22D3EE',
    heroLightEnd: '#0E7490',
    heroDarkStart: '#0891B2',
    heroDarkEnd: '#083344',
    heroGradient: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 50%, #0E7490 100%)',
    heroGlow: '#A5F3FC',
    heroPattern: 'rgba(255,255,255,0.13)',
    heroBorder: 'rgba(255,255,255,0.28)',
    heroAccent: '#ECFCCB',
    heroShadow: 'rgba(8, 145, 178, 0.38)',
  },
  {
    id: 'monochrome',
    name: 'Midnight Dark',
    description: 'Tema gelap arang canggih dan sophisticated',
    accentColor: '#64748B',
    mode: 'system',
    heroLightStart: '#334155',
    heroLightEnd: '#0F172A',
    heroDarkStart: '#1E293B',
    heroDarkEnd: '#020617',
    heroGradient: 'linear-gradient(135deg, #334155 0%, #1E293B 50%, #0F172A 100%)',
    heroGlow: '#64748B',
    heroPattern: 'rgba(255,255,255,0.08)',
    heroBorder: 'rgba(255,255,255,0.16)',
    heroAccent: '#A3E635',
    heroShadow: 'rgba(15, 23, 42, 0.50)',
  },
];

export const DEFAULT_THEME: ThemeSettings = {
  mode: 'system',
  accentColor: '#FF6A00',
  heroCard: {
    mode: 'auto',
    presetId: 'orange',
    lightStart: '#FF8A1F',
    lightEnd: '#D93600',
    darkStart: '#FF5A0A',
    darkEnd: '#7C1A00',
    sameInBothModes: false,
    gradient: 'linear-gradient(135deg, #FF8A1F 0%, #FF5A0A 50%, #D93600 100%)',
    glow: '#FFD166',
    pattern: 'rgba(255,255,255,0.14)',
    border: 'rgba(255,255,255,0.30)',
    accent: '#B7FF4A',
    shadow: 'rgba(255, 90, 10, 0.38)',
  },
  presetId: 'default',
};

// ── Color Math Helpers ──────────────────────────────────────────
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) {
    return { r: 255, g: 106, b: 0 }; // fallback default
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

export function getContrastTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // YIQ luminance formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#25343F' : '#FFFFFF';
}

export function getEffectiveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return mode;
}

// ── Apply Theme Tokens ──────────────────────────────────────────
export function applyTheme(settings: ThemeSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const effectiveMode = getEffectiveMode(settings.mode);
  const isDark = effectiveMode === 'dark';

  // 1. Toggle dark class on <html>
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // 2. Compute Accent Color Tokens
  const accent = settings.accentColor || '#FF6A00';
  const rgb = hexToRgb(accent);
  const accentHover = adjustBrightness(accent, isDark ? 12 : -12);
  const accentActive = adjustBrightness(accent, isDark ? 20 : -20);
  const accentSoft = hexToRgba(accent, isDark ? 0.22 : 0.12);
  const accentContrast = getContrastTextColor(accent);

  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty('--color-accent-hover', accentHover);
  root.style.setProperty('--color-accent-active', accentActive);
  root.style.setProperty('--color-accent-soft', accentSoft);
  root.style.setProperty('--color-accent-contrast', accentContrast);

  // Also bridge into Tailwind official palette variable
  root.style.setProperty('--color-sknr-orange', accent);
  root.style.setProperty('--color-primary-500', accent);

  // 3. Compute Hero Card Design Tokens (Gradient + Glow + Pattern + Border + Accent)
  const heroPreset =
    HERO_PRESETS.find(p => p.id === settings.heroCard.presetId) ||
    HERO_PRESETS.find(p => p.id === settings.presetId) ||
    HERO_PRESETS.find(p => p.lightStart === settings.heroCard.lightStart) ||
    HERO_PRESETS[0];

  const gradient = settings.heroCard.gradient || heroPreset.gradient;
  const glow = settings.heroCard.glow || heroPreset.glow;
  const pattern = settings.heroCard.pattern || heroPreset.pattern;
  const border = settings.heroCard.border || heroPreset.border;
  const heroAccent = settings.heroCard.accent || heroPreset.accent;
  const shadow = settings.heroCard.shadow || heroPreset.shadow;

  let heroStart = settings.heroCard.lightStart || heroPreset.lightStart;
  let heroEnd = settings.heroCard.lightEnd || heroPreset.lightEnd;

  if (!settings.heroCard.sameInBothModes && isDark) {
    heroStart = settings.heroCard.darkStart || heroPreset.darkStart;
    heroEnd = settings.heroCard.darkEnd || heroPreset.darkEnd;
  }

  root.style.setProperty('--hero-gradient', gradient);
  root.style.setProperty('--hero-glow', glow);
  root.style.setProperty('--hero-pattern', pattern);
  root.style.setProperty('--hero-border', border);
  root.style.setProperty('--hero-accent', heroAccent);
  root.style.setProperty('--hero-shadow', shadow);
  root.style.setProperty('--hero-start', heroStart);
  root.style.setProperty('--hero-end', heroEnd);
  root.style.setProperty('--hero-text', '#FFFFFF');
}

// ── Persistence ─────────────────────────────────────────────────
export function getThemeSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_THEME,
        ...parsed,
        heroCard: {
          ...DEFAULT_THEME.heroCard,
          ...(parsed.heroCard || {}),
        },
      };
    }
  } catch (e) {
    console.warn('Failed to load theme from storage:', e);
  }
  return { ...DEFAULT_THEME };
}

export function saveThemeSettings(settings: ThemeSettings): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
    applyTheme(settings);
  } catch (e) {
    console.warn('Failed to save theme to storage:', e);
  }
}

export function resetThemeSettings(): ThemeSettings {
  const def = { ...DEFAULT_THEME };
  saveThemeSettings(def);
  return def;
}

// ── System Media Query Listener ─────────────────────────────────
let mediaListenerAttached = false;

export function initThemeSystem(onSystemChange?: (mode: 'light' | 'dark') => void): () => void {
  const current = getThemeSettings();
  applyTheme(current);

  if (typeof window !== 'undefined' && window.matchMedia && !mediaListenerAttached) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const settings = getThemeSettings();
      if (settings.mode === 'system') {
        applyTheme(settings);
        if (onSystemChange) {
          onSystemChange(mq.matches ? 'dark' : 'light');
        }
      }
    };

    mq.addEventListener('change', handler);
    mediaListenerAttached = true;

    return () => {
      mq.removeEventListener('change', handler);
      mediaListenerAttached = false;
    };
  }

  return () => {};
}
