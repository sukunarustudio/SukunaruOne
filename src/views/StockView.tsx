import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Square3Stack3DIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  QrCodeIcon,
  PrinterIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  CheckIcon,
  PhotoIcon,
  ArchiveBoxIcon,
  TagIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  CubeIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import {
  StockItem,
  StockMovement,
  StockMovementType,
  ItemType,
  PaymentMethod,
  ViewType,
  UnitConversion,
  PriceTier,
  ItemComponent,
  Product,
} from '../types';
import { formatRupiah, formatDateTime, formatDate } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { BarcodeLabelPrintModal } from '../components/BarcodeLabelPrintModal';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { generateBarcodeValue, validateBarcodeValue, BarcodeFormat, BARCODE_FORMAT_LABELS } from '../lib/barcodeUtils';

interface StockViewProps {
  onRefreshDashboard?: () => void;
  onNavigate?: (view: ViewType) => void;
}

const POPULAR_UNITS = [
  { value: 'pcs', label: 'Pcs (Buah / Satuan)' },
  { value: 'box', label: 'Box / Kotak' },
  { value: 'dus', label: 'Dus / Karton' },
  { value: 'pack', label: 'Pack / Bungkus' },
  { value: 'kg', label: 'Kg (Kilogram)' },
  { value: 'gram', label: 'Gram (gr)' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'ml', label: 'Mililiter (ml)' },
  { value: 'lembar', label: 'Lembar' },
  { value: 'rim', label: 'Rim (500 Lembar)' },
  { value: 'meter', label: 'Meter (m)' },
  { value: 'roll', label: 'Roll / Gulungan' },
  { value: 'porsi', label: 'Porsi / Cup / Mangkok' },
  { value: 'botol', label: 'Botol' },
  { value: 'sachet', label: 'Sachet' },
  { value: 'lusin', label: 'Lusin (12 Pcs)' },
  { value: 'set', label: 'Set / Paket' },
  { value: 'custom', label: '✍️ Satuan Lainnya (Ketik Manual)...' },
];

const PACKAGING_PRESETS = [
  { label: 'Dus (12)', unit: 'Dus', rate: 12 },
  { label: 'Box (24)', unit: 'Box', rate: 24 },
  { label: 'Lusin (12)', unit: 'Lusin', rate: 12 },
  { label: 'Pack (10)', unit: 'Pack', rate: 10 },
  { label: 'Pack (20)', unit: 'Pack', rate: 20 },
  { label: 'Rim (500)', unit: 'Rim', rate: 500 },
  { label: 'Karton (50)', unit: 'Karton', rate: 50 },
  { label: 'Kodi (20)', unit: 'Kodi', rate: 20 },
  { label: 'Gross (144)', unit: 'Gross', rate: 144 },
];

const COMMON_PACKAGING_UNITS = [
  'Dus', 'Box', 'Pack', 'Lusin', 'Rim', 'Karton', 'Bal', 'Roll', 'Kodi', 'Gross', 'Bungkus', 'Sachet', 'Botol', 'Karung', 'Galon', 'Set'
];

const POPULAR_CATEGORIES = [
  'Umum',
  'Makanan & Minuman',
  'Bahan Baku',
  'Kemasan & Plastik',
  'Pakaian & Tekstil',
  'Elektronik & Aksesoris',
  'Percetakan & Kertas',
  'Jasa & Desain',
  'Kecantikan & Herbal',
  'ATK / Alat Tulis',
];

