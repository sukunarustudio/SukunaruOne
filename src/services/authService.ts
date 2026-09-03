/**
 * authService.ts — BisnisUrang Supabase Auth Service
 */

import { SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';

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
  callback: (user: User | null, session: Session | null) => void
): () => void {
  const client = getAuthClient();
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session);
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
  requiresEmailConfirmation?: boolean;
}

export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<SignUpResult> {
  try {
    const { data, error } = await getAuthClient().auth.signUp({
      email: email.trim().toLowerCase(),
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

    if (data.user && !data.session) {
      return {
        success: true,
        user: data.user,
        message: 'Pendaftaran berhasil! Cek email Anda untuk konfirmasi.',
        requiresEmailConfirmation: true,
      };
    }

    return {
      success: true,
      user: data.user ?? undefined,
      session: data.session ?? undefined,
      message: 'Akun berhasil dibuat! Selamat datang di BisnisUrang.',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Terjadi kesalahan saat mendaftar.' };
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

function translateAuthError(error: AuthError | Error): string {
  const msg = error.message?.toLowerCase() || '';

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Email atau password salah. Periksa kembali dan coba lagi.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Cek inbox email Anda dan klik link konfirmasi.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
  }
  if (msg.includes('password should be at least')) {
    return 'Password terlalu pendek. Minimal 6 karakter.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Terlalu banyak percobaan. Tunggu beberapa saat dan coba lagi.';
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return 'Format email tidak valid.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    return 'Koneksi gagal. Periksa koneksi internet Anda.';
  }

  return error.message || 'Terjadi kesalahan. Silakan coba lagi.';
}
