/**
 * authService.ts — BisnisUrang Supabase Auth Service
 */

import { SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, verifyLicenseInCloud } from './supabaseClient';
import { resolvePlan } from '../hooks/useLicense';
import { localDb } from './localDb';

function getAuthClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client belum terkonfigurasi.');
  }
  return client;
}

export function getAuthClientInstance(): SupabaseClient {
  return getAuthClient();
}

export async function getSession(): Promise<Session | null> {
  try {
    const { data } = await getAuthClient().auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

export function onAuthStateChange(
  callback: (user: User | null, session: Session | null, event?: string) => void
): () => void {
  const client = getAuthClient();
  const { data } = client.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null, session, event);
  });
  return () => {
    data.subscription.unsubscribe();
  };
}

export interface SignUpResult {
  success: boolean;
  user?: User;
  session?: Session;
  message: string;
}

export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<SignUpResult> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const { data, error } = await getAuthClient().auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          display_name: displayName?.trim() || email.split('@')[0],
        },
      },
    });

    if (error) {
      return { success: false, message: translateAuthError(error) };
    }

    // Reset local database to pristine state for new user so no previous session data leaks
    await localDb.resetToCleanNewUserState(trimmedEmail, displayName);
    try {
      sessionStorage.setItem('sukunaru_is_new_signup', 'true');
      sessionStorage.setItem('sukunaru_just_signed_in', 'true');
      sessionStorage.setItem('sukunaru_signup_success_banner', 'true');
      localStorage.setItem('sukunaru_new_signup_welcome', 'true');
      localStorage.removeItem('sukunaru_last_acknowledged_plan');
    } catch {}

    return {
      success: true,
      user: data.user ?? undefined,
      session: data.session ?? undefined,
      message: 'Akun berhasil dibuat! Selamat datang di BisnisUrang.',
    };
  } catch (err: any) {
    return { success: false, message: translateAuthError(err) };
  }
}

export interface SignInResult {
  success: boolean;
  user?: User;
  session?: Session;
  message: string;
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  try {
    const { data, error } = await getAuthClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { success: false, message: translateAuthError(error) };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      message: 'Berhasil masuk!',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Terjadi kesalahan saat masuk.' };
  }
}

export async function signOut(): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await getAuthClient().auth.signOut();
    if (error) {
      return { success: false, message: translateAuthError(error) };
    }
    return { success: true, message: 'Berhasil keluar.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Terjadi kesalahan saat keluar.' };
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await getAuthClient().auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: window.location.origin,
      }
    );

    if (error) {
      return { success: false, message: translateAuthError(error) };
    }

    return {
      success: true,
      message: `Link reset password dikirim ke ${email}. Cek inbox atau folder spam Anda.`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengirim email reset.' };
  }
}

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem('sukunaru_device_id');
    if (!id) {
      const randHex = Array.from({ length: 4 }, () =>
        Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1)
          .toUpperCase()
      ).join('-');
      id = `DEV-${randHex}`;
      localStorage.setItem('sukunaru_device_id', id);
    }
    return id;
  } catch {
    return 'DEV-88A2-99F1-44B0';
  }
}

const SESSION_LOCK_KEY = 'sukunaru_session_locked';

export function isSessionLocked(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SESSION_LOCK_KEY) === 'true';
}

export function lockBusinessSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_LOCK_KEY, 'true');
  try {
    const rawLic = localStorage.getItem('sukunaru_license_info');
    if (rawLic) {
      localStorage.setItem('sukunaru_license_info_cached', rawLic);
      localStorage.removeItem('sukunaru_license_info');
    }
  } catch {}
}

export function unlockBusinessSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_LOCK_KEY);
}

