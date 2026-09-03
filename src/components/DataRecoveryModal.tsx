import React, { useState } from 'react';
import {
  CloudArrowUpIcon,
  DevicePhoneMobileIcon,
  ArrowPathRoundedSquareIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DataPresenceInfo } from '../services/syncManager';

interface DataRecoveryModalProps {
  isOpen: boolean;
  presenceInfo: DataPresenceInfo;
  onUseCloud: () => Promise<void>;
  onUseLocal: () => Promise<void>;
  onMerge: () => Promise<void>;
  onClose?: () => void;
}

export const DataRecoveryModal: React.FC<DataRecoveryModalProps> = ({
  isOpen,
  presenceInfo,
  onUseCloud,
  onUseLocal,
  onMerge,
  onClose,
}) => {
  const [selectedAction, setSelectedAction] = useState<'cloud' | 'local' | 'merge' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLocalConfirm, setShowLocalConfirm] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async (action: 'cloud' | 'local' | 'merge') => {
    if (action === 'local' && !showLocalConfirm) {
      setShowLocalConfirm(true);
      return;
    }

    try {
      setSelectedAction(action);
      setIsProcessing(true);
      if (action === 'cloud') {
        await onUseCloud();
      } else if (action === 'local') {
        await onUseLocal();
      } else if (action === 'merge') {
        await onMerge();
      }
    } catch (err) {
      console.error('[DataRecoveryModal Action Error]:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-[#151D2A] rounded-3xl border border-[#BFC9D1]/30 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-left my-auto relative">
        {/* Close button if provided */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Tutup"
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-[#FF9B51]/15 text-[#FF6A00] flex items-center justify-center shrink-0 border border-[#FF9B51]/30">
            <ShieldCheckIcon className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#25343F] dark:text-white">
              Data Bisnis Ditemukan
            </h2>
            <p className="text-xs text-[#898989] dark:text-slate-400">
              Kami menemukan data bisnis di perangkat ini dan di cloud.
            </p>
          </div>
        </div>

        {/* Info stats comparison */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 p-3 rounded-2xl bg-[#EAEFEF]/60 dark:bg-slate-800/60 border border-[#BFC9D1]/20 text-xs">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-[#25343F] dark:text-white mb-1">
              <DevicePhoneMobileIcon className="w-4 h-4 text-[#FF9B51]" />
              <span>Data Perangkat</span>
            </div>
            <p className="text-[11px] text-[#898989] dark:text-slate-400">
              {presenceInfo.localCounts.products} produk • {presenceInfo.localCounts.orders} pesanan
            </p>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
            <div className="flex items-center gap-1.5 font-bold text-[#25343F] dark:text-white mb-1">
              <CloudArrowUpIcon className="w-4 h-4 text-[#0284C7]" />
              <span>Data Cloud</span>
            </div>
            <p className="text-[11px] text-[#898989] dark:text-slate-400">
              {presenceInfo.cloudCounts.products} produk • {presenceInfo.cloudCounts.orders} pesanan
            </p>
          </div>
        </div>

        {/* Confirmation State for Local Device option */}
        {showLocalConfirm ? (
          <div className="space-y-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-left">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">
                  Konfirmasi Gunakan Data Perangkat
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  Data perangkat akan digunakan sebagai sumber utama. Perubahan tertentu di cloud dapat tertimpa.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowLocalConfirm(false)}
                className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 active:scale-95 transition-all"
              >
                Batalkan
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleExecute('local')}
                className="flex-1 py-2 px-3 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] text-xs font-black rounded-xl cursor-pointer shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {isProcessing && selectedAction === 'local' ? (
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>Lanjutkan</span>
              </button>
            </div>
          </div>
        ) : (
          /* 3 Choice Cards */
          <div className="space-y-2.5">
            {/* 1. Cloud Option */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleExecute('cloud')}
              className="w-full p-3.5 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-700 hover:border-[#0284C7] bg-white dark:bg-[#1E293B] hover:bg-sky-50/50 dark:hover:bg-slate-750 transition-all text-left flex items-center justify-between gap-3 group cursor-pointer active:scale-[0.99] disabled:opacity-50 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/50 text-[#0284C7] flex items-center justify-center shrink-0">
                  <CloudArrowUpIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-xs sm:text-sm text-[#25343F] dark:text-white">
                      Gunakan Data Cloud
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 text-[10px] font-black">
                      Disarankan
                    </span>
                  </div>
                  <p className="text-[11px] text-[#898989] dark:text-slate-400 mt-0.5 truncate">
                    Ambil data terbaru dari cloud ke perangkat ini
                  </p>
                </div>
              </div>
              {isProcessing && selectedAction === 'cloud' ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin text-[#0284C7] shrink-0" />
              ) : (
                <span className="text-xs font-bold text-[#0284C7] group-hover:translate-x-0.5 transition-transform shrink-0">
                  Pilih →
                </span>
              )}
            </button>

            {/* 2. Merge Option */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleExecute('merge')}
              className="w-full p-3.5 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-[#1E293B] hover:bg-emerald-50/50 dark:hover:bg-slate-750 transition-all text-left flex items-center justify-between gap-3 group cursor-pointer active:scale-[0.99] disabled:opacity-50 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-xs sm:text-sm text-[#25343F] dark:text-white">
                    Gabungkan &amp; Sinkronkan
                  </h3>
                  <p className="text-[11px] text-[#898989] dark:text-slate-400 mt-0.5 truncate">
                    Satukan data perangkat dan cloud tanpa duplikasi
                  </p>
                </div>
              </div>
              {isProcessing && selectedAction === 'merge' ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
              ) : (
                <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                  Pilih →
                </span>
              )}
            </button>

            {/* 3. Local Option */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleExecute('local')}
              className="w-full p-3.5 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-700 hover:border-[#FF9B51] bg-white dark:bg-[#1E293B] hover:bg-orange-50/50 dark:hover:bg-slate-750 transition-all text-left flex items-center justify-between gap-3 group cursor-pointer active:scale-[0.99] disabled:opacity-50 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FF9B51]/15 text-[#FF6A00] flex items-center justify-center shrink-0">
                  <DevicePhoneMobileIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-xs sm:text-sm text-[#25343F] dark:text-white">
                    Gunakan Data Perangkat
                  </h3>
                  <p className="text-[11px] text-[#898989] dark:text-slate-400 mt-0.5 truncate">
                    Gunakan data di HP ini dan perbarui cloud
                  </p>
                </div>
              </div>
              {isProcessing && selectedAction === 'local' ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin text-[#FF6A00] shrink-0" />
              ) : (
                <span className="text-xs font-bold text-[#FF6A00] group-hover:translate-x-0.5 transition-transform shrink-0">
                  Pilih →
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
