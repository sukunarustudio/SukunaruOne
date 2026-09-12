import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ClockIcon,
  UserIcon,
  BanknotesIcon,
  ArrowPathRoundedSquareIcon,
  QrCodeIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ReceiptPercentIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { CashierShift, ShiftSummary, Transaction, BusinessSettings } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatDate, formatTime, formatDateTime } from '../lib/utils';
import { downloadElementAsJpg } from '../lib/pdfHelper';
import { useToast } from './Toast';

interface ShiftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: CashierShift | null;
  onSelectTransaction?: (trx: Transaction) => void;
  settings?: BusinessSettings;
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  isOpen,
  onClose,
  shift,
  onSelectTransaction,
  settings,
}) => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExportingJpg, setIsExportingJpg] = useState(false);

  useEffect(() => {
    if (isOpen && shift) {
      setLoading(true);
      api.getShiftSummary(shift.id)
        .then(res => setSummary(res))
        .catch(err => console.error('Failed to load shift summary:', err))
        .finally(() => setLoading(false));
    } else {
      setSummary(null);
    }
  }, [isOpen, shift]);

  if (!isOpen || !shift) return null;

  const formatTimeOnly = (isoStr?: string) => {
    if (!isoStr) return '--:--';
    const d = new Date(isoStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const isClosed = shift.status === 'CLOSED';
  const totalTrx = summary ? summary.totalTransactions : shift.totalTransactions;
  const totalSales = summary ? summary.totalAmount : shift.totalAmount;
  const cashSales = summary ? summary.cashAmount : shift.cashAmount;
  const transferSales = summary ? summary.transferAmount : shift.transferAmount;
  const qrisSales = summary ? summary.qrisAmount : shift.qrisAmount;
  const trxList = summary?.transactions || [];

  const handleDownloadJpg = async () => {
    try {
      setIsExportingJpg(true);
      const safeCashier = (shift.cashierName || 'Kasir').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Laporan-Shift-${safeCashier}-${(shift.startedAt || '').slice(0, 10)}.jpg`;
      
      const success = await downloadElementAsJpg('printable-shift-detail-report', {
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
      console.error('Download shift detail JPG error:', err);
      showToast('Terjadi kesalahan saat mengunduh JPG', 'error');
    } finally {
      setIsExportingJpg(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#BFC9D1]/40 dark:border-slate-800 animate-scale-up flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#BFC9D1]/30 dark:border-slate-800 bg-[#EAEFEF]/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isClosed
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <ClockIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#25343F] dark:text-white leading-tight uppercase">
                  Shift {shift.cashierName || 'Kasir'}
                </h3>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    isClosed
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {isClosed ? 'SELESAI' : 'AKTIF'}
                </span>
              </div>
              <p className="text-xs text-[#898989] dark:text-slate-400 font-medium mt-0.5">
                {formatDate(shift.startedAt)} · {formatTimeOnly(shift.startedAt)} {isClosed ? `— ${formatTimeOnly(shift.endedAt)}` : '(Berjalan)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExportingJpg}
            className="p-1.5 rounded-lg text-[#898989] hover:text-[#25343F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable & Printable) */}
        <div className="overflow-y-auto grow">
          <div
            id="printable-shift-detail-report"
            className="p-5 space-y-4 bg-white dark:bg-[#111827]"
          >
            {/* Header for JPG Export */}
            <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-black text-[#25343F] dark:text-white uppercase tracking-wide">
                {settings?.businessName || 'Bisnis Urang POS'}
              </h4>
              <p className="text-[11px] font-semibold text-[#FF9B51] mt-0.5">
                RINCIAN LAPORAN SHIFT KASIR
              </p>
              <p className="text-[10px] text-[#898989] dark:text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                <CalendarDaysIcon className="w-3 h-3" />
                {formatDate(shift.startedAt || new Date().toISOString())}
              </p>
            </div>

            {/* Main Highlights Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[#BFC9D1]/30 dark:border-slate-800">
                <p className="text-xs text-[#898989] dark:text-slate-400 font-medium">Total Transaksi</p>
                <p className="text-xl font-black text-[#25343F] dark:text-white mt-1 tabular-nums">
                  {totalTrx}{' '}
                  <span className="text-xs font-normal text-[#898989] dark:text-slate-400">transaksi</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30">
                <p className="text-xs text-[#FF6A00] dark:text-orange-400 font-bold">Total Penjualan</p>
                <p className="text-lg font-black text-[#25343F] dark:text-white mt-1 tabular-nums">
                  {formatRupiah(totalSales)}
                </p>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#25343F] dark:text-slate-300 uppercase tracking-wider">
                Metode Pembayaran
              </p>
              <div className="divide-y divide-[#BFC9D1]/30 dark:divide-slate-800 rounded-xl border border-[#BFC9D1]/30 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                <div className="flex items-center justify-between p-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-[#25343F] dark:text-slate-200 font-medium">
                    <BanknotesIcon className="w-4 h-4 text-emerald-500" />
                    <span>Tunai (Cash)</span>
                  </div>
                  <span className="font-mono font-bold text-[#25343F] dark:text-white tabular-nums">
                    {formatRupiah(cashSales)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-[#25343F] dark:text-slate-200 font-medium">
                    <ArrowPathRoundedSquareIcon className="w-4 h-4 text-blue-500" />
                    <span>Transfer Bank</span>
                  </div>
                  <span className="font-mono font-bold text-[#25343F] dark:text-white tabular-nums">
                    {formatRupiah(transferSales)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-[#25343F] dark:text-slate-200 font-medium">
                    <QrCodeIcon className="w-4 h-4 text-purple-500" />
                    <span>QRIS</span>
                  </div>
                  <span className="font-mono font-bold text-[#25343F] dark:text-white tabular-nums">
                    {formatRupiah(qrisSales)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shift Notes if any */}
            {shift.notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-[#BFC9D1]/30 dark:border-slate-800 text-xs">
                <p className="font-semibold text-[#25343F] dark:text-slate-300 mb-0.5">Catatan:</p>
                <p className="text-[#898989] dark:text-slate-400">{shift.notes}</p>
              </div>
            )}

            {/* List of Transactions in this Shift */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#25343F] dark:text-slate-300 uppercase tracking-wider">
                  Daftar Transaksi ({trxList.length})
                </p>
              </div>

              {loading ? (
                <div className="py-6 text-center text-xs text-[#898989] dark:text-slate-400">
                  Memuat daftar transaksi...
                </div>
              ) : trxList.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#898989] dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-[#BFC9D1]/40 dark:border-slate-800">
                  Tidak ada transaksi selama periode shift ini.
                </div>
              ) : (
                <div className="divide-y divide-[#BFC9D1]/30 dark:divide-slate-800 rounded-xl border border-[#BFC9D1]/30 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden max-h-56 overflow-y-auto">
                  {trxList.map(t => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTransaction && onSelectTransaction(t)}
                      className={`flex items-center justify-between p-2.5 text-xs transition ${
                        onSelectTransaction
                          ? 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer'
                          : ''
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#25343F] dark:text-white">
                            #{t.receiptNumber}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {t.paymentMethod}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#898989] dark:text-slate-400 truncate mt-0.5">
                          {formatTimeOnly(t.createdAt || t.date)} · {t.customerName || 'Pelanggan'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-[#25343F] dark:text-white tabular-nums">
                          {formatRupiah(t.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#BFC9D1]/30 dark:border-slate-800 bg-[#EAEFEF]/30 dark:bg-slate-900/30 shrink-0">
          <button
            type="button"
            onClick={handleDownloadJpg}
            disabled={isExportingJpg}
            className="px-3.5 py-2 text-xs sm:text-sm font-bold text-[#25343F] dark:text-white bg-[#EAEFEF] dark:bg-slate-800 hover:bg-[#dfe5e5] dark:hover:bg-slate-700 active:scale-95 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-[#BFC9D1]/40 dark:border-slate-700"
            title="Unduh Laporan Shift format JPG"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-[#FF9B51]" />
            <span>{isExportingJpg ? 'Mengunduh...' : 'Unduh JPG'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#25343F] dark:text-white bg-[#EAEFEF] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
export default ShiftDetailModal;
