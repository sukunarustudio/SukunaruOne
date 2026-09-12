import React, { useState } from 'react';
import {
  XMarkIcon,
  StopCircleIcon,
  UserIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowPathRoundedSquareIcon,
  QrCodeIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { ShiftSummary, BusinessSettings } from '../types';
import { formatRupiah, formatDate } from '../lib/utils';
import { downloadElementAsJpg } from '../lib/pdfHelper';
import { useToast } from './Toast';

interface StopShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ShiftSummary | null;
  onConfirmStop: (notes?: string) => Promise<void>;
  isProcessing?: boolean;
  settings?: BusinessSettings;
}

export const StopShiftModal: React.FC<StopShiftModalProps> = ({
  isOpen,
  onClose,
  summary,
  onConfirmStop,
  isProcessing = false,
  settings,
}) => {
  const { showToast } = useToast();
  const [notes, setNotes] = useState('');
  const [isExportingJpg, setIsExportingJpg] = useState(false);

  if (!isOpen || !summary) return null;

  const { shift, totalTransactions, totalAmount, cashAmount, transferAmount, qrisAmount } = summary;

  const formatTimeOnly = (isoStr?: string) => {
    if (!isoStr) return '--:--';
    const d = new Date(isoStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const handleStop = async () => {
    await onConfirmStop(notes.trim() || undefined);
  };

  const handleDownloadJpg = async () => {
    try {
      setIsExportingJpg(true);
      const safeCashier = (shift.cashierName || 'Kasir').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Laporan-Shift-${safeCashier}-${new Date().toISOString().slice(0, 10)}.jpg`;
      
      const success = await downloadElementAsJpg('printable-stop-shift-report', {
        filename,
        scale: 3,
        quality: 0.98,
      });

      if (success) {
        showToast('Laporan shift berhasil disimpan sebagai gambar (JPG)', 'success');
      } else {
        showToast('Gagal membuat gambar JPG', 'error');
      }
    } catch (err: any) {
      console.error('Download shift report JPG failed:', err);
      showToast('Terjadi kesalahan saat mengunduh JPG', 'error');
    } finally {
      setIsExportingJpg(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white dark:bg-[#111827] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#BFC9D1]/40 dark:border-slate-800 animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#BFC9D1]/30 dark:border-slate-800 bg-[#EAEFEF]/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <StopCircleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#25343F] dark:text-white leading-tight">
                Tutup / Stop Shift
              </h3>
              <p className="text-xs text-[#898989] dark:text-slate-400 font-medium">
                Ringkasan aktivitas transaksi kasir
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing || isExportingJpg}
            className="p-1.5 rounded-lg text-[#898989] hover:text-[#25343F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content / Printable Area */}
        <div className="max-h-[75vh] overflow-y-auto">
          <div
            id="printable-stop-shift-report"
            className="p-5 space-y-4 bg-white dark:bg-[#111827]"
          >
            {/* Business & Report Header (Included in Export) */}
            <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-black text-[#25343F] dark:text-white uppercase tracking-wide">
                {settings?.businessName || 'Bisnis Urang POS'}
              </h4>
              <p className="text-[11px] font-semibold text-[#FF9B51] mt-0.5">
                LAPORAN REKAP TUTUP SHIFT KASIR
              </p>
              <p className="text-[10px] text-[#898989] dark:text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                <CalendarDaysIcon className="w-3 h-3" />
                {formatDate(shift.startedAt || new Date().toISOString())}
              </p>
            </div>

            {/* Cashier & Time Period */}
            <div className="bg-[#EAEFEF]/40 dark:bg-slate-800/40 rounded-xl p-3.5 border border-[#BFC9D1]/30 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FF9B51]/20 text-[#FF9B51] flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-[#898989] dark:text-slate-400 font-bold">
                    Kasir
                  </p>
                  <p className="text-sm font-black text-[#25343F] dark:text-white truncate">
                    {shift.cashierName || 'Kasir'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[11px] uppercase tracking-wider text-[#898989] dark:text-slate-400 font-bold flex items-center gap-1 justify-end">
                  <ClockIcon className="w-3.5 h-3.5" />
                  Periode
                </p>
                <p className="text-xs font-bold text-[#25343F] dark:text-slate-200 mt-0.5 tabular-nums">
                  {formatTimeOnly(shift.startedAt)} — {formatTimeOnly(new Date().toISOString())}
                </p>
              </div>
            </div>

            {/* Main Highlights */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[#BFC9D1]/30 dark:border-slate-800">
                <p className="text-xs text-[#898989] dark:text-slate-400 font-medium">Total Transaksi</p>
                <p className="text-xl font-black text-[#25343F] dark:text-white mt-1 tabular-nums">
                  {totalTransactions}{' '}
                  <span className="text-xs font-normal text-[#898989] dark:text-slate-400">trx</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30">
                <p className="text-xs text-[#FF6A00] dark:text-orange-400 font-bold">Total Penjualan</p>
                <p className="text-lg font-black text-[#25343F] dark:text-white mt-1 tabular-nums">
                  {formatRupiah(totalAmount)}
                </p>
              </div>
            </div>

            {/* Breakdown by Payment Method */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#25343F] dark:text-slate-300 uppercase tracking-wider">
                Rincian Metode Pembayaran
              </p>
              <div className="divide-y divide-[#BFC9D1]/30 dark:divide-slate-800 rounded-xl border border-[#BFC9D1]/30 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                <div className="flex items-center justify-between p-3 text-sm">
                  <div className="flex items-center gap-2 text-[#25343F] dark:text-slate-200 font-medium">
                    <BanknotesIcon className="w-4 h-4 text-emerald-500" />
                    <span>Tunai (Cash)</span>
                  </div>
                  <span className="font-mono font-bold text-[#25343F] dark:text-white tabular-nums">
                    {formatRupiah(cashAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 text-sm">
                  <div className="flex items-center gap-2 text-[#25343F] dark:text-slate-200 font-medium">
                    <ArrowPathRoundedSquareIcon className="w-4 h-4 text-blue-500" />
                    <span>Transfer Bank</span>
                  </div>
                  <span className="font-mono font-bold text-[#25343F] dark:text-white tabular-nums">
                    {formatRupiah(transferAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 text-sm">
                  <div className="flex items-center gap-2 text-[#25343F] dark:text-slate-200 font-medium">
                    <QrCodeIcon className="w-4 h-4 text-purple-500" />
                    <span>QRIS</span>
                  </div>
                  <span className="font-mono font-bold text-[#25343F] dark:text-white tabular-nums">
                    {formatRupiah(qrisAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-[#BFC9D1]/30 dark:border-slate-800 text-xs">
                <p className="font-semibold text-[#25343F] dark:text-slate-300 mb-0.5">Catatan Kasir:</p>
                <p className="text-[#898989] dark:text-slate-400">{notes}</p>
              </div>
            )}
          </div>

          {/* Optional Notes Input (outside printed card if typing) */}
          <div className="px-5 pb-5 space-y-1.5">
            <label className="text-xs font-medium text-[#898989] dark:text-slate-400">
              Catatan Shift (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Oper shift ke kasir malam..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#BFC9D1]/60 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#25343F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF9B51]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2.5 px-5 py-3.5 border-t border-[#BFC9D1]/30 dark:border-slate-800 bg-[#EAEFEF]/30 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={handleDownloadJpg}
            disabled={isProcessing || isExportingJpg}
            className="px-3.5 py-2 text-xs sm:text-sm font-bold text-[#25343F] dark:text-white bg-[#EAEFEF] dark:bg-slate-800 hover:bg-[#dfe5e5] dark:hover:bg-slate-700 active:scale-95 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-[#BFC9D1]/40 dark:border-slate-700"
            title="Unduh Laporan Tutup Shift format JPG"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-[#FF9B51]" />
            <span>{isExportingJpg ? 'Mengunduh...' : 'Unduh JPG'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing || isExportingJpg}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#898989] hover:text-[#25343F] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleStop}
              disabled={isProcessing || isExportingJpg}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Menutup Shift...</span>
              ) : (
                <>
                  <StopCircleIcon className="w-4 h-4" />
                  <span>STOP SHIFT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StopShiftModal;
