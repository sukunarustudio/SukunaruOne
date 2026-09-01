import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Transaction, BusinessSettings } from '../types';
import { formatRupiah, formatDateTime } from '../lib/utils';
import {
  downloadElementAsPdf,
  downloadElementAsJpg,
  shareElementAsJpg,
  printIsolatedElement,
} from '../lib/pdfHelper';
import { Capacitor } from '@capacitor/core';
import { useToast } from './Toast';

interface PrintReceiptModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  settings: BusinessSettings;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  isOpen,
  transaction,
  settings,
  onClose,
}) => {
  const { showToast } = useToast();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDownloadMenu && !(e.target as Element)?.closest('#receipt-download-menu-container')) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  if (!isOpen || !transaction) return null;

  const handlePrint = async () => {
    if (Capacitor.isNativePlatform()) {
      showToast('Menyiapkan file PDF struk untuk dicetak/disimpan...', 'info');
      await handleDownloadPdf();
    } else {
      showToast(`Mencetak struk (${paperWidth})...`, 'info');
      printIsolatedElement('printable-receipt-area', `Struk-${transaction.receiptNumber}`, paperWidth);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const success = await downloadElementAsPdf('printable-receipt-area', {
        filename: `Struk-${transaction.receiptNumber}.pdf`,
        format: paperWidth === '58mm' ? [58, 120] : [80, 160],
        orientation: 'portrait',
        marginMm: paperWidth === '58mm' ? 2 : 3,
        scale: 3,
      });
      if (success) {
        showToast(Capacitor.isNativePlatform() ? 'File berhasil disimpan' : 'Struk PDF berhasil diunduh', 'success');
      } else {
        showToast('Gagal membuat file PDF', 'error');
      }
    } catch (err) {
      showToast('Gagal mengunduh PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadJpg = async () => {
    try {
      setIsExportingJpg(true);
      const success = await downloadElementAsJpg('printable-receipt-area', {
        filename: `Struk-${transaction.receiptNumber}.jpg`,
        scale: 3,
        quality: 0.96,
      });
      if (success) {
        showToast(Capacitor.isNativePlatform() ? 'File berhasil disimpan' : 'Struk JPG berhasil diunduh', 'success');
      } else {
        showToast('Gagal membuat file JPG', 'error');
      }
    } catch (err) {
      showToast('Gagal mengunduh gambar JPG', 'error');
    } finally {
      setIsExportingJpg(false);
    }
  };

  const generateWhatsappText = () => {
    const lines = [
      `*${settings.businessName || 'SUKUNARU STUDIO'}*`,
      `${settings.tagline || 'Percetakan & Desain Grafis'}`,
      `--------------------------------`,
      `No. Struk : *${transaction.receiptNumber}*`,
      `Tanggal   : ${formatDateTime(transaction.createdAt || transaction.date)}`,
      `Pelanggan : ${transaction.customerName}`,
      `--------------------------------`,
      ...transaction.items.map(
        it => `${it.productName}\n  ${it.quantity}x @ ${formatRupiah(it.unitPrice)} = ${formatRupiah(it.subtotal)}`
      ),
      `--------------------------------`,
      `Subtotal  : ${formatRupiah(transaction.subtotal)}`,
      transaction.discount > 0 ? `Diskon    : -${formatRupiah(transaction.discount)}` : null,
      `*TOTAL     : ${formatRupiah(transaction.totalAmount)}*`,
      `Bayar (${transaction.paymentMethod}) : ${formatRupiah(transaction.paidAmount)}`,
      `Kembalian : ${formatRupiah(transaction.changeAmount)}`,
      `--------------------------------`,
      `${settings.footerNotes || 'Terima kasih atas pesanan Anda!'}`
    ].filter(Boolean).join('\n');
    return lines;
  };

  // Bagikan gambar struk JPG via Native Share Sheet / Web Share
  const handleShareJpg = async () => {
    try {
      setIsSendingWa(true);

      const result = await shareElementAsJpg('printable-receipt-area', {
        filename: `Struk-${transaction.receiptNumber}.jpg`,
        title: 'Struk Sukunaru Studio',
        text: generateWhatsappText(),
        phone: transaction.customerPhone,
      });

      if (result.success) {
        if (result.method === 'native-share') {
          showToast('Struk JPG berhasil dibagikan', 'success');
        } else if (result.method === 'fallback-download') {
          showToast('Struk JPG berhasil diunduh', 'info');
        }
        // If canceled, do nothing
      } else {
        showToast(result.error || 'Gagal membagikan struk', 'error');
      }
    } catch (err: any) {
      showToast('Gagal membagikan struk', 'error');
    } finally {
      setIsSendingWa(false);
    }
  };


  return (
    <div id="receipt-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div
        id="receipt-modal-content"
        className="bg-white rounded-xl shadow-2xl border border-[#BFC9D1]/25 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div id="receipt-modal-header" className="p-4 border-b border-[#BFC9D1]/40 flex items-center justify-between bg-[#EAEFEF]/50">
          <div>
            <h3 className="font-bold text-[#25343F] text-sm">Struk Kasir</h3>
            <p className="text-[11px] text-[#898989] font-mono">#{transaction.receiptNumber} • {transaction.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Paper Size selector */}
            <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg text-xs font-semibold text-zinc-700">
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  paperWidth === '58mm' ? 'bg-white text-[#25343F] shadow-md font-bold' : 'hover:text-[#25343F] text-zinc-600'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  paperWidth === '80mm' ? 'bg-white text-[#25343F] shadow-md font-bold' : 'hover:text-[#25343F] text-zinc-600'
                }`}
              >
                80mm
              </button>
            </div>
            <button
              id="btn-close-receipt-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#898989] hover:text-zinc-700 hover:bg-[#EAEFEF] transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Printable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#EAEFEF]/70 flex justify-center items-start">
          <div
            id="printable-receipt-area"
            style={{ width: paperWidth === '58mm' ? '250px' : '330px' }}
            className={`bg-white rounded-lg shadow-md text-[#25343F] font-mono border border-[#BFC9D1]/25 transition-all ${
              paperWidth === '58mm' ? 'p-3.5 text-[11px]' : 'p-5 text-xs'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-400">
              {settings.logoUrl && (
                <div className="flex justify-center mb-2">
                  <img
                    src={settings.logoUrl}
                    alt={settings.businessName || 'Logo'}
                    className="max-h-12 max-w-24 object-contain"
                  />
                </div>
              )}
              <h2 className="font-bold text-sm tracking-wider uppercase text-[#25343F]">{settings.businessName || 'SUKUNARU STUDIO'}</h2>
              <p className="text-[11px] text-zinc-600 mt-0.5 font-sans">{settings.tagline || 'Percetakan & Desain Grafis'}</p>
              <p className="text-[10px] text-[#898989] mt-1 leading-tight">{settings.address}</p>
              <p className="text-[10px] text-[#898989]">WA: {settings.whatsapp}</p>
            </div>

            {/* Meta */}
            <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#898989]">No. Struk:</span>
                <span className="font-bold">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">Waktu:</span>
                <span>{formatDateTime(transaction.createdAt || transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">Kasir:</span>
                <span>{transaction.cashierName || 'Kasir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">Pelanggan:</span>
                <span className="font-medium truncate max-w-[170px]">{transaction.customerName}</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-medium text-[#25343F]">{item.productName}</div>
                  <div className="flex justify-between text-zinc-600">
                    <span>
                      {item.quantity} × {formatRupiah(item.unitPrice)}
                    </span>
                    <span className="font-semibold text-[#25343F] font-mono">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculation */}
            <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-[#c45e00]">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[#25343F] pt-1">
                <span>TOTAL:</span>
                <span className="font-mono">{formatRupiah(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 pt-1">
                <span>Metode:</span>
                <span className="font-semibold">{transaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Bayar:</span>
                <span className="font-mono">{formatRupiah(transaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Kembalian:</span>
                <span className="font-mono">{formatRupiah(transaction.changeAmount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-[#898989] space-y-1">
              <p className="font-medium text-zinc-700">{settings.footerNotes || 'Terima kasih atas kunjungan Anda!'}</p>
              <p>Simpan struk ini sebagai bukti transaksi.</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div id="receipt-modal-footer" className="p-3 sm:p-4 border-t border-[#BFC9D1]/40 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSendingWa}
              onClick={handleShareJpg}
              title="Bagikan gambar struk ke WhatsApp, Telegram, email, dll."
              className="flex-1 sm:flex-none h-9 px-3.5 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] disabled:opacity-50 text-[#25343F] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer shadow-md whitespace-nowrap"
            >
              <span>{isSendingWa ? 'Menyiapkan...' : 'Bagikan'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Unified Download Button with Options */}
            <div id="receipt-download-menu-container" className="relative flex-1 sm:flex-none">
              <button
                id="btn-download-options"
                type="button"
                disabled={isExportingPdf || isExportingJpg}
                onClick={() => setShowDownloadMenu(prev => !prev)}
                className="w-full sm:w-auto h-9 px-3.5 rounded-xl border border-[#BFC9D1]/25 bg-white hover:bg-[#EAEFEF] text-[#25343F] font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{isExportingPdf || isExportingJpg ? 'Membuat...' : 'Unduh'}</span>
              </button>

              {showDownloadMenu && (
                <div className="absolute bottom-full mb-1.5 right-0 bg-white rounded-xl shadow-xl border border-[#BFC9D1]/40 py-1 z-30 min-w-[120px] animate-fade-in overflow-hidden">
                  <button
                    type="button"
                    disabled={isExportingPdf}
                    onClick={() => {
                      setShowDownloadMenu(false);
                      handleDownloadPdf();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#25343F] hover:bg-[#EAEFEF] transition-colors cursor-pointer block"
                  >
                    Unduh PDF
                  </button>
                  <button
                    type="button"
                    disabled={isExportingJpg}
                    onClick={() => {
                      setShowDownloadMenu(false);
                      handleDownloadJpg();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#25343F] hover:bg-[#EAEFEF] transition-colors cursor-pointer border-t border-[#BFC9D1]/20 block"
                  >
                    Unduh JPG
                  </button>
                </div>
              )}
            </div>

            <button
              id="btn-trigger-print-receipt"
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none h-9 px-4 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold text-xs flex items-center justify-center shadow-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Cetak Struk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
