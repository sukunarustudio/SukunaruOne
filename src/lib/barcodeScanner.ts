/**
 * barcodeScanner.ts
 * Camera and USB/Bluetooth barcode scanner utilities for Sukunaru Studio POS.
 *
 * - Camera scanning: Uses @zxing/browser (getUserMedia)
 * - USB/BT scanner: Listens for rapid keyboard input ended with Enter
 */

import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

export type ScannerStopFn = () => void;

// ── CAMERA SCANNER (Web & Android WebView) ─────────────────────────────────

/**
 * Start camera-based barcode scanner on a <video> element.
 * Uses @zxing/browser for multi-format decoding (Code128, EAN-13, QR, etc.)
 *
 * @param videoEl  The <video> element to stream camera into
 * @param onDetected  Callback called with decoded barcode string
 * @returns StopFn — call this to stop the scanner and release the camera
 */
export async function startCameraScanner(
  videoEl: HTMLVideoElement,
  onDetected: (code: string) => void
): Promise<ScannerStopFn> {
  let stopped = false;
  let controls: IScannerControls | null = null;
  const reader = new BrowserMultiFormatReader();

  try {
    // Prefer back camera on mobile
    const devices = await BrowserMultiFormatReader.listVideoInputDevices();
    const backCamera = devices.find(d =>
      /back|rear|environment/i.test(d.label)
    ) || devices[devices.length - 1];

    const deviceId = backCamera?.deviceId;

    controls = await reader.decodeFromVideoDevice(
      deviceId,
      videoEl,
      (result) => {
        if (stopped) return;
        if (result) {
          onDetected(result.getText());
        }
      }
    );
  } catch (err) {
    console.error('[barcodeScanner] startCameraScanner error:', err);
    throw err;
  }

  return () => {
    stopped = true;
    try {
      if (controls) {
        controls.stop();
      }
    } catch (_) { /* ignore */ }
  };
}

// ── USB/BLUETOOTH SCANNER (Keyboard Input Mode) ────────────────────────────

const KB_SCANNER_THRESHOLD_MS = 80;   // Max ms between characters for scanner input
const KB_SCANNER_MIN_LENGTH = 4;      // Minimum barcode length to trigger

interface KeyboardScannerState {
  buffer: string;
  lastKeyTime: number;
  timer: ReturnType<typeof setTimeout> | null;
}

let _kbScannerCleanup: ScannerStopFn | null = null;

/**
 * Start keyboard-input USB/Bluetooth barcode scanner listener.
 * Detects rapid keystrokes (< 80ms apart) ending with Enter as a barcode scan.
 * Only fires when no input/textarea/select element is focused.
 *
 * @param onDetected  Callback with the scanned barcode string
 * @returns StopFn to remove the listener
 */
export function startKeyboardScanner(onDetected: (code: string) => void): ScannerStopFn {
  // Stop any existing keyboard scanner
  if (_kbScannerCleanup) _kbScannerCleanup();

  const state: KeyboardScannerState = {
    buffer: '',
    lastKeyTime: 0,
    timer: null,
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip if an input/textarea/select/contenteditable is focused
    const target = e.target as HTMLElement;
    const tag = target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
      return;
    }

    const now = Date.now();
    const elapsed = now - state.lastKeyTime;
    state.lastKeyTime = now;

    // Clear buffer if gap too large (user typing, not scanner)
    if (elapsed > 500 && state.buffer.length > 0) {
      state.buffer = '';
    }

    if (e.key === 'Enter') {
      // Scanner sends Enter at end of barcode
      const code = state.buffer.trim();
      state.buffer = '';
      if (state.timer) clearTimeout(state.timer);
      if (code.length >= KB_SCANNER_MIN_LENGTH) {
        e.preventDefault();
        onDetected(code);
      }
      return;
    }

    // Accumulate character if fast enough (scanner) or first char
    if (elapsed < KB_SCANNER_THRESHOLD_MS || state.buffer.length === 0) {
      if (e.key.length === 1) {
        state.buffer += e.key;
      }
    } else {
      // Too slow — reset buffer, treat as manual typing
      state.buffer = e.key.length === 1 ? e.key : '';
    }

    // Auto-clear buffer after 500ms inactivity
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.buffer = '';
    }, 500);
  };

  window.addEventListener('keydown', handleKeyDown, true);

  const stopFn: ScannerStopFn = () => {
    window.removeEventListener('keydown', handleKeyDown, true);
    if (state.timer) clearTimeout(state.timer);
    _kbScannerCleanup = null;
  };
  _kbScannerCleanup = stopFn;
  return stopFn;
}

/**
 * Stop all active keyboard scanners.
 */
export function stopKeyboardScanner(): void {
  if (_kbScannerCleanup) {
    _kbScannerCleanup();
    _kbScannerCleanup = null;
  }
}