export async function restoreUserLicenseSession(user: User): Promise<{
  found: boolean;
  valid: boolean;
  licenseKey?: string;
  message?: string;
  isTrial?: boolean;
  plan?: string;
}> {
  try {
    const client = getAuthClient();
    const deviceId = getOrCreateDeviceId();
    const displayName =
      user.user_metadata?.display_name || user.email?.split('@')[0] || 'Owner';

    // 1. Query licenses linked to this user_id
    let { data: licList, error: licErr } = await client
      .from('licenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    // 2. If no license found → auto-provision for new user (idempotent)
    if (licErr || !licList || licList.length === 0) {
      console.log('[Auth] No license found for user — auto-provisioning...');
      try {
        const { data: provisionResult, error: provisionErr } = await client.rpc(
          'provision_new_user',
          { p_user_id: user.id, p_display_name: displayName }
        );
        if (provisionErr) {
          console.warn('[Auth] Provision RPC error:', provisionErr);
          return { found: false, valid: false, message: provisionErr.message };
        }

        const provLicKey: string = provisionResult?.license_key;
        const provPlan: string = provisionResult?.plan || 'TRIAL';
        const provTrialExpires: string | null = provisionResult?.trial_expires_at || null;
        const now = new Date();

        const licenseData = {
          isActivated: true,
          licenseKey: provLicKey,
          licenseType: provPlan === 'PRO' ? 'PRO_LIFETIME' : 'TRIAL_14_DAYS',
          plan: provPlan,
          activatedAt: now.toISOString(),
          activatedAtLabel: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          trialExpiresAt: provTrialExpires,
          expiresAt: provTrialExpires,
          durationDays: provPlan === 'TRIAL' ? 14 : null,
          registeredTo: displayName,
          deviceId,
        };

        localStorage.setItem('sukunaru_license_info', JSON.stringify(licenseData));
        localStorage.setItem('sukunaru_onboarding_completed', 'true');
        unlockBusinessSession();

        // Ensure newly provisioned account starts with completely clean database
        await localDb.resetToCleanNewUserState(user.email, displayName);

        return {
          found: true,
          valid: true,
          licenseKey: provLicKey,
          message: `Akun baru terdeteksi — Trial 14 hari dimulai!`,
          isTrial: provPlan === 'TRIAL',
          plan: provPlan,
        };
      } catch (provErr: any) {
        console.warn('[Auth] Provision error:', provErr);
        return { found: false, valid: false, message: provErr.message };
      }
    }

    const linkedLic = licList[0];
    const licKey = linkedLic.license_key;

    // 3. Verify with cloud validation & register current device
    const verifyRes = await verifyLicenseInCloud(licKey, deviceId, displayName);
    if (!verifyRes.valid) {
      return {
        found: true,
        valid: false,
        licenseKey: licKey,
        message: verifyRes.message,
      };
    }

    const cloudLic = verifyRes.license || linkedLic;

    const trialExpiresAt = cloudLic.trial_expires_at || cloudLic.expires_at || null;
    const now = new Date();
    const nowStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const candidateInfo = {
      isActivated: true,
      licenseKey: licKey,
      plan: cloudLic.plan,
      tier: cloudLic.tier,
      licenseType: cloudLic.tier || cloudLic.plan,
      activatedAt: cloudLic.activated_at || now.toISOString(),
      activatedAtLabel: nowStr,
      trialExpiresAt,
      expiresAt: trialExpiresAt,
      durationDays: cloudLic.duration_days,
      registeredTo: displayName,
      deviceId,
    };

    const resolved = resolvePlan(candidateInfo);

    const licenseData = {
      ...candidateInfo,
      plan: resolved.plan,
      licenseType: resolved.plan === 'PRO' ? 'PRO_LIFETIME' : (resolved.plan === 'TRIAL' ? 'TRIAL_14_DAYS' : 'FREE'),
      durationDays: resolved.plan === 'PRO' ? null : (cloudLic.duration_days ?? 14),
    };

    localStorage.setItem('sukunaru_license_info', JSON.stringify(licenseData));
    localStorage.setItem('sukunaru_onboarding_completed', 'true');
    unlockBusinessSession();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sukunaru:license_updated', { detail: licenseData }));
    }

    return {
      found: true,
      valid: true,
      licenseKey: licKey,
      message: verifyRes.message,
      isTrial,
      plan: resolvedPlan,
    };
  } catch (err: any) {
    console.warn('[Restore User License Error]:', err);
    return { found: false, valid: false, message: err.message };
  }
}


export async function claimLicenseForUser(
  licenseKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const client = getAuthClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      return { success: false, message: 'Anda belum login.' };
    }

    const cleanKey = licenseKey.trim().toUpperCase();

    const { data: licData, error: licErr } = await client
      .from('licenses')
      .select('license_key, user_id, status')
      .eq('license_key', cleanKey)
      .single();

    if (licErr || !licData) {
      return { success: false, message: 'License key tidak ditemukan.' };
    }

    const userId = sessionData.session.user.id;

    if (licData.user_id && licData.user_id !== userId) {
      return {
        success: false,
        message: 'License key ini sudah terdaftar ke akun lain.',
      };
    }

    if (licData.user_id === userId) {
      return { success: true, message: 'License sudah terhubung ke akun Anda.' };
    }

    const { error: updateError } = await client
      .from('licenses')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq('license_key', cleanKey);

    if (updateError) {
      return { success: false, message: `Gagal menghubungkan lisensi: ${updateError.message}` };
    }

    return { success: true, message: 'Lisensi berhasil dihubungkan ke akun Anda.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal klaim lisensi.' };
  }
}

export async function getUserLicenseKey(): Promise<string | null> {
  try {
    const client = getAuthClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) return null;

    const { data } = await client
      .from('licenses')
      .select('license_key')
      .eq('user_id', sessionData.session.user.id)
      .eq('status', 'ACTIVE')
      .limit(1)
      .single();

    return data?.license_key ?? null;
  } catch {
    return null;
  }
}

export function translateAuthError(error: AuthError | Error): string {
  const msg = error.message?.toLowerCase() || '';

  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid_credentials') ||
    msg.includes('invalid password') ||
    msg.includes('wrong password')
  ) {
    return 'Email atau password belum sesuai.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Cek inbox email Anda.';
  }
  if (msg.includes('user not found') || msg.includes('no user')) {
    return 'Email belum terdaftar.';
  }
  if (
    msg.includes('user already registered') ||
    msg.includes('already registered') ||
    msg.includes('already exists') ||
    msg.includes('identity already exists')
  ) {
    return 'Email ini sudah terdaftar. Silakan masuk.';
  }
  if (
    msg.includes('password should be at least') ||
    msg.includes('weak password') ||
    msg.includes('password is too short')
  ) {
    return 'Password minimal 6 karakter.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('over_email_send_rate_limit')) {
    return 'Terlalu banyak percobaan. Tunggu beberapa saat.';
  }
  if (
    msg.includes('invalid email') ||
    msg.includes('unable to validate email') ||
    msg.includes('email_address_invalid')
  ) {
    return 'Format email belum sesuai.';
  }
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('failed to fetch') ||
    msg.includes('koneksi') ||
    msg.includes('offline') ||
    msg.includes('timeout')
  ) {
    return 'Koneksi bermasalah. Periksa internet dan coba lagi.';
  }

  return error.message || 'Terjadi kendala. Silakan coba lagi.';
}
