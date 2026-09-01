import React, { useState, useEffect, useRef } from 'react';
import { CubeIcon, PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, Square3Stack3DIcon, TagIcon, ReceiptPercentIcon, EyeIcon, AdjustmentsHorizontalIcon, ArrowsUpDownIcon, XMarkIcon, EllipsisVerticalIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon, InformationCircleIcon, ArrowLeftIcon, QrCodeIcon, PrinterIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { Product, Material, ProductComponent, ProductType } from '../types';
import { formatRupiah } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProductImage, ProductImageUploader } from '../components/ProductImage';
import { generateBarcodeValue, validateBarcodeValue, renderBarcodeToSvg, BarcodeFormat, BARCODE_FORMAT_LABELS } from '../lib/barcodeUtils';
import { BarcodeLabelPrintModal } from '../components/BarcodeLabelPrintModal';

interface ProductsViewProps {
  onOpenHppCalculator?: (productId?: string) => void;
  onNavigate?: (view: any) => void;
}

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'margin-desc' | 'cost-asc';

export const ProductsView: React.FC<ProductsViewProps> = ({ onOpenHppCalculator, onNavigate }) => {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // MagnifyingGlassIcon & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [selectedType, setSelectedType] = useState<string>('SEMUA');
  const [minMarginFilter, setMinMarginFilter] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Mobile Bottom Sheet States
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortDrawerOpen, setIsSortDrawerOpen] = useState(false);
  const [activeMenuProductId, setActiveMenuProductId] = useState<string | null>(null);
  const [expandedBomCardId, setExpandedBomCardId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);

  // Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Image state
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [formImagePath, setFormImagePath] = useState<string | null>(null);
  const [formThumbnailPath, setFormThumbnailPath] = useState<string | null>(null);
  const [formImagePreviewUrl, setFormImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Dokumen');
  const [type, setType] = useState<ProductType>('CETAK');
  const [unit, setUnit] = useState('pcs');
  const [description, setDescription] = useState('');
  const [components, setComponents] = useState<ProductComponent[]>([]);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [machineCost, setMachineCost] = useState<number>(0);
  const [otherCost, setOtherCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(50);

  // Barcode form state
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeType, setBarcodeType] = useState<BarcodeFormat>('CODE128');
  const [barcodeError, setBarcodeError] = useState('');
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const barcodeSvgRef = useRef<SVGSVGElement>(null);

  // Barcode label print modal
  const [isLabelPrintOpen, setIsLabelPrintOpen] = useState(false);
  const [labelPrintProductId, setLabelPrintProductId] = useState<string | undefined>();

  // Delete Confirm State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Click outside listener for mobile ⋯ action menus
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target as Node)) {
        setActiveMenuProductId(null);
      }
    };
    if (activeMenuProductId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuProductId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodList, matList] = await Promise.all([api.getProducts(), api.getMaterials()]);
      setProducts(prodList);
      setMaterials(matList);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat katalog produk', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => {
      // Background reload data without resetting form/filter state
      api.getProducts().then(p => setProducts(p)).catch(() => {});
      api.getMaterials().then(m => setMaterials(m)).catch(() => {});
    };
    window.addEventListener('sukunaru:sync_completed', handleRefresh);
    window.addEventListener('sukunaru:data_mutation', handleRefresh);
    return () => {
      window.removeEventListener('sukunaru:sync_completed', handleRefresh);
      window.removeEventListener('sukunaru:data_mutation', handleRefresh);
    };
  }, []);

  const categories = ['SEMUA', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // Filtering & Sorting Logic
  const filteredProducts = products
    .filter(p => {
      const matchesCat = selectedCategory === 'SEMUA' || p.category === selectedCategory;
      const matchesType = selectedType === 'SEMUA' || p.type === selectedType;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesMargin = true;
      if (minMarginFilter !== '') {
        const profit = p.sellingPrice - p.costPrice;
        const marginPct = p.costPrice > 0 ? (profit / p.costPrice) * 100 : 100;
        matchesMargin = marginPct >= minMarginFilter;
      }

      return matchesCat && matchesType && matchesSearch && matchesMargin;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
      if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'cost-asc') return a.costPrice - b.costPrice;
      if (sortBy === 'margin-desc') {
        const marginA = a.costPrice > 0 ? (a.sellingPrice - a.costPrice) / a.costPrice : 1;
        const marginB = b.costPrice > 0 ? (b.sellingPrice - b.costPrice) / b.costPrice : 1;
        return marginB - marginA;
      }
      return 0;
    });

  // Calculate live HPP from components (lookup unit cost per material) + overhead
  const materialHpp = components.reduce((sum, comp) => {
    const mat = materials.find(m => m.id === comp.materialId);
    return sum + (mat ? mat.unitCost * (comp.quantity || 0) : 0);
  }, 0);
  const calculatedCostPrice = materialHpp + laborCost + machineCost + otherCost;

  // Recalculate selling price when margin changes or HPP changes
  const applyMargin = (marginPct: number) => {
    setTargetMarginPercent(marginPct);
    const suggested = Math.ceil((calculatedCostPrice * (1 + marginPct / 100)) / 500) * 500;
    setSellingPrice(suggested);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setCategory('Percetakan');
    setType('CETAK');
    setUnit('pcs');
    setDescription('');
    setComponents([]);
    setLaborCost(0);
    setMachineCost(0);
    setOtherCost(0);
    setSellingPrice(0);
    setTargetMarginPercent(50);
    setBarcodeValue('');
    setBarcodeType('CODE128');
    setBarcodeError('');
    setPendingImageFile(null);
    setFormImagePath(null);
    setFormThumbnailPath(null);
    setFormImagePreviewUrl(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setSku(prod.sku);
    setName(prod.name);
    setCategory(prod.category);
    setType(prod.type);
    setUnit(prod.unit);
    setDescription(prod.description || '');
    setComponents(prod.components || []);
    setLaborCost(prod.laborCost || 0);
    setMachineCost(prod.machineCost || 0);
    setOtherCost(prod.otherCost || 0);
    setSellingPrice(prod.sellingPrice);
    setTargetMarginPercent(prod.marginPercent || 50);
    setBarcodeValue(prod.barcode || '');
    setBarcodeType((prod.barcodeType as BarcodeFormat) || 'CODE128');
    setBarcodeError('');
    setPendingImageFile(null);
    setFormImagePath(prod.imagePath || null);
    setFormThumbnailPath(prod.thumbnailPath || null);
    setFormImagePreviewUrl(prod.imagePath ? `/uploads/${prod.imagePath}` : null);
    setIsFormModalOpen(true);
    setActiveMenuProductId(null);
  };

  const handleDuplicateProduct = (prod: Product) => {
    setEditingProduct(null);
    setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setName(`${prod.name} (Salinan)`);
    setCategory(prod.category);
    setType(prod.type);
    setUnit(prod.unit);
    setDescription(prod.description || '');
    setComponents(prod.components ? [...prod.components] : []);
    setLaborCost(prod.laborCost || 0);
    setMachineCost(prod.machineCost || 0);
    setOtherCost(prod.otherCost || 0);
    setSellingPrice(prod.sellingPrice);
    setTargetMarginPercent(prod.marginPercent || 50);
    setBarcodeValue(''); // Don't duplicate barcode to avoid uniqueness conflict
    setBarcodeType('CODE128');
    setBarcodeError('');
    setPendingImageFile(null);
    setFormImagePath(null);
    setFormThumbnailPath(null);
    setFormImagePreviewUrl(null);
    setIsFormModalOpen(true);
    setActiveMenuProductId(null);
    showToast('Form duplikasi produk siap disimpan', 'info');
  };

  // Auto-generate barcode value
  const handleAutoGenerateBarcode = () => {
    setIsGeneratingBarcode(true);
    const mockId = editingProduct?.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const generated = generateBarcodeValue(mockId);
    setBarcodeValue(generated);
    setBarcodeType('CODE128');
    setBarcodeError('');
    setTimeout(() => setIsGeneratingBarcode(false), 200);
  };

  // Render barcode preview SVG whenever barcodeValue or barcodeType changes in form modal
  useEffect(() => {
    if (!isFormModalOpen || !barcodeValue.trim() || !barcodeSvgRef.current) return;
    const val = barcodeValue.trim();
    const check = validateBarcodeValue(val, barcodeType);
    if (!check.valid) {
      setBarcodeError(check.error || 'Format barcode tidak valid');
      return;
    }
    setBarcodeError('');
    renderBarcodeToSvg(barcodeSvgRef.current, val, barcodeType, {
      width: 1.8,
      height: 45,
      fontSize: 11,
      margin: 4,
      displayValue: true,
    }).catch(err => {
      console.warn('Failed to render barcode SVG preview:', err);
    });
  }, [barcodeValue, barcodeType, isFormModalOpen]);

  const handleAddComponent = () => {
    if (materials.length === 0) {
      showToast('Belum ada bahan baku di inventori. Tambahkan bahan di menu Stok dulu.', 'info');
      return;
    }
    const firstMat = materials[0];
    const cost = firstMat.unitCost ?? firstMat.purchasePrice ?? 0;
    setComponents(prev => [
      ...prev,
      {
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        materialId: firstMat.id,
        componentName: firstMat.name,
        quantity: 1,
        unit: firstMat.unit || 'pcs',
        unitCost: cost,
        subtotal: cost * 1,
      },
    ]);
  };

  const handleUpdateComponent = (idx: number, field: string, value: any) => {
    setComponents(prev => {
      const copy = [...prev];
      if (field === 'materialId') {
        const mat = materials.find(m => m.id === value);
        if (mat) {
          copy[idx] = {
            ...copy[idx],
            materialId: mat.id,
            unit: mat.unit,
          };
        }
      } else if (field === 'quantity') {
        copy[idx] = {
          ...copy[idx],
          quantity: parseFloat(value) || 0,
        };
      }
      return copy;
    });
  };

  const handleRemoveComponent = (idx: number) => {
    setComponents(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama produk wajib diisi', 'error');
      return;
    }

    // Enrich components with unitCost & subtotal from materials lookup
    const enrichedComponents = components.map(comp => {
      const mat = materials.find(m => m.id === comp.materialId);
      const unitCost = mat ? mat.unitCost : (comp.unitCost || 0);
      const subtotal = unitCost * (comp.quantity || 0);
      return {
        ...comp,
        componentName: mat ? mat.name : (comp.componentName || 'Komponen'),
        unit: mat ? mat.unit : comp.unit,
        unitCost,
        subtotal,
      };
    });

    if (barcodeValue.trim()) {
      const check = validateBarcodeValue(barcodeValue.trim(), barcodeType);
      if (!check.valid) {
        showToast(check.error || 'Format barcode tidak valid', 'error');
        return;
      }
    }

    const payload = {
      sku: sku.trim(),
      name: name.trim(),
      category: category.trim(),
      type,
      unit: unit.trim() || 'pcs',
      description: description.trim(),
      costPrice: calculatedCostPrice,
      sellingPrice: Number(sellingPrice) || 0,
      marginPercent:
        calculatedCostPrice > 0
          ? Math.round(((sellingPrice - calculatedCostPrice) / calculatedCostPrice) * 100)
          : 0,
      barcode: barcodeValue.trim() || undefined,
      barcodeType: barcodeValue.trim() ? barcodeType : undefined,
      components: enrichedComponents,
      laborCost,
      machineCost,
      otherCost,
      isActive: true,
    };

    try {
      setIsSaving(true);
      if (editingProduct) {
        let updated = await api.updateProduct(editingProduct.id, payload);

        // If form image was explicitly cleared
        if (!formImagePath && editingProduct.imagePath) {
          await api.deleteProductImage(editingProduct.id);
          updated = { ...updated, imagePath: undefined, thumbnailPath: undefined };
        }

        // Upload new pending image for existing product
        if (pendingImageFile) {
          const imgRes = await api.uploadProductImage(editingProduct.id, pendingImageFile);
          updated = { ...updated, ...imgRes.product };
        }

        setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        showToast('Produk berhasil diperbarui!', 'success');
      } else {
        let created = await api.createProduct(payload);

        // Upload pending image now that we have the productId
        if (pendingImageFile) {
          try {
            const imgRes = await api.uploadProductImage(created.id, pendingImageFile);
            created = { ...created, ...imgRes.product };
          } catch (imgErr: any) {
            showToast('Produk disimpan, tapi gagal mengunggah gambar: ' + imgErr.message, 'info');
          }
        }

        setProducts(prev => [created, ...prev]);
        showToast('Produk baru berhasil disimpan!', 'success');
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan produk', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await api.deleteProduct(productToDelete.id);
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      showToast('Produk berhasil dihapus', 'success');
      setProductToDelete(null);
      setActiveMenuProductId(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus produk', 'error');
    }
  };

  const activeFiltersCount =
    (selectedCategory !== 'SEMUA' ? 1 : 0) +
    (selectedType !== 'SEMUA' ? 1 : 0) +
    (minMarginFilter !== '' ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedCategory('SEMUA');
    setSelectedType('SEMUA');
    setMinMarginFilter('');
    setSearchQuery('');
    setSortBy('name-asc');
  };

  return (
    <div id="products-view" className="space-y-3.5 max-w-7xl mx-auto pb-24 md:pb-12">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi: Search, Filter, Sort ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 space-y-2">
        {/* Row 1: [ ← Judul ] ... [ Aksi: Search, Filter, Sort ] */}
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
                Produk
              </h1>
              <p className="text-xs sm:text-[13px] text-[#898989] font-medium truncate hidden sm:block">
                {loading ? 'Memuat...' : `${filteredProducts.length} dari ${products.length} item`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Barcode Label Print Button */}
            <button
              type="button"
              onClick={() => {
                setLabelPrintProductId(undefined);
                setIsLabelPrintOpen(true);
              }}
              className="h-9 px-2.5 rounded-xl border border-[#BFC9D1]/25 bg-white hover:bg-[#EAEFEF] text-[#25343F] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 text-xs font-semibold"
              title="Cetak Label Barcode"
            >
              <PrinterIcon className="w-4 h-4 text-[#FF9B51]" />
              <span className="hidden sm:inline">Cetak Label</span>
            </button>

            {/* Search Toggle Icon */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
                isSearchOpen || searchQuery
                  ? 'bg-[#25343F] text-white border-slate-900'
                  : 'bg-white hover:bg-[#EAEFEF] border-[#BFC9D1]/25 text-[#25343F]'
              }`}
              title="Cari Produk"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>

            {/* Desktop Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="hidden md:block h-9 px-2.5 bg-white border border-[#BFC9D1]/25 rounded-xl text-xs font-semibold text-[#25343F] focus:outline-hidden focus:border-[#25343F] cursor-pointer shadow-sm"
            >
              <option value="name-asc">Nama (A - Z)</option>
              <option value="name-desc">Nama (Z - A)</option>
              <option value="price-asc">Harga Terendah</option>
              <option value="price-desc">Harga Tertinggi</option>
              <option value="margin-desc">Margin Tertinggi</option>
              <option value="cost-asc">HPP Terendah</option>
            </select>

            {/* Mobile Filter Icon Button */}
            <button
              type="button"
              id="btn-mobile-filter"
              onClick={() => setIsFilterDrawerOpen(true)}
              aria-label="Filter Produk"
              title="Filter Produk"
              className={`md:hidden h-9 w-9 rounded-xl border flex items-center justify-center relative transition-all cursor-pointer active:scale-95 shrink-0 ${
                activeFiltersCount > 0
                  ? 'bg-[#25343F] border-slate-900 text-white shadow-sm'
                  : 'bg-white border-[#BFC9D1]/25 text-[#898989] shadow-sm hover:bg-[#EAEFEF]'
              }`}
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#FF9B51] text-white text-[8px] flex items-center justify-center font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Mobile Sort Icon Button */}
            <button
              type="button"
              id="btn-mobile-sort"
              onClick={() => setIsSortDrawerOpen(true)}
              aria-label="Urutkan Produk"
              title="Urutkan Produk"
              className="md:hidden h-9 w-9 rounded-xl bg-white border border-[#BFC9D1]/25 text-[#898989] hover:bg-[#EAEFEF] flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 shadow-sm"
            >
              <ArrowsUpDownIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Search Input (Only shown when active or searching) */}
        {(isSearchOpen || searchQuery) && (
          <div className="relative animate-in fade-in slide-in-from-top-1 duration-150 pt-1">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#898989] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-products-search"
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk, SKU..."
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

        {/* Active Filter Tags on Mobile */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
            {selectedCategory !== 'SEMUA' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] font-semibold shrink-0 text-[10px]">
                Kat: {selectedCategory}
                <XMarkIcon className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedCategory('SEMUA')} />
              </span>
            )}
            {selectedType !== 'SEMUA' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] font-semibold shrink-0 text-[10px]">
                Tipe: {selectedType}
                <XMarkIcon className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedType('SEMUA')} />
              </span>
            )}
            {minMarginFilter !== '' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EAEFEF]/70 text-[#25343F] font-semibold shrink-0 text-[10px]">
                Margin &ge; {minMarginFilter}%
                <XMarkIcon className="w-2.5 h-2.5 cursor-pointer" onClick={() => setMinMarginFilter('')} />
              </span>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[10px] text-[#c45e00] font-bold underline px-1 shrink-0 cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}

        {/* Category Filter Pills (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#25343F] text-white shadow-md'
                  : 'bg-white border border-[#BFC9D1]/25 text-[#898989] hover:bg-[#EAEFEF]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOADING SKELETON STATES                                                   */}
      {/* ========================================================================= */}
      {loading && (
        <div className="space-y-3">
          {/* Mobile Skeleton Cards */}
          <div className="md:hidden space-y-3">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white p-4 rounded-2xl border border-[#BFC9D1]/25 animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-[#EAEFEF] rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#EAEFEF] rounded w-3/4" />
                    <div className="h-3 bg-[#EAEFEF] rounded w-1/2" />
                  </div>
                </div>
                <div className="h-12 bg-[#EAEFEF] rounded-xl" />
                <div className="h-10 bg-[#EAEFEF] rounded-xl" />
              </div>
            ))}
          </div>

          {/* Desktop Skeleton Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#BFC9D1]/25 p-8">
            <div className="animate-pulse space-y-3.5">
              <div className="h-6 bg-[#EAEFEF] rounded w-1/4" />
              <div className="h-4 bg-[#EAEFEF] rounded w-full" />
              <div className="h-4 bg-[#EAEFEF] rounded w-full" />
              <div className="h-4 bg-[#EAEFEF] rounded w-3/4" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EMPTY & NO-RESULT STATES                                                  */}
      {/* ========================================================================= */}
      {!loading && filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 p-8 sm:p-16 text-center shadow-md">
          <div className="w-16 h-16 bg-[#EAEFEF] rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#898989]">
            <CubeIcon className="w-8 h-8" />
          </div>
          {searchQuery || activeFiltersCount > 0 ? (
            <div>
              <h3 className="text-base font-bold text-[#25343F]">Tidak ada produk yang cocok</h3>
              <p className="text-xs text-[#898989] max-w-sm mx-auto mt-1">
                Coba ubah kata kunci pencarian atau bersihkan filter yang aktif.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-4 px-4 py-2 bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold text-[#25343F]">Belum ada produk</h3>
              <p className="text-xs text-[#898989] max-w-sm mx-auto mt-1">
                Tambahkan produk percetakan atau jasa desain pertama Anda ke katalog.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 px-5 py-2.5 bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <PlusIcon className="w-4 h-4" /> Tambah Produk Pertama
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE VIEW: VERTICAL PRODUCT CARDS (< 768px)                             */}
      {/* ========================================================================= */}
      {!loading && filteredProducts.length > 0 && (
        <div className="md:hidden space-y-3">
          {filteredProducts.map(prod => {
            const profit = prod.sellingPrice - prod.costPrice;
            const marginPct =
              prod.costPrice > 0 ? Math.round((profit / prod.costPrice) * 100) : 100;
            const hasBom = prod.components && prod.components.length > 0;
            const isBomExpanded = expandedBomCardId === prod.id;
            const isMenuOpen = activeMenuProductId === prod.id;

            return (
              <div
                key={prod.id}
                id={`mobile-product-card-${prod.id}`}
                className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-visible p-3 space-y-2.5 transition-shadow hover:shadow-sm"
              >
                {/* Row 1: Compact Thumbnail (48x48) + Name + Selling Price */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div
                      onClick={() => setSelectedDetailProduct(prod)}
                      className="w-12 h-12 rounded-xl overflow-hidden bg-[#EAEFEF] border border-slate-100 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <ProductImage
                        thumbnailPath={prod.thumbnailPath}
                        imagePath={prod.imagePath}
                        productName={prod.name}
                        size="md"
                        className="w-full h-full object-cover"
                        rounded="rounded-xl"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        onClick={() => setSelectedDetailProduct(prod)}
                        className="font-bold text-[13.5px] text-[#25343F] leading-snug cursor-pointer hover:text-[#25343F] line-clamp-1 truncate"
                      >
                        {prod.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-[#898989]">
                        <span className="font-mono text-[#898989]">SKU: {prod.sku}</span>
                        <span>·</span>
                        <span>{prod.unit || 'pcs'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price on right */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-[#25343F] font-mono leading-tight flex items-baseline justify-end gap-0.5">
                      <span className="font-mono">{formatRupiah(prod.sellingPrice)}</span>
                      <span className="text-[10px] text-[#898989] font-medium font-sans">/{prod.unit}</span>
                    </div>
                    <div className="text-[10px] font-semibold text-[#898989] font-mono mt-0.5">
                      HPP {formatRupiah(prod.costPrice)}
                    </div>
                  </div>
                </div>

                {/* Row 2: Compact Profit & Margin Banner + BOM Info */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#EAEFEF] border border-slate-100/90 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] text-[#898989] font-medium">Profit:</span>
                    <span className="font-bold text-[#25343F] font-mono text-[11px]">
                      +{formatRupiah(profit)}
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded-md font-bold text-[9.5px] ${
                        marginPct >= 50
                          ? 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25'
                          : marginPct >= 25
                          ? 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25'
                          : 'bg-[#FF9B51]/8 text-[#c45e00] border border-[#FF9B51]/40'
                      }`}
                    >
                      +{marginPct}%
                    </span>
                  </div>

                  {hasBom && (
                    <button
                      type="button"
                      onClick={() => setExpandedBomCardId(isBomExpanded ? null : prod.id)}
                      className="text-[10px] font-bold text-[#898989] hover:text-[#25343F] flex items-center gap-0.5 cursor-pointer shrink-0"
                    >
                      <Square3Stack3DIcon className="w-3 h-3 text-[#898989]" />
                      <span>{prod.components!.length} Bahan</span>
                      {isBomExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Expandable BOM Section */}
                {hasBom && isBomExpanded && (
                  <div className="p-2.5 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 text-xs space-y-1.5 animate-fade-in">
                    <span className="text-[10px] font-bold text-[#25343F] uppercase tracking-wider block">
                      Rincian Bahan Baku (BOM):
                    </span>
                    {prod.components!.map((c, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] text-[#25343F]">
                        <span className="truncate max-w-[180px]">• {c.componentName || 'Bahan'}</span>
                        <span className="font-mono text-[#898989] font-medium">
                          {c.quantity} {c.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Minimalist Action Buttons */}
                <div className="pt-0.5 flex items-center justify-end gap-1.5 relative">
                  {/* Lihat Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedDetailProduct(prod)}
                    className="h-7 px-2.5 bg-[#EAEFEF] hover:bg-[#EAEFEF]/70 text-[#25343F] rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-transform active:scale-95 cursor-pointer"
                  >
                    <EyeIcon className="w-3 h-3 text-[#898989]" />
                    <span>Lihat</span>
                  </button>

                  {/* PencilSquareIcon Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(prod)}
                    className="h-7 px-3 bg-[#25343F] active:bg-[#FF9B51] text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-md transition-transform active:scale-95 cursor-pointer"
                  >
                    <PencilSquareIcon className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  {/* ⋯ More Options Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuProductId(isMenuOpen ? null : prod.id)}
                      className="h-7 w-7 bg-white active:bg-[#EAEFEF] text-[#898989] border border-[#BFC9D1]/25 rounded-lg flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md"
                      aria-label="Opsi lainnya"
                    >
                      <EllipsisVerticalIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        ref={menuDropdownRef}
                        className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl border border-[#BFC9D1]/25 py-1.5 z-30 animate-fade-in text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuProductId(null);
                            setLabelPrintProductId(prod.id);
                            setIsLabelPrintOpen(true);
                          }}
                          className="w-full min-h-[38px] px-3.5 py-2 text-left text-[#25343F] hover:bg-[#EAEFEF] flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <QrCodeIcon className="w-4 h-4 text-[#25343F]" />
                          <span>Cetak Label Barcode</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateProduct(prod)}
                          className="w-full min-h-[38px] px-3.5 py-2 text-left text-[#25343F] hover:bg-[#EAEFEF] flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <SparklesIcon className="w-4 h-4 text-[#FF9B51]" />
                          <span>Duplikat Produk</span>
                        </button>
                        {onOpenHppCalculator && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuProductId(null);
                              onOpenHppCalculator(prod.id);
                            }}
                            className="w-full min-h-[40px] px-3.5 py-2 text-left text-[#25343F] hover:bg-[#EAEFEF] flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <Square3Stack3DIcon className="w-4 h-4 text-[#25343F]" />
                            <span>Kalkulator HPP</span>
                          </button>
                        )}
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuProductId(null);
                            setProductToDelete(prod);
                          }}
                          className="w-full min-h-[40px] px-3.5 py-2 text-left text-[#c45e00] hover:bg-[#FF9B51]/8 flex items-center gap-2 cursor-pointer font-bold"
                        >
                          <TrashIcon className="w-4 h-4 text-[#c45e00]" />
                          <span>Hapus Produk</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP & TABLET VIEW: FULL / SIMPLIFIED TABLE (>= 768px)                 */}
      {/* ========================================================================= */}
      {!loading && filteredProducts.length > 0 && (
        <div className="hidden md:block bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/80 text-[#898989] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-3 w-14"></th>
                  <th className="py-3.5 px-4">Kode &amp; Nama Produk</th>
                  <th className="py-3.5 px-4">Kategori &amp; Tipe</th>
                  <th className="py-3.5 px-4 text-right">Biaya Pokok (HPP)</th>
                  <th className="py-3.5 px-4 text-right">Harga Jual</th>
                  <th className="py-3.5 px-4 text-center">Margin Laba</th>
                  <th className="py-3.5 px-4 text-center">Bahan (BOM)</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(prod => {
                  const profit = prod.sellingPrice - prod.costPrice;
                  const marginPct =
                    prod.costPrice > 0 ? Math.round((profit / prod.costPrice) * 100) : 100;

                  return (
                    <tr key={prod.id} className="hover:bg-[#EAEFEF]/60 transition-colors">
                      {/* Thumbnail */}
                      <td className="py-2 px-3">
                        <ProductImage
                          thumbnailPath={prod.thumbnailPath}
                          imagePath={prod.imagePath}
                          productName={prod.name}
                          size="sm"
                          rounded="rounded-lg"
                        />
                      </td>

                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-[#25343F] text-sm">{prod.name}</div>
                        <div className="text-[11px] text-[#898989] font-mono">
                          SKU: {prod.sku} • Satuan: {prod.unit}
                        </div>
                      </td>

                      {/* Category & Type */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#25343F]">{prod.category}</span>
                        <div className="mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-[#EAEFEF] text-[#25343F]">
                            {prod.type}
                          </span>
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-[#25343F] font-mono">{formatRupiah(prod.costPrice)}</div>
                        <div className="text-[10px] text-[#898989]">per {prod.unit}</div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-[#25343F] text-sm flex items-baseline justify-end gap-1">
                          <span className="font-mono">{formatRupiah(prod.sellingPrice)}</span>
                          <span className="text-xs text-[#898989] font-medium font-sans">/{prod.unit}</span>
                        </div>
                        <div className="text-[10px] text-[#25343F] font-bold">
                          Profit: +{formatRupiah(profit)}
                        </div>
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                            marginPct >= 50
                              ? 'bg-[#EAEFEF] text-[#25343F]'
                              : marginPct >= 25
                              ? 'bg-[#EAEFEF] text-[#25343F]'
                              : 'bg-[#FF9B51]/15 text-[#c45e00]'
                          }`}
                        >
                          +{marginPct}%
                        </span>
                      </td>

                      {/* Components / BOM */}
                      <td className="py-3 px-4 text-center">
                        {prod.components && prod.components.length > 0 ? (
                          <span className="text-[11px] font-semibold text-[#25343F] bg-[#EAEFEF] px-2 py-1 rounded-md">
                            {prod.components.length} bahan baku
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#898989]">Tanpa BOM</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setLabelPrintProductId(prod.id);
                              setIsLabelPrintOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#25343F] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 cursor-pointer"
                            title="Cetak Label Barcode"
                          >
                            <QrCodeIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedDetailProduct(prod)}
                            className="p-1.5 rounded-lg text-[#25343F] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 cursor-pointer"
                            title="Lihat Detail Produk & Gambar"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg text-[#25343F] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 cursor-pointer"
                            title="Edit Produk & Rincian HPP"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 rounded-lg text-[#c45e00] hover:bg-[#FF9B51]/8 border border-[#FF9B51]/40 cursor-pointer"
                            title="Hapus Produk"
                          >
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM SHEET: FILTER DRAWER (< 768px)                              */}
      {/* ========================================================================= */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#25343F]/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-5 max-h-[85vh] flex flex-col animate-slide-up shadow-2xl safe-area-bottom">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="w-4 h-4 text-[#25343F]" />
                <h3 className="font-extrabold text-sm text-[#25343F]">Filter Produk</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#EAEFEF] flex items-center justify-center text-[#898989] cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="overflow-y-auto py-4 space-y-3.5 flex-1 text-xs">
              {/* Category Filter */}
              <div>
                <label className="block font-bold text-[#25343F] mb-2">Kategori Produk</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#25343F] text-white shadow-sm'
                          : 'bg-[#EAEFEF] text-[#898989] hover:bg-[#EAEFEF]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block font-bold text-[#25343F] mb-2">Tipe Item</label>
                <div className="grid grid-cols-3 gap-2">
                  {['SEMUA', 'CETAK', 'JASA'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className={`py-2 rounded-xl font-bold transition-all cursor-pointer text-center ${
                        selectedType === t
                          ? 'bg-[#25343F] text-white shadow-sm'
                          : 'bg-[#EAEFEF] text-[#898989] hover:bg-[#EAEFEF]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Margin Preset */}
              <div>
                <label className="block font-bold text-[#25343F] mb-2">Minimal Margin Laba</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Semua', val: '' },
                    { label: '≥ 25%', val: 25 },
                    { label: '≥ 50%', val: 50 },
                    { label: '≥ 100%', val: 100 },
                  ].map(m => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setMinMarginFilter(m.val as any)}
                      className={`py-2 rounded-xl font-bold transition-all cursor-pointer text-center ${
                        minMarginFilter === m.val
                          ? 'bg-[#25343F] text-white shadow-sm'
                          : 'bg-[#EAEFEF] text-[#898989] hover:bg-[#EAEFEF]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-[#BFC9D1]/25 font-bold text-[#898989] hover:bg-[#EAEFEF] cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-2 min-h-[44px] py-2.5 bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold rounded-xl shadow-sm cursor-pointer"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM SHEET: SORT DRAWER (< 768px)                                */}
      {/* ========================================================================= */}
      {isSortDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#25343F]/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-5 max-h-[85vh] flex flex-col animate-slide-up shadow-2xl safe-area-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowsUpDownIcon className="w-4 h-4 text-[#25343F]" />
                <h3 className="font-extrabold text-sm text-[#25343F]">Urutkan Produk</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSortDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#EAEFEF] flex items-center justify-center text-[#898989] cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 divide-y divide-slate-100 text-xs">
              {[
                { id: 'name-asc', label: 'Nama Produk (A - Z)' },
                { id: 'name-desc', label: 'Nama Produk (Z - A)' },
                { id: 'price-asc', label: 'Harga Jual Terendah' },
                { id: 'price-desc', label: 'Harga Jual Tertinggi' },
                { id: 'margin-desc', label: 'Margin Laba Tertinggi' },
                { id: 'cost-asc', label: 'Biaya Pokok (HPP) Terendah' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.id as SortOption);
                    setIsSortDrawerOpen(false);
                  }}
                  className="w-full min-h-[44px] py-3 px-2 flex items-center justify-between text-left text-[#25343F] hover:bg-[#EAEFEF] cursor-pointer"
                >
                  <span className={`text-sm ${sortBy === opt.id ? 'font-black text-[#25343F]' : 'font-medium'}`}>
                    {opt.label}
                  </span>
                  {sortBy === opt.id && <CheckIcon className="w-4 h-4 text-[#25343F]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT                                                 */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-2xl w-full p-4 sm:p-6 my-2 sm:my-8 max-h-[92dvh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base sm:text-lg text-[#25343F]">
                {editingProduct ? 'Edit Produk & HPP' : 'Tambah Produk Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#EAEFEF] flex items-center justify-center text-[#898989] hover:text-[#25343F] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="overflow-y-auto py-4 space-y-3.5 flex-1 text-xs">
              {/* Product Image Uploader */}
              <div>
                <label className="block font-bold text-[#25343F] mb-1.5">Foto Produk (Opsional)</label>
                <ProductImageUploader
                  productId={editingProduct?.id}
                  currentImagePath={formImagePath}
                  currentThumbnailPath={formThumbnailPath}
                  onUploadSuccess={data => {
                    setFormImagePath(data.imagePath);
                    setFormThumbnailPath(data.thumbnailPath);
                    setFormImagePreviewUrl(data.imageUrl);
                  }}
                  onPendingFile={file => {
                    setPendingImageFile(file);
                    if (file) {
                      setFormImagePreviewUrl(URL.createObjectURL(file));
                      setFormImagePath('pending');
                    } else {
                      setFormImagePreviewUrl(null);
                      setFormImagePath(null);
                    }
                  }}
                  onRemoveImage={() => {
                    setPendingImageFile(null);
                    setFormImagePath(null);
                    setFormThumbnailPath(null);
                    setFormImagePreviewUrl(null);
                  }}
                  isLoading={isSaving}
                />
              </div>

              {/* Core Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Kode / SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MDF Photo A4 Cetak Mewah"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Kategori Plain Text Input */}
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Kategori</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Ketik kategori produk..."
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                  />
                </div>

                {/* Tipe: Clean Segmented Pill Buttons (No native Android popup) */}
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Tipe Produk</label>
                  <div className="grid grid-cols-2 p-1 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25">
                    <button
                      type="button"
                      onClick={() => setType('CETAK')}
                      className={`py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
                        type === 'CETAK'
                          ? 'bg-[#25343F] text-white shadow-md'
                          : 'text-[#898989] hover:text-white'
                      }`}
                    >
                      Produk Fisik
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('JASA')}
                      className={`py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
                        type === 'JASA'
                          ? 'bg-[#25343F] text-white shadow-md'
                          : 'text-[#898989] hover:text-white'
                      }`}
                    >
                      Jasa / Desain
                    </button>
                  </div>
                </div>

                {/* Satuan Selector */}
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Satuan Produk</label>
                  <select
                    value={['pcs', 'lembar', 'meter', 'box', 'paket', 'porsi', 'set', 'lusin', 'kg', 'rim'].includes(unit) ? unit : 'custom'}
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        setUnit('');
                      } else {
                        setUnit(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-medium cursor-pointer text-xs"
                  >
                    <option value="pcs">pcs (Buah/Item)</option>
                    <option value="lembar">lembar</option>
                    <option value="meter">meter (m / m²)</option>
                    <option value="box">box / dus</option>
                    <option value="paket">paket</option>
                    <option value="porsi">porsi</option>
                    <option value="set">set</option>
                    <option value="lusin">lusin (12 pcs)</option>
                    <option value="rim">rim (500 lbr)</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="custom">+ Ketik Satuan Lainnya...</option>
                  </select>
                  {!['pcs', 'lembar', 'meter', 'box', 'paket', 'porsi', 'set', 'lusin', 'kg', 'rim'].includes(unit) && (
                    <input
                      type="text"
                      autoFocus
                      required
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      placeholder="Ketik nama satuan custom..."
                      className="w-full mt-1.5 px-3 py-1.5 bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-lg text-xs"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Deskripsi / Spesifikasi</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Keterangan bahan, finishing, ukuran..."
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              {/* ── BARCODE SECTION ── */}
              <div className="p-3 sm:p-3.5 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <QrCodeIcon className="w-4 h-4 text-[#25343F] shrink-0" />
                    <h4 className="font-bold text-[#25343F] text-xs sm:text-sm">Barcode Produk</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGenerateBarcode}
                    disabled={isGeneratingBarcode}
                    className="px-2.5 py-1 bg-white hover:bg-[#FF9B51]/10 text-[#25343F] border border-[#BFC9D1]/40 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <SparklesIcon className="w-3 h-3 text-[#FF9B51]" />
                    {isGeneratingBarcode ? 'Membuat...' : 'Generate Otomatis'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#898989] mb-1">Format Barcode</label>
                    <select
                      value={barcodeType}
                      onChange={e => setBarcodeType(e.target.value as BarcodeFormat)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-lg text-xs font-semibold"
                    >
                      {(Object.keys(BARCODE_FORMAT_LABELS) as BarcodeFormat[]).map(fmt => (
                        <option key={fmt} value={fmt}>
                          {BARCODE_FORMAT_LABELS[fmt]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#898989] mb-1">
                      Kode / Nilai Barcode <span className="text-[#898989] font-normal">(opsional)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={barcodeValue}
                        onChange={e => setBarcodeValue(e.target.value)}
                        placeholder="Contoh: SKN-8DA2T5C4 atau 8991234567890"
                        className="flex-1 px-2.5 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-lg text-xs font-mono"
                      />
                      {barcodeValue && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(barcodeValue);
                            showToast('Kode barcode disalin ke clipboard', 'success');
                          }}
                          className="p-1.5 bg-white hover:bg-slate-100 border border-[#BFC9D1]/25 rounded-lg text-[#898989] hover:text-[#25343F] cursor-pointer"
                          title="Salin barcode"
                        >
                          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {barcodeError && (
                  <p className="text-[11px] text-red-500 font-medium">{barcodeError}</p>
                )}

                {/* Live SVG Barcode Preview */}
                {barcodeValue.trim() && !barcodeError && (
                  <div className="bg-white p-2.5 rounded-lg border border-[#BFC9D1]/25 flex flex-col items-center justify-center">
                    <svg ref={barcodeSvgRef} className="max-w-full h-auto" />
                  </div>
                )}
              </div>

              {/* BOM (Bill of Materials) Components */}
              <div className="p-3 sm:p-3.5 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#25343F] text-xs sm:text-sm">Komposisi Bahan Baku (BOM)</h4>
                    <span className="text-[10.5px] text-[#898989] line-clamp-1">
                      Bahan yang otomatis dipotong stoknya
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddComponent}
                    className="px-2.5 py-1.5 bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <PlusIcon className="w-3 h-3" /> Tambah Bahan
                  </button>
                </div>

                {components.length === 0 ? (
                  <p className="text-xs text-[#898989] italic py-2">
                    Belum ada bahan baku yang dikaitkan (HPP bahan = Rp0).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {components.map((comp, idx) => {
                      const mat = materials.find(m => m.id === comp.materialId);
                      const subtotal = (mat?.unitCost || 0) * (comp.quantity || 0);

                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-lg border border-[#BFC9D1]/25 text-xs"
                        >
                          <select
                            value={comp.materialId}
                            onChange={e => handleUpdateComponent(idx, 'materialId', e.target.value)}
                            className="w-full sm:flex-1 px-2 py-1.5 bg-white border border-[#BFC9D1]/25 rounded text-xs truncate"
                          >
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({formatRupiah(m.unitCost)}/{m.unit})
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="Qty"
                                value={comp.quantity || ''}
                                onChange={e => handleUpdateComponent(idx, 'quantity', e.target.value)}
                                className="w-16 px-2 py-1 bg-white border border-[#BFC9D1]/25 rounded text-center text-xs font-bold"
                              />
                              <span className="text-[#898989] font-mono text-[11px] min-w-[28px]">{comp.unit}</span>
                            </div>

                            <span className="font-bold text-[#25343F] font-mono text-xs text-right min-w-[70px]">
                              {formatRupiah(subtotal)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(idx)}
                              className="p-1 text-[#898989] hover:text-[#c45e00] rounded cursor-pointer shrink-0"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Overhead Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Tenaga Kerja (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={laborCost ? laborCost.toLocaleString('id-ID') : ''}
                    placeholder="0"
                    onChange={e => setLaborCost(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Listrik &amp; Mesin (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={machineCost ? machineCost.toLocaleString('id-ID') : ''}
                    placeholder="0"
                    onChange={e => setMachineCost(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Biaya Lainnya (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otherCost ? otherCost.toLocaleString('id-ID') : ''}
                    placeholder="0"
                    onChange={e => setOtherCost(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Pricing & Margin Calculator summary */}
              <div className="p-3.5 sm:p-4 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#25343F]">Total Biaya Pokok (HPP):</span>
                  <span className="font-extrabold text-sm text-[#25343F] font-mono">
                    {formatRupiah(calculatedCostPrice)}
                  </span>
                </div>

                {/* Margin Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#25343F] flex items-center gap-1">
                      <ReceiptPercentIcon className="w-3.5 h-3.5 text-[#898989]" /> Target Margin Laba:
                    </span>
                    <span className="font-extrabold text-[#25343F] font-mono">+{targetMarginPercent}%</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[30, 50, 75, 100, 150].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applyMargin(pct)}
                        className={`py-1.5 rounded-lg font-bold text-xs border transition-colors cursor-pointer text-center ${
                          targetMarginPercent === pct
                            ? 'bg-[#25343F] text-white border-slate-900 shadow-md'
                            : 'bg-white text-[#898989] border-[#BFC9D1] hover:bg-[#EAEFEF]'
                        }`}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final Selling Price Input */}
                <div>
                  <label className="block font-extrabold text-[#25343F] mb-1 text-xs sm:text-sm">
                    Harga Jual Satuan (Rp) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={sellingPrice ? sellingPrice.toLocaleString('id-ID') : ''}
                    onChange={e => {
                      const sp = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                      setSellingPrice(sp);
                      if (calculatedCostPrice > 0) {
                        setTargetMarginPercent(
                          Math.round(((sp - calculatedCostPrice) / calculatedCostPrice) * 100)
                        );
                      }
                    }}
                    className="w-full px-3.5 py-2 bg-white border border-[#BFC9D1]/25 focus:border-slate-900 rounded-xl font-black text-base sm:text-lg text-[#25343F] font-mono"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs pt-1 border-t border-[#BFC9D1]/40 gap-0.5">
                  <span className="text-[#898989]">Estimasi Laba Bersih per {unit || 'pcs'}:</span>
                  <span className="font-black text-[#25343F] text-sm font-mono">
                    +{formatRupiah(Math.max(0, sellingPrice - calculatedCostPrice))}
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-[#BFC9D1]/25 font-semibold text-[#898989] hover:bg-[#EAEFEF] cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold shadow-sm cursor-pointer text-xs flex items-center gap-1.5"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Produk & HPP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRODUCT DETAIL PREVIEW                                             */}
      {/* ========================================================================= */}
      {selectedDetailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-lg w-full p-4 sm:p-6 my-4 sm:my-8 max-h-[92dvh] overflow-y-auto space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-[#25343F]">Detail Produk</h3>
                <p className="text-xs text-[#898989] font-mono">SKU: {selectedDetailProduct.sku}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailProduct(null)}
                className="w-8 h-8 rounded-full bg-[#EAEFEF] flex items-center justify-center text-[#898989] hover:text-[#25343F] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Product Image Full Preview */}
            <div className="w-full aspect-video sm:aspect-4/3 rounded-xl overflow-hidden bg-[#EAEFEF] border border-[#BFC9D1]/25 flex items-center justify-center relative shadow-inner">
              <ProductImage
                imagePath={selectedDetailProduct.imagePath}
                thumbnailPath={selectedDetailProduct.thumbnailPath}
                productName={selectedDetailProduct.name}
                preferFull={true}
                size="xl"
                rounded="rounded-xl"
              />
            </div>

            {/* Information Grid */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="font-extrabold text-[#25343F] text-lg">{selectedDetailProduct.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md font-bold uppercase bg-[#EAEFEF] text-[#25343F] text-[10px]">
                    {selectedDetailProduct.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-bold uppercase bg-[#EAEFEF] text-[#25343F] text-[10px]">
                    Tipe: {selectedDetailProduct.type}
                  </span>
                  <span className="text-[#898989] text-[11px]">Satuan: {selectedDetailProduct.unit}</span>
                </div>
              </div>

              {selectedDetailProduct.description && (
                <div className="p-3 bg-[#EAEFEF] rounded-xl text-[#898989] text-xs leading-relaxed">
                  {selectedDetailProduct.description}
                </div>
              )}

              {/* Price & Profit Summary */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div className="p-3 bg-[#EAEFEF] rounded-xl text-center">
                  <span className="text-[10px] text-[#898989] font-semibold block">BIAYA POKOK (HPP)</span>
                  <span className="text-xs sm:text-sm font-bold text-[#25343F] mt-0.5 block font-mono">
                    {formatRupiah(selectedDetailProduct.costPrice)}
                  </span>
                </div>
                <div className="p-3 bg-[#EAEFEF]/60 rounded-xl text-center border border-[#BFC9D1]/25">
                  <span className="text-[10px] text-[#25343F] font-semibold block">HARGA JUAL</span>
                  <span className="text-xs sm:text-sm font-black text-[#25343F] mt-0.5 block font-mono">
                    {formatRupiah(selectedDetailProduct.sellingPrice)}
                  </span>
                </div>
                <div className="p-3 bg-[#EAEFEF]/60 rounded-xl text-center border border-[#BFC9D1]/25">
                  <span className="text-[10px] text-[#25343F] font-semibold block">ESTIMASI LABA</span>
                  <span className="text-xs sm:text-sm font-black text-[#25343F] mt-0.5 block font-mono">
                    {formatRupiah(Math.max(0, selectedDetailProduct.sellingPrice - selectedDetailProduct.costPrice))}
                  </span>
                </div>
              </div>

              {/* Barcode Info in Detail */}
              {selectedDetailProduct.barcode && (
                <div className="p-3 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCodeIcon className="w-5 h-5 text-[#25343F]" />
                    <div>
                      <span className="text-[10px] text-[#898989] font-bold block uppercase">Barcode ({selectedDetailProduct.barcodeType || 'CODE128'})</span>
                      <span className="font-mono font-bold text-xs text-[#25343F]">{selectedDetailProduct.barcode}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedDetailProduct.id;
                      setSelectedDetailProduct(null);
                      setLabelPrintProductId(id);
                      setIsLabelPrintOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#BFC9D1]/30 text-xs font-bold text-[#25343F] hover:bg-[#FF9B51]/10 flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <PrinterIcon className="w-3.5 h-3.5 text-[#FF9B51]" />
                    <span>Cetak Label</span>
                  </button>
                </div>
              )}

              {/* BOM Components List */}
              {selectedDetailProduct.components && selectedDetailProduct.components.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-[#25343F] block">Komponen Bahan Baku (BOM):</span>
                  <div className="space-y-1 bg-[#EAEFEF] rounded-xl p-2.5">
                    {selectedDetailProduct.components.map((c, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] text-[#898989]">
                        <span>• {c.componentName || 'Bahan'}</span>
                        <span className="font-mono text-[#898989]">{c.quantity} {c.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const prod = selectedDetailProduct;
                  setSelectedDetailProduct(null);
                  handleOpenEdit(prod);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <PencilSquareIcon className="w-3.5 h-3.5" />
                <span>Edit Produk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        title="Hapus Produk?"
        message={`Apakah Anda yakin ingin menghapus produk "${productToDelete?.name}"?`}
        confirmLabel="Hapus Produk"
        onConfirm={handleDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />

      {/* Barcode Label Print Modal */}
      <BarcodeLabelPrintModal
        isOpen={isLabelPrintOpen}
        onClose={() => {
          setIsLabelPrintOpen(false);
          setLabelPrintProductId(undefined);
        }}
        products={products}
        initialProductId={labelPrintProductId}
      />

      {/* ── Floating Action Button (FAB) Tambah Produk ── */}
      <button
        id="btn-add-product-fab"
        type="button"
        onClick={handleOpenAdd}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] flex items-center justify-center shadow-xl border-2 border-white transition-all cursor-pointer active:scale-90 hover:scale-105"
        title="Tambah Produk Baru"
        aria-label="Tambah Produk Baru"
      >
        <PlusIcon className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
