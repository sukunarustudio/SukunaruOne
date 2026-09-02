import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, CameraIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { startCameraScanner, ScannerStopFn } from '../lib/barcodeScanner';
import { useToast } from './Toast';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when a barcode is successfully scanned */
  onScanned: (code: string) => void | boolean | Promise<void | boolean>;
  /** If true, modal stays open after a scan so user can scan multiple items */
  stayOpenAfterScan?: boolean;
}

type ScanStatus = 'initializing' | 'scanning' | 'error_permission' | 'error_camera' | 'manual';

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanned,
  stayOpenAfterScan = false,
}) => {
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopScannerRef = useRef<ScannerStopFn | null>(null);

  const [status, setStatus] = useState<ScanStatus>('initializing');
  const [manualInput, setManualInput] = useState('');
  const [flashDetected, setFlashDetected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const stopCamera = useCallback(() => {
    if (stopScannerRef.current) {
      stopScannerRef.current();
      stopScannerRef.current = null;
    }
    // Also stop all video tracks manually
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleDetected = useCallback(async (code: string) => {
    if (!code.trim() || isProcessing) return;
    setIsProcessing(true);

    // Flash effect
    setFlashDetected(true);
    setTimeout(() => setFlashDetected(false), 400);

    let shouldClose = !stayOpenAfterScan;
    try {
      const result = await onScanned(code.trim());
      // If the handler explicitly returns false (e.g. item not found), keep scanner open
      if (result === false) {
        shouldClose = false;
      }
    } catch (err) {
      shouldClose = false;
    }

    if (shouldClose) {
      stopCamera();
      onClose();
    } else {
      setTimeout(() => setIsProcessing(false), 1200); // 1.2s delay before next scan
    }
  }, [onScanned, onClose, stayOpenAfterScan, stopCamera, isProcessing]);

  // Start camera when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStatus('initializing');
      setManualInput('');
      return;
    }

    let cancelled = false;
    setStatus('initializing');

    const initCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stopFn = await startCameraScanner(videoRef.current, (code) => {
          if (!cancelled) handleDetected(code);
        });
        if (cancelled) {
          stopFn();
          return;
        }
        stopScannerRef.current = stopFn;
        if (!cancelled) setStatus('scanning');
      } catch (err: any) {
        if (cancelled) return;
        console.error('[BarcodeScannerModal] camera error:', err);
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setStatus('error_permission');
        } else {
          setStatus('error_camera');
        }
      }
    };

    // Small delay to let modal animate in before accessing camera
    const t = setTimeout(initCamera, 150);

    return () => {
      cancelled = true;
      clearTimeout(t);
      stopCamera();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualInput.trim();
    if (!code) return;
    handleDetected(code);
    setManualInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top py-3 bg-black/60">
        <div className="flex items-center gap-2">
          <QrCodeIcon className="w-5 h-5 text-white" />
          <span className="text-white font-bold text-sm">Scan Barcode Produk</span>
        </div>
        <button
          type="button"
          onClick={() => { stopCamera(); onClose(); }}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          aria-label="Tutup Scanner"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Camera Viewfinder */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${status === 'scanning' ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: 'scaleX(1)' }}
        />

        {/* Initializing State */}
        {status === 'initializing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
            <div className="w-10 h-10 rounded-full border-2 border-[#FF9B51] border-t-transparent animate-spin" />
            <p className="text-white text-sm">Memulai kamera...</p>
          </div>
        )}

        {/* Permission Error */}
        {status === 'error_permission' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black px-8 text-center">
            <CameraIcon className="w-12 h-12 text-red-400" />
            <p className="text-white font-bold text-base">Akses Kamera Ditolak</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Izinkan akses kamera di pengaturan browser/aplikasi, lalu tutup dan buka kembali scanner ini.
            </p>
            <button
              type="button"
              onClick={() => setStatus('manual')}
              className="mt-2 px-4 py-2 rounded-xl bg-[#FF9B51] text-white font-semibold text-sm cursor-pointer"
            >
              Input Manual
            </button>
          </div>
        )}

        {/* Camera Error */}
        {status === 'error_camera' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black px-8 text-center">
            <CameraIcon className="w-12 h-12 text-yellow-400" />
            <p className="text-white font-bold text-base">Kamera Tidak Tersedia</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Tidak ada kamera yang dapat diakses. Gunakan input manual atau scanner USB/Bluetooth.
            </p>
            <button
              type="button"
              onClick={() => setStatus('manual')}
              className="mt-2 px-4 py-2 rounded-xl bg-[#FF9B51] text-white font-semibold text-sm cursor-pointer"
            >
              Input Manual
            </button>
          </div>
        )}

        {/* Scanning Overlay: Viewfinder + Scan Line Animation */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Flash effect on scan */}
            {flashDetected && (
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            )}

            {/* Dimmed edges */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-black/50" />
              {/* Center viewfinder cutout */}
              <div
                className="absolute bg-transparent border-0"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '72%',
                  maxWidth: '280px',
                  aspectRatio: '1.6',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                  borderRadius: '8px',
                }}
              />
            </div>

            {/* Viewfinder corners */}
            <div
              className="relative border-[3px] border-white/80 rounded-lg"
              style={{ width: '72%', maxWidth: '280px', aspectRatio: '1.6' }}
            >
              {/* Corner markers */}
              {(['tl','tr','bl','br'] as const).map((corner) => (
                <div
                  key={corner}
                  className={`absolute w-6 h-6 border-[3px] border-[#FF9B51] ${
                    corner === 'tl' ? '-top-[2px] -left-[2px] border-r-0 border-b-0 rounded-tl-md' :
                    corner === 'tr' ? '-top-[2px] -right-[2px] border-l-0 border-b-0 rounded-tr-md' :
                    corner === 'bl' ? '-bottom-[2px] -left-[2px] border-r-0 border-t-0 rounded-bl-md' :
                    '-bottom-[2px] -right-[2px] border-l-0 border-t-0 rounded-br-md'
                  }`}
                />
              ))}

              {/* Animated scan line */}
              <div
                className="absolute left-1 right-1 h-0.5 bg-[#FF9B51]/80 rounded-full shadow-[0_0_8px_rgba(255,155,81,0.8)]"
                style={{ animation: 'scan-line 2s ease-in-out infinite' }}
              />
            </div>

            <p className="text-white text-sm font-medium mt-5 text-center px-4">
              Arahkan kamera ke barcode produk
            </p>
          </div>
        )}
      </div>

      {/* Bottom: Manual Input */}
      <div className="bg-black/70 px-4 py-4 pb-safe-bottom space-y-3">
        {status === 'scanning' && (
          <p className="text-slate-400 text-xs text-center">
            Kamera aktif · Scan otomatis terdeteksi
          </p>
        )}

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder="Ketik/paste kode barcode manual..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#FF9B51] font-mono"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#FF9B51] text-white font-bold text-sm disabled:opacity-40 cursor-pointer"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Keyframe CSS for scan line animation */}
      <style>{`
        @keyframes scan-line {
          0%   { top: 8%; }
          50%  { top: 88%; }
          100% { top: 8%; }
        }
      `}</style>
    </div>
  );
};
