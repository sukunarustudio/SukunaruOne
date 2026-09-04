import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ShareIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Order, BusinessSettings } from '../types';
import {
  formatRupiah,
  formatDate,
  formatDateTime,
  isDeadlineOverdue,
  isDeadlineToday,
  PaperSize,
  PAPER_CONFIGS,
  getPrintStatusBadgeStyle,
} from '../lib/utils';
import {
  downloadElementAsPdf,
  downloadElementAsJpg,
  shareElementAsJpg,
  printIsolatedElement,
} from '../lib/pdfHelper';
import { Capacitor } from '@capacitor/core';
import { useToast } from './Toast';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  order: Order | null;
  settings: BusinessSettings;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  order,
  settings,
  onClose,
}) => {
  const { showToast } = useToast();
  const [paperSize, setPaperSize] = useState<PaperSize>('a5');
  const [docType, setDocType] = useState<'invoice' | 'spk'>('invoice');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDownloadMenu && !(e.target as Element)?.closest('#invoice-download-menu-container')) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  if (!isOpen || !order) return null;

  const invoiceNumber = order.orderNumber.replace('ORD-', settings.invoicePrefix || 'INV-');
  const spkNumber = order.orderNumber.replace('ORD-', 'SPK-');
  const statusBadge = getPrintStatusBadgeStyle(order.paymentStatus, order.remainingAmount);
  const isOverdue = isDeadlineOverdue(order.deadlineDate, order.status);
  const isToday = isDeadlineToday(order.deadlineDate, order.status);
  const currentPaper = PAPER_CONFIGS[paperSize];

  const handlePrint = async () => {
    if (Capacitor.isNativePlatform()) {
      showToast(`Menyiapkan file PDF ${docType === 'invoice' ? 'Invoice' : 'SPK'} untuk dicetak...`, 'info');
      await handleDownloadPdf();
    } else {
      const targetId = docType === 'invoice' ? 'printable-invoice-area' : 'printable-spk-area';
      const title = docType === 'invoice' ? `Invoice-${invoiceNumber}` : `SPK-${spkNumber}`;
      showToast(`Mempersiapkan cetak ${docType === 'invoice' ? 'Invoice' : 'SPK'} (${currentPaper.name})...`, 'info');
      printIsolatedElement(targetId, title, paperSize);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const targetId = docType === 'invoice' ? 'printable-invoice-area' : 'printable-spk-area';
      const filename =
        docType === 'invoice'
          ? `Invoice-${invoiceNumber}-${paperSize.toUpperCase()}.pdf`
          : `SPK-Produksi-${spkNumber}-${paperSize.toUpperCase()}.pdf`;

      const success = await downloadElementAsPdf(targetId, {
        filename: filename,
        format: paperSize,
        orientation: 'portrait',
        marginMm: paperSize === 'a5' ? 4 : 6,
        scale: 2.5,
      });

      if (success) {
        showToast(
          Capacitor.isNativePlatform()
            ? 'File berhasil disimpan'
            : `Dokumen ${docType === 'invoice' ? 'Invoice' : 'SPK'} (${currentPaper.name}) berhasil diunduh sebagai PDF!`,
          'success'
        );
      } else {
        showToast('Gagal mengekspor PDF. Silakan gunakan tombol Cetak / Print to PDF.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat memproses file PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadJpg = async () => {
    try {
      setIsExportingJpg(true);
      const targetId = docType === 'invoice' ? 'printable-invoice-area' : 'printable-spk-area';
      const filename =
        docType === 'invoice'
          ? `Invoice-${invoiceNumber}-${paperSize.toUpperCase()}.jpg`
          : `SPK-Produksi-${spkNumber}-${paperSize.toUpperCase()}.jpg`;

      const success = await downloadElementAsJpg(targetId, {
        filename: filename,
        scale: 2.5,
        quality: 0.96,
        paperSize: paperSize,
      });

      if (success) {
        showToast(
          Capacitor.isNativePlatform()
            ? 'File berhasil disimpan'
            : `Dokumen ${docType === 'invoice' ? 'Invoice' : 'SPK'} (${currentPaper.name}) berhasil diunduh sebagai JPG!`,
          'success'
        );
      } else {
        showToast('Gagal membuat file gambar JPG.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat memproses file JPG', 'error');
    } finally {
      setIsExportingJpg(false);
    }
  };

  const generateWhatsappInvoiceText = () => {
    const lines = [
      `*${settings.businessName || 'SUKUNARU STUDIO'}*`,
      `${settings.tagline || 'Percetakan & Desain Grafis'}`,
      `--------------------------------`,
      `*${docType === 'invoice' ? 'FAKTUR PEMBAYARAN' : 'SURAT PERINTAH KERJA (SPK)'}*`,
      `No. Dokumen : ${docType === 'invoice' ? invoiceNumber : spkNumber}`,
      `Tanggal     : ${formatDateTime(order.createdAt || order.orderDate)}`,
      `Pelanggan   : *${order.customerName}*`,
      ...(order.customerPhone ? [`No. HP/WA   : ${order.customerPhone}`] : []),
      `Deadline    : ${formatDate(order.deadlineDate)}`,
      `Status      : ${order.status}`,
      `--------------------------------`,
      `*Rincian Item Pesanan:*`,
      ...order.items.map((it, idx) => {
        let details = `${idx + 1}. *${it.productName}* (${it.quantity} ${it.unit || 'pcs'})`;
        if (it.customWidth && it.customHeight) {
          details += `\n   Ukuran: ${it.customWidth}x${it.customHeight} cm`;
        }
        if (it.materialName) {
          details += `\n   Bahan: ${it.materialName}`;
        }
        if (it.finishing) {
          details += `\n   Finishing: ${it.finishing}`;
        }
        if (it.notes) {
          details += `\n   Catatan: ${it.notes}`;
        }
        details += `\n   Harga: ${formatRupiah(it.unitPrice || it.price || 0)} -> *${formatRupiah(it.subtotal)}*`;
        return details;
      }),
      `--------------------------------`,
      `Total Tagihan : *${formatRupiah(order.totalAmount)}*`,
      `Uang Muka/DP  : ${formatRupiah(order.paidAmount)}`,
      `Sisa Tagihan  : *${formatRupiah(order.remainingAmount)}*`,
      `Status Bayar  : *${statusBadge.label}*`,
      `--------------------------------`,
      `*Info Pembayaran:*`,
      `Transfer Bank : ${settings.bankAccount || 'BCA: 123-456-7890'}`,
      `a.n : ${settings.businessName || 'Sukunaru Studio'}`,
      `--------------------------------`,
      `${settings.footerNotes || 'Terima kasih atas kepercayaan Anda!'}`
    ].join('\n');
    return lines;
  };

  const handleShareJpg = async () => {
    try {
      setIsSendingWa(true);
      const targetId = docType === 'invoice' ? 'printable-invoice-area' : 'printable-spk-area';
      const filename =
        docType === 'invoice'
          ? `Invoice-${invoiceNumber}-${paperSize.toUpperCase()}.jpg`
          : `SPK-${spkNumber}-${paperSize.toUpperCase()}.jpg`;

      const result = await shareElementAsJpg(targetId, {
        filename: filename,
        title: `${docType === 'invoice' ? 'Invoice' : 'SPK'} #${order.orderNumber} - ${settings.businessName || 'Sukunaru Studio'}`,
        text: generateWhatsappInvoiceText(),
        phone: order.customerPhone,
        paperSize: paperSize,
      });

      if (result.success) {
        if (result.method === 'native-share') {
          showToast('Dokumen JPG berhasil dibagikan', 'success');
        } else if (result.method === 'fallback-download') {
          showToast('Dokumen JPG berhasil diunduh', 'info');
        }
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat membagikan dokumen', 'error');
    } finally {
      setIsSendingWa(false);
    }
  };

  return (
    <div
      id="invoice-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-2 sm:p-4 animate-fade-in"
    >
      <div
        id="invoice-modal-content"
        className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div
          id="invoice-modal-header"
          className="p-3.5 sm:p-4 border-b border-[#BFC9D1]/40 flex flex-wrap items-center justify-between gap-3 bg-[#EAEFEF]"
        >
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[#25343F] text-sm truncate flex items-center gap-2">
              {docType === 'invoice' ? (
                <>
                  <DocumentTextIcon className="w-4 h-4 text-[#25343F]" />
                  <span>Faktur Tagihan (Invoice)</span>
                </>
              ) : (
                <>
                  <WrenchScrewdriverIcon className="w-4 h-4 text-[#25343F]" />
                  <span>Surat Perintah Kerja (SPK Workshop)</span>
                </>
              )}
            </h3>
            <p className="text-[11px] text-[#898989] font-mono truncate mt-0.5">
              #{order.orderNumber} • {order.customerName} • {currentPaper.shortLabel}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Paper Size Selector */}
            <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded-lg border border-[#BFC9D1]/40 text-xs">
              <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider hidden sm:inline">
                Kertas:
              </span>
              <select
                id="select-paper-size"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="bg-transparent text-xs font-bold text-[#25343F] border-none focus:outline-hidden cursor-pointer"
                title="Pilih ukuran kertas cetak"
              >
                <option value="a5">A5 — 148 × 210 mm (Default)</option>
                <option value="a4">A4 — 210 × 297 mm</option>
                <option value="f4">F4 — 210 × 330 mm (Folio)</option>
              </select>
            </div>

            {/* Document Mode Switcher */}
            <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg text-xs font-bold text-[#25343F]">
              <button
                type="button"
                onClick={() => setDocType('invoice')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  docType === 'invoice'
                    ? 'bg-white text-[#25343F] shadow-md font-extrabold'
                    : 'hover:text-[#25343F] text-[#898989]'
                }`}
              >
                <span>Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('spk')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  docType === 'spk'
                    ? 'bg-white text-[#25343F] shadow-md font-extrabold'
                    : 'hover:text-[#25343F] text-[#898989]'
                }`}
              >
                <span>SPK</span>
              </button>
            </div>

            <button
              id="btn-close-invoice-modal"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/80 border border-[#BFC9D1]/25 flex items-center justify-center text-[#898989] hover:text-[#25343F] hover:bg-slate-200 transition-colors cursor-pointer shrink-0 ml-1"
              aria-label="Tutup dialog"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-[#EAEFEF]/70 flex justify-center items-start">
          {docType === 'invoice' ? (
            /* ========================================================= */
            /* DOCUMENT 1: INVOICE / FAKTUR PENJUALAN                    */
            /* ========================================================= */
            <div
              id="printable-invoice-area"
              className={`bg-white rounded-xl shadow-sm border border-[#BFC9D1]/30 text-[#25343F] font-sans leading-relaxed transition-all mx-auto ${
                paperSize === 'a5'
                  ? 'p-5 sm:p-6 max-w-[560px] text-[11px] w-full'
                  : 'p-6 sm:p-8 max-w-[794px] text-xs w-full'
              }`}
              style={{
                width: paperSize === 'a5' ? '560px' : '794px',
                maxWidth: '100%',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              {/* Studio Header & Invoice Tag */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3.5 pb-4 border-b-2 border-slate-900">
                <div className="flex items-start gap-3">
                  {settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt={settings.businessName || 'Logo'}
                      className={`${
                        paperSize === 'a5' ? 'w-12 h-12' : 'w-14 h-14'
                      } rounded-xl object-contain border border-[#BFC9D1]/25 p-1 shrink-0 bg-white`}
                    />
                  )}
                  <div>
                    <h1
                      className={`${
                        paperSize === 'a5' ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
                      } font-black tracking-tight text-[#25343F] uppercase`}
                    >
                      {settings.businessName || 'SUKUNARU STUDIO'}
                    </h1>
                    <p className="text-[11px] font-semibold text-[#25343F] mt-0.5">
                      {settings.tagline || 'Solusi Percetakan & Desain Grafis Profesional'}
                    </p>
                    <p className="text-[10px] text-[#898989] mt-0.5 max-w-xs sm:max-w-sm leading-tight">
                      {settings.address || 'Jl. Workshop Percetakan No. 1'}
                    </p>
                    <p className="text-[10px] text-[#898989] font-mono mt-0.5">
                      WA: {settings.whatsapp || settings.phone || '-'} | Email: {settings.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right font-sans">
                  <div className="flex sm:justify-end">
                    <span className="inline-block px-2.5 py-0.5 bg-[#25343F] text-white font-extrabold text-[10px] tracking-wider uppercase rounded">
                      FAKTUR INVOICE
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[11px] font-mono">
                    <div>
                      <span className="text-[#898989]">No. Inv: </span>
                      <strong className="text-[#25343F] text-xs">#{invoiceNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[#898989]">Tgl Pesan: </span>
                      <span>{formatDate(order.orderDate)}</span>
                    </div>
                    <div>
                      <span className="text-[#898989]">Tgl Selesai: </span>
                      <span className="font-bold text-[#25343F]">{formatDate(order.deadlineDate)}</span>
                    </div>
                    <div className="text-[9px] text-[#898989]">
                      Ukuran: {currentPaper.shortLabel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info & Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-[#BFC9D1]/40 items-center">
                <div>
                  <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block mb-0.5">
                    Ditagihkan Kepada:
                  </span>
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#25343F]">{order.customerName}</h4>
                  <p className="text-[11px] text-[#898989] font-mono mt-0.5">
                    {order.customerPhone ? `WA: ${order.customerPhone}` : 'Pelanggan Walk-in'}
                  </p>
                </div>

                <div className="sm:text-right flex flex-col sm:items-end justify-center">
                  <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block mb-1">
                    Status Pembayaran:
                  </span>
                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider shadow-xs"
                      style={statusBadge.style}
                    >
                      {statusBadge.label === 'LUNAS' ? (
                        <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
                      ) : statusBadge.label.includes('DP') ? (
                        <ClockIcon className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <ExclamationTriangleIcon className="w-3.5 h-3.5 text-white" />
                      )}
                      <span>{statusBadge.label}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-3">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-[#25343F] font-bold text-[10px] uppercase tracking-wider bg-[#EAEFEF]/60">
                      <th className="py-2 px-1.5 w-7 text-center">#</th>
                      <th className="py-2 px-2.5">Item Pesanan / Spesifikasi</th>
                      <th className="py-2 px-2 text-center w-16">Qty</th>
                      <th className="py-2 px-2 text-right w-24">Harga</th>
                      <th className="py-2 px-2 text-right w-24">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#BFC9D1]/30">
                    {order.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-[#EAEFEF]/40">
                        <td className="py-2 px-1.5 text-center font-mono text-[#898989] text-[10px] align-top">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 align-top">
                          <div className="font-bold text-[#25343F] text-[11px]">{it.productName}</div>
                          {/* Technical attributes tags */}
                          <div className="flex flex-wrap gap-1 mt-0.5 text-[9.5px]">
                            {it.customWidth && it.customHeight ? (
                              <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-mono">
                                {it.customWidth}×{it.customHeight} cm
                              </span>
                            ) : null}
                            {it.materialName ? (
                              <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded">
                                {it.materialName}
                              </span>
                            ) : null}
                            {it.finishing ? (
                              <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded">
                                {it.finishing}
                              </span>
                            ) : null}
                          </div>
                          {it.notes && (
                            <div className="text-[10px] text-[#898989] italic mt-0.5 leading-tight">
                              Catatan: {it.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-[#25343F] text-[11px] align-top">
                          {it.quantity} {it.unit || 'pcs'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-[#898989] text-[10.5px] align-top">
                          {formatRupiah(it.unitPrice || it.price || 0)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-[#25343F] text-[11px] align-top">
                          {formatRupiah(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation & Payment Summary */}
              <div className="pt-2.5 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                {/* Bank Accounts & Terms */}
                <div className="p-2.5 bg-[#EAEFEF]/90 rounded-lg border border-[#BFC9D1]/30 space-y-1 text-[9.5px]">
                  <span className="font-bold text-[#25343F] uppercase tracking-wider block text-[9px]">
                    Informasi Pembayaran / Transfer:
                  </span>
                  <div className="whitespace-pre-line font-mono text-[#25343F] leading-tight">
                    {settings.bankAccount || 'BCA: 123-456-7890 a.n Sukunaru Studio\nMandiri: 987-654-3210 a.n Sukunaru Studio'}
                  </div>
                  {order.notes && (
                    <div className="text-[9px] text-[#25343F] pt-1 border-t border-[#BFC9D1]/40 leading-tight">
                      <strong>Catatan Order:</strong> {order.notes}
                    </div>
                  )}
                  <p className="text-[8.5px] text-[#898989] pt-1 border-t border-[#BFC9D1]/40 leading-tight">
                    {settings.footerNotes || 'Harap konfirmasi bukti transfer via WhatsApp setelah melakukan pembayaran.'}
                  </p>
                </div>

                {/* Grand Total Breakdown */}
                <div className="space-y-1 text-[11px] sm:pl-2">
                  <div className="flex justify-between text-[#898989] py-0.5">
                    <span>Total Subtotal:</span>
                    <span className="font-mono font-bold text-[#25343F]">{formatRupiah(order.totalAmount)}</span>
                  </div>
                  {order.discount ? (
                    <div className="flex justify-between text-[#898989] py-0.5">
                      <span>Diskon:</span>
                      <span className="font-mono font-bold text-[#25343F]">-{formatRupiah(order.discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-[#898989] py-0.5">
                    <span>Sudah Dibayar (DP/Cicilan):</span>
                    <span className="font-mono font-bold text-[#25343F]">-{formatRupiah(order.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t-2 border-slate-900 text-[#25343F]">
                    <span className="font-black text-xs uppercase tracking-wider">Sisa Tagihan:</span>
                    <span className="font-mono font-black text-sm sm:text-base text-[#25343F]">
                      {formatRupiah(order.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="grid grid-cols-2 gap-4 pt-5 mt-3 border-t border-[#BFC9D1]/40 text-center text-[10px]">
                <div>
                  <p className="text-[#898989] font-medium mb-8">Penerima / Pelanggan,</p>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1">
                    <span className="font-bold text-[#25343F]">{order.customerName}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[#898989] font-medium mb-8">Hormat Kami,</p>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1">
                    <span className="font-bold text-[#25343F]">{settings.businessName || 'Admin / Kasir'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* DOCUMENT 2: SPK (SURAT PERINTAH KERJA WORKSHOP)           */
            /* ========================================================= */
            <div
              id="printable-spk-area"
              className={`bg-white rounded-xl shadow-sm border border-[#BFC9D1]/30 text-[#25343F] font-sans leading-relaxed transition-all mx-auto ${
                paperSize === 'a5'
                  ? 'p-5 sm:p-6 max-w-[560px] text-[11px] w-full'
                  : 'p-6 sm:p-8 max-w-[794px] text-xs w-full'
              }`}
              style={{
                width: paperSize === 'a5' ? '560px' : '794px',
                maxWidth: '100%',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              {/* SPK Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-3.5 border-b-2 border-slate-900">
                <div className="flex items-start gap-3">
                  {settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt={settings.businessName || 'Logo'}
                      className={`${
                        paperSize === 'a5' ? 'w-11 h-11' : 'w-13 h-13'
                      } rounded-lg object-contain border border-[#BFC9D1]/25 p-1 shrink-0 bg-white`}
                    />
                  )}
                  <div>
                    <h1
                      className={`${
                        paperSize === 'a5' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
                      } font-black tracking-tight text-[#25343F] uppercase`}
                    >
                      SURAT PERINTAH KERJA (SPK)
                    </h1>
                    <p className="text-[11px] font-bold text-[#25343F] mt-0.5">
                      Workshop &amp; Tim Produksi — {settings.businessName || 'Sukunaru Studio'}
                    </p>
                    <p className="text-[10px] text-[#898989] font-mono">
                      Ukuran Dokumen: {currentPaper.label}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono text-[11px]">
                  <div>
                    <span className="text-[#898989]">No. SPK: </span>
                    <strong className="text-[#25343F] text-xs">#{spkNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[#898989]">Target Selesai: </span>
                    <strong
                      className={`text-xs font-black ${
                        isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-[#25343F]'
                      }`}
                    >
                      {formatDate(order.deadlineDate)}
                    </strong>
                  </div>
                  <div className="mt-1">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold uppercase"
                      style={statusBadge.style}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2.5 bg-[#EAEFEF] p-2.5 rounded-lg border border-[#BFC9D1]/25 mt-3 text-[10.5px]">
                <div>
                  <span className="text-[#898989] block font-semibold text-[9.5px]">Nama Pemesan:</span>
                  <span className="font-bold text-[#25343F] truncate block">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-[#898989] block font-semibold text-[9.5px]">Kontak WA:</span>
                  <span className="font-mono text-[#25343F]">{order.customerPhone || '-'}</span>
                </div>
                <div>
                  <span className="text-[#898989] block font-semibold text-[9.5px]">Tgl Masuk:</span>
                  <span className="font-mono text-[#25343F]">{formatDate(order.orderDate)}</span>
                </div>
                <div>
                  <span className="text-[#898989] block font-semibold text-[9.5px]">Status Alur:</span>
                  <span className="font-bold text-[#25343F] uppercase">{order.status}</span>
                </div>
              </div>

              {/* Technical Job Specifications */}
              <div className="py-3.5 space-y-2.5">
                <h3 className="font-black text-xs uppercase tracking-wider text-[#25343F] border-b border-[#BFC9D1]/40 pb-1">
                  Rincian Item Pekerjaan &amp; Spesifikasi Teknis
                </h3>

                {order.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-[#BFC9D1]/30 bg-white space-y-1.5 shadow-2xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-black text-xs text-[#25343F]">
                        {idx + 1}. {it.productName}
                      </div>
                      <div className="px-2 py-0.5 bg-[#25343F] text-white font-mono font-black text-[10px] rounded shrink-0">
                        JUMLAH: {it.quantity} {it.unit || 'pcs'}
                      </div>
                    </div>

                    {/* Technical detail chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-[10px]">
                      <div className="bg-[#EAEFEF]/60 px-2 py-1 rounded border border-[#BFC9D1]/20">
                        <span className="text-[#898989] text-[9px] block">Ukuran / Dimensi:</span>
                        <strong className="text-[#25343F] font-mono">
                          {it.customWidth && it.customHeight ? `${it.customWidth} × ${it.customHeight} cm` : 'Standar'}
                        </strong>
                      </div>
                      <div className="bg-[#EAEFEF]/60 px-2 py-1 rounded border border-[#BFC9D1]/20">
                        <span className="text-[#898989] text-[9px] block">Bahan / Material:</span>
                        <strong className="text-[#25343F]">{it.materialName || 'Sesuai Katalog'}</strong>
                      </div>
                      <div className="bg-[#EAEFEF]/60 px-2 py-1 rounded border border-[#BFC9D1]/20">
                        <span className="text-[#898989] text-[9px] block">Finishing:</span>
                        <strong className="text-[#25343F]">{it.finishing || 'Tanpa Finishing'}</strong>
                      </div>
                    </div>

                    {it.notes ? (
                      <div className="p-1.5 bg-[#EAEFEF] rounded border border-[#BFC9D1]/25 text-[#25343F] font-medium text-[10px]">
                        <strong>Instruksi Khusus:</strong> {it.notes}
                      </div>
                    ) : (
                      <div className="text-[#898989] text-[9.5px] italic">Standar produksi workshop.</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Order Global Notes if any */}
              {order.notes && (
                <div className="p-2 bg-[#EAEFEF] rounded-lg border border-[#BFC9D1]/25 text-[10px] text-[#25343F] mb-3">
                  <strong>Catatan Pesanan:</strong> {order.notes}
                </div>
              )}

              {/* Quality Checklist */}
              <div className="p-2.5 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 space-y-1.5 text-[10px]">
                <span className="font-bold text-[#25343F] block uppercase tracking-wider text-[9.5px]">
                  Checklist Quality Control (QC) Workshop:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-medium">
                  <label className="flex items-center gap-1.5 text-[#25343F]">
                    <input type="checkbox" className="rounded text-[#25343F]" readOnly />
                    <span>Kesesuaian ukuran, bahan &amp; finishing</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[#25343F]">
                    <input type="checkbox" className="rounded text-[#25343F]" readOnly />
                    <span>Kualitas cetak, kerapian &amp; bebas cacat</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[#25343F]">
                    <input type="checkbox" className="rounded text-[#25343F]" readOnly />
                    <span>Kelengkapan jumlah &amp; rincian pesanan</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[#25343F]">
                    <input type="checkbox" className="rounded text-[#25343F]" readOnly />
                    <span>Pengemasan rapi &amp; siap serah terima</span>
                  </label>
                </div>
              </div>

              {/* SPK Signatures (3 Columns: Admin, Operator, QC / Customer) */}
              <div className="grid grid-cols-3 gap-2 pt-4 mt-3 border-t border-[#BFC9D1]/40 text-center text-[9.5px]">
                <div>
                  <p className="text-[#898989] font-medium mb-7">Admin / CS,</p>
                  <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto pb-0.5">
                    <span className="font-bold text-[#25343F]">(........................)</span>
                  </div>
                </div>
                <div>
                  <p className="text-[#898989] font-medium mb-7">Operator Produksi,</p>
                  <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto pb-0.5">
                    <span className="font-bold text-[#25343F]">(........................)</span>
                  </div>
                </div>
                <div>
                  <p className="text-[#898989] font-medium mb-7">Serah Terima / Pelanggan,</p>
                  <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto pb-0.5">
                    <span className="font-bold text-[#25343F]">{order.customerName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div
          id="invoice-modal-footer"
          className="p-3 sm:p-4 border-t border-[#BFC9D1]/40 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSendingWa}
              onClick={handleShareJpg}
              title="Bagikan gambar dokumen ke WhatsApp, Telegram, email, dll."
              className="flex-1 sm:flex-none h-9 px-3.5 rounded-xl bg-[#FF9B51] hover:bg-[#e8883e] disabled:opacity-50 text-[#25343F] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <ShareIcon className="w-3.5 h-3.5" />
              <span>{isSendingWa ? 'Menyiapkan...' : 'Bagikan'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Unified Download Button with Options */}
            <div id="invoice-download-menu-container" className="relative flex-1 sm:flex-none">
              <button
                id="btn-download-options"
                type="button"
                disabled={isExportingPdf || isExportingJpg}
                onClick={() => setShowDownloadMenu((prev) => !prev)}
                className="w-full sm:w-auto h-9 px-3.5 rounded-xl border border-[#BFC9D1]/30 bg-white hover:bg-[#EAEFEF] text-[#25343F] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                <span>{isExportingPdf || isExportingJpg ? 'Membuat...' : 'Unduh'}</span>
                <ChevronDownIcon className="w-3 h-3 text-[#898989]" />
              </button>

              {showDownloadMenu && (
                <div className="absolute bottom-full mb-1.5 right-0 bg-white rounded-xl shadow-xl border border-[#BFC9D1]/40 py-1 z-30 min-w-[140px] animate-fade-in overflow-hidden">
                  <button
                    type="button"
                    disabled={isExportingPdf}
                    onClick={() => {
                      setShowDownloadMenu(false);
                      handleDownloadPdf();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#25343F] hover:bg-[#EAEFEF] transition-colors cursor-pointer block"
                  >
                    Unduh PDF ({currentPaper.name})
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
                    Unduh JPG ({currentPaper.name})
                  </button>
                </div>
              )}
            </div>

            <button
              id="btn-trigger-print-invoice"
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none h-9 px-4 rounded-xl bg-[#25343F] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <PrinterIcon className="w-3.5 h-3.5 text-[#FF9B51]" />
              <span>Cetak {docType === 'invoice' ? 'Faktur' : 'SPK'} ({currentPaper.name})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};