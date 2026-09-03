/**
 * barcodeUtils.ts
 * Barcode generation and validation utilities for Sukunaru Studio / BisnisUrang.
 * Uses JsBarcode for rendering Code128 / EAN-13 / EAN-8 barcodes.
 */

export type BarcodeFormat = 'CODE128' | 'EAN13' | 'EAN8';

export const BARCODE_FORMAT_LABELS: Record<BarcodeFormat, string> = {
  CODE128: 'Code 128 (Fleksibel)',
  EAN13: 'EAN-13 (Pabrik 13 digit)',
  EAN8: 'EAN-8 (Pabrik 8 digit)',
};

/**
 * Auto-generate a valid barcode value based on format.
 * - CODE128: Flexible alphanumeric (e.g. SKN-XXXXXXXX)
 * - EAN13: 13 numeric digits with standard Modulo 10 check digit
 * - EAN8: 8 numeric digits with standard Modulo 10 check digit
 */
export function generateBarcodeValue(productId: string, format: BarcodeFormat = 'CODE128'): string {
  if (format === 'EAN13') {
    const seed = Math.floor(100000000 + Math.random() * 900000000).toString();
    const raw12 = `899${seed}`.slice(0, 12);
    const digits = raw12.split('').map(Number);
    const sum = digits.reduce((acc, d, i) => acc + (i % 2 === 0 ? d : d * 3), 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return `${raw12}${checkDigit}`;
  }

  if (format === 'EAN8') {
    const seed = Math.floor(10000 + Math.random() * 90000).toString();
    const raw7 = `89${seed}`.slice(0, 7);
    const digits = raw7.split('').map(Number);
    const sum = digits.reduce((acc, d, i) => acc + (i % 2 === 0 ? d * 3 : d), 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return `${raw7}${checkDigit}`;
  }

  const parts = productId.split('_');
  const suffix = (parts[parts.length - 1] || Date.now().toString(36).slice(-8)).toUpperCase();
  const padded = (suffix + '00000000').slice(0, 8);
  return `SKN-${padded}`;
}

/**
 * Validate barcode value based on format.
 */
export function validateBarcodeValue(value: string, type: BarcodeFormat): { valid: boolean; error?: string } {
  const v = value.trim();
  if (!v) return { valid: false, error: 'Barcode tidak boleh kosong.' };

  if (type === 'EAN13') {
    if (!/^\d{13}$/.test(v)) return { valid: false, error: 'EAN-13 harus tepat 13 digit angka.' };
    if (!validateEan13Checksum(v)) return { valid: false, error: 'Checksum EAN-13 tidak valid.' };
  } else if (type === 'EAN8') {
    if (!/^\d{8}$/.test(v)) return { valid: false, error: 'EAN-8 harus tepat 8 digit angka.' };
    if (!validateEan8Checksum(v)) return { valid: false, error: 'Checksum EAN-8 tidak valid.' };
  } else {
    if (v.length < 4) return { valid: false, error: 'Barcode minimal 4 karakter.' };
    if (v.length > 48) return { valid: false, error: 'Barcode maksimal 48 karakter.' };
  }
  return { valid: true };
}

function validateEan13Checksum(code: string): boolean {
  const digits = code.split('').map(Number);
  const check = digits[12];
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + (i % 2 === 0 ? d : d * 3), 0);
  return (10 - (sum % 10)) % 10 === check;
}

function validateEan8Checksum(code: string): boolean {
  const digits = code.split('').map(Number);
  const check = digits[7];
  const sum = digits.slice(0, 7).reduce((acc, d, i) => acc + (i % 2 === 0 ? d * 3 : d), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/**
 * Render barcode onto an HTMLCanvasElement using JsBarcode.
 */
export async function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  value: string,
  format: BarcodeFormat,
  options?: {
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
  }
): Promise<boolean> {
  try {
    const JsBarcode = (await import('jsbarcode')).default;
    JsBarcode(canvas, value, {
      format,
      width: options?.width ?? 2,
      height: options?.height ?? 60,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize ?? 12,
      margin: options?.margin ?? 8,
      background: options?.background ?? '#ffffff',
      lineColor: options?.lineColor ?? '#000000',
      font: 'monospace',
    });
    return true;
  } catch (err) {
    console.error('[barcodeUtils] renderBarcodeToCanvas error:', err);
    return false;
  }
}

/**
 * Render barcode to a hidden canvas and return PNG data URL.
 */
export async function barcodeToPngDataUrl(
  value: string,
  format: BarcodeFormat,
  options?: { width?: number; height?: number; displayValue?: boolean; fontSize?: number; margin?: number }
): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    const ok = await renderBarcodeToCanvas(canvas, value, format, options);
    if (!ok) return null;
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('[barcodeUtils] barcodeToPngDataUrl error:', err);
    return null;
  }
}

/**
 * Render barcode to an SVG element.
 */
export async function renderBarcodeToSvg(
  svgEl: SVGSVGElement,
  value: string,
  format: BarcodeFormat,
  options?: {
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
  }
): Promise<boolean> {
  try {
    const JsBarcode = (await import('jsbarcode')).default;
    JsBarcode(svgEl, value, {
      format,
      width: options?.width ?? 2,
      height: options?.height ?? 60,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize ?? 12,
      margin: options?.margin ?? 8,
      background: options?.background ?? '#ffffff',
      lineColor: options?.lineColor ?? '#000000',
      font: 'monospace',
    });
    return true;
  } catch (err) {
    console.error('[barcodeUtils] renderBarcodeToSvg error:', err);
    return false;
  }
}
