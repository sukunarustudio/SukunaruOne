import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  TagIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Order, BusinessSettings } from '../types';
import {
  formatRupiah,
  formatDate,
  isDeadlineOverdue,
  isDeadlineToday,
  PaperSize,
  PAPER_CONFIGS,
  getPrintStatusBadgeStyle,
} from '../lib/utils';
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
  const [paperSize, setPaperSize] = useState<PaperSize>('a5');
  const [docType, setDocType] = useState<BatchDocType>('spk');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Initialize selected orders
  useEffect(() => {
    if (isOpen && orders.length > 0) {
      setSelectedIds(orders.map((o) => o.id));
    }
  }, [isOpen, orders]);

  if (!isOpen || orders.length === 0) return null;

  const activeOrders = orders.filter((o) => selectedIds.includes(o.id));
  const totalBatchAmount = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const currentPaper = PAPER_CONFIGS[paperSize];

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
    showToast(
      `Mempersiapkan cetak massal (${activeOrders.length} pesanan, ${currentPaper.name})...`,
      'info'
    );
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
        marginMm: paperSize === 'a5' ? 4 : 6,
        scale: 2.3,
      });

      if (success) {
        showToast(
          Capacitor.isNativePlatform()
            ? 'File berhasil disimpan'
            : `Dokumen PDF batch (${currentPaper.name}) berhasil diunduh!`,
          'success'
        );
      } else {
        showToast('Gagal membuat PDF batch. Silakan gunakan tombol Cetak.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat memproses PDF batch', 'error');
    } finally {
      setIsExportingPdf(false);
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
              <h3 className="font-bold text-[#25343F] text-sm">Cetak Massal (Batch Print)</h3>
              <p className="text-[11px] text-[#898989]">
                {activeOrders.length} Pesanan Dipilih • Total:{' '}
                <strong className="text-[#25343F] font-mono">{formatRupiah(totalBatchAmount)}</strong> •{' '}
                {currentPaper.shortLabel}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Paper Size Selector */}
              <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded-lg border border-[#BFC9D1]/40 text-xs">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider hidden sm:inline">
                  Kertas:
                </span>
                <select
                  id="select-batch-paper-size"
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                  className="bg-transparent text-xs font-bold text-[#25343F] border-none focus:outline-hidden cursor-pointer"
                  title="Pilih ukuran kertas cetak batch"
                >
                  <option value="a5">A5 — 148 × 210 mm (Default)</option>
                  <option value="a4">A4 — 210 × 297 mm</option>
                  <option value="f4">F4 — 210 × 330 mm (Folio)</option>
                </select>
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
          </div>

          {/* Doc Type Selector: 3 Clean Tabs (SPK, Faktur / Invoice, Label) */}
          <div>
            <div className="grid grid-cols-3 bg-[#EAEFEF]/80 p-1 rounded-xl text-xs font-bold text-[#25343F] gap-1">
              <button
                type="button"
                onClick={() => setDocType('spk')}
                className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  docType === 'spk'
                    ? 'bg-white text-[#25343F] shadow-md font-extrabold ring-1 ring-slate-900/5'
                    : 'hover:text-[#25343F] text-[#898989]'
                }`}
              >
                <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                <span className="truncate">SPK Workshop</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('invoice')}
                className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  docType === 'invoice'
                    ? 'bg-white text-[#25343F] shadow-md font-extrabold ring-1 ring-slate-900/5'
                    : 'hover:text-[#25343F] text-[#898989]'
                }`}
              >
                <DocumentTextIcon className="w-3.5 h-3.5" />
                <span className="truncate">Faktur / Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('labels')}
                className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  docType === 'labels'
                    ? 'bg-white text-[#25343F] shadow-md font-extrabold ring-1 ring-slate-900/5'
                    : 'hover:text-[#25343F] text-[#898989]'
                }`}
              >
                <TagIcon className="w-3.5 h-3.5" />
                <span className="truncate">Label Pengiriman</span>
              </button>
            </div>
          </div>
        </div>

        {/* Printable View Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#EAEFEF]/90 flex justify-center">
          <div
            id="printable-batch-area"
            className={`w-full space-y-8 ${paperSize === 'a5' ? 'max-w-[560px]' : 'max-w-[794px]'}`}
            style={{
              width: paperSize === 'a5' ? '560px' : '794px',
              maxWidth: '100%',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            {/* FORMAT 1: SPK WORKSHOP BATCH */}
            {docType === 'spk' && (
              <div className="space-y-6">
                {activeOrders.map((order, index) => {
                  const spkNumber = order.orderNumber.replace('ORD-', 'SPK-');
                  const isOverdue = isDeadlineOverdue(order.deadlineDate, order.status);
                  const isToday = isDeadlineToday(order.deadlineDate, order.status);
                  const statusBadge = getPrintStatusBadgeStyle(order.paymentStatus, order.remainingAmount);

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-xl shadow-sm border-2 border-slate-900 text-[#25343F] batch-page-break batch-page-avoid-break font-sans leading-relaxed ${
                        paperSize === 'a5' ? 'p-5 text-[10.5px]' : 'p-6 sm:p-8 text-xs'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start pb-3 border-b-2 border-slate-900 gap-2">
                        <div className="flex items-start gap-2.5">
                          {settings.logoUrl && (
                            <img
                              src={settings.logoUrl}
                              alt="Logo"
                              className="w-10 h-10 rounded-lg object-contain border border-slate-200 p-0.5 shrink-0 bg-white"
                            />
                          )}
                          <div>
                            <h2 className="text-base font-black uppercase tracking-tight text-[#25343F]">
                              SURAT PERINTAH KERJA (SPK)
                            </h2>
                            <p className="text-[10px] font-semibold text-[#898989] mt-0.5">
                              {settings.businessName || 'SUKUNARU STUDIO'} • Dokumen {index + 1} dari{' '}
                              {activeOrders.length}
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right font-mono text-[11px]">
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
                          <div className="mt-0.5">
                            <span
                              className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                              style={statusBadge.style}
                            >
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Order Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 bg-[#EAEFEF] p-2 rounded-lg border border-[#BFC9D1]/25 mt-2.5 text-[10px]">
                        <div>
                          <span className="text-[#898989] block font-semibold text-[9px]">Pemesan:</span>
                          <strong className="text-[#25343F] truncate block">{order.customerName}</strong>
                        </div>
                        <div>
                          <span className="text-[#898989] block font-semibold text-[9px]">Kontak WA:</span>
                          <span className="font-mono text-[#25343F]">{order.customerPhone || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[#898989] block font-semibold text-[9px]">Tgl Masuk:</span>
                          <span className="font-mono text-[#25343F]">{formatDate(order.orderDate)}</span>
                        </div>
                        <div>
                          <span className="text-[#898989] block font-semibold text-[9px]">Status Alur:</span>
                          <strong className="text-[#25343F] uppercase">{order.status}</strong>
                        </div>
                      </div>

                      {/* Technical Job Specifications */}
                      <div className="py-2.5 space-y-2">
                        <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#25343F] border-b border-[#BFC9D1]/40 pb-1">
                          Rincian Item Pekerjaan &amp; Spesifikasi Teknis:
                        </h4>

                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg border border-[#BFC9D1]/30 bg-white space-y-1"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="font-black text-[11px] text-[#25343F]">
                                {idx + 1}. {it.productName}
                              </div>
                              <div className="px-2 py-0.5 bg-[#25343F] text-white font-mono font-black text-[9.5px] rounded shrink-0">
                                {it.quantity} {it.unit || 'pcs'}
                              </div>
                            </div>

                            {/* Tech specs chips */}
                            <div className="flex flex-wrap gap-1 text-[9.5px]">
                              {it.customWidth && it.customHeight ? (
                                <span className="bg-[#EAEFEF] px-1.5 py-0.5 rounded font-mono">
                                  Ukuran: {it.customWidth}×{it.customHeight} cm
                                </span>
                              ) : null}
                              {it.materialName ? (
                                <span className="bg-[#EAEFEF] px-1.5 py-0.5 rounded">
                                  Bahan: {it.materialName}
                                </span>
                              ) : null}
                              {it.finishing ? (
                                <span className="bg-[#EAEFEF] px-1.5 py-0.5 rounded">
                                  Finishing: {it.finishing}
                                </span>
                              ) : null}
                            </div>

                            {it.notes ? (
                              <div className="p-1 bg-[#EAEFEF] rounded text-[#25343F] font-medium text-[9.5px]">
                                <strong>Instruksi:</strong> {it.notes}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      {/* Notes & QC Checklist */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2 border-t border-[#BFC9D1]/40 text-[9.5px]">
                        <div className="p-2 bg-[#EAEFEF] rounded-lg border border-[#BFC9D1]/25 space-y-1">
                          <h5 className="font-bold text-[#25343F] uppercase text-[9px]">Catatan Khusus:</h5>
                          <p className="text-[#25343F] leading-tight">
                            {order.notes || 'Periksa detail instruksi khusus sebelum serah terima.'}
                          </p>
                        </div>

                        <div className="p-2 bg-[#EAEFEF] rounded-lg border border-[#BFC9D1]/25 space-y-1">
                          <h5 className="font-bold text-[#25343F] uppercase text-[9px]">Quality Control (QC):</h5>
                          <div className="grid grid-cols-2 gap-1 text-[9px] text-[#25343F]">
                            <label className="flex items-center gap-1">
                              <input type="checkbox" className="rounded text-[#25343F]" readOnly /> <span>Sesuai spek</span>
                            </label>
                            <label className="flex items-center gap-1">
                              <input type="checkbox" className="rounded text-[#25343F]" readOnly /> <span>Hasil rapi</span>
                            </label>
                            <label className="flex items-center gap-1">
                              <input type="checkbox" className="rounded text-[#25343F]" readOnly /> <span>Qty lengkap</span>
                            </label>
                            <label className="flex items-center gap-1">
                              <input type="checkbox" className="rounded text-[#25343F]" readOnly /> <span>Kemasan aman</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-[#BFC9D1]/30 text-center text-[9px]">
                        <div>
                          <p className="text-[#898989] mb-5">Admin / CS,</p>
                          <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto pb-0.5">
                            <span className="font-bold text-[#25343F]">(................)</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[#898989] mb-5">Operator,</p>
                          <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto pb-0.5">
                            <span className="font-bold text-[#25343F]">(................)</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[#898989] mb-5">Pelanggan,</p>
                          <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto pb-0.5">
                            <span className="font-bold text-[#25343F]">{order.customerName}</span>
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
              <div className="space-y-6">
                {activeOrders.map((order, index) => {
                  const invoiceNumber = order.orderNumber.replace('ORD-', settings.invoicePrefix || 'INV-');
                  const statusBadge = getPrintStatusBadgeStyle(order.paymentStatus, order.remainingAmount);

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-xl shadow-sm border border-[#BFC9D1]/30 text-[#25343F] batch-page-break batch-page-avoid-break font-sans leading-relaxed mx-auto w-full ${
                        paperSize === 'a5' ? 'p-5 text-[10.5px]' : 'p-6 sm:p-8 text-xs'
                      }`}
                    >
                      {/* Studio Header & Invoice Tag */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-3 border-b-2 border-slate-900">
                        <div className="flex items-start gap-2.5">
                          {settings.logoUrl && (
                            <img
                              src={settings.logoUrl}
                              alt="Logo"
                              className="w-11 h-11 rounded-xl object-contain border border-[#BFC9D1]/25 p-1 shrink-0 bg-white"
                            />
                          )}
                          <div>
                            <h1 className="text-base sm:text-lg font-black tracking-tight text-[#25343F] uppercase">
                              {settings.businessName || 'SUKUNARU STUDIO'}
                            </h1>
                            <p className="text-[10.5px] font-semibold text-[#25343F]">
                              {settings.tagline || 'Percetakan & Desain Grafis'}
                            </p>
                            <p className="text-[9.5px] text-[#898989] max-w-xs">{settings.address}</p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right font-sans">
                          <span className="inline-block px-2 py-0.5 bg-[#25343F] text-white font-extrabold text-[9.5px] tracking-wider uppercase rounded">
                            FAKTUR INVOICE
                          </span>
                          <div className="mt-1 space-y-0.5 text-[10px] font-mono">
                            <div>
                              <span className="text-[#898989]">No. Inv: </span>
                              <strong className="text-[#25343F]">#{invoiceNumber}</strong>
                            </div>
                            <div>
                              <span className="text-[#898989]">Tgl Pesan: </span>
                              <span>{formatDate(order.orderDate)}</span>
                            </div>
                            <div>
                              <span className="text-[#898989]">Tgl Selesai: </span>
                              <span className="font-bold text-[#25343F]">{formatDate(order.deadlineDate)}</span>
                            </div>
                            <div className="text-[#898989] text-[9px]">
                              Lembar {index + 1} dari {activeOrders.length}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info & Status Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2.5 border-b border-[#BFC9D1]/40 items-center">
                        <div>
                          <span className="text-[9.5px] font-bold text-[#898989] uppercase tracking-wider block">
                            Ditagihkan Kepada:
                          </span>
                          <h4 className="font-extrabold text-xs text-[#25343F]">{order.customerName}</h4>
                          <p className="text-[10px] text-[#898989] font-mono">
                            {order.customerPhone ? `WA: ${order.customerPhone}` : 'Pelanggan Walk-in'}
                          </p>
                        </div>

                        <div className="sm:text-right flex flex-col sm:items-end justify-center">
                          <span className="text-[9.5px] font-bold text-[#898989] uppercase tracking-wider block mb-0.5">
                            Status Pembayaran:
                          </span>
                          <div>
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                              style={statusBadge.style}
                            >
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="py-2.5">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b-2 border-slate-800 text-[#25343F] font-bold text-[9.5px] uppercase tracking-wider bg-[#EAEFEF]/60">
                              <th className="py-1.5 px-1 w-6 text-center">#</th>
                              <th className="py-1.5 px-2">Item / Jasa</th>
                              <th className="py-1.5 px-1.5 text-center w-14">Qty</th>
                              <th className="py-1.5 px-1.5 text-right w-20">Harga</th>
                              <th className="py-1.5 px-1.5 text-right w-20">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#BFC9D1]/30">
                            {order.items.map((it, idx) => (
                              <tr key={idx} className="hover:bg-[#EAEFEF]/40">
                                <td className="py-1.5 px-1 text-center font-mono text-[#898989] text-[9.5px] align-top">
                                  {idx + 1}
                                </td>
                                <td className="py-1.5 px-2 align-top">
                                  <div className="font-bold text-[#25343F] text-[10.5px]">{it.productName}</div>
                                  <div className="flex flex-wrap gap-1 mt-0.5 text-[9px]">
                                    {it.customWidth && it.customHeight ? (
                                      <span className="bg-zinc-100 text-zinc-700 px-1 py-0.5 rounded font-mono">
                                        {it.customWidth}×{it.customHeight} cm
                                      </span>
                                    ) : null}
                                    {it.materialName ? (
                                      <span className="bg-zinc-100 text-zinc-700 px-1 py-0.5 rounded">
                                        {it.materialName}
                                      </span>
                                    ) : null}
                                    {it.finishing ? (
                                      <span className="bg-zinc-100 text-zinc-700 px-1 py-0.5 rounded">
                                        {it.finishing}
                                      </span>
                                    ) : null}
                                  </div>
                                  {it.notes && (
                                    <div className="text-[9.5px] text-[#898989] italic mt-0.5">
                                      Catatan: {it.notes}
                                    </div>
                                  )}
                                </td>
                                <td className="py-1.5 px-1.5 text-center font-mono font-bold text-[#25343F] text-[10px] align-top">
                                  {it.quantity} {it.unit || 'pcs'}
                                </td>
                                <td className="py-1.5 px-1.5 text-right font-mono text-[#898989] text-[10px] align-top">
                                  {formatRupiah(it.unitPrice || it.price || 0)}
                                </td>
                                <td className="py-1.5 px-1.5 text-right font-mono font-bold text-[#25343F] text-[10.5px] align-top">
                                  {formatRupiah(it.subtotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Calculation & Payment Summary */}
                      <div className="pt-2 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
                        {/* Bank Accounts & Terms */}
                        <div className="p-2 bg-[#EAEFEF]/90 rounded-lg border border-[#BFC9D1]/30 space-y-0.5 text-[9px]">
                          <span className="font-bold text-[#25343F] uppercase tracking-wider block">
                            Informasi Pembayaran:
                          </span>
                          <div className="whitespace-pre-line font-mono text-[#25343F] leading-tight">
                            {settings.bankAccount || 'BCA: 123-456-7890 a.n Sukunaru Studio'}
                          </div>
                          <p className="text-[8.5px] text-[#898989] pt-0.5 border-t border-[#BFC9D1]/40">
                            {settings.footerNotes || 'Terima kasih atas kepercayaan Anda!'}
                          </p>
                        </div>

                        {/* Grand Total Breakdown */}
                        <div className="space-y-0.5 text-[10px] sm:pl-2">
                          <div className="flex justify-between text-[#898989] py-0.5">
                            <span>Total Subtotal:</span>
                            <span className="font-mono font-bold">{formatRupiah(order.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between text-[#898989] py-0.5">
                            <span>Sudah Dibayar (DP):</span>
                            <span className="font-mono font-bold text-[#25343F]">-{formatRupiah(order.paidAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t-2 border-slate-900 text-[#25343F]">
                            <span className="font-black text-[10.5px] uppercase tracking-wider">Sisa Tagihan:</span>
                            <span className="font-mono font-black text-xs text-[#25343F]">
                              {formatRupiah(order.remainingAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-4 pt-3 mt-2 border-t border-[#BFC9D1]/30 text-center text-[9px]">
                        <div>
                          <p className="text-[#898989] mb-6">Penerima / Pelanggan,</p>
                          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-0.5">
                            <span className="font-bold text-[#25343F]">{order.customerName}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[#898989] mb-6">Hormat Kami,</p>
                          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-0.5">
                            <span className="font-bold text-[#25343F]">{settings.businessName || 'Admin'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FORMAT 3: LABEL & STIKER PENGIRIMAN */}
            {docType === 'labels' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeOrders.map((order) => {
                  const isOverdue = isDeadlineOverdue(order.deadlineDate, order.status);
                  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                  const statusBadge = getPrintStatusBadgeStyle(order.paymentStatus, order.remainingAmount);

                  return (
                    <div
                      key={order.id}
                      className="bg-white p-3.5 rounded-xl border-2 border-slate-800 text-[#25343F] space-y-2 shadow-sm batch-page-avoid-break text-[10.5px]"
                    >
                      {/* Label Top */}
                      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs uppercase tracking-wider">
                            {settings.businessName || 'SUKUNARU STUDIO'}
                          </span>
                        </div>
                        <span className="font-mono font-black text-[11px] px-2 py-0.5 bg-[#FF9B51] text-[#25343F] rounded">
                          #{order.orderNumber}
                        </span>
                      </div>

                      {/* Recipient */}
                      <div>
                        <span className="text-[9px] font-bold text-[#898989] uppercase tracking-wider block">
                          Penerima / Pemesan:
                        </span>
                        <h4 className="font-extrabold text-xs text-[#25343F]">{order.customerName}</h4>
                        {order.customerPhone && (
                          <p className="text-[10px] font-mono text-[#25343F]">WA: {order.customerPhone}</p>
                        )}
                      </div>

                      {/* Items */}
                      <div className="p-2 bg-[#EAEFEF] rounded border border-[#BFC9D1]/25 text-[10px]">
                        <span className="text-[9px] font-bold text-[#898989] uppercase block mb-0.5">
                          Isi Paket ({totalQty} pcs):
                        </span>
                        <div className="space-y-0.5 font-semibold text-[#25343F]">
                          {order.items.map((it, iIdx) => (
                            <div key={iIdx} className="truncate">
                              • {it.productName} ({it.quantity} {it.unit || 'pcs'})
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Meta Footer */}
                      <div className="pt-1.5 border-t border-[#BFC9D1]/40 flex items-center justify-between text-[9.5px]">
                        <div>
                          <span className="text-[#898989]">Deadline: </span>
                          <strong className={isOverdue ? 'text-red-600' : 'text-[#25343F]'}>
                            {formatDate(order.deadlineDate)}
                          </strong>
                        </div>
                        <div>
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                            style={statusBadge.style}
                          >
                            {statusBadge.label}
                          </span>
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
          <div className="flex items-center gap-2">
            <button
              id="btn-download-batch-pdf"
              type="button"
              disabled={isExportingPdf || activeOrders.length === 0}
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl border border-[#BFC9D1]/30 bg-white hover:bg-[#EAEFEF] text-[#25343F] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Membuat PDF...' : `Unduh PDF (${currentPaper.name})`}</span>
            </button>

            <button
              id="btn-trigger-batch-print"
              type="button"
              disabled={activeOrders.length === 0}
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-[#25343F] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <PrinterIcon className="w-4 h-4 text-[#FF9B51]" />
              <span>Cetak {activeOrders.length} Dokumen ({currentPaper.name})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

