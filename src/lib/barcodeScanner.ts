/**
 * barcodeScanner.ts
 * Camera and USB/Bluetooth barcode scanner utilities for Sukunaru Studio POS.
 *
 * - Camera scanning: Uses @zxing/browser (getUserMedia)
 * - USB/BT scanner: Listens for rapid keyboard input ended with Enter
 */

import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

export type ScannerStopFn = () => void;

// ── AUDIO SOUND EFFECTS & HAPTIC VIBRATION FEEDBACK ────────────────────────

/**
 * Play high-pitch cheerful chime and crisp vibration when barcode is successfully scanned & found.
 */
export function playScanSuccessFeedback(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Cheerful 2-tone cash register chime (1400Hz -> 1900Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.setValueAtTime(1900, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (_) {}

  // Single crisp vibration for success (90ms)
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(90);
    }
  } catch (_) {}
}

/**
 * Play low warning double-buzz sound and double-vibration when barcode is not found or error.
 */
export function playScanErrorFeedback(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Warning buzzer tone (320Hz -> 200Hz)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch (_) {}

  // Double vibration pattern for error: buzz-pause-buzz ([120ms, 70ms, 120ms])
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([120, 70, 120]);
    }
  } catch (_) {}
}

// ── CAMERA SCANNER (Native BarcodeDetector + ZXing Fallback) ───────────────

/**
 * Start camera-based barcode scanner on a <video> element.
 * Uses native BarcodeDetector API (fast & highly accurate on Android)
 * with @zxing/browser as universal fallback.
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
  let stream: MediaStream | null = null;
  let animFrameId: number | null = null;
  let scanIntervalId: any = null;
  let zxingControls: IScannerControls | null = null;
  let lastScannedCode = '';
  let lastScannedTime = 0;

  const handleSuccessfulScan = (rawCode: string) => {
    if (stopped) return;
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    const now = Date.now();
    // Debounce duplicate identical scans within 1.5s
    if (cleanCode === lastScannedCode && now - lastScannedTime < 1500) {
      return;
    }

    lastScannedCode = cleanCode;
    lastScannedTime = now;
    playBeepSound();
    triggerHaptic();
    onDetected(cleanCode);
  };

  try {
    // 1. Request environment / back camera with optimal resolution & autofocus
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
      },
      audio: false,
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (stopped) {
      stream.getTracks().forEach(t => t.stop());
      return () => {};
    }

    videoEl.srcObject = stream;
    videoEl.setAttribute('playsinline', 'true');
    await videoEl.play().catch(e => console.warn('[barcodeScanner] video play caught:', e));

    // Try applying continuous autofocus if supported by browser/camera track
    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
      if (capabilities && capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        await (track as any).applyConstraints({
          advanced: [{ focusMode: 'continuous' }]
        });
      }
    } catch (_) {}

    // 2. Check if Native BarcodeDetector API is supported (Supported on Android Chrome/WebView)
    const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

    if (hasNativeDetector) {
      try {
        const formats = [
          'code_128',
          'code_39',
          'code_93',
          'ean_13',
          'ean_8',
          'qr_code',
          'upc_a',
          'upc_e',
          'data_matrix',
          'itf'
        ];
        const detector = new (window as any).BarcodeDetector({ formats });

        const scanFrame = async () => {
          if (stopped) return;
          if (videoEl.readyState >= 2 && !videoEl.paused && !videoEl.ended) {
            try {
              const barcodes = await detector.detect(videoEl);
              if (barcodes && barcodes.length > 0) {
                const detected = barcodes[0].rawValue || barcodes[0].text;
                if (detected) {
                  handleSuccessfulScan(detected);
                }
              }
            } catch (detErr) {
              // Ignore frame decode errors
            }
          }
          if (!stopped) {
            animFrameId = requestAnimationFrame(scanFrame);
          }
        };

        animFrameId = requestAnimationFrame(scanFrame);
      } catch (nativeInitErr) {
        console.warn('[barcodeScanner] Native BarcodeDetector init failed, using ZXing fallback:', nativeInitErr);
      }
    }

    // 3. ZXing Fallback Engine (Runs as backup or primary if native not active)
    if (!hasNativeDetector) {
      try {
        const reader = new BrowserMultiFormatReader();
        zxingControls = await reader.decodeFromVideoElement(videoEl, (result, error) => {
          if (stopped) return;
          if (result) {
            handleSuccessfulScan(result.getText());
          }
        });
      } catch (zxingErr) {
        console.warn('[barcodeScanner] ZXing decodeFromVideoElement error:', zxingErr);
      }
    }
  } catch (err) {
    console.error('[barcodeScanner] Camera access error:', err);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    throw err;
  }

  return () => {
    stopped = true;
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (scanIntervalId !== null) {
      clearInterval(scanIntervalId);
      scanIntervalId = null;
    }
    if (zxingControls) {
      try { zxingControls.stop(); } catch (_) {}
      zxingControls = null;
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
    }
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
