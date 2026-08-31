import React, { useState, useEffect } from 'react';
import { XMarkIcon, WrenchScrewdriverIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Order, BusinessSettings } from '../types';
import { formatRupiah, formatDate, isDeadlineOverdue, isDeadlineToday } from '../lib/utils';
import { downloadElementAsPdf, printIsolatedElement } from '../lib/pdfHelper';
import { Capacitor } from '@capacitor/core';
import { useToast } from './Toast';

export type BatchDocType = 'spk' | 'invoice' | 'labels';

interface BatchPrintOrdersModalProps {
  isOpen: boolean;
  orders: Order[];
  settings: BusinessSettings;
  onClose: () => void;
  onUpdateBatchStatus?: (orderIds: string[], newStatus: string) => Promise<void>;
}

export const BatchPrintOrdersModal: React.FC<BatchPrintOrdersModalProps> = ({
  isOpen,
  orders,
  settings,
  onClose,
  onUpdateBatchStatus,
}) => {
  const { showToast } = useToast();
  const [paperSize, setPaperSize] = useState<'a5' | 'a4'>('a5');
  const [docType, setDocType] = useState<BatchDocType>('spk');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Initialize selected orders
  useEffect(() => {
    if (isOpen && orders.length > 0) {
      setSelectedIds(orders.map(o => o.id));
    }
  }, [isOpen, orders]);

  if (!isOpen || orders.length === 0) return null;

  const activeOrders = orders.filter(o => selectedIds.includes(o.id));
  const totalBatchAmount = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalItemsCount = activeOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  const toggleOrderSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) {
        showToast('Minimal 1 pesanan harus tetap dipilih', 'info');
        return;
      }
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(orders.map(o => o.id));
  };

  const handlePrint = () => {
    if (activeOrders.length === 0) {
      showToast('Pilih minimal 1 pesanan untuk dicetak', 'info');
      return;
    }
    const titles: Record<BatchDocType, string> = {
      spk: `Batch-SPK-${activeOrders.length}-Pesanan`,
      invoice: `Batch-Invoice-${activeOrders.length}-Pesanan`,
      labels: `Label-Pengiriman-${activeOrders.length}-Pesanan`,
    };
    showToast(`Mempersiapkan cetak massal (${activeOrders.length} pesanan, ${paperSize.toUpperCase()})...`, 'info');
    printIsolatedElement('printable-batch-area', titles[docType], paperSize);
  };

  const handleDownloadPdf = async () => {
    if (activeOrders.length === 0) {
      showToast('Pilih minimal 1 pesanan untuk diekspor ke PDF', 'info');
      return;
    }

    try {
      setIsExportingPdf(true);
      const titles: Record<BatchDocType, string> = {
        spk: `Batch-SPK-${activeOrders.length}-Pesanan-${paperSize.toUpperCase()}.pdf`,
        invoice: `Batch-Invoice-${activeOrders.length}-Pesanan-${paperSize.toUpperCase()}.pdf`,
        labels: `Label-Pengiriman-Batch-${activeOrders.length}-Pesanan-${paperSize.toUpperCase()}.pdf`,
      };

      const success = await downloadElementAsPdf('printable-batch-area', {
        filename: titles[docType],
        format: paperSize,
        orientation: 'portrait',
        marginMm: paperSize === 'a5' ? 5 : 6,
        scale: 2.3,
      });

      if (success) {
        showToast(Capacitor.isNativePlatform() ? 'File berhasil disimpan' : `Dokumen PDF batch (${paperSize.toUpperCase()}) berhasil diunduh!`, 'success');
      } else {
        showToast('Gagal membuat PDF batch. Silakan gunakan tombol Cetak.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat memproses PDF batch', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleBatchStatusChange = async (newStatus: string) => {
    if (!onUpdateBatchStatus || activeOrders.length === 0) return;
    try {
      setIsUpdatingStatus(true);
      await onUpdateBatchStatus(activeOrders.map(o => o.id), newStatus);
      showToast(`Status ${activeOrders.length} pesanan berhasil diubah menjadi ${newStatus}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui status pesanan', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div
      id="batch-print-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-2 sm:p-4 animate-fade-in"
    >
      <div
        id="batch-print-modal-content"
        className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden"
      >
        {/* Modal Top Header */}
        <div
          id="batch-print-modal-header"
          className="p-3.5 sm:p-4 border-b border-[#BFC9D1]/40 bg-[#EAEFEF] space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#25343F] text-sm">Cetak Massal</h3>
              <p className="text-[11px] text-[#898989]">
                {activeOrders.length} Pesanan Dipilih • Total: <strong className="text-[#25343F] font-mono">{formatRupiah(totalBatchAmount)}</strong>
              </p>
            </div>

            <button
              id="btn-close-batch-modal"
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#EAEFEF]/70 flex items-center justify-center text-[#898989] hover:text-[#25343F] hover:bg-slate-300 transition-colors cursor-pointer shrink-0"
              aria-label="Tutup dialog cetak massal"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Doc Type Selector: 3 Clean Tabs (Faktur / Invoice, SPK, Label) */}
          <div>
            <div className="grid grid-cols-3 bg-[#EAEFEF]/80 p-1 rounded-xl text-xs font-bold text-[#25343F] gap-1">
              <button
                type="button"
                onClick={() => setDocType('invoice')}
                className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  docType === 'invoice'
                    ? 'bg-white text-[#25343F] shadow-md font-extrabold ring-1 ring-slate-900/5'
                    : 'hover:text-[#25343F] text-[#898989]'
                }`}
              >
                <span className="truncate">Faktur / Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('spk')}
                className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  docType === 'spk'
                    ? 'bg-white text-[#25343F] shadow-md font-extrabold ring-1 ring-slate-900/5'
                    : 'hover:text-[#25343F] text-[#898989]'
                }`}
              >
                <span className="truncate">SPK</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('labels')}
                className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  docType === 'labels'
                    ? 'bg-white text-[#25343F] shadow-md font-extrabold ring-1 ring-slate-900/5'
                    : 'hover:text-[#25343F] text-[#898989]'
                }`}
              >
                <span className="truncate">Label</span>
              </button>
            </div>
          </div>
        </div>

        {/* Printable View Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#EAEFEF]/90 flex justify-center">
          <div id="printable-batch-area" className="w-full max-w-4xl space-y-8">
            {/* FORMAT 1: SPK WORKSHOP BATCH (A4 Sheets separated by page breaks) */}
            {docType === 'spk' && (
              <div className="space-y-4">
                {activeOrders.map((order, index) => {
                  const spkNumber = order.orderNumber.replace('ORD-', 'SPK-');
                  const isOverdue = isDeadlineOverdue(order.deadlineDate, order.status);
                  const isToday = isDeadlineToday(order.deadlineDate, order.status);

                  return (
                    <div
                      key={order.id}
                      className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border-2 border-slate-900 text-[#25343F] batch-page-break batch-page-avoid-break font-sans leading-relaxed text-xs"
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start pb-3 border-b-2 border-slate-900 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <WrenchScrewdriverIcon className="w-4 h-4 text-[#25343F]" />
                            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#25343F]">
                              SURAT PERINTAH KERJA (SPK)
                            </h2>
                          </div>
                          <p className="text-[11px] font-semibold text-[#898989] mt-0.5">
                            {settings.businessName || 'SUKUNARU STUDIO'} • Lembar {index + 1} dari {activeOrders.length}
                          </p>
                        </div>

                        <div className="sm:text-right font-mono text-xs">
                          <div>
                            <span className="text-[#898989]">No. SPK: </span>
                            <strong className="text-[#25343F] text-sm">#{spkNumber}</strong>
                          </div>
                          <div>
                            <span className="text-[#898989]">Target Selesai: </span>
                            <strong className={`text-sm font-black ${isOverdue ? 'text-[#c45e00]' : isToday ? 'text-[#c45e00]' : 'text-[#25343F]'}`}>
                              {formatDate(order.deadlineDate)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Order Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2.5 bg-[#EAEFEF] p-2.5 rounded-lg border border-[#BFC9D1]/25 mt-3 text-[11px]">
                        <div>
                          <span className="text-[#898989] block font-semibold text-[10px]">Pemesan:</span>
                          <strong className="text-[#25343F]">{order.customerName}</strong>
                        </div>
                        <div>
                          <span className="text-[#898989] block font-semibold text-[10px]">Kontak WA:</span>
                          <span className="font-mono text-[#25343F]">{order.customerPhone || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[#898989] block font-semibold text-[10px]">Tgl Masuk:</span>
                          <span className="font-mono text-[#25343F]">{formatDate(order.orderDate)}</span>
                        </div>
                        <div>
                          <span className="text-[#898989] block font-semibold text-[10px]">Status:</span>
                          <strong className="text-[#25343F] uppercase">{order.status}</strong>
                        </div>
                      </div>

                      {/* Technical Job Specifications */}
                      <div className="py-3.5 space-y-3">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[#25343F] border-b border-[#BFC9D1]/40 pb-1">
                          Rincian Item Pekerjaan &amp; Spesifikasi Teknis:
                        </h4>

                        {order.items.map((it, idx) => (
                          <div key={idx} className="p-3 rounded-lg border border-[#BFC9D1]/25 bg-white space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="font-black text-xs sm:text-sm text-[#25343F]">
                                {idx + 1}. {it.productName}
                              </div>
                              <div className="px-2.5 py-1 bg-[#25343F] text-white font-mono font-black text-xs rounded shrink-0">
                                {it.quantity} {it.unit || 'pcs'}
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

                      {/* Notes & QC Checklist */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-t border-[#BFC9D1]/40 text-xs">
                        <div className="p-3 bg-[#EAEFEF] rounded-lg border border-[#BFC9D1]/25 space-y-1">
                          <h5 className="font-bold text-[#25343F] uppercase text-[9px]">Catatan Khusus:</h5>
                          <p className="text-[#25343F] text-[11px] leading-relaxed">
                            {order.notes || 'Resolusi minimal 300 DPI, mode warna CMYK, pastikan bleeding aman.'}
                          </p>
                        </div>

                        <div className="p-3 bg-[#EAEFEF] rounded-lg border border-[#BFC9D1]/25 space-y-1">
                          <h5 className="font-bold text-[#25343F] uppercase text-[9px]">Quality Control:</h5>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-[#25343F]">
                            <label className="flex items-center gap-1.5">
                              <input type="checkbox" className="rounded" readOnly /> <span>Warna akurat</span>
                            </label>
                            <label className="flex items-center gap-1.5">
                              <input type="checkbox" className="rounded" readOnly /> <span>Ukuran presisi</span>
                            </label>
                            <label className="flex items-center gap-1.5">
                              <input type="checkbox" className="rounded" readOnly /> <span>Finishing rapi</span>
                            </label>
                            <label className="flex items-center gap-1.5">
                              <input type="checkbox" className="rounded" readOnly /> <span>Jumlah komplit</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FORMAT 2: INVOICE / FAKTUR BATCH */}
            {docType === 'invoice' && (
              <div className="space-y-4">
                {activeOrders.map((order, index) => {
                  const invoiceNumber = order.orderNumber.replace('ORD-', settings.invoicePrefix || 'INV-');
                  return (
                    <div
                      key={order.id}
                      className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-[#BFC9D1]/25 text-[#25343F] batch-page-break batch-page-avoid-break font-sans leading-relaxed text-xs max-w-[780px] mx-auto w-full"
                    >
                      {/* Studio Header & Invoice TagIcon */}
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
                            <div className="text-[#898989] text-[10px]">
                              Lembar {index + 1} dari {activeOrders.length}
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
                  );
                })}
              </div>
            )}

            {/* FORMAT 4: LABEL & STIKER PENGIRIMAN / WORKSHOP (Compact Cards Grid) */}
            {docType === 'labels' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeOrders.map((order, idx) => {
                  const isOverdue = isDeadlineOverdue(order.deadlineDate, order.status);
                  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <div
                      key={order.id}
                      className="bg-white p-4 rounded-xl border-2 border-slate-800 text-[#25343F] space-y-2.5 shadow-md batch-page-avoid-break"
                    >
                      {/* Label Top */}
                      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs uppercase tracking-wider">{settings.businessName || 'SUKUNARU STUDIO'}</span>
                        </div>
                        <span className="font-mono font-black text-xs px-2 py-0.5 bg-[#FF9B51] text-[#25343F] rounded">
                          #{order.orderNumber}
                        </span>
                      </div>

                      {/* Recipient */}
                      <div>
                        <span className="text-[9px] font-bold text-[#898989] uppercase tracking-wider block">Penerima / Pemesan:</span>
                        <h4 className="font-extrabold text-sm text-[#25343F]">{order.customerName}</h4>
                        {order.customerPhone && (
                          <p className="text-xs font-mono text-[#25343F] mt-0.5">WA: {order.customerPhone}</p>
                        )}
                      </div>

                      {/* Items */}
                      <div className="p-2 bg-[#EAEFEF] rounded border border-[#BFC9D1]/25 text-xs">
                        <span className="text-[9px] font-bold text-[#898989] uppercase block mb-1">Daftar Isi Paket ({totalQty} pcs):</span>
                        <div className="space-y-0.5 text-[11px] font-semibold text-[#25343F]">
                          {order.items.map((it, iIdx) => (
                            <div key={iIdx} className="truncate">
                              • {it.productName} ({it.quantity} pcs)
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Meta Footer */}
                      <div className="pt-2 border-t border-[#BFC9D1]/40 flex items-center justify-between text-[10px]">
                        <div>
                          <span className="text-[#898989]">Deadline: </span>
                          <strong className={isOverdue ? 'text-[#c45e00]' : 'text-[#25343F]'}>
                            {formatDate(order.deadlineDate)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#898989]">Status Bayar: </span>
                          <strong className="uppercase font-bold text-[#25343F]">{order.paymentStatus}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div
          id="batch-print-modal-footer"
          className="p-3.5 sm:p-4 border-t border-[#BFC9D1]/40 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3"
        >
          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              id="btn-download-batch-pdf"
              type="button"
              disabled={isExportingPdf || activeOrders.length === 0}
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl border border-[#BFC9D1]/25 bg-white hover:bg-[#EAEFEF] text-zinc-700 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isExportingPdf ? 'Membuat PDF...' : 'Unduh PDF Batch'}</span>
            </button>

            <button
              id="btn-trigger-batch-print"
              type="button"
              disabled={activeOrders.length === 0}
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Cetak {activeOrders.length} Dokumen Massal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
