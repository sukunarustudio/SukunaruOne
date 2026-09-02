import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface FileDownloadOptions {
  filename: string;
  data: string; // Base64 string, data URI, or raw text content
  mimeType: string;
  isBase64?: boolean;
  openSharePrompt?: boolean; // On Android: prompt native share/save sheet so user can easily save to Downloads or open
  dialogTitle?: string;
}

export interface FileDownloadResult {
  success: boolean;
  filename: string;
  uri?: string;
  message?: string;
  error?: string;
}

/**
 * Sanitizes a filename to ensure safe storage on Android and browser file systems
 * while preserving readable spaces and Indonesian text characters.
 */
export function sanitizeFilename(filename: string, defaultExt: string = ''): string {
  if (!filename) {
    filename = `dokumen_${Date.now()}`;
  }

  // Remove illegal characters for Android/Windows file systems: / \ ? % * : | " < >
  let clean = filename.replace(/[/\\?%*:|"<>]/g, '-').trim();

  // Normalize multiple spaces into single space
  clean = clean.replace(/\s+/g, ' ');

  if (!clean) {
    clean = `dokumen_${Date.now()}`;
  }

  if (defaultExt) {
    const ext = defaultExt.startsWith('.') ? defaultExt : `.${defaultExt}`;
    if (!clean.toLowerCase().endsWith(ext.toLowerCase())) {
      clean = `${clean}${ext}`;
    }
  }

  return clean;
}

/**
 * Checks and requests storage permissions on Android/Capacitor when needed.
 */
export async function ensureStoragePermissions(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) return true;
    const status = await Filesystem.checkPermissions();
    if (status.publicStorage !== 'granted') {
      const request = await Filesystem.requestPermissions();
      return request.publicStorage === 'granted';
    }
    return true;
  } catch (err) {
    console.warn('[FileDownloader] Permission check warning:', err);
    return true;
  }
}

/**
 * Convert string text to UTF-8 Base64 (handling Unicode / Indonesian characters properly).
 */
