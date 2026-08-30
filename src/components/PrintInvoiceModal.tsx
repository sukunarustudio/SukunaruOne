import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Order, BusinessSettings } from '../types';
import { formatRupiah, formatDate, formatDateTime } from '../lib/utils';
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
  const [paperSize, setPaperSize] = useState<'a5' | 'a4'>('a5');
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

  const handlePrint = () => {
    const targetId = docType === 'invoice' ? 'printable-invoice-area' : 'printable-spk-area';
    const title = docType === 'invoice' ? `Invoice-${invoiceNumber}` : `SPK-${spkNumber}`;
    showToast(`Mempersiapkan cetak ${docType === 'invoice' ? 'Invoice' : 'SPK'} (${paperSize.toUpperCase()})...`, 'info');
    printIsolatedElement(targetId, title, paperSize);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const targetId = docType === 'invoice' ? 'printable-invoice-area' : 'printable-spk-area';
      const filename = docType === 'invoice' ? `Invoice-${invoiceNumber}-${paperSize.toUpperCase()}.pdf` : `SPK-Produksi-${spkNumber}-${paperSize.toUpperCase()}.pdf`;

      const success = await downloadElementAsPdf(targetId, {
        filename: filename,
        format: paperSize,
        orientation: 'portrait',
        marginMm: paperSize === 'a5' ? 5 : 8,
        scale: 2.5,
      });

      if (success) {
        showToast(Capacitor.isNativePlatform() ? 'File berhasil disimpan' : `Dokumen ${docType === 'invoice' ? 'Invoice' : 'SPK'} (${paperSize.toUpperCase()}) berhasil diunduh sebagai PDF!`, 'success');
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
      const filename = docType === 'invoice' ? `Invoice-${invoiceNumber}-${paperSize.toUpperCase()}.jpg` : `SPK-Produksi-${spkNumber}-${paperSize.toUpperCase()}.jpg`;

      const success = await downloadElementAsJpg(targetId, {
        filename: filename,
        scale: 2.5,
        quality: 0.96,
      });

      if (success) {
        showToast(Capacitor.isNativePlatform() ? 'File berhasil disimpan' : `Dokumen ${docType === 'invoice' ? 'Invoice' : 'SPK'} (${paperSize.toUpperCase()}) berhasil diunduh sebagai JPG!`, 'success');
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
      `Tanggal     : ${formatDateTime(order.createdAt)}`,
      `Pelanggan   : *${order.customerName}*`,
      ...(order.customerPhone ? [`No. HP/WA   : ${order.customerPhone}`] : []),
      `Deadline    : ${formatDate(order.deadlineDate)}`,
      `Status      : ${order.status}`,
      `--------------------------------`,
      `*Rincian Item Pesanan:*`,
      ...order.items.map(
        (it, idx) =>
          `${idx + 1}. *${it.productName}* (${it.quantity}x)\n   Ukuran : ${it.customWidth || 0}x${it.customHeight || 0} cm\n   Bahan  : ${it.materialName || '-'}\n   Finishing : ${it.finishing || '-'}\n   Harga  : ${formatRupiah(it.price)}/item -> *${formatRupiah(it.subtotal)}*`
      ),
      `--------------------------------`,
      `Total Tagihan : *${formatRupiah(order.totalAmount)}*`,
      `Uang Muka/DP  : ${formatRupiah(order.paidAmount)}`,
      `Sisa Tagihan  : *${formatRupiah(order.remainingAmount)}*`,
      `Status Bayar  : *${order.paymentStatus}*`,
      `--------------------------------`,
      `*Info Pembayaran:*`,
      `Transfer Bank : ${settings.bankAccount || '123-456-7890'}`,
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
      const filename = docType === 'invoice' ? `Invoice-${invoiceNumber}-${paperSize.toUpperCase()}.jpg` : `SPK-${spkNumber}-${paperSize.toUpperCase()}.jpg`;

      const result = await shareElementAsJpg(targetId, {
        filename: filename,
        title: `${docType === 'invoice' ? 'Invoice' : 'SPK'} #${order.orderNumber} - ${settings.businessName || 'Sukunaru Studio'}`,
        text: generateWhatsappInvoiceText(),
        phone: order.customerPhone,
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
    <div id="invoice-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-2 sm:p-4 animate-fade-in">
      <div
        id="invoice-modal-content"
        className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div id="invoice-modal-header" className="p-3.5 sm:p-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3 bg-[#EAEFEF]">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[#25343F] text-sm truncate">
              {docType === 'invoice' ? 'Faktur Tagihan (Invoice)' : 'Surat Perintah Kerja (SPK Workshop)'}
            </h3>
            <p className="text-[11px] text-[#898989] font-mono truncate">
              #{order.orderNumber} • {order.customerName}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Document Mode Switcher */}
            <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg text-xs font-bold text-[#25343F]">
              <button
                type="button"
                onClick={() => setDocType('invoice')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  docType === 'invoice' ? 'bg-white text-[#25343F] shadow-md font-extrabold' : 'hover:text-[#25343F] text-[#898989]'
                }`}
              >
                <span>Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('spk')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  docType === 'spk' ? 'bg-white text-[#25343F] shadow-md font-extrabold' : 'hover:text-[#25343F] text-[#898989]'
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
              className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-[#BFC9D1]/25 w-full max-w-[780px] text-[#25343F] text-xs font-sans leading-relaxed"
            >
              {/* Studio Header & Invoice Tag */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3.5 pb-6 border-b-2 border-slate-900">
                <div className="flex items-start gap-3.5">
                  {settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt={settings.businessName || 'Logo'}
                      className="w-14 h-14 rounded-xl object-contain border border-[#BFC9D1]/25 p-1 shrink-0 bg-white"
                    />
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#25343F] uppercase">
                      {settings.businessName || 'SUKUNARU STUDIO'}
                    </h1>
                    <p className="text-xs font-semibold text-[#25343F] mt-0.5">
                      {settings.tagline || 'Solusi Percetakan & Desain Grafis Profesional'}
                    </p>
                    <p className="text-[11px] text-[#898989] mt-1 max-w-sm">{settings.address}</p>
                    <p className="text-[11px] text-[#898989] font-mono mt-0.5">
                      WhatsApp: {settings.whatsapp || '-'} | Email: {settings.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-3 py-1 bg-[#25343F] text-white font-extrabold text-xs tracking-wider uppercase rounded">
                    FAKTUR INVOICE
                  </span>
                  <div className="mt-2 space-y-0.5 text-xs font-mono">
                    <div>
                      <span className="text-[#898989]">No. Inv: </span>
                      <strong className="text-[#25343F] text-sm">#{invoiceNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[#898989]">Tgl Pesan: </span>
                      <span>{formatDate(order.orderDate)}</span>
                    </div>
                    <div>
                      <span className="text-[#898989]">Tgl Selesai: </span>
                      <span className="font-bold text-[#25343F]">{formatDate(order.deadlineDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info & Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-4 border-b border-[#BFC9D1]/40">
                <div>
                  <span className="text-[11px] font-bold text-[#898989] uppercase tracking-wider block mb-1">
                    Ditagihkan Kepada:
                  </span>
                  <h4 className="font-extrabold text-sm text-[#25343F]">{order.customerName}</h4>
                  <p className="text-xs text-[#898989] font-mono mt-0.5">{order.customerPhone || 'Walk-in Customer'}</p>
                </div>

                <div className="sm:text-right flex flex-col sm:items-end justify-center">
                  <span className="text-[11px] font-bold text-[#898989] uppercase tracking-wider block mb-1">
                    Status Pembayaran:
                  </span>
                  <div>
                    {order.paymentStatus === 'LUNAS' ? (
                      <span className="px-3 py-1 bg-[#25343F] text-white font-black rounded-md text-xs uppercase inline-flex items-center gap-1">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-[#FF9B51]" /> LUNAS
                      </span>
                    ) : order.paymentStatus === 'DP' ? (
                      <span className="px-3 py-1 bg-[#EAEFEF] text-[#25343F] font-black rounded-md text-xs uppercase border border-[#BFC9D1]/25 inline-flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 text-[#25343F]" /> DP / UANG MUKA
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-[#EAEFEF] text-[#25343F] font-black rounded-md text-xs uppercase border border-[#BFC9D1]/25 inline-flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5 text-[#25343F]" /> BELUM BAYAR
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#BFC9D1] text-[#25343F] font-bold text-[11px] uppercase tracking-wider bg-[#EAEFEF]/50">
                      <th className="py-2.5 px-2 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">Item Pesanan / Jasa</th>
                      <th className="py-2.5 px-3 text-center w-20">Qty</th>
                      <th className="py-2.5 px-3 text-right w-28">Harga Satuan</th>
                      <th className="py-2.5 px-3 text-right w-32">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-[#EAEFEF]/50">
                        <td className="py-3 px-2 text-center font-mono text-[#898989]">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#25343F]">{it.productName}</div>
                          {it.notes && (
                            <div className="text-[11px] text-[#898989] italic mt-0.5">Catatan: {it.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#25343F]">
                          {it.quantity} {it.unit || 'pcs'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#898989]">
                          {formatRupiah(it.unitPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#25343F]">
                          {formatRupiah(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation & Payment Summary */}
              <div className="pt-3 border-t-2 border-[#BFC9D1] grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                {/* Bank Accounts & Terms (Compact & Balanced) */}
                <div className="p-2.5 bg-[#EAEFEF]/90 rounded-lg border border-[#BFC9D1]/25 space-y-1 text-[10px]">
                  <span className="font-bold text-[#25343F] uppercase tracking-wider block text-[9px]">
                    Informasi Pembayaran / Transfer:
                  </span>
                  <div className="whitespace-pre-line font-mono text-[#25343F] leading-snug">
                    {settings.bankAccount || 'BCA: 123-456-7890 a.n Sukunaru Studio\nMandiri: 987-654-3210 a.n Sukunaru Studio'}
                  </div>
                  <p className="text-[9px] text-[#898989] pt-1 border-t border-[#BFC9D1]/40 leading-tight">
                    {settings.footerNotes || 'Harap konfirmasi bukti transfer via WhatsApp setelah melakukan pembayaran.'}
                  </p>
                </div>

                {/* Grand Total Breakdown */}
                <div className="space-y-1 text-xs sm:pl-2">
                  <div className="flex justify-between text-[#898989] py-0.5 text-[11px]">
                    <span>Total Subtotal:</span>
                    <span className="font-mono font-bold">{formatRupiah(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[#898989] py-0.5 text-[11px]">
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
            </div>
          ) : (
            /* ========================================================= */
            /* DOCUMENT 2: SPK (SURAT PERINTAH KERJA WORKSHOP)           */
            /* ========================================================= */
            <div
              id="printable-spk-area"
              className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-[#BFC9D1]/25 w-full max-w-[780px] text-[#25343F] text-xs font-sans leading-relaxed"
            >
              {/* SPK Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3.5 pb-4 border-b-2 border-slate-900">
                <div className="flex items-start gap-3">
                  {settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt={settings.businessName || 'Logo'}
                      className="w-12 h-12 rounded-lg object-contain border border-[#BFC9D1]/25 p-1 shrink-0 bg-white"
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-[#25343F] uppercase">
                      SURAT PERINTAH KERJA (SPK)
                    </h1>
                    <p className="text-xs font-bold text-[#25343F]">
                      Workshop &amp; Tim Produksi - {settings.businessName || 'Sukunaru Studio'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono text-xs">
                  <div>
                    <span className="text-[#898989]">No. SPK: </span>
                    <strong className="text-[#25343F] text-sm">#{spkNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[#898989]">Target Selesai: </span>
                    <strong className="text-[#25343F] text-sm font-black">{formatDate(order.deadlineDate)}</strong>
                  </div>
                </div>
              </div>

              {/* Order Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 bg-[#EAEFEF] p-3 rounded-lg border border-[#BFC9D1]/25 mt-4 text-[11px]">
                <div>
                  <span className="text-[#898989] block font-semibold">Nama Pemesan:</span>
                  <span className="font-bold text-[#25343F]">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-[#898989] block font-semibold">Kontak WA:</span>
                  <span className="font-mono text-[#25343F]">{order.customerPhone || '-'}</span>
                </div>
                <div>
                  <span className="text-[#898989] block font-semibold">Tgl Masuk:</span>
                  <span className="font-mono text-[#25343F]">{formatDate(order.orderDate)}</span>
                </div>
                <div>
                  <span className="text-[#898989] block font-semibold">Status Pekerjaan:</span>
                  <span className="font-bold text-[#25343F]">{order.status}</span>
                </div>
              </div>

              {/* Technical Job Specifications */}
              <div className="py-4 space-y-3.5">
                <h3 className="font-black text-sm uppercase tracking-wider text-[#25343F] border-b border-[#BFC9D1]/40 pb-1">
                  Rincian Item Pekerjaan &amp; Spesifikasi Teknis
                </h3>

                {order.items.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-[#BFC9D1]/25 bg-white space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="font-black text-sm text-[#25343F]">
                        {idx + 1}. {it.productName}
                      </div>
                      <div className="px-3 py-1 bg-[#25343F] text-white font-mono font-black text-xs rounded">
                        JUMLAH: {it.quantity} {it.unit || 'pcs'}
                      </div>
                    </div>

                    {it.notes ? (
                      <div className="p-2 bg-[#EAEFEF] rounded border border-[#BFC9D1]/25 text-[#25343F] font-medium text-[11px]">
                        <strong>Instruksi Khusus:</strong> {it.notes}
                      </div>
                    ) : (
                      <div className="text-[#898989] text-[11px] italic">Standar produksi katalog.</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quality Checklist */}
              <div className="p-3 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 space-y-2 text-[11px]">
                <span className="font-bold text-[#25343F] block">Checklist Quality Control (QC) Sebelum Serah Terima:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-medium">
                  <label className="flex items-center gap-2 text-[#25343F]">
                    <input type="checkbox" className="rounded" readOnly /> <span>Ukuran cetak &amp; layout sesuai ACC desain</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#25343F]">
                    <input type="checkbox" className="rounded" readOnly /> <span>Hasil warna tajam &amp; tidak bergaris</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#25343F]">
                    <input type="checkbox" className="rounded" readOnly /> <span>Laminasi/Finishing merekat sempurna</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#25343F]">
                    <input type="checkbox" className="rounded" readOnly /> <span>Jumlah pesanan lengkap &amp; dikemas rapi</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div id="invoice-modal-footer" className="p-3 sm:p-4 border-t border-[#BFC9D1]/40 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSendingWa}
              onClick={handleShareJpg}
              title="Bagikan gambar dokumen ke WhatsApp, Telegram, email, dll."
              className="flex-1 sm:flex-none h-9 px-3.5 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] disabled:opacity-50 text-[#25343F] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer shadow-md whitespace-nowrap"
            >
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
              id="btn-trigger-print-invoice"
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none h-9 px-4 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold text-xs flex items-center justify-center shadow-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Cetak {docType === 'invoice' ? 'Faktur' : 'SPK'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};