import React, { useState, useEffect } from 'react';
import { Square3Stack3DIcon, PlusIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, ArrowDownLeftIcon, ArrowUpRightIcon, ArrowPathIcon, PencilSquareIcon, TrashIcon, ArrowTrendingDownIcon, ClockIcon, CheckCircleIcon, DocumentTextIcon, FunnelIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { Material, InventoryMovement, MovementType } from '../types';
import { formatRupiah, formatDate, formatDateTime } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface InventoryViewProps {
  onRefreshDashboard?: () => void;
  onNavigate?: (view: any) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onRefreshDashboard, onNavigate }) => {
  const { showToast } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'stock' or 'movements'
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Add / PencilSquareIcon Material Modal
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [matForm, setMatForm] = useState({
    sku: '',
    name: '',
    category: 'Kertas',
    unit: 'lembar',
    currentStock: 100,
    minStock: 20,
    unitCost: 1000,
    supplier: '',
    supplierContact: '',
  });

  // Adjust / Restock Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetMaterial, setAdjustTargetMaterial] = useState<Material | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('IN');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(50);
  const [adjustUnitPrice, setAdjustUnitPrice] = useState<number>(1000);
  const [adjustSupplier, setAdjustSupplier] = useState<string>('');
  const [adjustRecordExpense, setAdjustRecordExpense] = useState<boolean>(true);
  const [adjustPaymentMethod, setAdjustPaymentMethod] = useState<string>('CASH');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Delete Material Confirm
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mats, movs] = await Promise.all([api.getMaterials(), api.getMovements()]);
      setMaterials(mats);
      setMovements(movs);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat inventori', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = ['SEMUA', ...Array.from(new Set(materials.map(m => m.category).filter(Boolean)))];

  const filteredMaterials = materials.filter(m => {
    const matchesCat = selectedCategory === 'SEMUA' || m.category === selectedCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.supplier && m.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLowStock = !onlyLowStock || m.currentStock <= m.minStock;
    return matchesCat && matchesSearch && matchesLowStock;
  });

  // Summary Metrics
  const totalStockAssetValue = materials.reduce(
    (sum, m) => sum + (m.currentStock * m.unitCost || 0),
    0
  );
  const lowStockCount = materials.filter(m => m.currentStock <= m.minStock).length;

  const handleOpenAddMaterial = () => {
    setEditingMaterial(null);
    setMatForm({
      sku: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'Kertas',
      unit: 'lembar',
      currentStock: 50,
      minStock: 20,
      unitCost: 1000,
      supplier: '',
      supplierContact: '',
    });
    setIsMaterialModalOpen(true);
  };

  const handleOpenEditMaterial = (m: Material) => {
    setEditingMaterial(m);
    setMatForm({
      sku: m.sku,
      name: m.name,
      category: m.category,
      unit: m.unit,
      currentStock: m.currentStock,
      minStock: m.minStock,
      unitCost: m.unitCost,
      supplier: m.supplier || '',
      supplierContact: m.supplierContact || '',
    });
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matForm.name.trim()) {
      showToast('Nama bahan baku wajib diisi', 'error');
      return;
    }

    try {
      if (editingMaterial) {
        const updated = await api.updateMaterial(editingMaterial.id, matForm);
        setMaterials(prev => prev.map(m => (m.id === updated.id ? updated : m)));
        showToast('Data bahan baku berhasil diperbarui', 'success');
      } else {
        const created = await api.createMaterial(matForm);
        setMaterials(prev => [created, ...prev]);
        showToast('Bahan baku baru berhasil ditambahkan', 'success');
      }
      setIsMaterialModalOpen(false);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan bahan baku', 'error');
    }
  };

  const handleOpenAdjust = (m: Material) => {
    setAdjustTargetMaterial(m);
    setMovementType('IN');
    setAdjustQuantity(50);
    setAdjustUnitPrice(m.unitCost || 1000);
    setAdjustSupplier(m.supplier || '');
    setAdjustRecordExpense(true);
    setAdjustPaymentMethod('CASH');
    setAdjustNotes(`Restock ${m.name}`);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetMaterial || adjustQuantity <= 0) return;

    try {
      if (movementType === 'IN') {
        // Use v3-v4 Restock API with auto expense & cashflow recording
        await api.restockMaterial(adjustTargetMaterial.id, {
          quantity: adjustQuantity,
          unitPrice: adjustUnitPrice,
          paymentMethod: adjustPaymentMethod,
          supplier: adjustSupplier,
          recordExpense: adjustRecordExpense,
          notes: adjustNotes,
        });
        showToast(
          adjustRecordExpense
            ? `Restock berhasil & otomatis dicatat ke Pengeluaran (${formatRupiah(adjustQuantity * adjustUnitPrice)})!`
            : 'Restock stok bahan berhasil dicatat!',
          'success'
        );
      } else {
        await api.recordMovement({
          materialId: adjustTargetMaterial.id,
          materialName: adjustTargetMaterial.name,
          type: movementType,
          quantity: adjustQuantity,
          notes: adjustNotes,
        });
        showToast('Mutasi stok berhasil dicatat!', 'success');
      }

      setIsAdjustModalOpen(false);
      loadData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal mencatat mutasi stok', 'error');
    }
  };

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return;
    try {
      await api.deleteMaterial(materialToDelete.id);
      setMaterials(prev => prev.filter(m => m.id !== materialToDelete.id));
      showToast('Bahan baku berhasil dihapus', 'success');
      setMaterialToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus bahan baku', 'error');
    }
  };

  return (
    <div id="inventory-view" className="space-y-3.5 max-w-7xl mx-auto pb-24">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 space-y-2">
        {/* Row 1: [ ← Judul ] ... [ Aksi ] */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate?.('dashboard')}
              className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
              title="Kembali ke Beranda"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
                Bahan Baku
              </h1>
              <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
                Katalog inventaris & kartu stok
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Search Toggle Icon */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
                isSearchOpen || searchQuery
                  ? 'bg-[#25343F] text-white border-slate-900'
                  : 'bg-white hover:bg-[#EAEFEF] border-[#BFC9D1]/25 text-[#25343F]'
              }`}
              title="Cari Bahan Baku"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {(isSearchOpen || searchQuery) && (
          <div className="relative animate-in fade-in slide-in-from-top-1 duration-150 pt-1">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#898989] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari bahan, SKU, supplier..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#BFC9D1]/40 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#25343F] shadow-sm placeholder:text-[#898989]"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#898989] hover:text-[#25343F] rounded-full cursor-pointer"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Card 1: Total Aset Bahan (Full Width on Mobile) */}
        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-md">
          <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
            Total Nilai Aset Stok Bahan
          </span>
          <div className="text-2xl font-black text-[#25343F] mt-1 font-mono">{formatRupiah(totalStockAssetValue)}
          </div>
        </div>

        {/* Card 2: Total Jenis Bahan (Col 1 of 2 on Mobile) */}
        <div className="col-span-1 bg-white p-3.5 sm:p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex flex-col justify-center">
          <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block truncate">
            Total Jenis Bahan
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#25343F] mt-1 font-mono">
            {materials.length} <span className="text-xs font-semibold text-[#898989]">item</span>
          </div>
        </div>

        {/* Card 3: Status Bahan Menipis (Col 2 of 2 on Mobile) */}
        <div
          onClick={() => {
            setActiveTab('stock');
            setOnlyLowStock(prev => !prev);
          }}
          className={`col-span-1 p-3.5 sm:p-5 rounded-2xl border shadow-md cursor-pointer transition-all flex flex-col justify-center ${
            onlyLowStock
              ? 'bg-[#FFAF2A]/10 border-[#FFAF2A]/40 ring-2 ring-[#FFAF2A]'
              : 'bg-white border-[#BFC9D1]/25 hover:border-[#FFAF2A]/40'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider truncate">
              Bahan Menipis
            </span>
            {onlyLowStock && (
              <span className="text-[9px] bg-[#FFAF2A] text-white font-extrabold px-1.5 py-0.2 rounded-md shrink-0">
                Aktif
              </span>
            )}
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 font-mono ${
              lowStockCount > 0 ? 'text-[#b45309]' : 'text-[#25343F]'
            }`}
          >
            {lowStockCount} <span className="text-xs font-semibold text-[#898989]">kritis</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Below Summary Cards) */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center p-0.5 bg-[#EAEFEF] rounded-lg border border-[#BFC9D1]/25 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap text-xs ${
              activeTab === 'stock'
                ? 'bg-white text-[#25343F] shadow-md'
                : 'text-[#898989] hover:text-[#25343F]'
            }`}
          >
            Katalog
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap text-xs ${
              activeTab === 'movements'
                ? 'bg-white text-[#25343F] shadow-md'
                : 'text-[#898989] hover:text-[#25343F]'
            }`}
          >
            Mutasi Stok
          </button>
        </div>

        {/* Active Category Tag Indicator */}
        {selectedCategory !== 'SEMUA' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] font-bold text-[11px]">
              Kategori: {selectedCategory}
              <XMarkIcon
                className="w-3 h-3 cursor-pointer hover:text-[#25343F]"
                onClick={() => setSelectedCategory('SEMUA')}
              />
            </span>
          </div>
        )}
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Materials Table Container */}
          <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1,2,3].map(n => (
                  <div key={n} className="animate-pulse flex gap-3 items-center p-3 rounded-xl bg-[#EAEFEF]">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#EAEFEF] rounded w-2/3" />
                      <div className="h-3 bg-[#EAEFEF] rounded w-1/2" />
                    </div>
                    <div className="h-8 w-16 bg-[#EAEFEF] rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-16 text-[#898989]">
                <Square3Stack3DIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#25343F]">Belum ada bahan baku</p>
                <p className="text-xs text-[#898989] mt-1">Tambahkan bahan baku untuk otomatisasi pemotongan stok.</p>
              </div>
            ) : (
              <>
                {/* ── MOBILE: Compact Minimalist Card List ── */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredMaterials.map(mat => {
                    const isLow = mat.currentStock <= mat.minStock;
                    const isEmpty = mat.currentStock === 0;
                    return (
                      <div
                        key={mat.id}
                        className={`p-3.5 space-y-2.5 ${isLow ? 'bg-[#FF9B51]/8' : ''}`}
                      >
                        {/* Row 1: Name, SKU, Price & Current Stock */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[13.5px] text-[#25343F] leading-snug">{mat.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#898989] font-mono">
                              <span>SKU: {mat.sku}</span>
                              <span>·</span>
                              <span className="text-[#898989] font-bold font-mono">{formatRupiah(mat.unitCost)}/{mat.unit}</span>
                            </div>
                          </div>

                          {/* Stock + status */}
                          <div className="text-right shrink-0">
                            <div className={`text-base font-black leading-tight ${
                              isEmpty ? 'text-[#FF4267]' : isLow ? 'text-[#b45309]' : 'text-[#25343F]'
                            }`}>
                              {mat.currentStock}
                              <span className="text-xs font-semibold text-[#898989] ml-1">{mat.unit}</span>
                            </div>
                            <div className={`text-[9.5px] font-bold mt-0.5 ${
                              isEmpty ? 'text-[#FF4267]' : isLow ? 'text-[#b45309]' : 'text-[#0f766e]'
                            }`}>
                              {isEmpty ? '🔴 Habis' : isLow ? `🟡 Min ${mat.minStock}` : '🟢 Aman'}
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            onClick={() => handleOpenAdjust(mat)}
                            className="flex-1 min-h-[34px] px-3 py-1 rounded-xl bg-[#EAEFEF] hover:bg-[#EAEFEF] active:bg-[#EAEFEF] text-[#25343F] font-bold border border-[#BFC9D1]/25 flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                          >
                            <ArrowDownLeftIcon className="w-3.5 h-3.5" />
                            <span>Restock</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditMaterial(mat)}
                            className="min-h-[34px] px-3 py-1 rounded-xl border border-[#BFC9D1]/25 text-[#25343F] hover:bg-[#EAEFEF] active:bg-[#EAEFEF] flex items-center justify-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5 text-[#898989]" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setMaterialToDelete(mat)}
                            className="min-h-[34px] px-2.5 py-1 rounded-xl border border-[#FF4267]/30 text-[#FF4267] hover:bg-[#FF4267]/10 active:bg-[#FF4267]/20 flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── DESKTOP: Full Table ── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/80 text-[#898989] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Nama Bahan & SKU</th>
                        <th className="py-3.5 px-4">Kategori & Satuan</th>
                        <th className="py-3.5 px-4 text-center">Stok Saat Ini</th>
                        <th className="py-3.5 px-4 text-right">Harga Beli / Satuan</th>
                        <th className="py-3.5 px-4 text-right">Total Nilai Aset</th>
                        <th className="py-3.5 px-4">Supplier & Kontak</th>
                        <th className="py-3.5 px-4 text-center">Aksi & Restock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMaterials.map(mat => {
                        const isLow = mat.currentStock <= mat.minStock;
                        const totalVal = mat.currentStock * mat.unitCost;
                        return (
                          <tr key={mat.id} className={`hover:bg-[#EAEFEF]/60 transition-colors ${isLow ? 'bg-[#FFAF2A]/8' : ''}`}>
                            <td className="py-3 px-4">
                              <div className="font-extrabold text-[#25343F] text-sm">{mat.name}</div>
                              <div className="text-[11px] text-[#898989] font-mono">SKU: {mat.sku} • Min: {mat.minStock} {mat.unit}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-[#25343F]">{mat.category}</span>
                              <div className="text-[11px] text-[#898989] mt-0.5">Satuan: {mat.unit}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black ${
                                isLow ? 'bg-[#FFAF2A]/15 text-[#b45309] border border-[#FFAF2A]/40' : 'bg-[#52D5BA]/20 text-[#0f766e] border border-[#52D5BA]/40'
                              }`}>
                                {isLow && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-[#FFAF2A]" />}
                                {mat.currentStock} {mat.unit}
                              </span>
                              {isLow && (
                                <div className="text-[10px] text-[#b45309] font-bold mt-1">Menipis! (Min: {mat.minStock})</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#25343F] font-mono">{formatRupiah(mat.unitCost)}</td>
                            <td className="py-3 px-4 text-right font-extrabold text-[#25343F] font-mono">{formatRupiah(totalVal)}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-[#25343F]">{mat.supplier || 'Supplier Umum'}</div>
                              <div className="text-[11px] text-[#898989]">{mat.supplierContact || '-'}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleOpenAdjust(mat)} className="px-2.5 py-1.5 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] font-bold border border-[#BFC9D1]/25 flex items-center gap-1 transition-colors" title="Catat Restock / Penyesuaian">
                                  <ArrowDownLeftIcon className="w-3.5 h-3.5" /><span>Restock</span>
                                </button>
                                <button onClick={() => handleOpenEditMaterial(mat)} className="p-1.5 rounded-lg text-[#898989] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25" title="Edit Bahan">
                                  <PencilSquareIcon className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setMaterialToDelete(mat)} className="p-1.5 rounded-lg text-[#FF4267] hover:bg-[#FF4267]/10 border border-[#FF4267]/30" title="Hapus Bahan">
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* TAB 2: Mutation Movement Logs */
        <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
          <div className="p-4 bg-[#EAEFEF] border-b border-[#BFC9D1]/40 font-bold text-xs text-[#25343F]">
            Riwayat Pencatatan Keluar Masuk Bahan Baku
          </div>
          {movements.length === 0 ? (
            <div className="text-center py-16 text-[#898989] text-xs">Belum ada catatan mutasi.</div>
          ) : (
            <>
              {/* ── MOBILE: Compact Movement List ── */}
              <div className="md:hidden divide-y divide-slate-100">
                {movements.map(mov => {
                  const isPlus = mov.type === 'IN';
                  return (
                    <div key={mov.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isPlus ? 'bg-[#EAEFEF]' : 'bg-[#FF9B51]/15'
                      }`}>
                        {isPlus
                          ? <ArrowDownLeftIcon className="w-4 h-4 text-[#25343F]" />
                          : <ArrowUpRightIcon className="w-4 h-4 text-[#c45e00]" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px] text-[#25343F] truncate">{mov.materialName}</div>
                        <div className="text-[10px] text-[#898989]">{formatDateTime(mov.createdAt || mov.date)}</div>
                        {mov.notes && <div className="text-[10px] text-[#898989] truncate">{mov.notes}</div>}
                      </div>
                      <div className={`font-black text-sm shrink-0 ${isPlus ? 'text-[#25343F]' : 'text-[#c45e00]'}`}>
                        {isPlus ? `+${mov.quantity}` : `-${mov.quantity}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── DESKTOP: Full Table ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/50 text-[#898989] font-bold">
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Bahan Baku</th>
                      <th className="py-3 px-4 text-center">Tipe Mutasi</th>
                      <th className="py-3 px-4 text-right">Jumlah</th>
                      <th className="py-3 px-4">Keterangan / Referensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map(mov => {
                      const isPlus = mov.type === 'IN';
                      return (
                        <tr key={mov.id} className="hover:bg-[#EAEFEF]/60">
                          <td className="py-2.5 px-4 text-[#898989]">{formatDateTime(mov.createdAt || mov.date)}</td>
                          <td className="py-2.5 px-4 font-bold text-[#25343F]">{mov.materialName}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isPlus ? 'bg-[#EAEFEF] text-[#25343F]' : 'bg-[#FF9B51]/15 text-[#c45e00]'
                            }`}>
                              {mov.type}
                            </span>
                          </td>
                          <td className={`py-2.5 px-4 text-right font-black ${isPlus ? 'text-[#25343F]' : 'text-[#c45e00]'}`}>
                            {isPlus ? `+${mov.quantity}` : `-${mov.quantity}`}
                          </td>
                          <td className="py-2.5 px-4 text-[#898989]">{mov.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL 1: Add / PencilSquareIcon Material */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-lg w-full p-6">
            <h3 className="font-bold text-base text-[#25343F] mb-1">
              {editingMaterial ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
            </h3>
            <p className="text-xs text-[#898989] mb-4">Informasi stok dan harga modal bahan</p>

            <form onSubmit={handleSaveMaterial} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">SKU / Kode</label>
                  <input
                    type="text"
                    required
                    value={matForm.sku}
                    onChange={e => setMatForm({ ...matForm, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-[#25343F] mb-1">Nama Bahan Baku *</label>
                  <input
                    type="text"
                    required
                    value={matForm.name}
                    onChange={e => setMatForm({ ...matForm, name: e.target.value })}
                    placeholder="Contoh: Kertas Art Paper 260gr A3+"
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Kategori Bahan</label>
                  <select
                    value={['Kertas', 'Tinta', 'Stiker & Vinyl', 'MDF & Kayu', 'Akrilik', 'Kain & Tekstil', 'Laminasi & Finishing', 'Kemasan & Box', 'Aksesoris & Perlengkapan'].includes(matForm.category) ? matForm.category : 'custom'}
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        setMatForm({ ...matForm, category: '' });
                      } else {
                        setMatForm({ ...matForm, category: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-medium cursor-pointer text-xs sm:text-sm"
                  >
                    <option value="Kertas">Kertas</option>
                    <option value="Tinta">Tinta</option>
                    <option value="Stiker & Vinyl">Stiker &amp; Vinyl</option>
                    <option value="MDF & Kayu">MDF &amp; Kayu</option>
                    <option value="Akrilik">Akrilik</option>
                    <option value="Kain & Tekstil">Kain &amp; Tekstil</option>
                    <option value="Laminasi & Finishing">Laminasi &amp; Finishing</option>
                    <option value="Kemasan & Box">Kemasan &amp; Box</option>
                    <option value="Aksesoris & Perlengkapan">Aksesoris &amp; Perlengkapan</option>
                    <option value="custom">+ Ketik Kategori Lainnya...</option>
                  </select>
                  {!['Kertas', 'Tinta', 'Stiker & Vinyl', 'MDF & Kayu', 'Akrilik', 'Kain & Tekstil', 'Laminasi & Finishing', 'Kemasan & Box', 'Aksesoris & Perlengkapan'].includes(matForm.category) && (
                    <input
                      type="text"
                      autoFocus
                      required
                      value={matForm.category}
                      onChange={e => setMatForm({ ...matForm, category: e.target.value })}
                      placeholder="Ketik kategori custom..."
                      className="w-full mt-1.5 px-3 py-1.5 bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-lg text-xs"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Satuan</label>
                  <select
                    value={['lembar', 'pcs', 'meter', 'roll', 'rim', 'box', 'pack', 'kg', 'gram', 'liter', 'ml', 'botol', 'set', 'lusin', 'paket'].includes(matForm.unit) ? matForm.unit : 'custom'}
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        setMatForm({ ...matForm, unit: '' });
                      } else {
                        setMatForm({ ...matForm, unit: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-medium cursor-pointer text-xs sm:text-sm"
                  >
                    <option value="lembar">lembar</option>
                    <option value="pcs">pcs (Buah/Item)</option>
                    <option value="meter">meter (m / m²)</option>
                    <option value="roll">roll / gulungan</option>
                    <option value="rim">rim (500 lbr)</option>
                    <option value="box">box / dus</option>
                    <option value="pack">pack / bungkus</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="gram">gram (gr)</option>
                    <option value="liter">liter (L)</option>
                    <option value="ml">ml (Mililiter)</option>
                    <option value="botol">botol / kaleng</option>
                    <option value="set">set</option>
                    <option value="lusin">lusin (12 pcs)</option>
                    <option value="paket">paket</option>
                    <option value="custom">+ Ketik Satuan Lainnya...</option>
                  </select>
                  {!['lembar', 'pcs', 'meter', 'roll', 'rim', 'box', 'pack', 'kg', 'gram', 'liter', 'ml', 'botol', 'set', 'lusin', 'paket'].includes(matForm.unit) && (
                    <input
                      type="text"
                      autoFocus
                      required
                      value={matForm.unit}
                      onChange={e => setMatForm({ ...matForm, unit: e.target.value })}
                      placeholder="Ketik nama satuan custom..."
                      className="w-full mt-1.5 px-3 py-1.5 bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-lg text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={matForm.currentStock}
                    onChange={e =>
                      setMatForm({ ...matForm, currentStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Stok Minimum</label>
                  <input
                    type="number"
                    min="0"
                    value={matForm.minStock}
                    onChange={e =>
                      setMatForm({ ...matForm, minStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-bold text-[#c45e00]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Harga Beli / Satuan</label>
                  <input
                    type="number"
                    min="0"
                    value={matForm.unitCost}
                    onChange={e =>
                      setMatForm({ ...matForm, unitCost: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-bold text-[#25343F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Nama Supplier</label>
                  <input
                    type="text"
                    value={matForm.supplier}
                    onChange={e => setMatForm({ ...matForm, supplier: e.target.value })}
                    placeholder="Toko Kertas Makmur"
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Kontak Supplier</label>
                  <input
                    type="text"
                    value={matForm.supplierContact}
                    onChange={e => setMatForm({ ...matForm, supplierContact: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-[#BFC9D1]/25 font-semibold text-[#898989]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick Restock / Stock Adjustment */}
      {isAdjustModalOpen && adjustTargetMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-md w-full p-6">
            <h3 className="font-bold text-base text-[#25343F] mb-1">
              Catat Mutasi / Restock Bahan
            </h3>
            <p className="text-xs text-[#898989] mb-4">
              Bahan: <strong className="text-[#25343F]">{adjustTargetMaterial.name}</strong> (Stok: {adjustTargetMaterial.currentStock} {adjustTargetMaterial.unit})
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#25343F] mb-1">Tipe Mutasi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'IN', label: '+ Masuk (Restock)' },
                    { id: 'OUT', label: '- Keluar (Pakai)' },
                    { id: 'ADJUSTMENT', label: '± Koreksi Opname' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMovementType(t.id as MovementType)}
                      className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                        movementType === t.id
                          ? 'bg-[#25343F] text-white border-slate-900'
                          : 'bg-white text-[#898989] border-[#BFC9D1] hover:bg-[#EAEFEF]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">
                  Jumlah ({adjustTargetMaterial.unit}) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={adjustQuantity || ''}
                  onChange={e => setAdjustQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl text-base font-bold text-[#25343F]"
                />
              </div>

              {/* Conditional Restock Financial Details */}
              {movementType === 'IN' && (
                <div className="p-3 bg-[#EAEFEF]/60 rounded-xl border border-[#BFC9D1]/25 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-[#25343F] mb-1">Harga Beli / Satuan (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        value={adjustUnitPrice || ''}
                        onChange={e => setAdjustUnitPrice(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-lg font-bold text-[#25343F]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#25343F] mb-1">Nama Supplier</label>
                      <input
                        type="text"
                        value={adjustSupplier}
                        onChange={e => setAdjustSupplier(e.target.value)}
                        placeholder="Toko Jaya Makmur"
                        className="w-full px-2.5 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-[#898989]">Total Biaya Pembelian:</span>
                    <span className="font-extrabold text-[#25343F] text-sm font-mono">{formatRupiah(adjustQuantity * adjustUnitPrice)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#BFC9D1]/40 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adjustRecordExpense}
                        onChange={e => setAdjustRecordExpense(e.target.checked)}
                        className="w-4 h-4 rounded text-[#25343F] focus:ring-[#25343F]"
                      />
                      <span className="font-bold text-[#25343F]">
                        Otomatis catat ke Pengeluaran Kas (Beban Bahan)
                      </span>
                    </label>

                    {adjustRecordExpense && (
                      <div className="flex items-center gap-2 pl-6">
                        <span className="text-[11px] text-[#898989]">Metode Bayar:</span>
                        {['CASH', 'TRANSFER', 'QRIS'].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setAdjustPaymentMethod(m)}
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                              adjustPaymentMethod === m
                                ? 'bg-[#25343F] text-white border-[#BFC9D1]'
                                : 'bg-white text-[#898989] border-[#BFC9D1]'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: Beli 2 rim di toko Jaya Abadi"
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-[#BFC9D1]/25 font-semibold text-[#898989]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!materialToDelete}
        title="Hapus Bahan Baku?"
        message={`Apakah Anda yakin ingin menghapus bahan "${materialToDelete?.name}"?`}
        confirmLabel="Hapus"
        onConfirm={handleDeleteMaterial}
        onCancel={() => setMaterialToDelete(null)}
      />

      {/* ── Floating Action Button (FAB) Tambah Bahan Baku ── */}
      <button
        id="btn-add-material-fab"
        type="button"
        onClick={handleOpenAddMaterial}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] flex items-center justify-center shadow-xl border-2 border-white transition-all cursor-pointer active:scale-90 hover:scale-105"
        title="Tambah Bahan Baku Baru"
        aria-label="Tambah Bahan Baku Baru"
      >
        <PlusIcon className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
