import React, { useState, useEffect } from 'react';
import {
  CalculatorIcon,
  PlusIcon,
  SparklesIcon,
  DocumentCheckIcon,
  ChartPieIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { api } from '../services/api';
import { Material } from '../types';
import { formatRupiah } from '../lib/utils';
import { useToast } from '../components/Toast';

interface HppCalculatorViewProps {
  onSavedToProducts?: () => void;
  onNavigate?: (view: any) => void;
}

export const HppCalculatorView: React.FC<HppCalculatorViewProps> = ({
  onSavedToProducts,
  onNavigate,
}) => {
  const { showToast } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculation parameters
  const [calculationName, setCalculationName] = useState('Simulasi Produk Baru');
  const [batchQuantity, setBatchQuantity] = useState<number>(100);

  // Material selection & costs
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [materialUnitCost, setMaterialUnitCost] = useState<number>(1200);
  const [materialQtyPerUnit, setMaterialQtyPerUnit] = useState<number>(1);

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

  // Preset templates
  const presets = [
    {
      label: 'Stiker Vinyl A3+',
      matCost: 1500,
      ink: 500,
      elec: 200,
      labor: 300,
      machine: 150,
      finish: 400,
      pack: 150,
      margin: 60,
    },
    {
      label: 'Foto MDF 20x30',
      matCost: 7500,
      ink: 1200,
      elec: 300,
      labor: 1500,
      machine: 500,
      finish: 800,
      pack: 1000,
      margin: 80,
    },
    {
      label: 'Sertifikat A4',
      matCost: 900,
      ink: 350,
      elec: 100,
      labor: 200,
      machine: 100,
      finish: 0,
      pack: 100,
      margin: 70,
    },
    {
      label: 'Brosur Art Paper',
      matCost: 650,
      ink: 400,
      elec: 150,
      labor: 200,
      machine: 100,
      finish: 200,
      pack: 100,
      margin: 50,
    },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const mats = await api.getMaterials();
      setMaterials(mats);
      if (mats.length > 0) {
        setSelectedMaterialId(mats[0].id);
        setMaterialUnitCost(mats[0].unitCost);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat bahan baku', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectMaterial = (id: string) => {
    setSelectedMaterialId(id);
    const m = materials.find(mat => mat.id === id);
    if (m) {
      setMaterialUnitCost(m.unitCost);
    }
  };

  const applyPreset = (preset: (typeof presets)[0]) => {
    setCalculationName(preset.label);
    setMaterialUnitCost(preset.matCost);
    setInkCost(preset.ink);
    setElectricityCost(preset.elec);
    setLaborCost(preset.labor);
    setMachineDepreciationCost(preset.machine);
    setFinishingCost(preset.finish);
    setPackagingCost(preset.pack);
    setMarginPercent(preset.margin);
    setCustomSellingPrice(0);
    showToast(`Template "${preset.label}" berhasil dimuat`, 'info');
  };

  // Calculations per unit
  const totalMaterialCostPerUnit = materialUnitCost * materialQtyPerUnit;
  const hppPerUnit =
    totalMaterialCostPerUnit +
    inkCost +
    electricityCost +
    laborCost +
    machineDepreciationCost +
    finishingCost +
    packagingCost;

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
    { name: 'Bahan Baku', value: totalMaterialCostPerUnit, color: '#FF9B51' },
    { name: 'Bahan Penolong', value: inkCost, color: '#0B90FE' },
    { name: 'Listrik & Utilitas', value: electricityCost, color: '#10B981' },
    { name: 'Upah / Tenaga Kerja', value: laborCost, color: '#8B5CF6' },
    { name: 'Penyusutan Mesin', value: machineDepreciationCost, color: '#F59E0B' },
    { name: 'Proses Akhir', value: finishingCost, color: '#6366F1' },
    { name: 'Kemasan', value: packagingCost, color: '#EC4899' },
  ].filter(d => d.value > 0);

  // Save to Product
  const handleSaveAsProduct = async () => {
    try {
      const payload = {
        sku: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
        name: calculationName,
        category: 'Percetakan',
        type: 'CETAK' as const,
        unit: 'pcs',
        description: `Dibuat dari Kalkulator HPP: Margin ${actualMarginPercent}%`,
        costPrice: hppPerUnit,
        sellingPrice: suggestedSellingPrice,
        marginPercent: actualMarginPercent,
        laborCost,
        machineCost: machineDepreciationCost + electricityCost,
        otherCost: inkCost + finishingCost + packagingCost,
        isActive: true,
      };

      await api.createProduct(payload);
      showToast(`Produk "${calculationName}" berhasil ditambahkan ke Katalog Produk!`, 'success');
      if (onSavedToProducts) onSavedToProducts();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan ke produk', 'error');
    }
  };

  return (
    <div id="hpp-calculator-view" className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── STICKY TOP HEADER ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate?.('dashboard')}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-sm"
            title="Kembali ke Beranda"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Hitung HPP Produk
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium truncate hidden sm:block">
              Kalkulator biaya pokok produksi & simulasi margin harga jual
            </p>
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {presets.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white hover:bg-[#FFF0E6] hover:text-[#FF9B51] border border-[#BFC9D1]/30 text-[#25343F] transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MOBILE PRESETS BAR ── */}
      <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {presets.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg bg-white hover:bg-[#FFF0E6] text-[#25343F] border border-[#BFC9D1]/30 shrink-0 shadow-2xs active:scale-95"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── TOP HIGHLIGHT SUMMARY CARD (Live Output) ── */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/30 p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-[#BFC9D1]/25">
          {/* 1. HPP Per Unit */}
          <div className="pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#898989] block">
              Biaya Pokok (HPP) / Pcs
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#25343F] font-mono mt-0.5">
              {formatRupiah(hppPerUnit)}
            </div>
            <span className="text-[11px] text-[#898989] font-medium block mt-0.5">
              Total modal dasar produksi
            </span>
          </div>

          {/* 2. Target Margin */}
          <div className="py-3 sm:py-0 sm:px-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#898989]">
                Margin Keuntungan
              </span>
              <span className="text-xs font-black text-[#FF9B51] font-mono bg-[#FFF0E6] px-2 py-0.5 rounded-md">
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
                      ? 'bg-[#25343F] text-white border-[#25343F] shadow-xs'
                      : 'bg-white text-[#898989] border-[#BFC9D1]/40 hover:bg-[#EAEFEF]'
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
            <div className="text-[11px] font-bold text-[#25343F] mt-0.5">
              Untung: <span className="text-[#10B981]">+{formatRupiah(profitPerUnit)}</span> / pcs
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Clean, Structured Inputs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: Nama Produk & Bahan Baku Utama */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-sm space-y-3.5">
            <h3 className="font-extrabold text-[#25343F] text-sm flex items-center justify-between border-b border-[#BFC9D1]/20 pb-2.5">
              <span>1. Identitas & Bahan Baku Utama</span>
              <span className="text-xs font-black text-[#25343F] font-mono bg-[#EAEFEF] px-2.5 py-0.5 rounded-lg">
                {formatRupiah(totalMaterialCostPerUnit)}
              </span>
            </h3>

            {/* Nama Produk */}
            <div>
              <label className="block text-[11px] font-bold text-[#898989] uppercase tracking-wider mb-1">
                Nama Produk / Pekerjaan
              </label>
              <input
                type="text"
                value={calculationName}
                onChange={e => setCalculationName(e.target.value)}
                placeholder="Contoh: Stiker Vinyl A3+ Cutting"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl font-bold text-[#25343F] text-sm focus:bg-white focus:border-[#FF9B51] focus:ring-1 focus:ring-[#FF9B51] transition-all outline-none"
              />
            </div>

            {/* Pilihan Bahan Baku */}
            <div>
              <label className="block text-[11px] font-bold text-[#898989] uppercase tracking-wider mb-1">
                Pilih Dari Stok Bahan Baku
              </label>
              {materials.length > 0 ? (
                <select
                  value={selectedMaterialId}
                  onChange={e => handleSelectMaterial(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] focus:bg-white focus:border-[#FF9B51] outline-none"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatRupiah(m.unitCost)} / {m.unit})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-[#898989] italic py-1">Belum ada data stok bahan baku</div>
              )}
            </div>

            {/* Biaya Bahan & Jumlah Pemakaian */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-[#898989] mb-1">
                  Harga Beli Bahan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={materialUnitCost || ''}
                  onChange={e => setMaterialUnitCost(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl font-bold text-xs text-[#25343F] font-mono focus:bg-white focus:border-[#FF9B51] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#898989] mb-1">
                  Jumlah Pemakaian / Pcs
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={materialQtyPerUnit}
                  onChange={e => setMaterialQtyPerUnit(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl font-bold text-xs text-[#25343F] font-mono focus:bg-white focus:border-[#FF9B51] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Biaya Tambahan & Overhead (Compact 2-Column Grid) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-sm space-y-3">
            <h3 className="font-extrabold text-[#25343F] text-sm border-b border-[#BFC9D1]/20 pb-2.5">
              2. Biaya Penolong &amp; Operasional (Overhead)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Bahan Pelengkap / Tinta */}
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#BFC9D1]/20">
                <label className="font-bold text-[#25343F] block text-[11px] mb-1">
                  Bahan Penolong / Tinta
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={inkCost || ''}
                    placeholder="0"
                    onChange={e => setInkCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#BFC9D1]/30 rounded-lg font-bold font-mono text-[#25343F] outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>

              {/* Listrik & Operasional */}
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#BFC9D1]/20">
                <label className="font-bold text-[#25343F] block text-[11px] mb-1">
                  Operasional &amp; Listrik
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={electricityCost || ''}
                    placeholder="0"
                    onChange={e => setElectricityCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#BFC9D1]/30 rounded-lg font-bold font-mono text-[#25343F] outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>

              {/* Tenaga Kerja */}
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#BFC9D1]/20">
                <label className="font-bold text-[#25343F] block text-[11px] mb-1">
                  Tenaga Kerja / Upah
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={laborCost || ''}
                    placeholder="0"
                    onChange={e => setLaborCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#BFC9D1]/30 rounded-lg font-bold font-mono text-[#25343F] outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>

              {/* Penyusutan Alat */}
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#BFC9D1]/20">
                <label className="font-bold text-[#25343F] block text-[11px] mb-1">
                  Penyusutan Alat / Mesin
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={machineDepreciationCost || ''}
                    placeholder="0"
                    onChange={e => setMachineDepreciationCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#BFC9D1]/30 rounded-lg font-bold font-mono text-[#25343F] outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>

              {/* Finishing */}
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#BFC9D1]/20">
                <label className="font-bold text-[#25343F] block text-[11px] mb-1">
                  Finishing / Laminasi / Potong
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={finishingCost || ''}
                    placeholder="0"
                    onChange={e => setFinishingCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#BFC9D1]/30 rounded-lg font-bold font-mono text-[#25343F] outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>

              {/* Kemasan */}
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#BFC9D1]/20">
                <label className="font-bold text-[#25343F] block text-[11px] mb-1">
                  Kemasan &amp; Plastik
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={packagingCost || ''}
                    placeholder="0"
                    onChange={e => setPackagingCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#BFC9D1]/30 rounded-lg font-bold font-mono text-[#25343F] outline-none focus:border-[#FF9B51]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Simulasi Borongan / Massal */}
          <div className="bg-white p-4 rounded-2xl border border-[#BFC9D1]/25 shadow-sm flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-[#25343F] block">
                Simulasi Jumlah Produksi Massal
              </span>
              <span className="text-[11px] text-[#898989]">
                Hitung proyeksi modal borongan
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="1"
                value={batchQuantity}
                onChange={e => setBatchQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-16 px-2 py-1.5 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-lg text-center font-bold text-xs text-[#25343F] font-mono outline-none focus:border-[#FF9B51]"
              />
              <span className="text-xs font-bold text-[#898989]">pcs</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Rincian Borongan, Chart & Simpan */}
        <div className="lg:col-span-5 space-y-4">
          {/* Batch Projection Summary */}
          <div className="bg-white p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-sm space-y-3 text-xs">
            <h4 className="font-extrabold text-[#25343F] text-sm border-b border-[#BFC9D1]/20 pb-2">
              Proyeksi {batchQuantity} Pcs Pesanan
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-[#898989]">
                <span>Total Modal (HPP):</span>
                <span className="font-bold text-[#25343F] font-mono">{formatRupiah(totalBatchHpp)}</span>
              </div>
              <div className="flex justify-between text-[#898989]">
                <span>Total Omzet Penjualan:</span>
                <span className="font-bold text-[#25343F] font-mono">{formatRupiah(totalBatchRevenue)}</span>
              </div>
              <div className="flex justify-between text-[#10B981] font-extrabold pt-2 border-t border-[#BFC9D1]/30 text-sm">
                <span>Total Profit Bersih:</span>
                <span className="font-mono">+{formatRupiah(totalBatchProfit)}</span>
              </div>
            </div>

            {/* Simpan ke Katalog Produk Button */}
            <button
              id="btn-save-hpp-to-product"
              type="button"
              onClick={handleSaveAsProduct}
              className="w-full mt-2 py-2.5 px-4 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <DocumentCheckIcon className="w-4 h-4" />
              <span>Simpan ke Katalog Produk</span>
            </button>
          </div>

          {/* Cost Composition Chart */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-sm">
            <h4 className="font-bold text-[#25343F] text-xs mb-2 flex items-center gap-1.5">
              <ChartPieIcon className="w-4 h-4 text-[#FF9B51]" />
              Proporsi Komponen Biaya HPP
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
                <div key={idx} className="flex items-center gap-1.5 text-[#898989]">
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
