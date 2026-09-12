import React, { useState, useEffect } from 'react';
import {
  CalculatorIcon,
  PlusIcon,
  SparklesIcon,
  DocumentCheckIcon,
  ChartPieIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { api } from '../services/api';
import { Material, StockItem, Product, ProductComponent } from '../types';
import { formatRupiah } from '../lib/utils';
import { useToast } from '../components/Toast';

interface HppCalculatorViewProps {
  onSavedToProducts?: () => void;
  onNavigate?: (view: any) => void;
}

interface HppMaterialRow {
  id: string;
  materialId?: string;
  source: 'material' | 'stock' | 'custom';
  name: string;
  unitCost: number;
  quantity: number;
  unit: string;
}

interface AvailableInventoryItem {
  id: string;
  originalId: string;
  source: 'stock' | 'material';
  name: string;
  unitCost: number;
  unit: string;
  category?: string;
  currentStock?: number;
  sku?: string;
}

export const HppCalculatorView: React.FC<HppCalculatorViewProps> = ({
  onSavedToProducts,
  onNavigate,
}) => {
  const { showToast } = useToast();

  const [availableStock, setAvailableStock] = useState<AvailableInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Calculation parameters
  const [calculationName, setCalculationName] = useState('Simulasi Produk Baru');
  const [batchQuantity, setBatchQuantity] = useState<number>(100);

  // Multi-material components
  const [components, setComponents] = useState<HppMaterialRow[]>([
    {
      id: 'row_1',
      materialId: '',
      source: 'custom',
      name: 'Bahan Baku Utama',
      unitCost: 1200,
      quantity: 1,
      unit: 'pcs',
    },
  ]);

  // Overhead per unit
  const [inkCost, setInkCost] = useState<number>(400);
  const [electricityCost, setElectricityCost] = useState<number>(150);
  const [laborCost, setLaborCost] = useState<number>(300);
  const [machineDepreciationCost, setMachineDepreciationCost] = useState<number>(100);
  const [finishingCost, setFinishingCost] = useState<number>(350); // laminasi/cutting
  const [packagingCost, setPackagingCost] = useState<number>(150);

  // Pricing margin
  const [marginPercent, setMarginPercent] = useState<number>(50);
  const [customSellingPrice, setCustomSellingPrice] = useState<number>(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mats, stockItems] = await Promise.all([
        api.getMaterials().catch(() => []),
        api.getStockItems().catch(() => []),
      ]);

      const items: AvailableInventoryItem[] = [];

      // 1. Tambah dari Stok Barang (Master Unified Inventory)
      if (Array.isArray(stockItems)) {
        stockItems.forEach((s: StockItem) => {
          items.push({
            id: `stock_${s.id}`,
            originalId: s.id,
            source: 'stock',
            name: s.name,
            unitCost: s.costPrice || s.purchasePrice || 0,
            unit: s.baseUnit || 'pcs',
            category: s.category || (s.itemType === 'RAW_MATERIAL' ? 'Bahan Baku' : 'Stok Barang'),
            currentStock: s.currentStock,
            sku: s.sku,
          });
        });
      }

      // 2. Tambah dari legacy Materials jika belum ada
      if (Array.isArray(mats)) {
        mats.forEach((m: Material) => {
          if (!items.some(it => it.name.toLowerCase() === m.name.toLowerCase())) {
            items.push({
              id: `mat_${m.id}`,
              originalId: m.id,
              source: 'material',
              name: m.name,
              unitCost: m.unitCost || m.purchasePrice || 0,
              unit: m.unit || 'pcs',
              category: m.category || 'Bahan Baku',
              currentStock: m.currentStock,
              sku: m.sku,
            });
          }
        });
      }

      setAvailableStock(items);

      // Inisialisasi baris pertama jika stok tersedia dan form masih default
      if (items.length > 0) {
        setComponents(prev => {
          if (prev.length === 1 && (!prev[0].name || prev[0].name === 'Bahan Baku Utama')) {
            const first = items[0];
            return [
              {
                id: 'row_1',
                materialId: first.id,
                source: first.source,
                name: first.name,
                unitCost: first.unitCost,
                quantity: 1,
                unit: first.unit,
              },
            ];
          }
          return prev;
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data stok dan bahan baku', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Multi-material Handlers
  const handleAddComponent = () => {
    const newId = `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setComponents(prev => [
      ...prev,
      {
        id: newId,
        materialId: '',
        source: 'custom',
        name: '',
        unitCost: 0,
        quantity: 1,
        unit: 'pcs',
      },
    ]);
  };

  const handleRemoveComponent = (id: string) => {
    setComponents(prev => {
      if (prev.length <= 1) {
        return [
          {
            id: `row_${Date.now()}`,
            materialId: '',
            source: 'custom',
            name: '',
            unitCost: 0,
            quantity: 1,
            unit: 'pcs',
          },
        ];
      }
      return prev.filter(c => c.id !== id);
    });
  };

  const handleUpdateComponent = (id: string, updates: Partial<HppMaterialRow>) => {
    setComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleSelectStockForComponent = (id: string, selectedStockId: string) => {
    if (selectedStockId === 'CUSTOM_MANUAL' || !selectedStockId) {
      handleUpdateComponent(id, {
        materialId: '',
        source: 'custom',
        name: '',
        unitCost: 0,
        unit: 'pcs',
      });
      return;
    }

    const item = availableStock.find(s => s.id === selectedStockId);
    if (item) {
      handleUpdateComponent(id, {
        materialId: item.id,
        source: item.source,
        name: item.name,
        unitCost: item.unitCost,
        unit: item.unit,
      });
    }
  };

  // Calculations per unit
  const totalMaterialCostPerUnit = components.reduce(
    (sum, c) => sum + (Number(c.unitCost) || 0) * (Number(c.quantity) || 0),
    0
  );

  const totalOverheadPerUnit =
    inkCost +
    electricityCost +
    laborCost +
    machineDepreciationCost +
    finishingCost +
    packagingCost;

  const hppPerUnit = totalMaterialCostPerUnit + totalOverheadPerUnit;

  const suggestedSellingPrice =
    customSellingPrice > 0
      ? customSellingPrice
      : Math.ceil((hppPerUnit * (1 + marginPercent / 100)) / 500) * 500;

  const profitPerUnit = Math.max(0, suggestedSellingPrice - hppPerUnit);
  const actualMarginPercent =
    hppPerUnit > 0 ? Math.round((profitPerUnit / hppPerUnit) * 100) : 0;

  // Batch Calculations
  const totalBatchHpp = hppPerUnit * batchQuantity;
  const totalBatchRevenue = suggestedSellingPrice * batchQuantity;
  const totalBatchProfit = profitPerUnit * batchQuantity;

  // Chart Data
  const chartData = [
    ...components
      .filter(c => (Number(c.unitCost) || 0) * (Number(c.quantity) || 0) > 0)
      .map((c, idx) => {
        const materialColors = ['#FF9B51', '#F59E0B', '#EAB308', '#84CC16', '#10B981', '#06B6D4'];
        return {
          name: c.name || `Bahan #${idx + 1}`,
          value: (Number(c.unitCost) || 0) * (Number(c.quantity) || 0),
          color: materialColors[idx % materialColors.length],
        };
      }),
    { name: 'Bahan Penolong', value: inkCost, color: '#0B90FE' },
    { name: 'Listrik & Utilitas', value: electricityCost, color: '#10B981' },
    { name: 'Upah / Tenaga Kerja', value: laborCost, color: '#8B5CF6' },
    { name: 'Penyusutan Alat & Mesin', value: machineDepreciationCost, color: '#F59E0B' },
    { name: 'Proses Akhir / Finishing', value: finishingCost, color: '#6366F1' },
    { name: 'Kemasan & Packaging', value: packagingCost, color: '#EC4899' },
  ].filter(d => d.value > 0);

  // Reset calculation form
  const handleReset = () => {
    setCalculationName('');
    setBatchQuantity(100);
    if (availableStock.length > 0) {
      const first = availableStock[0];
      setComponents([
        {
          id: `row_${Date.now()}`,
          materialId: first.id,
          source: first.source,
          name: first.name,
          unitCost: first.unitCost,
          quantity: 1,
          unit: first.unit,
        },
      ]);
    } else {
      setComponents([
        {
          id: `row_${Date.now()}`,
          materialId: '',
          source: 'custom',
          name: '',
          unitCost: 0,
          quantity: 1,
          unit: 'pcs',
        },
      ]);
    }
    setInkCost(0);
    setElectricityCost(0);
    setLaborCost(0);
    setMachineDepreciationCost(0);
    setFinishingCost(0);
    setPackagingCost(0);
    setMarginPercent(50);
    setCustomSellingPrice(0);
    showToast('Kalkulator HPP berhasil direset', 'info');
  };

  // Save to Product
  const handleSaveAsProduct = async () => {
    if (!calculationName.trim()) {
      showToast('Masukkan nama produk terlebih dahulu', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const validComponents: ProductComponent[] = components
        .filter(c => c.name.trim() || c.unitCost > 0)
        .map((c, idx) => ({
          id: `comp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
          materialId: c.materialId ? c.materialId.replace(/^(stock_|mat_)/, '') : undefined,
          componentName: c.name.trim() || `Bahan Baku #${idx + 1}`,
          quantity: Number(c.quantity) || 1,
          unit: c.unit || 'pcs',
          unitCost: Number(c.unitCost) || 0,
          subtotal: (Number(c.unitCost) || 0) * (Number(c.quantity) || 1),
        }));

      const skuCode = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;

      const productPayload: Partial<Product> = {
        sku: skuCode,
        name: calculationName.trim(),
        category: 'Hasil Produksi',
        type: 'PHYSICAL',
        unit: 'pcs',
        description: `Dibuat dari Kalkulator HPP: Margin ${actualMarginPercent}% (${validComponents.length} bahan baku)`,
        costPrice: hppPerUnit,
        sellingPrice: suggestedSellingPrice,
        profit: profitPerUnit,
        marginPercent: actualMarginPercent,
        profitMargin: actualMarginPercent,
        laborCost,
        machineCost: machineDepreciationCost + electricityCost,
        otherCost: inkCost + finishingCost + packagingCost,
        components: validComponents,
        trackStock: true,
        currentStock: 0,
        minStock: 5,
        isActive: true,
      };

      await api.createProduct(productPayload);

      // Sinkronisasi otomatis ke Master Stok Barang jika didukung
      try {
        await api.createStockItem({
          name: calculationName.trim(),
          sku: skuCode,
          category: 'Hasil Produksi',
          itemType: 'PRODUCED',
          trackStock: true,
          currentStock: 0,
          minStock: 5,
          baseUnit: 'pcs',
          purchasePrice: hppPerUnit,
          costPrice: hppPerUnit,
          sellingPrice: suggestedSellingPrice,
          laborCost,
          machineCost: machineDepreciationCost + electricityCost,
          otherCost: inkCost + finishingCost + packagingCost,
          profit: profitPerUnit,
          profitMargin: actualMarginPercent,
          components: validComponents.map(vc => ({
            id: vc.id,
            itemId: vc.materialId || '',
            componentName: vc.componentName,
            quantity: vc.quantity,
            unit: vc.unit,
            unitCost: vc.unitCost,
            subtotal: vc.subtotal,
          })),
          isActive: true,
        });
      } catch {
        // Abaikan jika stock items tidak tersinkron
      }

      showToast(
        `Produk "${calculationName.trim()}" berhasil disimpan ke Katalog Produk!`,
        'success'
      );
      if (onSavedToProducts) onSavedToProducts();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan ke produk', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="hpp-calculator-view" className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── STICKY TOP HEADER ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF]/90 dark:bg-[#0B0F17]/90 backdrop-blur-xl py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate?.('dashboard')}
            className="p-2 -ml-2 text-[#25343F] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer active:scale-90 shrink-0"
            title="Kembali ke Beranda"
          >
            <ArrowLeftIcon className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] dark:text-white leading-tight tracking-tight truncate">
              Hitung HPP Produk
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] dark:text-slate-400 font-medium truncate hidden sm:block">
              Kalkulator biaya pokok produksi, resep multi bahan baku &amp; simulasi harga jual
            </p>
          </div>
        </div>

        <button
          id="btn-reset-hpp"
          type="button"
          onClick={handleReset}
          className="h-9 px-3.5 bg-white dark:bg-[#151C24] hover:bg-rose-50 hover:border-rose-300 text-[#25343F] hover:text-rose-600 dark:text-slate-200 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 border border-[#BFC9D1]/40 dark:border-white/[0.08] shadow-xs"
          title="Reset semua hitungan HPP"
        >
          <ArrowPathIcon className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Reset</span>
        </button>
      </div>

      {/* ── TOP HIGHLIGHT SUMMARY CARD (Live Output) ── */}
      <div className="bg-white dark:bg-[#151C24] rounded-2xl border border-[#BFC9D1]/30 dark:border-white/[0.08] p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-[#BFC9D1]/25 dark:divide-white/[0.08]">
          {/* 1. HPP Per Unit */}
          <div className="pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#898989] dark:text-slate-400 block">
              Biaya Pokok (HPP) / Pcs
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#25343F] dark:text-white font-mono mt-0.5">
              {formatRupiah(hppPerUnit)}
            </div>
            <span className="text-[11px] text-[#898989] dark:text-slate-400 font-medium block mt-0.5">
              Total modal dasar produksi ({components.length} bahan)
            </span>
          </div>

          {/* 2. Target Margin */}
          <div className="py-3 sm:py-0 sm:px-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#898989] dark:text-slate-400">
                Margin Keuntungan
              </span>
              <span className="text-xs font-black text-[#FF9B51] font-mono bg-[#FFF0E6] dark:bg-[#FF9B51]/10 px-2 py-0.5 rounded-md">
                +{marginPercent}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[30, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setMarginPercent(pct);
                    setCustomSellingPrice(0);
                  }}
                  className={`py-1 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
                    marginPercent === pct && customSellingPrice === 0
                      ? 'bg-[#25343F] text-white border-[#25343F] dark:bg-[#FF9B51] dark:text-[#25343F] dark:border-[#FF9B51] shadow-xs'
                      : 'bg-white dark:bg-[#151C24] text-[#898989] dark:text-slate-400 border-[#BFC9D1]/40 dark:border-white/[0.08] hover:bg-[#EAEFEF] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>

          {/* 3. Suggested Selling Price */}
          <div className="pt-3 sm:pt-0 sm:pl-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] block">
              Rekomendasi Harga Jual
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#10B981] font-mono mt-0.5">
              {formatRupiah(suggestedSellingPrice)}
            </div>
            <div className="text-[11px] font-bold text-[#25343F] dark:text-slate-200 mt-0.5">
              Untung: <span className="text-[#10B981]">+{formatRupiah(profitPerUnit)}</span> / pcs
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Clean, Structured Inputs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: Nama Produk & Resep Multi Bahan Baku */}
          <div className="bg-white dark:bg-[#151C24] p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#BFC9D1]/20 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9B51]" />
                <h3 className="font-extrabold text-[#25343F] dark:text-white text-sm">
                  1. Identitas &amp; Bahan Baku Produksi
                </h3>
                <span className="text-[11px] font-bold text-[#898989] dark:text-slate-400">
                  ({components.length} bahan)
                </span>
              </div>
              <span className="text-xs font-black text-[#25343F] dark:text-white font-mono bg-[#EAEFEF] dark:bg-white/[0.08] px-2.5 py-0.5 rounded-lg">
                {formatRupiah(totalMaterialCostPerUnit)}
              </span>
            </div>

            {/* Nama Produk */}
            <div>
              <label className="block text-[11px] font-bold text-[#898989] dark:text-slate-400 uppercase tracking-wider mb-1">
                Nama Produk / Barang Jadi
              </label>
              <input
                type="text"
                value={calculationName}
                onChange={e => setCalculationName(e.target.value)}
                placeholder="Contoh: Paket Hampers, Kaos Sablon, Box Kemasan, Brownies, dll"
                className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-black/20 border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-xl font-bold text-[#25343F] dark:text-white text-sm focus:bg-white dark:focus:bg-black/40 focus:border-[#FF9B51] focus:ring-1 focus:ring-[#FF9B51] transition-all outline-none"
              />
            </div>

            {/* Daftar Multi Bahan Baku */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#898989] dark:text-slate-400 uppercase tracking-wider">
                  Rincian Bahan Baku &amp; Komponen
                </span>
                <span className="text-[11px] text-[#898989] dark:text-slate-400 font-medium">
                  {availableStock.length} opsi stok barang
                </span>
              </div>

              {components.map((comp, index) => {
                const rowSubtotal = (Number(comp.unitCost) || 0) * (Number(comp.quantity) || 0);
                return (
                  <div
                    key={comp.id}
                    className="p-3 bg-[#F8FAFC] dark:bg-white/[0.03] rounded-xl border border-[#BFC9D1]/30 dark:border-white/[0.08] space-y-2.5 transition-all"
                  >
                    {/* Header Row Bahan Baku */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-md bg-[#25343F] dark:bg-white/10 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <select
                            value={comp.materialId || (comp.source === 'custom' ? 'CUSTOM_MANUAL' : '')}
                            onChange={e => handleSelectStockForComponent(comp.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/40 dark:border-white/[0.1] rounded-lg text-xs font-bold text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51]"
                          >
                            <option value="CUSTOM_MANUAL">✏️ Input Manual (Bahan Kustom / Baru)</option>
                            {availableStock.filter(s => s.source === 'stock').length > 0 && (
                              <optgroup label="📦 Stok Barang (Master Inventory)">
                                {availableStock
                                  .filter(s => s.source === 'stock')
                                  .map(item => (
                                    <option key={item.id} value={item.id}>
                                      {item.name} ({formatRupiah(item.unitCost)} / {item.unit})
                                      {item.currentStock !== undefined ? ` • Stok: ${item.currentStock}` : ''}
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                            {availableStock.filter(s => s.source === 'material').length > 0 && (
                              <optgroup label="🌾 Bahan Baku (Inventory)">
                                {availableStock
                                  .filter(s => s.source === 'material')
                                  .map(item => (
                                    <option key={item.id} value={item.id}>
                                      {item.name} ({formatRupiah(item.unitCost)} / {item.unit})
                                      {item.currentStock !== undefined ? ` • Stok: ${item.currentStock}` : ''}
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-black font-mono text-[#25343F] dark:text-white bg-white dark:bg-black/20 px-2 py-1 rounded-md border border-[#BFC9D1]/20 dark:border-white/[0.06]">
                          {formatRupiah(rowSubtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(comp.id)}
                          className="p-1.5 text-[#898989] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          title="Hapus baris bahan baku"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Jika custom/manual atau perlu edit nama */}
                    {(comp.source === 'custom' || !comp.materialId) && (
                      <div>
                        <input
                          type="text"
                          value={comp.name}
                          onChange={e => handleUpdateComponent(comp.id, { name: e.target.value })}
                          placeholder="Ketik nama bahan baku kustom..."
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg text-xs font-semibold text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51]"
                        />
                      </div>
                    )}

                    {/* Grid Biaya, Qty, Satuan */}
                    <div className="grid grid-cols-12 gap-2 text-xs">
                      {/* Biaya Satuan */}
                      <div className="col-span-5">
                        <label className="block text-[10px] font-bold text-[#898989] dark:text-slate-400 mb-0.5">
                          Harga Beli Satuan (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={comp.unitCost || ''}
                          placeholder="0"
                          onChange={e => handleUpdateComponent(comp.id, { unitCost: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg font-bold font-mono text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51]"
                        />
                      </div>

                      {/* Jumlah Pemakaian */}
                      <div className="col-span-4">
                        <label className="block text-[10px] font-bold text-[#898989] dark:text-slate-400 mb-0.5">
                          Jumlah / Pcs
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={comp.quantity}
                          onChange={e => handleUpdateComponent(comp.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg font-bold font-mono text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51]"
                        />
                      </div>

                      {/* Satuan */}
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-[#898989] dark:text-slate-400 mb-0.5">
                          Satuan
                        </label>
                        <input
                          type="text"
                          value={comp.unit}
                          placeholder="pcs"
                          onChange={e => handleUpdateComponent(comp.id, { unit: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg font-bold text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51] text-center"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Tombol + Tambah Bahan Baku Lainnya */}
              <button
                id="btn-add-material-row"
                type="button"
                onClick={handleAddComponent}
                className="w-full py-2.5 px-3 bg-[#FFF0E6] hover:bg-[#FFE2CC] text-[#FF9B51] dark:bg-[#FF9B51]/10 dark:hover:bg-[#FF9B51]/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-[#FF9B51]/30 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                <span>+ Tambah Bahan Baku Lainnya</span>
              </button>
            </div>
          </div>

          {/* Card 2: Biaya Tambahan & Overhead (Compact 2-Column Grid) */}
          <div className="bg-white dark:bg-[#151C24] p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-sm space-y-3">
            <h3 className="font-extrabold text-[#25343F] dark:text-white text-sm border-b border-[#BFC9D1]/20 dark:border-white/[0.08] pb-2.5">
              2. Biaya Penolong &amp; Operasional (Overhead)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Bahan Penolong / Tambahan */}
              <div className="bg-[#F8FAFC] dark:bg-white/[0.03] p-2.5 rounded-xl border border-[#BFC9D1]/20 dark:border-white/[0.06]">
                <label className="font-bold text-[#25343F] dark:text-white block text-[11px] mb-1">
                  Bahan Penolong / Tambahan
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={inkCost || ''}
                    placeholder="0"
                    onChange={e => setInkCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg font-bold font-mono text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>

              {/* Listrik & Utilitas */}
              <div className="bg-[#F8FAFC] dark:bg-white/[0.03] p-2.5 rounded-xl border border-[#BFC9D1]/20 dark:border-white/[0.06]">
                <label className="font-bold text-[#25343F] dark:text-white block text-[11px] mb-1">
                  Operasional &amp; Utilitas
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={electricityCost || ''}
                    placeholder="0"
                    onChange={e => setElectricityCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg font-bold font-mono text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>

              {/* Tenaga Kerja */}
              <div className="bg-[#F8FAFC] dark:bg-white/[0.03] p-2.5 rounded-xl border border-[#BFC9D1]/20 dark:border-white/[0.06]">
                <label className="font-bold text-[#25343F] dark:text-white block text-[11px] mb-1">
                  Tenaga Kerja / Upah Produksi
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={laborCost || ''}
                    placeholder="0"
                    onChange={e => setLaborCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg font-bold font-mono text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>

              {/* Penyusutan Alat / Mesin */}
              <div className="bg-[#F8FAFC] dark:bg-white/[0.03] p-2.5 rounded-xl border border-[#BFC9D1]/20 dark:border-white/[0.06]">
                <label className="font-bold text-[#25343F] dark:text-white block text-[11px] mb-1">
                  Penyusutan Alat &amp; Mesin
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={machineDepreciationCost || ''}
                    placeholder="0"
                    onChange={e => setMachineDepreciationCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg font-bold font-mono text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>

              {/* Finishing / Proses Akhir */}
              <div className="bg-[#F8FAFC] dark:bg-white/[0.03] p-2.5 rounded-xl border border-[#BFC9D1]/20 dark:border-white/[0.06]">
                <label className="font-bold text-[#25343F] dark:text-white block text-[11px] mb-1">
                  Proses Akhir / Finishing
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={finishingCost || ''}
                    placeholder="0"
                    onChange={e => setFinishingCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg font-bold font-mono text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>

              {/* Kemasan */}
              <div className="bg-[#F8FAFC] dark:bg-white/[0.03] p-2.5 rounded-xl border border-[#BFC9D1]/20 dark:border-white/[0.06]">
                <label className="font-bold text-[#25343F] dark:text-white block text-[11px] mb-1">
                  Kemasan &amp; Packaging
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={packagingCost || ''}
                    placeholder="0"
                    onChange={e => setPackagingCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-[#151C24] border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg font-bold font-mono text-[#25343F] dark:text-white outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Simulasi Borongan / Massal */}
          <div className="bg-white dark:bg-[#151C24] p-4 rounded-2xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-sm flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-[#25343F] dark:text-white block">
                Simulasi Jumlah Produksi Massal
              </span>
              <span className="text-[11px] text-[#898989] dark:text-slate-400">
                Hitung proyeksi modal &amp; omzet borongan
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="1"
                value={batchQuantity}
                onChange={e => setBatchQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-16 px-2 py-1.5 bg-[#F8FAFC] dark:bg-black/20 border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-lg text-center font-bold text-xs text-[#25343F] dark:text-white font-mono outline-none focus:border-[#FF9B51]"
              />
              <span className="text-xs font-bold text-[#898989] dark:text-slate-400">pcs</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Rincian Borongan, Chart & Simpan */}
        <div className="lg:col-span-5 space-y-4">
          {/* Batch Projection Summary */}
          <div className="bg-white dark:bg-[#151C24] p-5 rounded-2xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-sm space-y-3 text-xs">
            <h4 className="font-extrabold text-[#25343F] dark:text-white text-sm border-b border-[#BFC9D1]/20 dark:border-white/[0.08] pb-2 flex items-center justify-between">
              <span>Proyeksi {batchQuantity} Pcs Pesanan</span>
              <span className="text-[11px] font-bold text-[#FF9B51]">Margin {actualMarginPercent}%</span>
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-[#898989] dark:text-slate-400">
                <span>Total Modal (HPP):</span>
                <span className="font-bold text-[#25343F] dark:text-white font-mono">{formatRupiah(totalBatchHpp)}</span>
              </div>
              <div className="flex justify-between text-[#898989] dark:text-slate-400">
                <span>Total Omzet Penjualan:</span>
                <span className="font-bold text-[#25343F] dark:text-white font-mono">{formatRupiah(totalBatchRevenue)}</span>
              </div>
              <div className="flex justify-between text-[#10B981] font-extrabold pt-2 border-t border-[#BFC9D1]/30 dark:border-white/[0.08] text-sm">
                <span>Total Profit Bersih:</span>
                <span className="font-mono">+{formatRupiah(totalBatchProfit)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-3.5 bg-white dark:bg-[#151C24] hover:bg-rose-50 hover:border-rose-300 text-[#898989] hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-[#BFC9D1]/30 dark:border-white/[0.08] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Reset Hitungan"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                id="btn-save-hpp-to-product"
                type="button"
                disabled={isSaving}
                onClick={handleSaveAsProduct}
                className="flex-1 py-2.5 px-4 bg-[#FF9B51] hover:bg-[#ff8c38] disabled:opacity-50 text-[#25343F] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {isSaving ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <DocumentCheckIcon className="w-4 h-4" />
                )}
                <span>Simpan ke Katalog Produk</span>
              </button>
            </div>
          </div>

          {/* Cost Composition Chart */}
          <div className="bg-white dark:bg-[#151C24] p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/25 dark:border-white/[0.08] shadow-sm">
            <h4 className="font-bold text-[#25343F] dark:text-white text-xs mb-2 flex items-center gap-1.5">
              <ChartPieIcon className="w-4 h-4 text-[#FF9B51]" />
              Proporsi Komponen Biaya HPP ({chartData.length} item)
            </h4>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatRupiah(Number(value)), 'Biaya']}
                    contentStyle={{ borderRadius: 10, fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-[10.5px]">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[#898989] dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HppCalculatorView;
