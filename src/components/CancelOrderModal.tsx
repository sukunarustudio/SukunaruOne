import React, { useState } from 'react';
import {
  XMarkIcon,
  NoSymbolIcon,
  CubeIcon,
  BanknotesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Order } from '../types';
import { formatRupiah, formatDate } from '../lib/utils';

interface CancelOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

const COMMON_REASONS = [
  'Permintaan pembeli / dibatalkan',
  'Salah input spesifikasi / harga',
  'Bahan baku / stok tidak tersedia',
  'Transaksi duplikat',
  'Lainnya',
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  order,
  onConfirm,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const finalReason =
    selectedPreset === 'Lainnya'
      ? customReason.trim() || 'Pembatalan pesanan'
      : customReason.trim()
      ? `${selectedPreset} - ${customReason.trim()}`
      : selectedPreset;

  const handleExecute = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(finalReason);
      onClose();
    } catch (err) {
      console.error('[Cancel Order Error]:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paidAmount = Number(order.paidAmount) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#BFC9D1]/30 shadow-2xl p-5 sm:p-6 text-left my-auto relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] transition-colors cursor-pointer disabled:opacity-50"
          title="Batal"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5 mb-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0 shadow-xs">
            <NoSymbolIcon className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#25343F] tracking-tight">
              Batalkan pesanan ini?
            </h2>
            <p className="text-xs text-[#898989] mt-0.5 leading-relaxed">
              Pembayaran, stok, dan bahan baku yang sudah tercatat akan dikembalikan secara otomatis.
            </p>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-[#EAEFEF]/60 border border-[#BFC9D1]/30 rounded-2xl p-3.5 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs border-b border-[#BFC9D1]/25 pb-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#898989]">
                No. Pesanan
              </span>
              <p className="font-mono font-black text-[#25343F]">
                {order.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#898989]">
                Total Tagihan
              </span>
              <p className="font-mono font-black text-[#25343F] text-sm">
                {formatRupiah(order.totalAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#898989]">
            <span>Pemesan: <strong className="text-[#25343F]">{order.customerName}</strong></span>
            <span>{formatDate(order.orderDate)}</span>
          </div>

          {/* Refunded Payment amount highlight */}
          <div className="flex items-center justify-between text-[11px] bg-white rounded-xl p-2.5 border border-[#BFC9D1]/20">
            <span className="font-bold text-[#898989]">Dana Terbayar (DP/Lunas) yang dikembalikan:</span>
            <span className="font-mono font-black text-rose-600">
              {paidAmount > 0 ? formatRupiah(paidAmount) : 'Rp0 (Belum ada bayar)'}
            </span>
          </div>

          {/* Items snippet */}
          <div className="text-[11px] text-[#25343F] bg-white rounded-xl p-2.5 border border-[#BFC9D1]/20">
            <span className="text-[10px] font-bold text-[#898989] block mb-1">Item yang dikembalikan ke stok:</span>
            <ul className="space-y-0.5 max-h-24 overflow-y-auto">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex justify-between">
                  <span className="truncate max-w-[240px] font-medium">• {item.productName}</span>
                  <span className="font-mono font-bold text-[#25343F]">+{item.quantity} qty</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Impact Highlights */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <CubeIcon className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
            <span className="text-[10px] font-bold text-slate-700 block">Stok &amp; Bahan Baku</span>
            <span className="text-[9px] text-emerald-700 font-extrabold">+ Dikembalikan</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <BanknotesIcon className="w-4 h-4 text-rose-600 mx-auto mb-0.5" />
            <span className="text-[10px] font-bold text-slate-700 block">Saldo Kas (DP / Lunas)</span>
            <span className="text-[9px] text-rose-700 font-extrabold">{paidAmount > 0 ? '- ' + formatRupiah(paidAmount) : 'Tidak ada mutasi'}</span>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="space-y-2 mb-5">
          <label className="text-xs font-bold text-[#25343F] block">
            Alasan Pembatalan:
          </label>
          <select
            value={selectedPreset}
            onChange={e => setSelectedPreset(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/40 rounded-xl text-xs font-medium text-[#25343F] focus:outline-hidden focus:border-[#25343F] cursor-pointer"
          >
            {COMMON_REASONS.map((r, i) => (
              <option key={i} value={r}>
                {r}
              </option>
            ))}
          </select>

          {selectedPreset === 'Lainnya' && (
            <input
              type="text"
              autoFocus
              disabled={isSubmitting}
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Tuliskan alasan pembatalan..."
              className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/40 rounded-xl text-xs font-medium text-[#25343F] focus:outline-hidden focus:border-[#25343F]"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#BFC9D1]/40 hover:bg-[#EAEFEF] text-[#25343F] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Kembali
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleExecute}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Membatalkan Pesanan...</span>
              </>
            ) : (
              <>
                <NoSymbolIcon className="w-4 h-4 stroke-[2]" />
                <span>Batalkan Pesanan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
