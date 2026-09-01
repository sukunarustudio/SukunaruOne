import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PrinterIcon, QrCodeIcon, MinusIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Product } from '../types';
import { formatRupiah } from '../lib/utils';
import { renderBarcodeToCanvas, BarcodeFormat } from '../lib/barcodeUtils';
import { downloadElementAsPdf } from '../lib/pdfHelper';
import { useToast } from './Toast';
import { Capacitor } from '@capacitor/core';

interface BarcodeLabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  /** Pre-selected product ID (e.g. from ProductsView edit panel) */
  initialProductId?: string;
}

type LabelSize = '50x30' | '60x40' | 'a4';
const LABEL_SIZE_LABELS: Record<LabelSize, string> = {
  '50x30': '50×30 mm (Label kecil)',
  '60x40': '60×40 mm (Label medium)',
  'a4': 'A4 (Cetak banyak)',
};

interface LabelConfig {
  width: number;  // mm
  height: number; // mm
  perRow: number;
  perCol: number;
  pageW: number;
  pageH: number;
}

const LABEL_CONFIGS: Record<LabelSize, LabelConfig> = {
  '50x30': { width: 50, height: 30, perRow: 1, perCol: 1, pageW: 50, pageH: 30 },
  '60x40': { width: 60, height: 40, perRow: 1, perCol: 1, pageW: 60, pageH: 40 },
  'a4': { width: 63.5, height: 33.9, perRow: 3, perCol: 8, pageW: 210, pageH: 297 },
};

interface SelectedProduct {
  product: Product;
  qty: number;
}