export function utf8ToBase64(str: string): string {
  try {
    return window.btoa(unescape(encodeURIComponent(str)));
  } catch {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

/**
 * Universal file saver & downloader for both Android APK (Capacitor) and Web Browser.
 */
export async function saveAndDownloadFile(options: FileDownloadOptions): Promise<FileDownloadResult> {
  const {
    filename,
    data,
    mimeType,
    isBase64 = false,
    openSharePrompt = true,
    dialogTitle = 'Simpan atau Buka File',
  } = options;

  const cleanFilename = sanitizeFilename(filename);

  // ─────────────────────────────────────────────
  // A. NATIVE ANDROID / CAPACITOR IMPLEMENTATION
  // ─────────────────────────────────────────────
  if (Capacitor.isNativePlatform()) {
    try {
      await ensureStoragePermissions();

      // Extract raw base64 string
      let rawBase64 = data;
      if (data.includes(';base64,')) {
        rawBase64 = data.split(';base64,')[1];
      } else if (!isBase64) {
        rawBase64 = utf8ToBase64(data);
      }

      let savedUri = '';

      // 1. Primary write to Directory.Documents (accessible on Android)
      try {
        const res = await Filesystem.writeFile({
          path: `BisnisUrang/${cleanFilename}`,
          data: rawBase64,
          directory: Directory.Documents,
          recursive: true,
        });
        savedUri = res.uri;
        console.log(`[FileDownloader] Saved to Documents: ${savedUri}`);
      } catch (docErr) {
        console.warn('[FileDownloader] Write to Documents failed, attempting Cache directory:', docErr);
        // 2. Fallback write to Directory.Cache
        const fallbackRes = await Filesystem.writeFile({
          path: `BisnisUrang/${cleanFilename}`,
          data: rawBase64,
          directory: Directory.Cache,
          recursive: true,
        });
        savedUri = fallbackRes.uri;
        console.log(`[FileDownloader] Saved to Cache: ${savedUri}`);
      }

      if (!savedUri) {
        throw new Error('Gagal menulis file ke penyimpanan perangkat.');
      }

      // 3. Open Android Native Share / Save Sheet so user can pick Downloads, Drive, WhatsApp, or Open
      if (openSharePrompt) {
        try {
          await Share.share({
            title: cleanFilename,
            text: `File ${cleanFilename}`,
            url: savedUri,
            dialogTitle: dialogTitle,
          });
        } catch (shareErr: any) {
          // If user cancels the share dialog, file is still saved successfully in Documents
          console.log('[FileDownloader] Share prompt closed/dismissed:', shareErr);
        }
      }

      return {
        success: true,
        filename: cleanFilename,
        uri: savedUri,
        message: `File ${cleanFilename} berhasil disimpan.`,
      };
    } catch (nativeErr: any) {
      console.error('[FileDownloader] Native Android download failed:', nativeErr);
      return {
        success: false,
        filename: cleanFilename,
        error: nativeErr.message || 'Gagal menyimpan file di perangkat.',
      };
    }
  }

  // ─────────────────────────────────────────────
  // B. BROWSER / WEB IMPLEMENTATION
  // ─────────────────────────────────────────────
  try {
    let blob: Blob;

    if (isBase64 || data.includes(';base64,')) {
      const base64Content = data.includes(';base64,') ? data.split(';base64,')[1] : data;
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
    } else {
      blob = new Blob([data], { type: `${mimeType};charset=utf-8;` });
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = cleanFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Revoke after small delay
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    return {
      success: true,
      filename: cleanFilename,
      message: `File ${cleanFilename} berhasil diunduh.`,
    };
  } catch (webErr: any) {
    console.error('[FileDownloader] Browser download error:', webErr);
    return {
      success: false,
      filename: cleanFilename,
      error: webErr.message || 'Gagal mengunduh file di peramban web.',
    };
  }
}

/**
 * Helper to download PDF from base64 string or data URI.
 */
export async function downloadPdfBase64(
  base64Pdf: string,
  filename: string,
  openSharePrompt: boolean = true
): Promise<FileDownloadResult> {
  return saveAndDownloadFile({
    filename: sanitizeFilename(filename, '.pdf'),
    data: base64Pdf,
    mimeType: 'application/pdf',
    isBase64: true,
    openSharePrompt,
    dialogTitle: 'Simpan / Buka Dokumen PDF',
  });
}

/**
 * Helper to download JPG or PNG image from base64 string or data URI.
 */
export async function downloadImageBase64(
  base64Image: string,
  filename: string,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  openSharePrompt: boolean = true
): Promise<FileDownloadResult> {
  const ext = mimeType === 'image/png' ? '.png' : '.jpg';
  return saveAndDownloadFile({
    filename: sanitizeFilename(filename, ext),
    data: base64Image,
    mimeType,
    isBase64: true,
    openSharePrompt,
    dialogTitle: 'Simpan / Bagikan Gambar',
  });
}

/**
 * Helper to download JSON data (e.g. database backup).
 */
export async function downloadJsonFile(
  jsonData: any,
  filename: string,
  openSharePrompt: boolean = true
): Promise<FileDownloadResult> {
  const jsonString = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
  return saveAndDownloadFile({
    filename: sanitizeFilename(filename, '.json'),
    data: jsonString,
    mimeType: 'application/json',
    isBase64: false,
    openSharePrompt,
    dialogTitle: 'Simpan File Cadangan Database',
  });
}

/**
 * Helper to download CSV spreadsheet.
 */
export async function downloadCsvFile(
  csvContent: string,
  filename: string,
  openSharePrompt: boolean = true
): Promise<FileDownloadResult> {
  return saveAndDownloadFile({
    filename: sanitizeFilename(filename, '.csv'),
    data: csvContent,
    mimeType: 'text/csv',
    isBase64: false,
    openSharePrompt,
    dialogTitle: 'Simpan File Spreadsheet CSV',
  });
}