// ── SUB-COMPONENT: LIVE BARCODE SVG PREVIEW ──
const LiveBarcodePreview: React.FC<{ value: string; format: BarcodeFormat }> = ({ value, format }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (!value || !value.trim()) return;
    let isMounted = true;
    (async () => {
      try {
        const JsBarcode = (await import('jsbarcode')).default;
        if (svgRef.current && isMounted) {
          JsBarcode(svgRef.current, value.trim(), {
            format,
            width: 1.6,
            height: 46,
            displayValue: true,
            fontSize: 11,
            margin: 6,
            background: '#ffffff',
            lineColor: '#1e293b',
            font: 'monospace',
          });
          setIsValid(true);
        }
      } catch (err) {
        if (isMounted) setIsValid(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [value, format]);

  if (!value || !value.trim()) return null;

  return (
    <div className="mt-2 p-2 bg-white rounded-xl border border-[#BFC9D1]/30 flex flex-col items-center justify-center shadow-xs">
      {isValid ? (
        <svg ref={svgRef} className="max-w-full h-auto" />
      ) : (
        <p className="text-[10.5px] text-amber-600 font-medium py-1 text-center">
          ⚠️ Nilai barcode belum valid untuk standar {format}.
        </p>
      )}
    </div>
  );
};

export const StockView: React.FC<StockViewProps> = ({ onRefreshDashboard, onNavigate }) => {
  const { showToast } = useToast();

  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs & Navigation
  const [activeMainTab, setActiveMainTab] = useState<'stock' | 'movements'>('stock');
  const [activeStockType, setActiveStockType] = useState<'all' | 'GOODS' | 'RAW_MATERIAL' | 'PRODUCED' | 'SERVICE'>('all');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filterCritical, setFilterCritical] = useState(false);
  const [selectedMovementType, setSelectedMovementType] = useState<string>('ALL');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<StockItem>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formBarcodeType, setFormBarcodeType] = useState<BarcodeFormat>('CODE128');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unit Selector Custom state
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  // Dynamic Sub-items in Form
  const [unitConversions, setUnitConversions] = useState<UnitConversion[]>([]);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [components, setComponents] = useState<ItemComponent[]>([]);

  // Restock Modal State
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(1);
  const [restockSelectedUnit, setRestockSelectedUnit] = useState<string>('');
  const [restockUnitPrice, setRestockUnitPrice] = useState<number>(0);
  const [restockTotalPrice, setRestockTotalPrice] = useState<number>(0);
  const [restockSupplier, setRestockSupplier] = useState<string>('');
  const [restockNotes, setRestockNotes] = useState<string>('');
  const [restockRecordExpense, setRestockRecordExpense] = useState<boolean>(true);
  const [restockPaymentMethod, setRestockPaymentMethod] = useState<PaymentMethod>('CASH');

  // Opname / Adjust Modal State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustSelectedUnit, setAdjustSelectedUnit] = useState<string>('');
  const [adjustInputQty, setAdjustInputQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'OPNAME' | 'ADJUSTMENT'>('OPNAME');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Delete Confirm State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);

  // Barcode Modals
  const [isBarcodePrintOpen, setIsBarcodePrintOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [barcodeTargetMode, setBarcodeTargetMode] = useState<'search' | 'form'>('search');

  // Expanded BOM Recipe Card ID
  const [expandedBomCardId, setExpandedBomCardId] = useState<string | null>(null);

  // Top-bar ⋮ menu state
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const topMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (topMenuRef.current && !topMenuRef.current.contains(event.target as Node)) {
        setIsTopMenuOpen(false);
      }
    };
    if (isTopMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTopMenuOpen]);

  // Load Initial Data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [stockList, movsList] = await Promise.all([
        api.getStockItems().catch(() => []),
        api.getStockMovements().catch(() => []),
      ]);
      setItems(stockList || []);
      setMovements(movsList || []);
    } catch (error: any) {
      console.error('Error fetching stock data:', error);
      showToast(error?.message || 'Gagal memuat data stok', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleSync = () => {
      api.getStockItems().then(setItems).catch(() => {});
      api.getStockMovements().then(setMovements).catch(() => {});
    };
    const handleMutation = () => {
      api.getStockItems().then(setItems).catch(() => {});
      api.getStockMovements().then(setMovements).catch(() => {});
    };
    window.addEventListener('sukunaru:sync_completed', handleSync);
    window.addEventListener('sukunaru:data_mutation', handleMutation);
    return () => {
      window.removeEventListener('sukunaru:sync_completed', handleSync);
      window.removeEventListener('sukunaru:data_mutation', handleMutation);
    };
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (activeStockType !== 'all' && item.itemType !== activeStockType) {
        return false;
      }
      if (filterCritical) {
        if (!item.trackStock || (item.currentStock || 0) > (item.minStock || 0)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSku = item.sku && item.sku.toLowerCase().includes(q);
        const matchesCat = item.category && item.category.toLowerCase().includes(q);
        const matchesBarcode = item.barcode && item.barcode.toLowerCase().includes(q);
        const matchesSupplier = item.supplier && item.supplier.toLowerCase().includes(q);
        const matchesConv = (item.unitConversions || []).some(
          c => c.fromUnit.toLowerCase().includes(q) || (c.barcode && c.barcode.toLowerCase().includes(q))
        );
        if (!matchesName && !matchesSku && !matchesCat && !matchesBarcode && !matchesSupplier && !matchesConv) {
          return false;
        }
      }
      return true;
    });
  }, [items, activeStockType, filterCritical, searchQuery]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movements.filter(mov => {
      if (selectedMovementType !== 'ALL' && mov.type !== selectedMovementType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesItem = mov.itemName.toLowerCase().includes(q);
        const matchesNotes = mov.notes && mov.notes.toLowerCase().includes(q);
        const matchesRef = mov.referenceType && mov.referenceType.toLowerCase().includes(q);
        if (!matchesItem && !matchesNotes && !matchesRef) return false;
      }
      return true;
    });
  }, [movements, selectedMovementType, searchQuery]);

  // Movement Metrics Calculation
  const movementMetrics = useMemo(() => {
    let inCount = 0;
    let outCount = 0;
    let opnameCount = 0;
    let prodCount = 0;

    movements.forEach(m => {
      if (m.type === 'IN') inCount++;
      else if (m.type === 'OUT') outCount++;
      else if (m.type === 'OPNAME' || m.type === 'ADJUSTMENT') opnameCount++;
      else if (m.type === 'PRODUCTION') prodCount++;
    });

    return {
      total: movements.length,
      inCount,
      outCount,
      opnameCount,
      prodCount,
    };
  }, [movements]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const totalItems = items.length;
    const retailCount = items.filter(i => i.itemType === 'GOODS').length;
    const rawCount = items.filter(i => i.itemType === 'RAW_MATERIAL').length;
    const producedCount = items.filter(i => i.itemType === 'PRODUCED').length;
    const serviceCount = items.filter(i => i.itemType === 'SERVICE').length;

    let lowStockCount = 0;
    let totalStockAssetValue = 0;

    items.forEach(item => {
      if (item.trackStock && item.itemType !== 'SERVICE') {
        const stock = item.currentStock || 0;
        const min = item.minStock || 0;
        if (stock <= min) {
          lowStockCount++;
        }
        const cost = item.costPrice || item.purchasePrice || 0;
        totalStockAssetValue += stock * cost;
      }
    });

    return {
      totalItems,
      retailCount,
      rawCount,
      producedCount,
      serviceCount,
      lowStockCount,
      totalStockAssetValue,
    };
  }, [items]);

  // Auto SKU Generator
  const handleGenerateSku = () => {
    const prefix = formData.itemType === 'RAW_MATERIAL' ? 'MAT' : formData.itemType === 'PRODUCED' ? 'PRD' : formData.itemType === 'SERVICE' ? 'SRV' : 'SKU';
    const rand = Math.floor(10000 + Math.random() * 90000);
    const newSku = `${prefix}-${rand}`;
    setFormData(prev => ({ ...prev, sku: newSku }));
    showToast(`SKU dibuat: ${newSku}`, 'info');
  };

  // Open Create Form
  const handleOpenCreateForm = (presetType: ItemType = 'GOODS') => {
    const prefix = presetType === 'RAW_MATERIAL' ? 'MAT' : presetType === 'PRODUCED' ? 'PRD' : presetType === 'SERVICE' ? 'SRV' : 'SKU';
    const rand = Math.floor(10000 + Math.random() * 90000);
    setFormData({
      itemType: presetType,
      name: '',
      sku: `${prefix}-${rand}`,
      category: 'Umum',
      baseUnit: 'pcs',
      trackStock: presetType !== 'SERVICE',
      currentStock: presetType === 'SERVICE' ? 0 : 5,
      minStock: presetType === 'SERVICE' ? 0 : 2,
      purchasePrice: 0,
      sellingPrice: 0,
      costPrice: 0,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
      description: '',
      supplier: '',
      supplierContact: '',
      isActive: true,
      barcode: '',
      barcodeType: 'CODE128',
    });
    setFormBarcodeType('CODE128');
    setIsCustomUnit(false);
    setUnitConversions([]);
    setPriceTiers([]);
    setComponents([]);
    setImageFile(null);
    setImagePreview(null);
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEditForm = (item: StockItem) => {
    setFormData({ ...item });
    const isStandard = POPULAR_UNITS.some(u => u.value === (item.baseUnit || 'pcs'));
    setIsCustomUnit(!isStandard);
    setFormBarcodeType((item.barcodeType as BarcodeFormat) || 'CODE128');
    setUnitConversions(item.unitConversions || []);
    setPriceTiers(item.priceTiers || []);
    setComponents(item.components || []);
    setImageFile(null);
    setImagePreview(item.thumbnailPath || item.imagePath || null);
    setIsFormOpen(true);
  };

  // Calculate BOM Cost for PRODUCED Items
  const calculatedBOMCost = useMemo(() => {
    if (formData.itemType !== 'PRODUCED') return 0;
    const rawMaterialsCost = components.reduce((sum, c) => sum + (c.subtotal || 0), 0);
    const labor = Number(formData.laborCost) || 0;
    const machine = Number(formData.machineCost) || 0;
    const other = Number(formData.otherCost) || 0;
    return rawMaterialsCost + labor + machine + other;
  }, [components, formData.laborCost, formData.machineCost, formData.otherCost, formData.itemType]);

  // Live Profit & Margin Indicator Calculation in Form
  const formProfitInfo = useMemo(() => {
    const isProduced = formData.itemType === 'PRODUCED';
    const cost = isProduced && calculatedBOMCost > 0 ? calculatedBOMCost : Number(formData.purchasePrice) || Number(formData.costPrice) || 0;
    const sell = Number(formData.sellingPrice) || 0;
    const profit = sell - cost;
    const margin = sell > 0 ? (profit / sell) * 100 : 0;
    return { cost, sell, profit, margin };
  }, [formData.itemType, formData.purchasePrice, formData.costPrice, formData.sellingPrice, calculatedBOMCost]);

  // Handle Form Save
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      showToast('Nama barang wajib diisi', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const isService = formData.itemType === 'SERVICE';
      const isProduced = formData.itemType === 'PRODUCED';
      const isRaw = formData.itemType === 'RAW_MATERIAL';

      let costPrice = Number(formData.costPrice) || Number(formData.purchasePrice) || 0;
      if (isProduced && calculatedBOMCost > 0) {
        costPrice = calculatedBOMCost;
      }

      const purchasePrice = isRaw || formData.itemType === 'GOODS'
        ? (Number(formData.purchasePrice) || costPrice)
        : costPrice;

      const sellingPrice = isRaw ? 0 : (Number(formData.sellingPrice) || 0);
      const profit = sellingPrice - costPrice;
      const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

      // Filter out invalid unit conversions (empty fromUnit)
      const validConversions = unitConversions
        .filter(c => c.fromUnit && c.fromUnit.trim() && c.conversionRate > 0)
        .map(c => ({
          ...c,
          fromUnit: c.fromUnit.trim(),
          toUnit: formData.baseUnit?.trim() || 'pcs',
        }));

      const payload: Partial<StockItem> = {
        ...formData,
        name: formData.name.trim(),
        sku: formData.sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        category: formData.category?.trim() || 'Umum',
        baseUnit: formData.baseUnit?.trim() || 'pcs',
        trackStock: isService ? false : (formData.trackStock ?? true),
        currentStock: isService ? 0 : (formData.currentStock === undefined ? 5 : Number(formData.currentStock)),
        minStock: isService ? 0 : Number(formData.minStock) || 0,
        purchasePrice,
        costPrice,
        sellingPrice,
        profit,
        profitMargin,
        marginPercent: profitMargin,
        barcodeType: formBarcodeType,
        unitConversions: validConversions,
        priceTiers,
        components: isProduced ? components : [],
        laborCost: isProduced ? Number(formData.laborCost) || 0 : 0,
        machineCost: isProduced ? Number(formData.machineCost) || 0 : 0,
        otherCost: isProduced ? Number(formData.otherCost) || 0 : 0,
      };

      let saved: StockItem;
      if (formData.id) {
        saved = await api.updateStockItem(formData.id, payload);
        showToast('Data barang berhasil diperbarui', 'success');
      } else {
        saved = await api.createStockItem(payload);
        showToast('Barang baru berhasil ditambahkan', 'success');
      }

      // Upload Image if present
      if (imageFile && saved) {
        await api.uploadStockItemImage(saved.id, imageFile);
      }

      setIsFormOpen(false);
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (error: any) {
      console.error('Error saving stock item:', error);
      showToast(error?.message || 'Gagal menyimpan data barang', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await api.deleteStockItem(itemToDelete.id);
      showToast(`Barang "${itemToDelete.name}" berhasil dihapus`, 'success');
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (error: any) {
      console.error('Error deleting stock item:', error);
      showToast(error?.message || 'Gagal menghapus barang', 'error');
    }
  };

  // Open Restock Modal
  const handleOpenRestock = (item: StockItem) => {
    setSelectedItem(item);
    setRestockQty(1);
    setRestockSelectedUnit(item.baseUnit || 'pcs');
    setRestockUnitPrice(item.purchasePrice || item.costPrice || 0);
    setRestockTotalPrice(item.purchasePrice || item.costPrice || 0);
    setRestockSupplier(item.supplier || '');
    setRestockNotes('');
    setRestockRecordExpense(true);
    setRestockPaymentMethod('CASH');
    setIsRestockOpen(true);
  };

  // Calculate Restock Base Qty considering Unit Conversions
  const calculatedRestockBaseQty = useMemo(() => {
    if (!selectedItem) return restockQty;
    if (restockSelectedUnit === selectedItem.baseUnit) return restockQty;
    const conv = (selectedItem.unitConversions || []).find(
      c => c.fromUnit.toLowerCase() === restockSelectedUnit.toLowerCase()
    );
    if (conv && conv.conversionRate > 0) {
      return restockQty * conv.conversionRate;
    }
    return restockQty;
  }, [selectedItem, restockQty, restockSelectedUnit]);

  // Handle Restock Submit
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (restockQty <= 0) {
      showToast('Jumlah masuk harus lebih dari 0', 'error');
      return;
    }

    try {
      const baseQty = calculatedRestockBaseQty;
      const unitCost = restockTotalPrice > 0 && baseQty > 0
        ? restockTotalPrice / baseQty
        : selectedItem.purchasePrice || selectedItem.costPrice || 0;

      const noteText = restockSelectedUnit !== selectedItem.baseUnit
        ? `Restock ${restockQty} ${restockSelectedUnit} (${baseQty} ${selectedItem.baseUnit})${restockNotes ? ` · ${restockNotes}` : ''}`
        : restockNotes;

      await api.restockStockItem(selectedItem.id, {
        quantity: baseQty,
        purchasePrice: restockTotalPrice,
        unitCost,
        supplier: restockSupplier || selectedItem.supplier,
        notes: noteText || undefined,
        recordExpense: restockRecordExpense,
        paymentMethod: restockPaymentMethod,
      });

      showToast(`Stok "${selectedItem.name}" bertambah +${baseQty} ${selectedItem.baseUnit}`, 'success');
      setIsRestockOpen(false);
      setSelectedItem(null);
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (error: any) {
      console.error('Error restock item:', error);
      showToast(error?.message || 'Gagal melakukan restock barang', 'error');
    }
  };

  // Open Adjust / Opname Modal
  const handleOpenAdjust = (item: StockItem) => {
    setSelectedItem(item);
    setAdjustSelectedUnit(item.baseUnit || 'pcs');
    setAdjustInputQty(item.currentStock || 0);
    setAdjustType('OPNAME');
    setAdjustNotes('');
    setIsAdjustOpen(true);
  };

  // Calculate Opname Actual Base Qty considering Unit Conversions
  const calculatedAdjustBaseQty = useMemo(() => {
    if (!selectedItem) return adjustInputQty;
    if (adjustSelectedUnit === selectedItem.baseUnit) return adjustInputQty;
    const conv = (selectedItem.unitConversions || []).find(
      c => c.fromUnit.toLowerCase() === adjustSelectedUnit.toLowerCase()
    );
    if (conv && conv.conversionRate > 0) {
      return adjustInputQty * conv.conversionRate;
    }
    return adjustInputQty;
  }, [selectedItem, adjustInputQty, adjustSelectedUnit]);

  // Handle Adjust Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const finalStock = calculatedAdjustBaseQty;
      const noteDetails = adjustSelectedUnit !== selectedItem.baseUnit
        ? `Opname fisik: ${adjustInputQty} ${adjustSelectedUnit} = ${finalStock} ${selectedItem.baseUnit}${adjustNotes ? ` · ${adjustNotes}` : ''}`
        : adjustNotes || (adjustType === 'OPNAME' ? 'Stock Opname Fisik' : 'Koreksi Stok Manual');

      await api.adjustStockItem(selectedItem.id, {
        newStock: finalStock,
        type: adjustType,
        notes: noteDetails,
      });

      showToast(`Stok "${selectedItem.name}" disesuaikan menjadi ${finalStock} ${selectedItem.baseUnit}`, 'success');
      setIsAdjustOpen(false);
      setSelectedItem(null);
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      showToast(error?.message || 'Gagal menyesuaikan stok', 'error');
    }
  };

  // Generate Barcode Value based on 3 formats
  const handleGenerateBarcode = (format: BarcodeFormat = formBarcodeType) => {
    const code = generateBarcodeValue(formData.id || `item_${Date.now()}`, format);
    setFormData(prev => ({ ...prev, barcode: code, barcodeType: format }));
    showToast(`Barcode ${format} berhasil dibuat`, 'success');
  };

  // Image Upload Handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Remove Selected Image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imagePath: undefined, thumbnailPath: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add Component to BOM Recipe
  const handleAddComponent = (rawItemId: string) => {
    const raw = items.find(i => i.id === rawItemId);
    if (!raw) return;
    const newComp: ItemComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      itemId: raw.id,
      componentName: raw.name,
      quantity: 1,
      unit: raw.baseUnit || 'pcs',
      unitCost: raw.costPrice || raw.purchasePrice || 0,
      subtotal: raw.costPrice || raw.purchasePrice || 0,
    };
    setComponents(prev => [...prev, newComp]);
  };

  // Update Component in BOM Recipe
  const handleUpdateComponentQty = (id: string, qty: number) => {
    setComponents(prev => prev.map(c => {
      if (c.id === id) {
        const safeQty = Math.max(0.001, qty);
        return {
          ...c,
          quantity: safeQty,
          subtotal: safeQty * (c.unitCost || 0),
        };
      }
      return c;
    }));
  };

  // Remove Component from BOM Recipe
  const handleRemoveComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
  };

  // Add Blank Unit Conversion
  const handleAddBlankUnitConversion = () => {
    const newConv: UnitConversion = {
      id: `uc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      fromUnit: '',
      toUnit: formData.baseUnit || 'pcs',
      conversionRate: 12,
    };
    setUnitConversions(prev => [...prev, newConv]);
  };

  // Add Preset Unit Conversion
  const handleAddPresetUnitConversion = (unit: string, rate: number) => {
    if (unitConversions.some(c => c.fromUnit.toLowerCase() === unit.toLowerCase())) {
      showToast(`Satuan ${unit} sudah ada di daftar konversi`, 'info');
      return;
    }
    const defaultSellingPrice = formData.sellingPrice ? Math.round(Number(formData.sellingPrice) * rate * 0.95) : undefined;
    const newConv: UnitConversion = {
      id: `uc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      fromUnit: unit,
      toUnit: formData.baseUnit || 'pcs',
      conversionRate: rate,
      sellingPrice: defaultSellingPrice,
    };
    setUnitConversions(prev => [...prev, newConv]);
    showToast(`Konversi 1 ${unit} = ${rate} ${formData.baseUnit || 'pcs'} ditambahkan`, 'success');
  };

  // Remove Unit Conversion
  const handleRemoveUnitConversion = (id: string) => {
    setUnitConversions(prev => prev.filter(u => u.id !== id));
  };

  // Add Price Tier
  const handleAddPriceTier = () => {
    const newTier: PriceTier = {
      id: `pt_${Date.now()}`,
      minQty: 10,
      price: Math.max(0, (formData.sellingPrice || 0) * 0.9),
      label: 'Grosir',
    };
    setPriceTiers(prev => [...prev, newTier]);
  };

  // Remove Price Tier
  const handleRemovePriceTier = (id: string) => {
    setPriceTiers(prev => prev.filter(p => p.id !== id));
  };

  // Products array prepared for BarcodeLabelPrintModal
  const productsForLabelPrint: Product[] = useMemo(() => {
    return items.map(it => ({
      id: it.id,
      name: it.name,
      sku: it.sku || '',
      category: it.category || 'Umum',
      barcode: it.barcode,
      barcodeType: (it.barcodeType as any) || 'CODE128',
      sellingPrice: it.sellingPrice || 0,
      costPrice: it.costPrice || 0,
      unit: it.baseUnit || 'pcs',
      isActive: it.isActive !== false,
      type: 'NON_CETAK' as any,
    }));
  }, [items]);

  return (
    <div id="stock-view" className="space-y-3.5 max-w-4xl mx-auto pb-28">

      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-20 bg-[#EAEFEF]/90 dark:bg-[#0B0F17]/90 backdrop-blur-xl py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="p-2 -ml-2 text-[#25343F] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer active:scale-90 shrink-0"
              title="Kembali ke Beranda"
            >
              <ArrowLeftIcon className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] dark:text-white leading-tight tracking-tight truncate">
              Stok Barang
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] dark:text-slate-400 font-medium mt-0.5 truncate hidden sm:block">
              {isLoading
                ? 'Memuat...'
                : activeMainTab === 'stock'
                ? `${filteredItems.length} dari ${items.length} master barang`
                : `${filteredMovements.length} dari ${movements.length} catatan mutasi`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(prev => !prev)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isSearchOpen || searchQuery
                ? 'bg-[#25343F] text-white border-[#25343F]'
                : 'bg-white dark:bg-slate-800 text-[#25343F] dark:text-white border-[#BFC9D1]/30 hover:bg-[#EAEFEF]'
            }`}
            title="Cari Barang"
          >
            <MagnifyingGlassIcon className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Barcode Scanner Button */}
          <button
            type="button"
            onClick={() => {
              setBarcodeTargetMode('search');
              setIsBarcodeScannerOpen(true);
            }}
            className="p-2 bg-white dark:bg-slate-800 text-[#25343F] dark:text-white border border-[#BFC9D1]/30 hover:bg-[#EAEFEF] rounded-xl transition-all cursor-pointer active:scale-95"
            title="Scan Barcode Cepat"
          >
            <QrCodeIcon className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Cetak Label Barcode Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedItem(null);
              setIsBarcodePrintOpen(true);
            }}
            className="p-2 bg-white dark:bg-slate-800 text-[#25343F] dark:text-white border border-[#BFC9D1]/30 hover:bg-[#EAEFEF] rounded-xl transition-all cursor-pointer active:scale-95"
            title="Cetak Label Barcode / Rak"
          >
            <PrinterIcon className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Three Dots Menu */}
          <div className="relative" ref={topMenuRef}>
            <button
              type="button"
              onClick={() => setIsTopMenuOpen(prev => !prev)}
              className="p-2 bg-white dark:bg-slate-800 text-[#25343F] dark:text-white border border-[#BFC9D1]/30 hover:bg-[#EAEFEF] rounded-xl transition-all cursor-pointer active:scale-95"
              title="Menu Lainnya"
            >
              <EllipsisVerticalIcon className="w-4 h-4 stroke-[2]" />
            </button>

            {isTopMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 border border-[#BFC9D1]/30 rounded-2xl shadow-xl py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTopMenuOpen(false);
                      handleOpenCreateForm('GOODS');
                    }}
                    className="w-full px-3.5 py-2 text-left text-[#25343F] dark:text-white hover:bg-[#EAEFEF] dark:hover:bg-slate-800 font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <BuildingStorefrontIcon className="w-4 h-4 text-[#FF9B51]" />
                    <span>+ Barang Retail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTopMenuOpen(false);
                      handleOpenCreateForm('RAW_MATERIAL');
                    }}
                    className="w-full px-3.5 py-2 text-left text-[#25343F] dark:text-white hover:bg-[#EAEFEF] dark:hover:bg-slate-800 font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <CubeIcon className="w-4 h-4 text-emerald-500" />
                    <span>+ Bahan Baku</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTopMenuOpen(false);
                      handleOpenCreateForm('PRODUCED');
                    }}
                    className="w-full px-3.5 py-2 text-left text-[#25343F] dark:text-white hover:bg-[#EAEFEF] dark:hover:bg-slate-800 font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <WrenchScrewdriverIcon className="w-4 h-4 text-blue-500" />
                    <span>+ Hasil Produksi (BOM)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTopMenuOpen(false);
                      handleOpenCreateForm('SERVICE');
                    }}
                    className="w-full px-3.5 py-2 text-left text-[#25343F] dark:text-white hover:bg-[#EAEFEF] dark:hover:bg-slate-800 font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <TagIcon className="w-4 h-4 text-purple-500" />
                    <span>+ Jasa / Layanan</span>
                  </button>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTopMenuOpen(false);
                      fetchData();
                    }}
                    className="w-full px-3.5 py-2 text-left text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] dark:hover:bg-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Segarkan Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EXPANDABLE SEARCH BAR ── */}
      {isSearchOpen && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-150">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#898989]" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang, SKU, barcode, kategori, supplier..."
            className="w-full h-10 pl-9 pr-8 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl text-xs font-medium text-[#25343F] dark:text-white placeholder:text-[#898989] focus:outline-hidden focus:border-[#25343F] shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#898989] hover:text-[#25343F] rounded-full cursor-pointer"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#898989] hover:text-[#25343F] rounded-full cursor-pointer"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── TOP SEGMENTED VIEW SWITCHER: MASTER STOK vs KARTU MUTASI ── */}
      <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl border border-[#BFC9D1]/30 shadow-xs flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveMainTab('stock')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'stock'
              ? 'bg-[#25343F] text-white shadow-md'
              : 'text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] dark:hover:bg-slate-700'
          }`}
        >
          <span>Daftar Stok Barang</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('movements')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'movements'
              ? 'bg-[#25343F] text-white shadow-md'
              : 'text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] dark:hover:bg-slate-700'
          }`}
        >
          <span>Kartu Stok &amp; Mutasi</span>
        </button>
      </div>

      {/* ── MASTER STOK VIEW SECTION ── */}
      {activeMainTab === 'stock' && (
        <>
          {/* ── COMPACT METRICS CARDS (4-COLUMNS) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Valuasi Total Aset */}
            <div className="bg-white dark:bg-slate-800 p-3 sm:p-3.5 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#898989] uppercase tracking-wider">
                Valuasi Persediaan
              </span>
              <p className="text-base sm:text-lg font-black text-[#25343F] dark:text-white tabular-nums leading-tight mt-0.5">
                {formatRupiah(metrics.totalStockAssetValue)}
              </p>
              <span className="text-[10px] text-[#898989] font-medium mt-0.5">
                Total {metrics.totalItems} item
              </span>
            </div>

            {/* Perlu Restock */}
            <div className={`p-3 sm:p-3.5 rounded-2xl border shadow-md flex flex-col justify-between ${
              metrics.lowStockCount > 0
                ? 'bg-red-50/50 dark:bg-red-950/30 border-red-200/80 text-red-700 dark:text-red-400'
                : 'bg-white dark:bg-slate-800 border-[#BFC9D1]/25 text-[#25343F] dark:text-white'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                  metrics.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-[#898989]'
                }`}>
                  Perlu Restock
                </span>
                {metrics.lowStockCount > 0 && (
                  <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                )}
              </div>
              <p className={`text-base sm:text-lg font-black tabular-nums leading-tight mt-0.5 ${
                metrics.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-[#25343F] dark:text-white'
              }`}>
                {metrics.lowStockCount} <span className="text-xs font-semibold">Item</span>
              </p>
              <span className={`text-[10px] font-medium mt-0.5 ${
                metrics.lowStockCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-[#898989]'
              }`}>
                Stok &le; batas minimum
              </span>
            </div>

            {/* Retail / Dagangan */}
            <div className="bg-white dark:bg-slate-800 p-3 sm:p-3.5 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#898989] uppercase tracking-wider">
                Retail / Jual
              </span>
              <p className="text-base sm:text-lg font-black text-[#25343F] dark:text-white tabular-nums leading-tight mt-0.5">
                {metrics.retailCount} <span className="text-xs font-semibold text-[#898989]">Item</span>
              </p>
              <span className="text-[10px] text-[#898989] font-medium mt-0.5">
                Siap jual di POS
              </span>
            </div>

            {/* Bahan & Produksi */}
            <div className="bg-white dark:bg-slate-800 p-3 sm:p-3.5 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#898989] uppercase tracking-wider">
                Bahan &amp; Produksi
              </span>
              <p className="text-base sm:text-lg font-black text-[#25343F] dark:text-white tabular-nums leading-tight mt-0.5">
                {metrics.rawCount + metrics.producedCount} <span className="text-xs font-semibold text-[#898989]">Item</span>
              </p>
              <span className="text-[10px] text-[#898989] font-medium mt-0.5">
                {metrics.rawCount} Bahan · {metrics.producedCount} Hasil
              </span>
            </div>
          </div>

          {/* ── STOCK TYPE SUB-PILLS (5 CLEAN ITEMS) ── */}
          <div className="flex items-center justify-between gap-2 py-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'GOODS', label: 'Retail' },
                { id: 'RAW_MATERIAL', label: 'Bahan Baku' },
                { id: 'PRODUCED', label: 'Produksi' },
                { id: 'SERVICE', label: 'Jasa' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStockType(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeStockType === tab.id
                      ? 'bg-[#25343F] text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-[#898989] border border-[#BFC9D1]/25 hover:bg-[#EAEFEF] dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Low Stock Toggle Pill */}
            <button
              type="button"
              onClick={() => setFilterCritical(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                filterCritical
                  ? 'bg-red-500 text-white border-red-600 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-[#898989] border-[#BFC9D1]/25 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <ExclamationTriangleIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stok Kritis</span>
            </button>
          </div>

          {/* ── MASTER ITEMS LIST / GRID ── */}
          {filteredItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#BFC9D1]/25 p-8 text-center shadow-md">
              <Square3Stack3DIcon className="w-10 h-10 mx-auto text-[#898989] mb-2" />
              <h3 className="text-sm font-bold text-[#25343F] dark:text-white">Tidak ada data barang</h3>
              <p className="text-xs text-[#898989] mt-0.5">
                {searchQuery ? 'Tidak ditemukan barang yang sesuai pencarian.' : 'Belum ada barang dalam kategori ini.'}
              </p>
              <button
                type="button"
                onClick={() => handleOpenCreateForm('GOODS')}
                className="mt-3.5 px-4 py-2 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Tambah Barang Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map(item => {
                const isLow = item.trackStock && (item.currentStock || 0) <= (item.minStock || 0) && (item.currentStock || 0) > 0;
                const isZero = item.trackStock && (item.currentStock || 0) <= 0;
                const hasMultiUnit = item.unitConversions && item.unitConversions.length > 0;
                const hasBom = item.itemType === 'PRODUCED' && item.components && item.components.length > 0;
                const isBomExpanded = expandedBomCardId === item.id;
                const isService = item.itemType === 'SERVICE';
                const isRaw = item.itemType === 'RAW_MATERIAL';

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl border p-3.5 shadow-md flex flex-col justify-between gap-3 transition-all hover:border-[#25343F]/40 ${
                      isZero
                        ? 'border-red-300 dark:border-red-900/50'
                        : isLow
                        ? 'border-amber-300 dark:border-amber-900/50'
                        : 'border-[#BFC9D1]/25 dark:border-slate-700'
                    }`}
                  >
                    {/* Row 1: Header Item (Thumbnail, Info, Badges) */}
                    <div className="flex items-start gap-3">
                      {/* Image Thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-[#EAEFEF] dark:bg-slate-700 border border-[#BFC9D1]/30 overflow-hidden flex items-center justify-center shrink-0">
                        {item.thumbnailPath || item.imagePath ? (
                          <img
                            src={item.thumbnailPath || item.imagePath}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-[#898989] text-xs font-black">
                            {item.itemType === 'GOODS' ? (
                              <BuildingStorefrontIcon className="w-6 h-6 text-[#FF9B51]" />
                            ) : item.itemType === 'RAW_MATERIAL' ? (
                              <CubeIcon className="w-6 h-6 text-emerald-500" />
                            ) : item.itemType === 'PRODUCED' ? (
                              <WrenchScrewdriverIcon className="w-6 h-6 text-blue-500" />
                            ) : (
                              <TagIcon className="w-6 h-6 text-purple-500" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Title & Codes */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.2 rounded-md font-bold text-[9.5px] uppercase ${
                            item.itemType === 'GOODS'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
                              : item.itemType === 'RAW_MATERIAL'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : item.itemType === 'PRODUCED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                          }`}>
                            {item.itemType === 'GOODS'
                              ? 'Retail'
                              : item.itemType === 'RAW_MATERIAL'
                              ? 'Bahan'
                              : item.itemType === 'PRODUCED'
                              ? 'Produksi'
                              : 'Jasa'}
                          </span>

                          {item.category && item.category !== 'Umum' && (
                            <span className="px-1.5 py-0.2 rounded-md font-semibold text-[9.5px] bg-[#EAEFEF] dark:bg-slate-700 text-[#898989] dark:text-slate-300">
                              {item.category}
                            </span>
                          )}

                          {item.sku && (
                            <span className="text-[10px] font-mono text-[#898989] truncate">
                              #{item.sku}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-[#25343F] dark:text-white truncate mt-0.5" title={item.name}>
                          {item.name}
                        </h3>

                        {/* Price Breakdown */}
                        <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap">
                          {!isRaw && (
                            <span className="font-bold text-[#25343F] dark:text-white tabular-nums">
                              {formatRupiah(item.sellingPrice || 0)}
                              <span className="text-[10px] text-[#898989] font-normal">/{item.baseUnit || 'pcs'}</span>
                            </span>
                          )}
                          <span className="text-[10.5px] text-[#898989] font-medium">
                            HPP: {formatRupiah(item.costPrice || item.purchasePrice || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Stock Level & Multi-Unit Indicators */}
                    {!isService && (
                      <div className="bg-[#EAEFEF]/60 dark:bg-slate-700/50 p-2 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-medium text-[#898989] dark:text-slate-400">Stok Saat Ini:</span>
                          <span className="font-bold tabular-nums text-xs text-[#25343F] dark:text-white">
                            {item.currentStock || 0} {item.baseUnit}
                          </span>
                          {item.minStock && item.minStock > 0 ? (
                            <span className="text-[10px] text-[#898989]">(Min: {item.minStock})</span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded-md font-bold text-[9.5px] ${
                            isZero
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {isZero ? 'HABIS' : isLow ? 'MENIPIS' : 'AMAN'}
                          </span>

                          {hasBom && (
                            <button
                              type="button"
                              onClick={() => setExpandedBomCardId(isBomExpanded ? null : item.id)}
                              className="text-[10px] font-bold text-[#898989] hover:text-[#25343F] dark:hover:text-white flex items-center gap-0.5 cursor-pointer ml-1"
                            >
                              <Square3Stack3DIcon className="w-3 h-3 text-[#898989]" />
                              <span>{item.components!.length} Bahan</span>
                              {isBomExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Multi-Unit Breakdown Pills (Live Conversion in Stock Card) */}
                    {hasMultiUnit && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {item.unitConversions!.map(conv => {
                          const rate = conv.conversionRate || 1;
                          const currentStock = item.currentStock || 0;
                          const bigUnits = Math.floor(currentStock / rate);
                          const remainder = currentStock % rate;
                          return (
                            <div
                              key={conv.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAEFEF]/80 dark:bg-slate-700/80 border border-[#BFC9D1]/30 dark:border-slate-600 text-[10.5px] text-[#25343F] dark:text-slate-200"
                            >
                              <span className="font-bold text-[#FF9B51]">📦 1 {conv.fromUnit} = {conv.conversionRate} {item.baseUnit}</span>
                              {item.trackStock && currentStock > 0 && (
                                <span className="font-medium text-[#898989]">
                                  (Setara <strong className="text-[#25343F] dark:text-white font-bold">{bigUnits} {conv.fromUnit}</strong>{remainder > 0 ? ` + ${remainder} ${item.baseUnit}` : ''})
                                </span>
                              )}
                              {conv.sellingPrice && conv.sellingPrice > 0 && (
                                <span className="text-[#898989] font-mono">· Jual {formatRupiah(conv.sellingPrice)}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Expandable BOM Recipe Details */}
                    {hasBom && isBomExpanded && (
                      <div className="p-2.5 bg-[#EAEFEF] dark:bg-slate-700/60 rounded-xl border border-[#BFC9D1]/25 dark:border-slate-600 text-xs space-y-1.5 animate-in fade-in duration-150">
                        <span className="text-[10px] font-bold text-[#25343F] dark:text-white uppercase tracking-wider block">
                          Rincian Resep Bahan Baku (BOM):
                        </span>
                        {item.components!.map((c, i) => (
                          <div key={i} className="flex justify-between items-center text-[11px] text-[#25343F] dark:text-slate-200">
                            <span className="truncate max-w-[200px]">• {c.componentName || 'Bahan'}</span>
                            <span className="tabular-nums text-[#898989] font-semibold">
                              {c.quantity} {c.unit} ({formatRupiah(c.subtotal)})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Row 3: Action Buttons */}
                    <div className="pt-0.5 flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {/* Restock Button */}
                        {item.trackStock && !isService && (
                          <button
                            type="button"
                            onClick={() => handleOpenRestock(item)}
                            className="h-7 px-2.5 bg-[#25343F] hover:bg-[#1a252d] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                            title="Tambah Stok Masuk"
                          >
                            <ArrowDownLeftIcon className="w-3 h-3" />
                            <span>Restock</span>
                          </button>
                        )}

                        {/* Stock Opname Button */}
                        {item.trackStock && !isService && (
                          <button
                            type="button"
                            onClick={() => handleOpenAdjust(item)}
                            className="h-7 px-2.5 bg-white dark:bg-slate-800 hover:bg-[#EAEFEF] dark:hover:bg-slate-700 border border-[#BFC9D1]/35 dark:border-slate-600 text-[#25343F] dark:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Penyesuaian / Opname Fisik"
                          >
                            <ScaleIcon className="w-3 h-3 text-[#898989]" />
                            <span>Opname</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Print Label Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsBarcodePrintOpen(true);
                          }}
                          className="h-7 w-7 bg-[#EAEFEF] dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[#25343F] dark:text-white rounded-lg flex items-center justify-center active:scale-95 cursor-pointer"
                          title="Cetak Label Barcode"
                        >
                          <PrinterIcon className="w-3.5 h-3.5 text-[#898989]" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(item)}
                          className="h-7 px-2.5 bg-[#EAEFEF] dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[#25343F] dark:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                          title="Edit Barang"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5 text-[#898989]" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete(item);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="h-7 w-7 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center active:scale-95 cursor-pointer"
                          title="Hapus Barang"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── MOVEMENTS TAB: KARTU STOK & MUTASI ── */}
      {activeMainTab === 'movements' && (
        <div className="space-y-3">
          {/* Movement Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-[#BFC9D1]/25 shadow-md">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#898989] uppercase tracking-wider">
                Total Mutasi
              </span>
              <p className="text-base sm:text-lg font-black text-[#25343F] dark:text-white tabular-nums leading-tight mt-0.5">
                {movementMetrics.total} <span className="text-xs font-semibold text-[#898989]">Catatan</span>
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-[#BFC9D1]/25 shadow-md">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Stok Masuk
              </span>
              <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums leading-tight mt-0.5">
                {movementMetrics.inCount} <span className="text-xs font-semibold text-[#898989]">Transaksi</span>
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-[#BFC9D1]/25 shadow-md">
              <span className="text-[10px] sm:text-[11px] font-bold text-red-600 uppercase tracking-wider">
                Stok Keluar
              </span>
              <p className="text-base sm:text-lg font-black text-red-700 dark:text-red-400 tabular-nums leading-tight mt-0.5">
                {movementMetrics.outCount} <span className="text-xs font-semibold text-[#898989]">Transaksi</span>
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-[#BFC9D1]/25 shadow-md">
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                Opname &amp; Adj
              </span>
              <p className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-400 tabular-nums leading-tight mt-0.5">
                {movementMetrics.opnameCount} <span className="text-xs font-semibold text-[#898989]">Koreksi</span>
              </p>
            </div>
          </div>

          {/* Movement Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
            {[
              { id: 'ALL', label: 'Semua Riwayat' },
              { id: 'IN', label: 'Stok Masuk' },
              { id: 'OUT', label: 'Stok Keluar' },
              { id: 'OPNAME', label: 'Opname' },
              { id: 'PRODUCTION', label: 'Produksi' },
              { id: 'ADJUSTMENT', label: 'Penyesuaian' },
            ].map(mType => (
              <button
                key={mType.id}
                type="button"
                onClick={() => setSelectedMovementType(mType.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedMovementType === mType.id
                    ? 'bg-[#25343F] text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-[#898989] border border-[#BFC9D1]/25 hover:bg-[#EAEFEF] dark:hover:bg-slate-700'
                }`}
              >
                {mType.label}
              </button>
            ))}
          </div>

          {filteredMovements.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#BFC9D1]/25 p-8 text-center shadow-md">
              <ClockIcon className="w-10 h-10 mx-auto text-[#898989] mb-2" />
              <h3 className="text-sm font-bold text-[#25343F] dark:text-white">Belum ada catatan mutasi stok</h3>
              <p className="text-xs text-[#898989] mt-0.5">Pergerakan stok masuk, keluar POS, atau opname akan tercatat di sini.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              {filteredMovements.map(mov => {
                const isPositive = mov.type === 'IN' || mov.quantity > 0;
                return (
                  <div key={mov.id} className="p-3 hover:bg-[#EAEFEF]/50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#25343F] dark:text-white truncate">{mov.itemName}</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[9.5px] font-bold ${
                          mov.type === 'IN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : mov.type === 'OUT'
                            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {mov.type} {mov.referenceType ? `(${mov.referenceType})` : ''}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-[#898989] mt-0.5 truncate">
                        {formatDateTime(mov.date || mov.createdAt || '')} {mov.notes ? `· ${mov.notes}` : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`font-black tabular-nums text-xs ${
                        isPositive ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {isPositive ? '+' : ''}{mov.quantity}
                      </div>
                      <div className="text-[10px] text-[#898989] tabular-nums mt-0.5">
                        Sisa: {mov.newStock}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FLOATING ACTION BUTTON (FAB): + TAMBAH BARANG ── */}
      {activeMainTab === 'stock' && (
        <button
          id="btn-add-stock-fab"
          type="button"
          onClick={() => handleOpenCreateForm('GOODS')}
          className="fixed right-4 sm:bottom-8 sm:right-8 z-30 h-12 px-5 rounded-full font-extrabold text-xs sm:text-sm flex items-center gap-2 apple-glass-fab cursor-pointer"
          style={{
            bottom: 'calc(94px + env(safe-area-inset-bottom, 10px))',
          }}
          title="Tambah Barang Baru"
          aria-label="Tambah Barang Baru"
        >
          <PlusIcon className="w-5 h-5 stroke-[2.8]" />
          <span>Tambah Barang</span>
        </button>
      )}

      {/* ========================================================================= */}
      {/* FORM MODAL: PRO REDESIGNED SINGLE-PAGE DIALOG                             */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col border border-[#BFC9D1]/30 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-[#EAEFEF]/60 dark:from-slate-800 dark:to-slate-800/80 border-b border-[#BFC9D1]/30 dark:border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
                  style={{
                    backgroundColor: 'var(--color-accent-soft, #FFF3EB)',
                    color: 'var(--color-accent, #FF9B51)',
                  }}
                >
                  <Square3Stack3DIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#25343F] dark:text-white leading-tight">
                    {formData.id ? 'Edit Data Barang' : 'Tambah Barang Baru'}
                  </h2>
                  <p className="text-[11px] text-[#898989] dark:text-slate-400 font-medium">
                    {formData.id ? 'Perbarui informasi produk, harga beli & jual, dan inventori' : 'Lengkapi detail spesifikasi barang untuk master inventori'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-[#898989] hover:text-[#25343F] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-[#25343F] dark:text-slate-100">
              <form id="stock-item-form" onSubmit={handleSaveItem} className="space-y-4">

                {/* ── BAGIAN 1: IDENTITAS & FOTO BARANG ── */}
                <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-700 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-700/80 pb-2">
                    <span className="text-[10.5px] font-black text-[#898989] dark:text-slate-400 uppercase tracking-wider block">
                      1. Identitas &amp; Foto Barang
                    </span>
                  </div>

                  {/* Foto Picker Dropzone (Custom Styled) */}
                  <div>
                    <label className="block font-bold text-[#25343F] dark:text-slate-200 text-xs mb-1.5">
                      Foto Produk / Barang
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#EAEFEF]/50 dark:bg-slate-700/40 border border-[#BFC9D1]/30 dark:border-slate-600">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 shadow-xs shrink-0 relative group">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-[#25343F] dark:text-white truncate">
                            {imageFile ? imageFile.name : 'Foto Barang Terpasang'}
                          </p>
                          <p className="text-[10px] text-[#898989] mt-0.5">Rasio 1:1 disarankan</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 bg-[#25343F] hover:bg-[#1a252d] text-white rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              Ganti Foto
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors"
                            >
                              Hapus Foto
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3.5 rounded-2xl border-2 border-dashed border-[#BFC9D1]/50 dark:border-slate-600 hover:border-[#25343F] dark:hover:border-slate-400 bg-[#EAEFEF]/30 dark:bg-slate-700/20 hover:bg-[#EAEFEF]/60 flex items-center justify-center gap-3 cursor-pointer transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-[#898989] group-hover:text-[#25343F] group-hover:scale-105 transition-all shadow-xs">
                          <PhotoIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-xs text-[#25343F] dark:text-white block group-hover:underline">
                            Pilih / Ambil Foto Produk
                          </span>
                          <span className="text-[10px] text-[#898989]">
                            Klik untuk unggah (Format JPG, PNG, WebP)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Jenis Barang: 4 Visual Cards */}
                  <div>
                    <label className="block font-bold text-[#25343F] dark:text-slate-200 mb-1.5">
                      Jenis Barang *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        {
                          id: 'GOODS' as ItemType,
                          title: 'Barang Retail',
                          desc: 'Jual Langsung di POS',
                          icon: BuildingStorefrontIcon,
                          color: '#FF9B51',
                        },
                        {
                          id: 'RAW_MATERIAL' as ItemType,
                          title: 'Bahan Baku',
                          desc: 'Stok Mentah Produksi',
                          icon: CubeIcon,
                          color: '#10B981',
                        },
                        {
                          id: 'PRODUCED' as ItemType,
                          title: 'Hasil Produksi',
                          desc: 'Dari Resep (BOM)',
                          icon: WrenchScrewdriverIcon,
                          color: '#3B82F6',
                        },
                        {
                          id: 'SERVICE' as ItemType,
                          title: 'Jasa & Layanan',
                          desc: 'Layanan Tanpa Stok',
                          icon: TagIcon,
                          color: '#8B5CF6',
                        },
                      ].map(typeCard => {
                        const Icon = typeCard.icon;
                        const isSelected = (formData.itemType || 'GOODS') === typeCard.id;
                        return (
                          <button
                            key={typeCard.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                itemType: typeCard.id,
                                trackStock: typeCard.id !== 'SERVICE',
                              });
                            }}
                            className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#25343F] text-white border-[#25343F] shadow-md scale-[1.02]'
                                : 'bg-white dark:bg-slate-800 text-[#25343F] dark:text-slate-200 border-[#BFC9D1]/35 hover:bg-[#EAEFEF] dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Icon
                                className="w-4 h-4"
                                style={{ color: isSelected ? '#FF9B51' : typeCard.color }}
                              />
                              {isSelected && <CheckCircleIcon className="w-4 h-4 text-[#FF9B51]" />}
                            </div>
                            <div>
                              <p className="font-bold text-xs leading-tight">{typeCard.title}</p>
                              <p className={`text-[9.5px] mt-0.5 leading-tight ${isSelected ? 'text-slate-300' : 'text-[#898989]'}`}>
                                {typeCard.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nama Barang */}
                  <div>
                    <label className="block font-bold text-[#25343F] dark:text-slate-200 mb-1">
                      Nama Barang / Material *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Kertas Art Paper 260gr, Kopi Arabica Gayo, Kaos Polos Combed 30s"
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-medium text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] dark:focus:border-white shadow-xs"
                    />
                  </div>

                  {/* Kategori & SKU / Kode Barang Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Kategori */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-[#25343F] dark:text-slate-200 text-xs">
                          Kategori
                        </label>
                      </div>
                      <input
                        type="text"
                        list="category-suggestions"
                        value={formData.category || ''}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Pilih atau ketik kategori..."
                        className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-medium text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] shadow-xs"
                      />
                      <datalist id="category-suggestions">
                        {POPULAR_CATEGORIES.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>

                      {/* Quick Category Chips */}
                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        {['Umum', 'Makanan', 'Minuman', 'Bahan Baku', 'Kemasan'].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: tag })}
                            className={`px-2 py-0.5 rounded-md text-[9.5px] font-semibold transition-colors cursor-pointer ${
                              formData.category === tag
                                ? 'bg-[#25343F] text-white'
                                : 'bg-[#EAEFEF] dark:bg-slate-700 text-[#898989] hover:text-[#25343F]'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SKU / Kode Barang */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-[#25343F] dark:text-slate-200 text-xs">
                          SKU / Kode Barang
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateSku}
                          className="text-[10px] font-bold text-[#FF9B51] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <SparklesIcon className="w-3 h-3" /> Auto
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={formData.sku || ''}
                          onChange={e => setFormData({ ...formData, sku: e.target.value })}
                          placeholder="SKU-107147"
                          className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-mono text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] shadow-xs"
                        />
                      </div>
                      <p className="text-[9.5px] text-[#898989] mt-1">Kode unik untuk pencarian cepat di kasir</p>
                    </div>
                  </div>

                  {/* Barcode Scanner & Generator Section */}
                  <div className="p-3.5 bg-[#EAEFEF]/60 dark:bg-slate-700/40 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-600 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <QrCodeIcon className="w-4 h-4 text-[#FF9B51]" />
                        <label className="font-bold text-[#25343F] dark:text-white text-xs">
                          Barcode Scanner &amp; Generator
                        </label>
                      </div>

                      {/* Format Selector Pills */}
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-[#BFC9D1]/30">
                        {(['CODE128', 'EAN13', 'EAN8'] as BarcodeFormat[]).map(fmt => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => {
                              setFormBarcodeType(fmt);
                              setFormData(prev => ({ ...prev, barcodeType: fmt }));
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              formBarcodeType === fmt
                                ? 'bg-[#25343F] text-white shadow-xs'
                                : 'text-[#898989] hover:text-[#25343F] dark:hover:text-white'
                            }`}
                          >
                            {fmt === 'CODE128' ? 'Code 128' : fmt === 'EAN13' ? 'EAN-13' : 'EAN-8'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={formData.barcode || ''}
                        onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder={
                          formBarcodeType === 'EAN13'
                            ? '13 digit angka (contoh: 8991234567890)'
                            : formBarcodeType === 'EAN8'
                            ? '8 digit angka (contoh: 89123456)'
                            : 'Ketik atau scan barcode bebas...'
                        }
                        className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-mono text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBarcodeTargetMode('form');
                          setIsBarcodeScannerOpen(true);
                        }}
                        className="h-9 w-9 bg-white dark:bg-slate-800 hover:bg-[#EAEFEF] border border-[#BFC9D1]/40 text-[#25343F] dark:text-white rounded-xl flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
                        title="Scan dengan Kamera"
                      >
                        <QrCodeIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateBarcode(formBarcodeType)}
                        className="h-9 px-3 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1 transition-all"
                        style={{
                          backgroundColor: 'var(--color-accent, #FF9B51)',
                          color: 'var(--color-accent-contrast, #25343F)',
                        }}
                        title={`Generate Barcode ${formBarcodeType} Otomatis`}
                      >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        <span>Auto</span>
                      </button>
                    </div>

                    {/* Live SVG Barcode Preview */}
                    {formData.barcode && (
                      <LiveBarcodePreview value={formData.barcode} format={formBarcodeType} />
                    )}

                    <p className="text-[10px] text-[#898989] leading-tight">
                      {formBarcodeType === 'EAN13'
                        ? '💡 Format EAN-13: 13 digit angka standar barcode retail/supermarket (prefix 899 + checksum).'
                        : formBarcodeType === 'EAN8'
                        ? '💡 Format EAN-8: 8 digit angka ringkas untuk kemasan kecil (prefix 89 + checksum).'
                        : '💡 Format Code 128: Alfanumerik bebas (bisa kombinasi huruf, angka, dan tanda hubung).' }
                    </p>
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block font-bold text-[#25343F] dark:text-slate-200 mb-1 text-xs">
                      Deskripsi / Catatan Singkat
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Keterangan spesifikasi atau catatan internal..."
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-medium text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] shadow-xs resize-none"
                    />
                  </div>
                </div>

                {/* ── BAGIAN 2: HARGA & STRATEGI PENJUALAN ── */}
                <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-700 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-700/80 pb-2">
                    <span className="text-[10.5px] font-black text-[#898989] dark:text-slate-400 uppercase tracking-wider block">
                      2. Harga &amp; Strategi Penjualan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Harga Beli / HPP */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-[#25343F] dark:text-slate-200 text-xs">
                          Harga Beli Pokok (HPP) *
                        </label>
                        {formData.itemType === 'PRODUCED' && (
                          <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded">
                            Auto dari BOM
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-xs">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={formData.itemType === 'PRODUCED' && components.length > 0}
                          value={
                            formData.itemType === 'PRODUCED' && calculatedBOMCost > 0
                              ? Number(calculatedBOMCost).toLocaleString('id-ID')
                              : formData.purchasePrice
                              ? Number(formData.purchasePrice).toLocaleString('id-ID')
                              : ''
                          }
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            const val = raw ? Number(raw) : 0;
                            setFormData({ ...formData, purchasePrice: val, costPrice: val });
                          }}
                          placeholder="0"
                          className={`w-full h-10 pl-10 pr-3.5 border border-[#BFC9D1]/40 rounded-xl font-mono font-bold text-xs tabular-nums text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] shadow-xs ${
                            formData.itemType === 'PRODUCED' && components.length > 0
                              ? 'bg-[#EAEFEF]/60 dark:bg-slate-700/60 text-slate-500'
                              : 'bg-white dark:bg-slate-800'
                          }`}
                        />
                      </div>
                      <p className="text-[9.5px] text-[#898989] mt-1">Modal dasar per 1 {formData.baseUnit || 'pcs'}</p>
                    </div>

                    {/* Harga Jual Satuan Retail */}
                    {formData.itemType !== 'RAW_MATERIAL' && (
                      <div>
                        <label className="block font-bold text-[#25343F] dark:text-slate-200 mb-1 text-xs">
                          Harga Jual Satuan Retail *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#898989] font-bold text-xs">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formData.sellingPrice ? Number(formData.sellingPrice).toLocaleString('id-ID') : ''}
                            onChange={e => {
                              const raw = e.target.value.replace(/\D/g, '');
                              const val = raw ? Number(raw) : 0;
                              setFormData({ ...formData, sellingPrice: val });
                            }}
                            placeholder="0"
                            className="w-full h-10 pl-10 pr-3.5 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-mono font-bold text-xs tabular-nums text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] shadow-xs"
                          />
                        </div>
                        <p className="text-[9.5px] text-[#898989] mt-1">Harga jual resmi untuk konsumen</p>
                      </div>
                    )}
                  </div>

                  {/* Live Profit & Margin Indicator */}
                  {formData.itemType !== 'RAW_MATERIAL' && (formProfitInfo.sell > 0 || formProfitInfo.cost > 0) && (
                    <div className={`p-3 rounded-2xl border flex items-center justify-between flex-wrap gap-2 ${
                      formProfitInfo.profit < 0
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-700'
                        : formProfitInfo.margin < 15
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-4 h-4 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider block">
                            Estimasi Laba per {formData.baseUnit || 'pcs'}
                          </span>
                          <p className="text-xs font-black tabular-nums">
                            {formatRupiah(formProfitInfo.profit)}
                            <span className="font-semibold text-[10px] ml-1">
                              ({formProfitInfo.margin.toFixed(1)}% Margin)
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-white/80 dark:bg-slate-800/80 shadow-xs">
                        {formProfitInfo.profit < 0 ? '⚠️ Jual Rugi' : formProfitInfo.margin < 15 ? 'Margin Tipis' : '✅ Untung Sehat'}
                      </span>
                    </div>
                  )}

                  {/* Wholesale / Price Tiers Builder */}
                  {formData.itemType !== 'RAW_MATERIAL' && (
                    <div className="p-3.5 bg-[#EAEFEF]/60 dark:bg-slate-700/40 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-600 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-[#25343F] dark:text-white flex items-center gap-1.5">
                            <TagIcon className="w-3.5 h-3.5 text-[#FF9B51]" />
                            <span>Tingkatan Harga Grosir (Price Tiers)</span>
                          </h4>
                          <p className="text-[10px] text-[#898989] mt-0.5">Potongan harga otomatis saat beli dalam kuantitas banyak di kasir.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPriceTier}
                          className="px-2.5 py-1 bg-[#25343F] hover:bg-[#1a252d] text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <PlusIcon className="w-3 h-3" /> Tambah Grosir
                        </button>
                      </div>

                      {priceTiers.length === 0 ? (
                        <p className="text-[10.5px] text-[#898989] italic py-1">Belum ada tingkatan harga grosir.</p>
                      ) : (
                        <div className="space-y-2">
                          {priceTiers.map((tier, idx) => (
                            <div key={tier.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-[#BFC9D1]/30 shadow-xs flex-wrap sm:flex-nowrap">
                              <input
                                type="text"
                                placeholder="Label (Grosir A)"
                                value={tier.label || ''}
                                onChange={e => {
                                  const copy = [...priceTiers];
                                  copy[idx].label = e.target.value;
                                  setPriceTiers(copy);
                                }}
                                className="w-28 h-8 px-2.5 bg-white dark:bg-slate-700 border border-[#BFC9D1]/40 rounded-lg text-xs font-semibold text-[#25343F] dark:text-white"
                              />
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-[#898989] font-medium">Min:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={tier.minQty}
                                  onChange={e => {
                                    const copy = [...priceTiers];
                                    copy[idx].minQty = Number(e.target.value) || 1;
                                    setPriceTiers(copy);
                                  }}
                                  className="w-16 h-8 px-2 bg-white dark:bg-slate-700 border border-[#BFC9D1]/40 rounded-lg font-mono font-bold text-xs text-[#25343F] dark:text-white text-center"
                                />
                                <span className="text-[#898989]">{formData.baseUnit || 'pcs'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs flex-1 min-w-[140px]">
                                <span className="text-[#898989] font-medium">Rp</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={tier.price ? Number(tier.price).toLocaleString('id-ID') : ''}
                                  onChange={e => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    const copy = [...priceTiers];
                                    copy[idx].price = raw ? Number(raw) : 0;
                                    setPriceTiers(copy);
                                  }}
                                  placeholder="0"
                                  className="w-full h-8 px-2.5 bg-white dark:bg-slate-700 border border-[#BFC9D1]/40 rounded-lg font-mono font-bold text-xs text-[#25343F] dark:text-white tabular-nums"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePriceTier(tier.id)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── BAGIAN 3: INVENTORI & SATUAN STOK ── */}
                <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-700 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-700/80 pb-2 flex items-center justify-between">
                    <span className="text-[10.5px] font-black text-[#898989] dark:text-slate-400 uppercase tracking-wider block">
                      3. Inventori &amp; Satuan Stok
                    </span>
                    {formData.itemType !== 'SERVICE' && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-xs font-bold text-[#25343F] dark:text-white">Lacak Stok Fisik</span>
                        <input
                          type="checkbox"
                          checked={formData.trackStock ?? true}
                          onChange={e => setFormData({ ...formData, trackStock: e.target.checked })}
                          className="w-4 h-4 rounded text-[#FF9B51] focus:ring-[#FF9B51] cursor-pointer"
                        />
                      </label>
                    )}
                  </div>

                  {formData.itemType === 'SERVICE' ? (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 text-purple-800 dark:text-purple-300 text-xs">
                      Item ini bertipe <strong>Jasa / Layanan</strong> — Transaksi kasir tidak akan mengurangi stok fisik gudang.
                    </div>
                  ) : formData.trackStock !== false ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Satuan Dasar */}
                        <div>
                          <label className="block font-bold text-[#25343F] dark:text-slate-200 mb-1 text-xs">
                            Satuan Dasar (Terkecil) *
                          </label>
                          {!isCustomUnit ? (
                            <select
                              value={formData.baseUnit || 'pcs'}
                              onChange={e => {
                                if (e.target.value === 'custom') {
                                  setIsCustomUnit(true);
                                } else {
                                  setFormData({ ...formData, baseUnit: e.target.value });
                                }
                              }}
                              className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-medium text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] shadow-xs"
                            >
                              {POPULAR_UNITS.map(u => (
                                <option key={u.value} value={u.value}>{u.label}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex gap-1.5">
                              <input
                                autoFocus
                                type="text"
                                value={formData.baseUnit || ''}
                                onChange={e => setFormData({ ...formData, baseUnit: e.target.value })}
                                placeholder="Ketik satuan..."
                                className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-medium text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] shadow-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCustomUnit(false);
                                  setFormData({ ...formData, baseUnit: 'pcs' });
                                }}
                                className="h-10 px-2.5 bg-[#EAEFEF] dark:bg-slate-700 hover:bg-slate-200 text-[#25343F] dark:text-white rounded-xl text-[10.5px] font-bold shrink-0 cursor-pointer"
                              >
                                Pilihan
                              </button>
                            </div>
                          )}
                          <p className="text-[9.5px] text-[#898989] mt-1">Satuan dasar item (pcs, kg, botol)</p>
                        </div>

                        {/* Stok Awal */}
                        <div>
                          <label className="block font-bold text-[#25343F] dark:text-slate-200 mb-1 text-xs">
                            Stok Awal ({formData.baseUnit || 'pcs'})
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const cur = Number(formData.currentStock) || 0;
                                setFormData({ ...formData, currentStock: Math.max(0, cur - 1) });
                              }}
                              className="w-9 h-10 bg-[#EAEFEF] dark:bg-slate-700 hover:bg-slate-200 text-[#25343F] dark:text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={formData.currentStock ?? 5}
                              onChange={e => setFormData({ ...formData, currentStock: e.target.value === '' ? 0 : Number(e.target.value) })}
                              className="w-full h-10 px-2 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-mono font-bold text-xs tabular-nums text-center text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const cur = Number(formData.currentStock) || 0;
                                setFormData({ ...formData, currentStock: cur + 1 });
                              }}
                              className="w-9 h-10 bg-[#EAEFEF] dark:bg-slate-700 hover:bg-slate-200 text-[#25343F] dark:text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-[9.5px] text-[#898989] mt-1">Jumlah fisik yang ada sekarang</p>
                        </div>

                        {/* Batas Minimum */}
                        <div>
                          <label className="block font-bold text-[#25343F] dark:text-slate-200 mb-1 text-xs">
                            Batas Minimum (Peringatan)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={formData.minStock ?? 2}
                            onChange={e => setFormData({ ...formData, minStock: e.target.value === '' ? 0 : Number(e.target.value) })}
                            className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-mono font-bold text-xs tabular-nums text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F] shadow-xs"
                          />
                          <p className="text-[9.5px] text-[#898989] mt-1">Peringatan restock jika &le; batas ini</p>
                        </div>
                      </div>

                      {/* ── FITUR MULTI-SATUAN KONVERSI (ENHANCED) ── */}
                      <div className="p-3.5 bg-[#EAEFEF]/60 dark:bg-slate-700/40 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-600 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <ArrowsRightLeftIcon className="w-4 h-4 text-[#FF9B51]" />
                              <h4 className="font-bold text-xs text-[#25343F] dark:text-white">
                                Konversi Multi-Satuan (Kemasan Besar)
                              </h4>
                            </div>
                            <p className="text-[10px] text-[#898989] mt-0.5">
                              Kelola kemasan bertingkat untuk belanja grosir atau penjualan pak/dus (misal 1 Dus = 12 {formData.baseUnit || 'pcs'}).
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddBlankUnitConversion}
                            className="px-2.5 py-1 bg-[#25343F] hover:bg-[#1a252d] text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs transition-colors"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            <span>Tambah Satuan</span>
                          </button>
                        </div>

                        {/* Quick Preset Buttons */}
                        <div className="space-y-1 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-[#BFC9D1]/30 shadow-xs">
                          <span className="text-[10px] font-bold text-[#898989] block">Pilihan Cepat Satuan Kemasan:</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {PACKAGING_PRESETS.map(preset => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => handleAddPresetUnitConversion(preset.unit, preset.rate)}
                                className="px-2.5 py-1 rounded-lg bg-[#EAEFEF] dark:bg-slate-700 hover:bg-[#FF9B51]/20 hover:text-[#c45e00] text-[#25343F] dark:text-slate-200 text-[10.5px] font-semibold border border-[#BFC9D1]/30 transition-all cursor-pointer"
                              >
                                + {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Conversion Items List */}
                        {unitConversions.length === 0 ? (
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-[#BFC9D1]/50 text-center text-[#898989] text-[10.5px]">
                            Belum ada satuan konversi kemasan. Klik tombol di atas untuk menambahkan.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {unitConversions.map((conv, idx) => (
                              <div
                                key={conv.id}
                                className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-[#BFC9D1]/35 shadow-xs space-y-2.5"
                              >
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
                                  <span className="font-bold text-xs text-[#25343F] dark:text-white flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-[#FF9B51] text-[#25343F] font-black text-[9.5px] flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    <span>Satuan Kemasan: {conv.fromUnit || 'Baru'}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveUnitConversion(conv.id)}
                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition-colors"
                                    title="Hapus Satuan Ini"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Main Equation Grid: 1 [Kemasan] = [Isi] [BaseUnit] */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div>
                                    <label className="block text-[10px] font-bold text-[#898989] mb-1">
                                      Nama Satuan Kemasan
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs text-[#25343F] dark:text-white">1</span>
                                      <input
                                        type="text"
                                        list="common-packaging-list"
                                        placeholder="Dus, Box, Rim..."
                                        value={conv.fromUnit}
                                        onChange={e => {
                                          const copy = [...unitConversions];
                                          copy[idx].fromUnit = e.target.value;
                                          setUnitConversions(copy);
                                        }}
                                        className="w-full h-8 px-2.5 bg-white dark:bg-slate-700 border border-[#BFC9D1]/40 rounded-lg text-xs font-bold text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F]"
                                      />
                                      <datalist id="common-packaging-list">
                                        {COMMON_PACKAGING_UNITS.map(u => <option key={u} value={u} />)}
                                      </datalist>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-[#898989] mb-1">
                                      Isi / Faktor Pengali
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs text-[#25343F] dark:text-white">=</span>
                                      <input
                                        type="number"
                                        min="0.0001"
                                        step="any"
                                        value={conv.conversionRate}
                                        onChange={e => {
                                          const copy = [...unitConversions];
                                          copy[idx].conversionRate = Number(e.target.value) || 1;
                                          setUnitConversions(copy);
                                        }}
                                        className="w-full h-8 px-2.5 bg-white dark:bg-slate-700 border border-[#BFC9D1]/40 rounded-lg font-mono font-bold text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F]"
                                      />
                                      <span className="font-bold text-xs text-[#898989] shrink-0">{formData.baseUnit || 'pcs'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Optional Wholesale Pricing & Barcode for this unit */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                                  <div>
                                    <label className="block text-[9.5px] font-semibold text-[#898989] mb-0.5">
                                      Harga Jual 1 {conv.fromUnit || 'Kemasan'} (Opsional)
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] text-[10px] font-bold">Rp</span>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder={formData.sellingPrice ? Number((formData.sellingPrice || 0) * (conv.conversionRate || 1)).toLocaleString('id-ID') : '0'}
                                        value={conv.sellingPrice ? Number(conv.sellingPrice).toLocaleString('id-ID') : ''}
                                        onChange={e => {
                                          const raw = e.target.value.replace(/\D/g, '');
                                          const copy = [...unitConversions];
                                          copy[idx].sellingPrice = raw ? Number(raw) : undefined;
                                          setUnitConversions(copy);
                                        }}
                                        className="w-full h-7 pl-7 pr-2 bg-[#EAEFEF]/40 dark:bg-slate-700/40 border border-[#BFC9D1]/30 rounded-lg font-mono font-bold text-xs tabular-nums text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F]"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[9.5px] font-semibold text-[#898989] mb-0.5">
                                      Barcode Khusus {conv.fromUnit || 'Kemasan'} (Opsional)
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Barcode kemasan..."
                                      value={conv.barcode || ''}
                                      onChange={e => {
                                        const copy = [...unitConversions];
                                        copy[idx].barcode = e.target.value;
                                        setUnitConversions(copy);
                                      }}
                                      className="w-full h-7 px-2.5 bg-[#EAEFEF]/40 dark:bg-slate-700/40 border border-[#BFC9D1]/30 rounded-lg font-mono text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F]"
                                    />
                                  </div>
                                </div>

                                {/* Calculation Insight / Live Helper */}
                                <div className="p-2 bg-[#EAEFEF]/70 dark:bg-slate-700/60 rounded-lg text-[10px] text-[#25343F] dark:text-slate-200 font-medium flex items-center justify-between flex-wrap gap-1">
                                  <span>
                                    💡 1 {conv.fromUnit || 'Kemasan'} = <strong className="font-bold">{conv.conversionRate} {formData.baseUnit || 'pcs'}</strong>
                                  </span>
                                  {conv.sellingPrice && conv.conversionRate > 0 && (
                                    <span className="text-[#898989]">
                                      (Jatuhnya Rp {Math.round(conv.sellingPrice / conv.conversionRate).toLocaleString('id-ID')}/{formData.baseUnit || 'pcs'})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* ── BAGIAN 4: RESEP PRODUKSI BOM (KHUSUS PRODUCED) ── */}
                {formData.itemType === 'PRODUCED' && (
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3.5">
                    <div className="border-b border-emerald-200/80 pb-2">
                      <span className="text-[10.5px] font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block">
                        4. Resep Produksi (Bill of Materials)
                      </span>
                      <p className="text-[10.5px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Bahan baku di bawah ini otomatis terpotong dari stok saat produk ini terjual di POS atau Pesanan.
                      </p>
                    </div>

                    {/* Add Raw Material Selector */}
                    <div>
                      <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                        + Tambah Bahan Baku ke Resep
                      </label>
                      <select
                        id="select-raw-material-form"
                        className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-emerald-300 rounded-xl text-xs font-medium text-[#25343F] dark:text-white shadow-xs"
                        defaultValue=""
                        onChange={e => {
                          if (e.target.value) {
                            handleAddComponent(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="" disabled>Pilih bahan baku dari Master Stok...</option>
                        {items
                          .filter(it => it.itemType === 'RAW_MATERIAL' || it.itemType === 'GOODS')
                          .map(it => (
                            <option key={it.id} value={it.id}>
                              {it.name} ({it.baseUnit}) — HPP: {formatRupiah(it.costPrice || it.purchasePrice || 0)}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Component List */}
                    {components.length === 0 ? (
                      <p className="text-[10.5px] text-emerald-700 dark:text-emerald-400 italic py-1">
                        Belum ada bahan baku dalam resep produksi ini.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {components.map(comp => (
                          <div key={comp.id} className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
                            <span className="font-bold text-xs text-[#25343F] dark:text-white truncate flex-1">{comp.componentName}</span>
                            <div className="flex items-center gap-1 text-xs">
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                value={comp.quantity}
                                onChange={e => handleUpdateComponentQty(comp.id, parseFloat(e.target.value) || 0)}
                                className="w-16 h-7 px-2 bg-white dark:bg-slate-700 border border-[#BFC9D1]/40 rounded-lg font-mono font-bold text-xs text-center"
                              />
                              <span className="text-[#898989] font-medium">{comp.unit}</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#25343F] dark:text-white tabular-nums">
                              {formatRupiah(comp.subtotal)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(comp.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Overhead Costs */}
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="block font-bold text-emerald-950 dark:text-emerald-300 mb-1 text-[10px]">Tenaga Kerja</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.laborCost ? Number(formData.laborCost).toLocaleString('id-ID') : ''}
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, laborCost: raw ? Number(raw) : 0 });
                          }}
                          placeholder="Rp 0"
                          className="w-full h-8 px-2 bg-white dark:bg-slate-800 border border-emerald-300 rounded-lg font-mono text-xs font-bold tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-emerald-950 dark:text-emerald-300 mb-1 text-[10px]">Mesin / Listrik</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.machineCost ? Number(formData.machineCost).toLocaleString('id-ID') : ''}
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, machineCost: raw ? Number(raw) : 0 });
                          }}
                          placeholder="Rp 0"
                          className="w-full h-8 px-2 bg-white dark:bg-slate-800 border border-emerald-300 rounded-lg font-mono text-xs font-bold tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-emerald-950 dark:text-emerald-300 mb-1 text-[10px]">Biaya Lainnya</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.otherCost ? Number(formData.otherCost).toLocaleString('id-ID') : ''}
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, otherCost: raw ? Number(raw) : 0 });
                          }}
                          placeholder="Rp 0"
                          className="w-full h-8 px-2 bg-white dark:bg-slate-800 border border-emerald-300 rounded-lg font-mono text-xs font-bold tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-[#25343F] text-white rounded-xl flex items-center justify-between text-xs shadow-sm">
                      <span className="font-bold">Total HPP Produksi (Auto):</span>
                      <span className="font-mono font-black text-sm text-[#FF9B51]">{formatRupiah(calculatedBOMCost)}</span>
                    </div>
                  </div>
                )}

                {/* ── BAGIAN 5: SUPPLIER & KONTAK ── */}
                <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-700 shadow-xs space-y-3">
                  <div className="border-b border-slate-100 dark:border-slate-700/80 pb-2">
                    <span className="text-[10.5px] font-black text-[#898989] dark:text-slate-400 uppercase tracking-wider block">
                      5. Informasi Supplier / Vendor (Opsional)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#25343F] dark:text-slate-200 mb-1 text-xs">
                        Nama Supplier / Toko
                      </label>
                      <input
                        type="text"
                        value={formData.supplier || ''}
                        onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="PT / Toko Supplier..."
                        className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-medium text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#25343F] dark:text-slate-200 mb-1 text-xs">
                        Kontak WhatsApp / HP
                      </label>
                      <input
                        type="text"
                        value={formData.supplierContact || ''}
                        onChange={e => setFormData({ ...formData, supplierContact: e.target.value })}
                        placeholder="08123456789..."
                        className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-medium text-xs text-[#25343F] dark:text-white focus:outline-hidden focus:border-[#25343F]"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer (Sticky Bottom) */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-[#EAEFEF]/60 dark:from-slate-800 dark:to-slate-800/80 border-t border-[#BFC9D1]/30 dark:border-slate-700 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="h-10 px-5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-[#BFC9D1]/40 text-[#25343F] dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Batal
              </button>
              <button
                form="stock-item-form"
                type="submit"
                disabled={isSaving}
                className="h-10 px-6 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95 text-white"
                style={{
                  backgroundColor: 'var(--color-accent, #FF9B51)',
                  color: 'var(--color-accent-contrast, #25343F)',
                }}
              >
                <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Barang'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESTOCK MODAL (WITH MULTI-UNIT CONVERSION)                                */}
      {/* ========================================================================= */}
      {isRestockOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-[#BFC9D1]/30 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-[#EAEFEF]/60 dark:from-slate-800 dark:to-slate-800/80 border-b border-[#BFC9D1]/30 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center">
                  <ArrowDownLeftIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[#25343F] dark:text-white">
                    Restock Stok Masuk
                  </h2>
                  <p className="text-[10.5px] text-[#898989] dark:text-slate-400 font-medium truncate max-w-[220px]">
                    {selectedItem.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-[#898989] hover:text-[#25343F] flex items-center justify-center transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs text-[#25343F] dark:text-slate-200">
              {/* Jumlah Masuk & Pilihan Satuan */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">Jumlah Masuk *</label>
                  <input
                    required
                    type="number"
                    min="0.001"
                    step="any"
                    value={restockQty}
                    onChange={e => {
                      const qty = parseFloat(e.target.value) || 0;
                      setRestockQty(qty);
                      setRestockTotalPrice(qty * restockUnitPrice);
                    }}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-mono font-bold text-xs tabular-nums focus:outline-hidden focus:border-[#25343F]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Satuan</label>
                  <select
                    value={restockSelectedUnit}
                    onChange={e => setRestockSelectedUnit(e.target.value)}
                    className="w-full h-10 px-2.5 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-bold text-xs focus:outline-hidden focus:border-[#25343F]"
                  >
                    <option value={selectedItem.baseUnit}>{selectedItem.baseUnit} (Satuan Dasar)</option>
                    {(selectedItem.unitConversions || []).map(c => (
                      <option key={c.id} value={c.fromUnit}>
                        {c.fromUnit} (= {c.conversionRate} {selectedItem.baseUnit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion Insight */}
              {restockSelectedUnit !== selectedItem.baseUnit && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 text-blue-800 dark:text-blue-300 text-[11px] font-medium">
                  📦 <strong>{restockQty} {restockSelectedUnit}</strong> = <strong className="font-bold">{calculatedRestockBaseQty} {selectedItem.baseUnit}</strong> akan ditambahkan ke stok fisik.
                </div>
              )}

              {/* Total Biaya Beli */}
              <div>
                <label className="block font-bold mb-1">Total Biaya Pembelian (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989] font-bold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={restockTotalPrice ? Number(restockTotalPrice).toLocaleString('id-ID') : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const val = raw ? Number(raw) : 0;
                      setRestockTotalPrice(val);
                      if (restockQty > 0) setRestockUnitPrice(val / restockQty);
                    }}
                    placeholder="0"
                    className="w-full h-10 pl-9 pr-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-mono font-bold text-xs tabular-nums focus:outline-hidden focus:border-[#25343F]"
                  />
                </div>
              </div>

              {/* Catat Pengeluaran Toggle */}
              <div className="p-3 bg-[#EAEFEF]/60 dark:bg-slate-800/60 rounded-xl border border-[#BFC9D1]/30 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-xs">Catat ke Buku Kas (Pengeluaran)</span>
                  <input
                    type="checkbox"
                    checked={restockRecordExpense}
                    onChange={e => setRestockRecordExpense(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FF9B51] focus:ring-[#FF9B51]"
                  />
                </label>

                {restockRecordExpense && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="text-[10.5px] text-[#898989]">Metode Pembayaran:</span>
                    <select
                      value={restockPaymentMethod}
                      onChange={e => setRestockPaymentMethod(e.target.value as PaymentMethod)}
                      className="h-8 px-2 bg-white dark:bg-slate-700 border border-[#BFC9D1]/40 rounded-lg text-xs font-bold"
                    >
                      <option value="CASH">Tunai (Cash)</option>
                      <option value="TRANSFER">Transfer Bank</option>
                      <option value="QRIS">QRIS</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Catatan */}
              <div>
                <label className="block font-bold mb-1">Catatan / Supplier</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={e => setRestockNotes(e.target.value)}
                  placeholder="Contoh: Beli di Agen Jaya Abadi..."
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  className="h-9 px-4 bg-[#EAEFEF] dark:bg-slate-800 text-[#25343F] dark:text-white rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Konfirmasi Restock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADJUST / OPNAME MODAL                                                     */}
      {/* ========================================================================= */}
      {isAdjustOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-[#BFC9D1]/30 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-[#EAEFEF]/60 dark:from-slate-800 dark:to-slate-800/80 border-b border-[#BFC9D1]/30 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex items-center justify-center">
                  <ScaleIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[#25343F] dark:text-white">
                    Penyesuaian / Opname Stok
                  </h2>
                  <p className="text-[10.5px] text-[#898989] dark:text-slate-400 font-medium truncate max-w-[220px]">
                    {selectedItem.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-[#898989] hover:text-[#25343F] flex items-center justify-center transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs text-[#25343F] dark:text-slate-200">
              {/* Info Stok Sistem Saat Ini */}
              <div className="p-3 bg-[#EAEFEF]/60 dark:bg-slate-800/60 rounded-xl border border-[#BFC9D1]/30 flex items-center justify-between">
                <span className="text-[#898989] font-medium">Stok Tercatat Sistem:</span>
                <span className="font-mono font-black text-sm text-[#25343F] dark:text-white">
                  {selectedItem.currentStock || 0} {selectedItem.baseUnit}
                </span>
              </div>

              {/* Input Stok Fisik Aktual */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">Stok Fisik Aktual *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={adjustInputQty}
                    onChange={e => setAdjustInputQty(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-mono font-bold text-xs tabular-nums focus:outline-hidden focus:border-[#25343F]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Satuan Hitung</label>
                  <select
                    value={adjustSelectedUnit}
                    onChange={e => setAdjustSelectedUnit(e.target.value)}
                    className="w-full h-10 px-2.5 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl font-bold text-xs focus:outline-hidden focus:border-[#25343F]"
                  >
                    <option value={selectedItem.baseUnit}>{selectedItem.baseUnit} (Dasar)</option>
                    {(selectedItem.unitConversions || []).map(c => (
                      <option key={c.id} value={c.fromUnit}>
                        {c.fromUnit} (= {c.conversionRate} {selectedItem.baseUnit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selisih Hitung Box */}
              {(() => {
                const diff = calculatedAdjustBaseQty - (selectedItem.currentStock || 0);
                return (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between font-bold ${
                    diff === 0
                      ? 'bg-slate-50 text-slate-700 border-slate-200'
                      : diff > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span>Selisih Penyesuaian:</span>
                    <span className="font-mono text-sm tabular-nums">
                      {diff > 0 ? `+${diff}` : diff} {selectedItem.baseUnit}
                    </span>
                  </div>
                );
              })()}

              {/* Alasan Penyesuaian */}
              <div>
                <label className="block font-bold mb-1">Alasan Penyesuaian / Catatan</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: Stok opname berkala, selisih hitung, barang rusak..."
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="h-9 px-4 bg-[#EAEFEF] dark:bg-slate-800 text-[#25343F] dark:text-white rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-[#25343F] hover:bg-[#1a252d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Simpan Penyesuaian</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARCODE SCANNER MODAL                                                     */}
      {/* ========================================================================= */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScanSuccess={scannedCode => {
          if (barcodeTargetMode === 'form') {
            setFormData(prev => ({ ...prev, barcode: scannedCode }));
            showToast(`Barcode ${scannedCode} berhasil di-scan`, 'success');
          } else {
            setSearchQuery(scannedCode);
            setIsSearchOpen(true);
            showToast(`Mencari item: ${scannedCode}`, 'info');
          }
          setIsBarcodeScannerOpen(false);
        }}
      />

      {/* ========================================================================= */}
      {/* BARCODE LABEL PRINT MODAL                                                 */}
      {/* ========================================================================= */}
      <BarcodeLabelPrintModal
        isOpen={isBarcodePrintOpen}
        onClose={() => {
          setIsBarcodePrintOpen(false);
          setSelectedItem(null);
        }}
        products={productsForLabelPrint}
        preselectedProductId={selectedItem ? selectedItem.id : undefined}
      />

      {/* ========================================================================= */}
      {/* DELETE CONFIRM DIALOG                                                     */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Hapus Master Barang"
        message={`Apakah Anda yakin ingin menghapus "${itemToDelete?.name}"? Data barang, stok, dan mutasinya akan dihapus.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
      />

    </div>
  );
};

export default StockView;