export const BarcodeLabelPrintModal: React.FC<BarcodeLabelPrintModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
}) => {
  const { showToast } = useToast();
  const labelContainerRef = useRef<HTMLDivElement>(null);
  const [labelSize, setLabelSize] = useState<LabelSize>('50x30');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [rendered, setRendered] = useState(false);

  // Initialize with pre-selected product
  useEffect(() => {
    if (!isOpen) {
      setSelectedProducts([]);
      setSearchQuery('');
      setRendered(false);
      return;
    }
    if (initialProductId) {
      const prod = products.find(p => p.id === initialProductId);
      if (prod && prod.barcode) {
        setSelectedProducts([{ product: prod, qty: 1 }]);
      }
    }
  }, [isOpen, initialProductId, products]);

  // Render barcodes into canvases after selected products change
  useEffect(() => {
    if (!isOpen || selectedProducts.length === 0) return;
    setRendered(false);
    const timeout = setTimeout(async () => {
      const canvases = document.querySelectorAll<HTMLCanvasElement>('[data-barcode-canvas]');
      let allOk = true;
      for (const canvas of Array.from(canvases)) {
        const value = canvas.getAttribute('data-barcode-value');
        const format = (canvas.getAttribute('data-barcode-format') as BarcodeFormat) || 'CODE128';
        if (value) {
          const ok = await renderBarcodeToCanvas(canvas, value, format, {
            width: 1.5,
            height: 40,
            displayValue: true,
            fontSize: 10,
            margin: 4,
          });
          if (!ok) allOk = false;
        }
      }
      setRendered(allOk);
    }, 200);
    return () => clearTimeout(timeout);
  }, [isOpen, selectedProducts, labelSize]);

  const filteredProducts = products.filter(p =>
    p.barcode &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleProduct = (product: Product) => {
    setSelectedProducts(prev => {
      const existing = prev.find(sp => sp.product.id === product.id);
      if (existing) {
        return prev.filter(sp => sp.product.id !== product.id);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setSelectedProducts(prev =>
      prev.map(sp =>
        sp.product.id === productId
          ? { ...sp, qty: Math.max(1, Math.min(50, sp.qty + delta)) }
          : sp
      )
    );
  };

  const isSelected = (productId: string) =>
    selectedProducts.some(sp => sp.product.id === productId);

  // Build label items array (repeat by qty)
  const labelItems = selectedProducts.flatMap(sp =>
    Array(sp.qty).fill(sp.product)
  );

  const config = LABEL_CONFIGS[labelSize];

  const handlePrint = async () => {
    if (labelItems.length === 0) {
      showToast('Pilih minimal 1 produk berbarcode untuk dicetak', 'error');
      return;
    }
    if (!rendered) {
      showToast('Menunggu barcode selesai dirender...', 'info');
      return;
    }
    try {
      setIsPrinting(true);
      const filename = `Label-Barcode-${new Date().toISOString().split('T')[0]}.pdf`;
      const success = await downloadElementAsPdf('barcode-label-print-area', {
        filename,
        format: labelSize === 'a4' ? 'a4' : [config.pageW, config.pageH],
        orientation: 'portrait',
        marginMm: labelSize === 'a4' ? 8 : 2,
        scale: 3,
      });
      if (success) {
        showToast(
          Capacitor.isNativePlatform() ? 'Label barcode berhasil disimpan' : 'Label barcode berhasil diunduh',
          'success'
        );
      } else {
        showToast('Gagal membuat PDF label barcode', 'error');
      }
    } catch (err) {
      showToast('Gagal mencetak label barcode', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#BFC9D1]/40 bg-[#25343F] text-white shrink-0">
          <div className="flex items-center gap-2">
            <QrCodeIcon className="w-5 h-5" />
            <span className="font-bold text-sm">Cetak Label Barcode</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center cursor-pointer"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Label Size Selector */}
          <div>
            <label className="block text-xs font-bold text-[#898989] uppercase tracking-wider mb-1.5">
              Ukuran Label
            </label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(LABEL_SIZE_LABELS) as LabelSize[]).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setLabelSize(size)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    labelSize === size
                      ? 'bg-[#25343F] text-white border-[#25343F]'
                      : 'bg-white text-[#898989] border-[#BFC9D1]/50 hover:bg-[#EAEFEF]'
                  }`}
                >
                  {LABEL_SIZE_LABELS[size]}
                </button>
              ))}
            </div>
          </div>

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-bold text-[#898989] uppercase tracking-wider mb-1.5">
              Pilih Produk ({selectedProducts.length} dipilih · {labelItems.length} label)
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari produk berbarcode..."
              className="w-full px-3 py-2 text-xs border border-[#BFC9D1]/40 rounded-xl mb-2 focus:outline-none focus:border-[#25343F]"
            />
            <div className="border border-[#BFC9D1]/30 rounded-xl divide-y divide-[#BFC9D1]/20 max-h-44 overflow-y-auto">
              {filteredProducts.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-[#898989]">
                  {products.filter(p => p.barcode).length === 0
                    ? 'Belum ada produk dengan barcode. Generate barcode di halaman Produk terlebih dahulu.'
                    : 'Produk tidak ditemukan'}
                </div>
              )}
              {filteredProducts.map(prod => {
                const sel = selectedProducts.find(sp => sp.product.id === prod.id);
                return (
                  <div key={prod.id} className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleProduct(prod)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isSelected(prod.id)
                          ? 'bg-[#25343F] border-[#25343F]'
                          : 'bg-white border-[#BFC9D1]'
                      }`}
                    >
                      {isSelected(prod.id) && <CheckIcon className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#25343F] truncate">{prod.name}</p>
                      <p className="text-[10px] text-[#898989] font-mono truncate">{prod.barcode}</p>
                    </div>
                    <span className="text-xs font-bold text-[#25343F] shrink-0">
                      {formatRupiah(prod.sellingPrice)}
                    </span>
                    {isSelected(prod.id) && sel && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => updateQty(prod.id, -1)}
                          className="w-5 h-5 rounded bg-[#EAEFEF] flex items-center justify-center cursor-pointer">
                          <MinusIcon className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center">{sel.qty}</span>
                        <button type="button" onClick={() => updateQty(prod.id, 1)}
                          className="w-5 h-5 rounded bg-[#25343F] text-white flex items-center justify-center cursor-pointer">
                          <PlusIcon className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Label Preview */}
          {selectedProducts.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#898989] uppercase tracking-wider mb-2">
                Preview ({labelItems.length} label)
              </label>
              {/* Hidden printable area */}
              <div
                id="barcode-label-print-area"
                ref={labelContainerRef}
                className="bg-white"
                style={{
                  width: labelSize === 'a4' ? '210mm' : `${config.pageW}mm`,
                  padding: labelSize === 'a4' ? '8mm' : '2mm',
                  display: labelSize === 'a4' ? 'grid' : 'block',
                  gridTemplateColumns: labelSize === 'a4' ? `repeat(${config.perRow}, 1fr)` : undefined,
                  gap: labelSize === 'a4' ? '2mm' : undefined,
                  boxSizing: 'border-box',
                }}
              >
                {labelItems.map((prod: Product, idx: number) => (
                  <div
                    key={`${prod.id}-${idx}`}
                    style={{
                      width: labelSize === 'a4' ? '100%' : `${config.width}mm`,
                      height: labelSize === 'a4' ? `${config.height}mm` : `${config.height}mm`,
                      border: '0.5pt solid #ddd',
                      borderRadius: '2mm',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2mm',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      backgroundColor: '#fff',
                      pageBreakInside: 'avoid',
                    }}
                  >
                    <p style={{ fontSize: '6pt', fontWeight: 700, textAlign: 'center', marginBottom: '1mm', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prod.name}
                    </p>
                    <canvas
                      data-barcode-canvas
                      data-barcode-value={prod.barcode}
                      data-barcode-format={prod.barcodeType || 'CODE128'}
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                    <p style={{ fontSize: '6pt', color: '#666', marginTop: '1mm' }}>
                      {formatRupiah(prod.sellingPrice)}
                    </p>
                  </div>
                ))}
              </div>
              {!rendered && (
                <p className="text-xs text-[#898989] text-center mt-1 animate-pulse">Merender barcode...</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-4 py-3 border-t border-[#BFC9D1]/40 flex gap-2 shrink-0 bg-[#EAEFEF]/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#BFC9D1]/50 text-[#898989] text-sm font-semibold hover:bg-white cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting || selectedProducts.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-[#25343F] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isPrinting ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <PrinterIcon className="w-4 h-4" />
            )}
            {isPrinting ? 'Membuat PDF...' : `Cetak ${labelItems.length} Label`}
          </button>
        </div>
      </div>
    </div>
  );
};
