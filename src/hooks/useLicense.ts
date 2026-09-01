/**
 * useLicense — reads license state from localStorage and returns
 * helper flags for Pro feature gating throughout the app.
 *
 * Key: sukunaru_license_info
 */

export interface LicenseInfo {
  isActivated: boolean;
  licenseKey?: string;
  licenseType?: string;
  activatedAt?: string;
  expiresAt?: string;
  durationDays?: number;
  registeredTo?: string;
  deviceId?: string;
}

export interface LicenseState {
  isActivated: boolean;
  isTrial: boolean;
  isTrialExpired: boolean;
  /** isPro = activated AND (not trial OR trial still valid) */
  isPro: boolean;
  daysRemaining: number | null;
  licenseType: string | null;
  registeredTo: string | null;
  raw: LicenseInfo | null;
}

export function useLicense(): LicenseState {
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
      isTrialExpired: false,
      isPro: false,
      daysRemaining: null,
      licenseType: null,
      registeredTo: null,
      raw: null,
    };
  }

  const isTrial = raw.licenseType === 'TRIAL_14_DAYS';

  let isTrialExpired = false;
  let daysRemaining: number | null = null;

  if (isTrial && raw.expiresAt) {
    const now = new Date();
    const expiresAt = new Date(raw.expiresAt);
    if (now > expiresAt) {
      isTrialExpired = true;
      daysRemaining = 0;
    } else {
      const diffMs = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }
  }

  const isPro = raw.isActivated && (!isTrial || !isTrialExpired);

  return {
    isActivated: raw.isActivated,
    isTrial,
    isTrialExpired,
    isPro,
    daysRemaining,
    licenseType: raw.licenseType ?? null,
    registeredTo: raw.registeredTo ?? null,
    raw,
  };
}
