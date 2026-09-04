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

  const handlePrint = () => {
    const targetId = docType === 'invoice' ? 'printable-invoice-area' : 'printable-spk-area';
    const title = docType === 'invoice' ? `Invoice-${invoiceNumber}` : `SPK-${spkNumber}`;
    showToast(`Mempersiapkan cetak ${docType === 'invoice' ? 'Invoice' : 'SPK'} (${currentPaper.name})...`, 'info');
    printIsolatedElement(targetId, title, paperSize);
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
                <option value="a5">A5</option>
                <option value="a4">A4</option>
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
              className={`bg-white rounded-xl shadow-sm border border-slate-200 text-slate-800 font-sans leading-relaxed transition-all mx-auto ${
                paperSize === 'a5'
                  ? 'p-4 max-w-[540px] text-[10.5px] w-full'
                  : 'p-6 max-w-[760px] text-xs w-full'
              }`}
              style={{
                width: paperSize === 'a5' ? '540px' : '760px',
                maxWidth: '100%',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              {/* Studio Header & Invoice Tag (Fixed 2-column flex) */}
              <div className="flex justify-between items-start gap-3 pb-3 border-b-2 border-slate-900">
                <div className="flex items-start gap-2.5 max-w-[62%]">
                  {settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt={settings.businessName || 'Logo'}
                      className={`${
                        paperSize === 'a5' ? 'w-11 h-11' : 'w-13 h-13'
                      } rounded-lg object-contain border border-slate-200 p-0.5 shrink-0 bg-white`}
                    />
                  )}
                  <div>
                    <h1
                      className={`${
                        paperSize === 'a5' ? 'text-base' : 'text-xl'
                      } font-black tracking-tight text-slate-900 uppercase leading-tight`}
                    >
                      {settings.businessName || 'SUKUNARU STUDIO'}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-700 mt-0.5 leading-tight">
                      {settings.tagline || 'Solusi Percetakan & Desain Grafis Profesional'}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                      {settings.address || 'Jl. Workshop Percetakan No. 1'}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                      WA: {settings.whatsapp || settings.phone || '-'} | Email: {settings.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="text-right font-sans shrink-0">
                  <div className="flex justify-end">
                    <span className="inline-block px-2 py-0.5 bg-slate-900 text-white font-extrabold text-[9.5px] tracking-wider uppercase rounded">
                      FAKTUR INVOICE
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500">No. Inv: </span>
                      <strong className="text-slate-900 text-xs">#{invoiceNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Tgl Pesan: </span>
                      <span className="text-slate-800">{formatDate(order.orderDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Tgl Selesai: </span>
                      <strong className="text-slate-900">{formatDate(order.deadlineDate)}</strong>
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Ukuran: {currentPaper.shortLabel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info & Status Bar (Fixed 2-column grid) */}
              <div className="grid grid-cols-2 gap-3 py-2.5 border-b border-slate-200 items-center">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Ditagihkan Kepada:
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-900 leading-tight">{order.customerName}</h4>
                  <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                    {order.customerPhone ? `WA: ${order.customerPhone}` : 'Pelanggan Walk-in'}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end justify-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Status Pembayaran:
                  </span>
                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white shadow-xs"
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
              <div className="py-2.5">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-slate-900 font-bold text-[9.5px] uppercase tracking-wider bg-slate-100">
                      <th className="py-1.5 px-1.5 w-6 text-center">#</th>
                      <th className="py-1.5 px-2">Item Pesanan / Spesifikasi</th>
                      <th className="py-1.5 px-1.5 text-center w-14">Qty</th>
                      <th className="py-1.5 px-1.5 text-right w-20">Harga</th>
                      <th className="py-1.5 px-1.5 text-right w-22">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-1.5 text-center font-mono text-slate-500 text-[9.5px] align-top">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2 align-top">
                          <div className="font-bold text-slate-900 text-[10.5px] leading-tight">{it.productName}</div>
                          {/* Technical attributes tags */}
                          <div className="flex flex-wrap gap-1 mt-0.5 text-[9px]">
                            {it.customWidth && it.customHeight ? (
                              <span className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono border border-slate-200">
                                {it.customWidth}×{it.customHeight} cm
                              </span>
                            ) : null}
                            {it.materialName ? (
                              <span className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded border border-slate-200">
                                {it.materialName}
                              </span>
                            ) : null}
                            {it.finishing ? (
                              <span className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded border border-slate-200">
                                {it.finishing}
                              </span>
                            ) : null}
                          </div>
                          {it.notes && (
                            <div className="text-[9px] text-slate-500 italic mt-0.5 leading-tight">
                              Catatan: {it.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-1.5 text-center font-mono font-bold text-slate-900 text-[10.5px] align-top">
                          {it.quantity} {it.unit || 'pcs'}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-slate-600 text-[10px] align-top">
                          {formatRupiah(it.unitPrice || it.price || 0)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono font-bold text-slate-900 text-[10.5px] align-top">
                          {formatRupiah(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation & Payment Summary (Fixed 2-column grid) */}
              <div className="pt-2 border-t-2 border-slate-900 grid grid-cols-2 gap-3 items-start">
                {/* Bank Accounts & Terms */}
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[9px]">
                  <span className="font-bold text-slate-900 uppercase tracking-wider block text-[8.5px]">
                    Informasi Pembayaran / Transfer:
                  </span>
                  <div className="whitespace-pre-line font-mono text-slate-800 leading-tight">
                    {settings.bankAccount || 'BCA: 123-456-7890 a.n Sukunaru Studio'}
                  </div>
                  {order.notes && (
                    <div className="text-[8.5px] text-slate-800 pt-1 border-t border-slate-200 leading-tight">
                      <strong>Catatan:</strong> {order.notes}
                    </div>
                  )}
                  <p className="text-[8px] text-slate-500 pt-0.5 border-t border-slate-200 leading-tight">
                    {settings.footerNotes || 'Harap konfirmasi bukti transfer via WhatsApp setelah melakukan pembayaran.'}
                  </p>
                </div>

                {/* Grand Total Breakdown */}
                <div className="space-y-0.5 text-[10.5px] pl-1">
                  <div className="flex justify-between text-slate-600 py-0.5">
                    <span>Total Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(order.totalAmount)}</span>
                  </div>
                  {order.discount ? (
                    <div className="flex justify-between text-slate-600 py-0.5">
                      <span>Diskon:</span>
                      <span className="font-mono font-bold text-slate-900">-{formatRupiah(order.discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-slate-600 py-0.5">
                    <span>Sudah Dibayar (DP):</span>
                    <span className="font-mono font-bold text-slate-900">-{formatRupiah(order.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t-2 border-slate-900 text-slate-900">
                    <span className="font-black text-[11px] uppercase tracking-wider">Sisa Tagihan:</span>
                    <span className="font-mono font-black text-xs text-slate-900">
                      {formatRupiah(order.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures Footer (Fixed 2-column grid) */}
              <div className="grid grid-cols-2 gap-4 pt-4 mt-2.5 border-t border-slate-200 text-center text-[9.5px]">
                <div>
                  <p className="text-slate-500 font-medium mb-7">Penerima / Pelanggan,</p>
                  <div className="border-b border-dashed border-slate-400 w-32 max-w-full mx-auto pb-0.5">
                    <span className="font-bold text-slate-900">{order.customerName}</span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 font-medium mb-7">Hormat Kami,</p>
                  <div className="border-b border-dashed border-slate-400 w-32 max-w-full mx-auto pb-0.5">
                    <span className="font-bold text-slate-900">{settings.businessName || 'Admin / Kasir'}</span>
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
              className={`bg-white rounded-xl shadow-sm border border-slate-200 text-slate-800 font-sans leading-relaxed transition-all mx-auto ${
                paperSize === 'a5'
                  ? 'p-4 max-w-[540px] text-[10.5px] w-full'
                  : 'p-6 max-w-[760px] text-xs w-full'
              }`}
              style={{
                width: paperSize === 'a5' ? '540px' : '760px',
                maxWidth: '100%',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              {/* SPK Header (Fixed 2-column flex) */}
              <div className="flex justify-between items-start gap-3 pb-3 border-b-2 border-slate-900">
                <div className="flex items-start gap-2.5 max-w-[62%]">
                  {settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt={settings.businessName || 'Logo'}
                      className={`${
                        paperSize === 'a5' ? 'w-10 h-10' : 'w-12 h-12'
                      } rounded-lg object-contain border border-slate-200 p-0.5 shrink-0 bg-white`}
                    />
                  )}
                  <div>
                    <h1
                      className={`${
                        paperSize === 'a5' ? 'text-base' : 'text-lg'
                      } font-black tracking-tight text-slate-900 uppercase leading-tight`}
                    >
                      SURAT PERINTAH KERJA (SPK)
                    </h1>
                    <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                      Workshop &amp; Tim Produksi — {settings.businessName || 'Sukunaru Studio'}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      Ukuran Dokumen: {currentPaper.label}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-[10px] shrink-0">
                  <div>
                    <span className="text-slate-500">No. SPK: </span>
                    <strong className="text-slate-900 text-xs">#{spkNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Target Selesai: </span>
                    <strong
                      className={`text-xs font-black ${
                        isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-slate-900'
                      }`}
                    >
                      {formatDate(order.deadlineDate)}
                    </strong>
                  </div>
                  <div className="mt-1">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white shadow-xs"
                      style={statusBadge.style}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Meta Grid (Fixed 4 Columns) */}
              <div className="grid grid-cols-4 gap-2 py-2 bg-slate-100 p-2 rounded-lg border border-slate-200 mt-2.5 text-[9.5px]">
                <div>
                  <span className="text-slate-500 block font-semibold text-[8.5px]">Nama Pemesan:</span>
                  <span className="font-bold text-slate-900 truncate block">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold text-[8.5px]">Kontak WA:</span>
                  <span className="font-mono text-slate-900">{order.customerPhone || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold text-[8.5px]">Tgl Masuk:</span>
                  <span className="font-mono text-slate-900">{formatDate(order.orderDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold text-[8.5px]">Status Alur:</span>
                  <span className="font-bold text-slate-900 uppercase">{order.status}</span>
                </div>
              </div>

              {/* Technical Job Specifications */}
              <div className="py-2.5 space-y-2">
                <h3 className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  Rincian Item Pekerjaan &amp; Spesifikasi Teknis
                </h3>

                {order.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg border border-slate-200 bg-white space-y-1 shadow-2xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-black text-[11px] text-slate-900">
                        {idx + 1}. {it.productName}
                      </div>
                      <div className="px-2 py-0.5 bg-slate-900 text-white font-mono font-black text-[9.5px] rounded shrink-0">
                        JUMLAH: {it.quantity} {it.unit || 'pcs'}
                      </div>
                    </div>

                    {/* Technical detail chips (Fixed 3 Columns) */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-[9.5px]">
                      <div className="bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        <span className="text-slate-500 text-[8.5px] block">Ukuran / Dimensi:</span>
                        <strong className="text-slate-900 font-mono">
                          {it.customWidth && it.customHeight ? `${it.customWidth} × ${it.customHeight} cm` : 'Standar'}
                        </strong>
                      </div>
                      <div className="bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        <span className="text-slate-500 text-[8.5px] block">Bahan / Material:</span>
                        <strong className="text-slate-900">{it.materialName || 'Sesuai Katalog'}</strong>
                      </div>
                      <div className="bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        <span className="text-slate-500 text-[8.5px] block">Finishing:</span>
                        <strong className="text-slate-900">{it.finishing || 'Tanpa Finishing'}</strong>
                      </div>
                    </div>

                    {it.notes ? (
                      <div className="p-1 bg-slate-50 rounded border border-slate-200 text-slate-900 font-medium text-[9px]">
                        <strong>Instruksi Khusus:</strong> {it.notes}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[8.5px] italic">Standar produksi workshop.</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Order Global Notes if any */}
              {order.notes && (
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[9px] text-slate-900 mb-2">
                  <strong>Catatan Pesanan:</strong> {order.notes}
                </div>
              )}

              {/* Quality Checklist (Fixed 2 Columns) */}
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[9px]">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[8.5px]">
                  Checklist Quality Control (QC) Workshop:
                </span>
                <div className="grid grid-cols-2 gap-1.5 font-medium">
                  <label className="flex items-center gap-1.5 text-slate-800">
                    <input type="checkbox" className="rounded text-slate-900" readOnly />
                    <span>Kesesuaian ukuran, bahan &amp; finishing</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-800">
                    <input type="checkbox" className="rounded text-slate-900" readOnly />
                    <span>Kualitas cetak, kerapian &amp; bebas cacat</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-800">
                    <input type="checkbox" className="rounded text-slate-900" readOnly />
                    <span>Kelengkapan jumlah &amp; rincian pesanan</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-800">
                    <input type="checkbox" className="rounded text-slate-900" readOnly />
                    <span>Pengemasan rapi &amp; siap serah terima</span>
                  </label>
                </div>
              </div>

              {/* SPK Signatures (Fixed 3 Columns: Admin, Operator, QC / Customer) */}
              <div className="grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-slate-200 text-center text-[9px]">
                <div>
                  <p className="text-slate-500 font-medium mb-6">Admin / CS,</p>
                  <div className="border-b border-dashed border-slate-400 w-24 max-w-full mx-auto pb-0.5">
                    <span className="font-bold text-slate-900">(........................)</span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 font-medium mb-6">Operator Produksi,</p>
                  <div className="border-b border-dashed border-slate-400 w-24 max-w-full mx-auto pb-0.5">
                    <span className="font-bold text-slate-900">(........................)</span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 font-medium mb-6">Serah Terima / Pelanggan,</p>
                  <div className="border-b border-dashed border-slate-400 w-24 max-w-full mx-auto pb-0.5">
                    <span className="font-bold text-slate-900">{order.customerName}</span>
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