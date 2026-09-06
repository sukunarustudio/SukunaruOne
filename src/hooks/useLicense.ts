import { useState, useEffect, useCallback } from 'react';

export interface LicenseInfo {
  isActivated: boolean;
  licenseKey?: string;
  licenseType?: string;    // legacy: 'TRIAL_14_DAYS' | 'PRO_LIFETIME' | 'TRIAL' | 'FREE' | 'PRO'
  plan?: string;           // 'TRIAL' | 'FREE' | 'PRO' | 'pro upgrade' | etc.
  tier?: string;           // 'TRIAL_14_DAYS' | 'PRO_LIFETIME' | etc.
  activatedAt?: string;
  activatedAtLabel?: string;
  expiresAt?: string | null;
  trialExpiresAt?: string | null; // from Supabase
  durationDays?: number | null;
  registeredTo?: string;
  deviceId?: string;
}

export type PlanType = 'TRIAL' | 'FREE' | 'PRO';

export interface LicenseState {
  isActivated: boolean;
  isTrial: boolean;
  isFree: boolean;          // trial expired → downgraded to FREE
  isTrialExpired: boolean;
  isPro: boolean;
  plan: PlanType | null;
  daysRemaining: number | null;
  licenseKey: string | null;
  licenseType: string | null;
  registeredTo: string | null;
  raw: LicenseInfo | null;
}

export const LICENSE_UPDATED_EVENT = 'sukunaru:license_updated';

export function emitLicenseUpdated(info?: LicenseInfo): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LICENSE_UPDATED_EVENT, { detail: info }));
}

/**
 * Resolve plan from raw license info.
 * Robustly checks both `plan` and `tier`/`licenseType` for keywords like 'PRO', 'LIFETIME'.
 */
export function resolvePlan(raw: LicenseInfo | null | any): {
  plan: PlanType;
  isTrial: boolean;
  isPro: boolean;
  isFree: boolean;
  isTrialExpired: boolean;
  daysRemaining: number | null;
} {
  if (!raw || !raw.isActivated) {
    return {
      plan: 'FREE',
      isTrial: false,
      isPro: false,
      isFree: true,
      isTrialExpired: true,
      daysRemaining: null,
    };
  }

  const rawPlan = String(raw.plan || '').trim().toUpperCase();
  const rawTier = String(raw.tier || raw.licenseType || '').trim().toUpperCase();

  // 1. Determine target mode with clear priority (Plan takes precedence over Tier)
  let targetMode: 'PRO' | 'TRIAL' | 'FREE';

  if (rawPlan === 'FREE') {
    targetMode = 'FREE';
  } else if (rawPlan.includes('TRIAL')) {
    targetMode = 'TRIAL';
  } else if (rawPlan.includes('PRO') || rawPlan.includes('LIFETIME')) {
    targetMode = 'PRO';
  } else if (rawTier === 'FREE') {
    targetMode = 'FREE';
  } else if (rawTier.includes('TRIAL')) {
    targetMode = 'TRIAL';
  } else if (rawTier.includes('PRO') || rawTier.includes('LIFETIME')) {
    targetMode = 'PRO';
  } else {
    targetMode = 'TRIAL';
  }

  if (targetMode === 'PRO') {
    return {
      plan: 'PRO',
      isTrial: false,
      isPro: true,
      isFree: false,
      isTrialExpired: false,
      daysRemaining: null,
    };
  }

  if (targetMode === 'FREE') {
    return {
      plan: 'FREE',
      isTrial: false,
      isPro: false,
      isFree: true,
      isTrialExpired: true,
      daysRemaining: 0,
    };
  }

  // targetMode === 'TRIAL' -> calculate expiry accurately
  const expiryStr = raw.trialExpiresAt || raw.expiresAt;
  let isTrialExpired = false;
  let daysRemaining: number | null = null;
  let effectivePlan: PlanType = 'TRIAL';

  if (expiryStr) {
    const now = new Date();
    const expiresAt = new Date(expiryStr);
    if (!isNaN(expiresAt.getTime())) {
      const diffMs = expiresAt.getTime() - now.getTime();
      if (diffMs <= 0) {
        isTrialExpired = true;
        daysRemaining = 0;
        effectivePlan = 'FREE';
      } else {
        daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }
    }
  } else if (raw.durationDays !== undefined && raw.durationDays !== null && raw.durationDays > 0 && raw.activatedAt) {
    const actDate = new Date(raw.activatedAt);
    if (!isNaN(actDate.getTime())) {
      const expDate = new Date(actDate.getTime() + raw.durationDays * 24 * 60 * 60 * 1000);
      const diffMs = expDate.getTime() - Date.now();
      if (diffMs <= 0) {
        isTrialExpired = true;
        daysRemaining = 0;
        effectivePlan = 'FREE';
      } else {
        daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }
    }
  } else if (raw.durationDays === 0) {
    // duration 0 without future expiry = trial expired
    isTrialExpired = true;
    daysRemaining = 0;
    effectivePlan = 'FREE';
  } else {
    // Default fallback
    daysRemaining = 14;
  }

  const isFree = effectivePlan === 'FREE';
  const isTrial = effectivePlan === 'TRIAL' && !isTrialExpired;
  const isPro = isTrial; // unexpired trial gets pro features

  return {
    plan: effectivePlan,
    isTrial,
    isPro,
    isFree,
    isTrialExpired,
    daysRemaining,
  };
}

export function getLicenseState(): LicenseState {
  let raw: LicenseInfo | null = null;
  try {
    const stored = localStorage.getItem('sukunaru_license_info');
    if (stored) {
      raw = JSON.parse(stored) as LicenseInfo;
    }
  } catch {
    raw = null;
  }

  if (!raw || !raw.isActivated) {
    return {
      isActivated: false,
      isTrial: false,
      isFree: false,
      isTrialExpired: false,
      isPro: false,
      plan: null,
      daysRemaining: null,
      licenseKey: null,
      licenseType: null,
      registeredTo: null,
      raw: null,
    };
  }

  const { plan, isTrial, isPro, isFree, isTrialExpired, daysRemaining } = resolvePlan(raw);

  return {
    isActivated: raw.isActivated,
    isTrial,
    isFree,
    isTrialExpired,
    isPro,
    plan,
    daysRemaining,
    licenseKey: raw.licenseKey ?? null,
    licenseType: raw.licenseType ?? raw.tier ?? null,
    registeredTo: raw.registeredTo ?? null,
    raw,
  };
}

export function useLicense(): LicenseState {
  const [state, setState] = useState<LicenseState>(getLicenseState);

  const refresh = useCallback(() => {
    setState(getLicenseState());
  }, []);

  useEffect(() => {
    // Refresh immediately on mount
    refresh();

    const handleCustomEvent = () => refresh();
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'sukunaru_license_info') {
        refresh();
      }
    };
    const handleFocus = () => refresh();

    window.addEventListener(LICENSE_UPDATED_EVENT, handleCustomEvent);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener(LICENSE_UPDATED_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refresh]);

  return state;
}


