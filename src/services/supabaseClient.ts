import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'sukunaru_supabase_url';
const STORAGE_KEY_KEY = 'sukunaru_supabase_key';

let cachedClient: SupabaseClient | null = null;
let currentConfig = {
  url: '',
  key: '',
};

export interface SupabaseConfig {
  url: string;
  key: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window === 'undefined') {
    return { url: '', key: '' };
  }

  const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
  const savedKey = localStorage.getItem(STORAGE_KEY_KEY);

  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

  return {
    url: (savedUrl || envUrl || '').trim(),
    key: (savedKey || envKey || '').trim(),
  };
}

export function setSupabaseConfig(config: SupabaseConfig): void {
  if (typeof window === 'undefined') return;

  if (config.url && config.url.trim()) {
    localStorage.setItem(STORAGE_KEY_URL, config.url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
  }

  if (config.key && config.key.trim()) {
    localStorage.setItem(STORAGE_KEY_KEY, config.key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_KEY);
  }

  // Invalidate cached client to force re-instantiation
  cachedClient = null;
  currentConfig = { url: '', key: '' };
}

export function isSupabaseConfigured(): boolean {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.key);
}

const schemaClients = new Map<string, SupabaseClient<any, any, any>>();

export function getSupabaseClientForSchema(schemaName?: string): SupabaseClient<any, any, any> | null {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.key) {
    return null;
  }

  const targetSchema = schemaName && schemaName.trim() ? schemaName.trim() : 'public';
  const cacheKey = `${cfg.url}:${targetSchema}`;

  if (schemaClients.has(cacheKey)) {
    return schemaClients.get(cacheKey)!;
  }

  try {
    const client = createClient<any, any, any>(cfg.url, cfg.key, {
      db: {
        schema: targetSchema,
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    schemaClients.set(cacheKey, client);
    return client;
  } catch (err) {
    console.error(`[Supabase Client Error for Schema ${targetSchema}]:`, err);
    return null;
  }
}

export function getSupabaseClient(): SupabaseClient<any, any, any> | null {
  return getSupabaseClientForSchema('public');
}

export async function testSupabaseConnection(customConfig?: SupabaseConfig): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const cfg = customConfig || getSupabaseConfig();

  if (!cfg.url || !cfg.key) {
    return {
      success: false,
      message: 'Supabase URL dan Anon Key belum diisi.',
    };
  }

  try {
    const testClient = createClient(cfg.url, cfg.key);
    // Attempt a light query on licenses or business_settings
    const { data, error } = await testClient
      .from('licenses')
      .select('license_key, status')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: true,
          message: 'Berhasil terhubung ke Supabase! (Catatan: Jalankan skrip SQL Multi-Tenant di menu SQL Editor Supabase untuk membuat tabel & lisensi).',
          details: error,
        };
      }
      return {
        success: false,
        message: `Gagal query Supabase: ${error.message} (Code: ${error.code})`,
        details: error,
      };
    }

    return {
      success: true,
      message: 'Berhasil terhubung 100% ke Cloud Supabase!',
      details: data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Koneksi gagal: ${err.message || 'Periksa URL dan Key Anda.'}`,
    };
  }
}

export async function verifyLicenseInCloud(
  key: string,
  deviceId: string,
  registeredName?: string
): Promise<{
  valid: boolean;
  message: string;
  license?: any;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { valid: false, message: 'Klien Supabase belum terhubung.' };
  }

  try {
    const cleanKey = key.trim().toUpperCase();
    const { data, error } = await client
      .from('licenses')
      .select('*')
      .eq('license_key', cleanKey)
      .single();

    if (error || !data) {
      return { valid: false, message: 'Kunci Lisensi tidak ditemukan di server Cloud Supabase.' };
    }

    if (data.status !== 'ACTIVE') {
      return { valid: false, message: `Lisensi tidak aktif (Status: ${data.status}). Hubungi customer support.` };
    }

    // Check expiration for trial or timed licenses
    const now = new Date();
    if (data.duration_days && data.activated_at) {
      const actDate = new Date(data.activated_at);
      const expDate = new Date(actDate.getTime() + data.duration_days * 24 * 60 * 60 * 1000);
      if (now > expDate) {
        return {
          valid: false,
          message: `Masa aktif lisensi (${data.duration_days} hari) telah berakhir pada ${expDate.toLocaleDateString('id-ID')}. Silakan upgrade ke Pro Lifetime.`,
        };
      }
    }

    // Check registered devices
    const devices: string[] = Array.isArray(data.registered_devices) ? data.registered_devices : [];
    const activatedAt = data.activated_at || now.toISOString();
    let expiresAt = data.expires_at;
    if (data.duration_days && !expiresAt) {
      expiresAt = new Date(new Date(activatedAt).getTime() + data.duration_days * 24 * 60 * 60 * 1000).toISOString();
    }

    if (!devices.includes(deviceId)) {
      if (devices.length >= (data.max_devices || 1)) {
        return {
          valid: false,
          message: `Lisensi telah mencapai batas maksimal (${data.max_devices || 1} perangkat).`,
        };
      }
      // Register this device
      devices.push(deviceId);
      await client
        .from('licenses')
        .update({
          registered_devices: devices,
          registered_name: registeredName || data.registered_name || 'Owner',
          activated_at: activatedAt,
          expires_at: expiresAt,
          updated_at: now.toISOString(),
        })
        .eq('license_key', cleanKey);
    }

    const isTrial = data.tier === 'TRIAL_14_DAYS' || Boolean(data.duration_days);

    return {
      valid: true,
      message: isTrial
        ? `Lisensi Trial 14 Hari (${data.max_devices || 1} Perangkat) berhasil diverifikasi!`
        : `Lisensi PRO Lifetime (${data.max_devices || 1} Perangkat) berhasil diverifikasi & terhubung ke Cloud!`,
      license: { ...data, activated_at: activatedAt, expires_at: expiresAt },
    };
  } catch (err: any) {
    return {
      valid: false,
      message: `Gagal verifikasi lisensi: ${err.message || 'Terjadi kesalahan jaringan'}`,
    };
  }
}

export async function releaseLicenseInCloud(
  key: string,
  deviceId: string
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Klien Supabase belum terhubung.' };
  }

  try {
    const cleanKey = key.trim().toUpperCase();
    const { data, error } = await client
      .from('licenses')
      .select('*')
      .eq('license_key', cleanKey)
      .single();

    if (error || !data) {
      return { success: false, message: 'Kunci lisensi tidak ditemukan di Cloud.' };
    }

    const currentDevices: string[] = Array.isArray(data.registered_devices) ? data.registered_devices : [];
    const updatedDevices = currentDevices.filter(d => d !== deviceId);

    const { error: updateError } = await client
      .from('licenses')
      .update({
        registered_devices: updatedDevices,
        updated_at: new Date().toISOString(),
      })
      .eq('license_key', cleanKey);

    if (updateError) {
      return { success: false, message: `Gagal melepaskan lisensi di Cloud: ${updateError.message}` };
    }

    return { success: true, message: 'Lisensi berhasil dilepaskan dari Cloud.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Terjadi kesalahan saat melepaskan lisensi.' };
  }
}

// ── Multi-Tenant File Storage Helper (Partitioned by License Key Folder) ────
export const TENANT_STORAGE_BUCKET = 'sukunaru-studio-files';

export async function uploadTenantFile(
  licenseKey: string,
  folder: 'logos' | 'products' | 'receipts' | 'attachments' | 'backups',
  file: File | Blob,
  fileName: string
): Promise<{ success: boolean; publicUrl?: string; storagePath?: string; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Klien Supabase belum terhubung.' };
  }

  try {
    const cleanLicense = licenseKey.trim().toUpperCase() || 'SKNR-DEFAULT-OFFLINE';
    // Path structured in folders per license key: e.g. "SKNR-S001-8DA2-T5C4/logos/logo_17251829.png"
    const ext = fileName.split('.').pop() || 'png';
    const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
    const storagePath = `${cleanLicense}/${folder}/${cleanName}`;

    const { data, error } = await client.storage
      .from(TENANT_STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('[Upload Tenant File Error]:', error);
      return { success: false, error: error.message };
    }

    const { data: publicData } = client.storage
      .from(TENANT_STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return {
      success: true,
      publicUrl: publicData.publicUrl,
      storagePath: data.path,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengunggah file ke Cloud Storage.' };
  }
}

export async function listTenantBackups(licenseKey: string): Promise<Array<{ name: string; size: number; createdAt: string; path: string }>> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const cleanLicense = licenseKey.trim().toUpperCase() || 'SKNR-DEFAULT-OFFLINE';
    const { data, error } = await client.storage
      .from(TENANT_STORAGE_BUCKET)
      .list(`${cleanLicense}/backups`, {
        sortBy: { column: 'created_at', order: 'desc' },
      });
    if (error || !data) return [];
    return data
      .filter(item => item.name.endsWith('.json'))
      .map(item => ({
        name: item.name,
        size: item.metadata?.size || 0,
        createdAt: item.created_at,
        path: `${cleanLicense}/backups/${item.name}`,
      }));
  } catch {
    return [];
  }
}

export async function deleteTenantFile(
  licenseKey: string,
  filePathOrUrl: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false };

  try {
    const cleanLicense = licenseKey.trim().toUpperCase();
    let relativePath = filePathOrUrl;
    if (filePathOrUrl.includes(TENANT_STORAGE_BUCKET)) {
      const parts = filePathOrUrl.split(`${TENANT_STORAGE_BUCKET}/`);
      if (parts[1]) relativePath = parts[1];
    }

    if (relativePath.startsWith(cleanLicense)) {
      await client.storage.from(TENANT_STORAGE_BUCKET).remove([relativePath]);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function downloadTenantBackup(path: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Klien Supabase belum terhubung.' };
  try {
    const { data, error } = await client.storage
      .from(TENANT_STORAGE_BUCKET)
      .download(path);
    if (error || !data) return { success: false, error: error?.message || 'Gagal mengunduh file backup.' };
    const text = await data.text();
    const parsed = JSON.parse(text);
    return { success: true, data: parsed };
  } catch (err: any) {
    return { success: false, error: err.message || 'File backup cloud rusak atau tidak valid.' };
  }
}
