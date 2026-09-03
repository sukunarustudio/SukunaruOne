import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, PlusIcon, MinusIcon, MagnifyingGlassIcon, CalendarIcon, ClockIcon, ExclamationTriangleIcon, DocumentTextIcon, ArrowUpTrayIcon, TrashIcon, ArrowTopRightOnSquareIcon, CurrencyDollarIcon, UserIcon, ChevronRightIcon, ChevronLeftIcon, EyeIcon, CreditCardIcon, PrinterIcon, PaperClipIcon, Squares2X2Icon, ListBulletIcon, SparklesIcon, CheckCircleIcon, StopIcon, ShoppingBagIcon, ArrowPathIcon, WrenchScrewdriverIcon, FunnelIcon, XMarkIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import {
  Order,
  Customer,
  Product,
  OrderStatus,
  BusinessSettings,
  PaymentMethod,
  OrderPaymentRecord,
  ViewType,
} from '../types';
import {
  formatRupiah,
  formatDate,
  formatDateTime,
  isDeadlineOverdue,
  isDeadlineToday,
  getStatusBadgeClass,
  getTodayDateString,
} from '../lib/utils';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal';
import { BatchPrintOrdersModal } from '../components/BatchPrintOrdersModal';
import { ProductImage } from '../components/ProductImage';

interface OrdersViewProps {
  settings: BusinessSettings;
  targetOrderId?: string;
  initialStatusFilter?: string;
  initialViewMode?: 'pos' | 'table' | 'kanban';
  onRefreshDashboard?: () => void;
  onNavigate?: (view: ViewType) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  settings,
  targetOrderId,
  initialStatusFilter,
  initialViewMode,
  onRefreshDashboard,
  onNavigate,
}) => {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'table' (Default Order list table) | 'kanban' (Kanban workflow) | 'pos' (POS-style order maker)
  const [viewMode, setViewMode] = useState<'pos' | 'table' | 'kanban'>(initialViewMode ?? 'table');
  const [mobileTab, setMobileTab] = useState<'catalog' | 'order'>('catalog');

  // Product Catalog in POS Mode State
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogSelectedCategory, setCatalogSelectedCategory] = useState('SEMUA');
  const [isCatalogFilterOpen, setIsCatalogFilterOpen] = useState(false);
  const catalogScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollCatLeft, setCanScrollCatLeft] = useState(false);
  const [canScrollCatRight, setCanScrollCatRight] = useState(false);
  const isDraggingCatRef = useRef(false);
  const startXCatRef = useRef(0);
  const scrollLeftCatRef = useRef(0);

  // Table / Kanban Filters
  const STATUS_TABS = ['SEMUA', 'BARU', 'DIPROSES', 'SIAP DIAMBIL', 'SELESAI'];
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(initialStatusFilter ?? 'SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [deadlineFilter, setDeadlineFilter] = useState<string>('ALL');

  // Swipe Gesture Handling for Mobile Status Switch
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const filterTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    // Must be predominantly horizontal swipe with at least 40px threshold
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      const normalizedCurrent = selectedStatusFilter === 'SIAP' ? 'SIAP DIAMBIL' : selectedStatusFilter;
      const currentIdx = STATUS_TABS.indexOf(normalizedCurrent);
      if (currentIdx !== -1) {
        if (deltaX < 0 && currentIdx < STATUS_TABS.length - 1) {
          // Swipe Left -> Pindah ke status berikutnya
          setSelectedStatusFilter(STATUS_TABS[currentIdx + 1]);
        } else if (deltaX > 0 && currentIdx > 0) {
          // Swipe Right -> Pindah ke status sebelumnya
          setSelectedStatusFilter(STATUS_TABS[currentIdx - 1]);
        }
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Auto-scroll active filter tab into view
  useEffect(() => {
    const activeKey = selectedStatusFilter === 'SIAP' ? 'SIAP DIAMBIL' : selectedStatusFilter;
    const el = filterTabRefs.current[activeKey];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedStatusFilter]);

  // Active Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Order / POS Cart State (Persisted in localStorage)
  const [newOrderCustomerName, setNewOrderCustomerName] = useState(() => {
    try {
      return localStorage.getItem('sukunaru_order_cust_name') || '';
    } catch {
      return '';
    }
  });
  const [newOrderCustomerPhone, setNewOrderCustomerPhone] = useState(() => {
    try {
      return localStorage.getItem('sukunaru_order_cust_phone') || '';
    } catch {
      return '';
    }
  });
  const [newOrderCustomerId, setNewOrderCustomerId] = useState(() => {
    try {
      return localStorage.getItem('sukunaru_order_cust_id') || '';
    } catch {
      return '';
    }
  });
  const [newOrderDate, setNewOrderDate] = useState(() => {
    try {
      return localStorage.getItem('sukunaru_order_date') || getTodayDateString();
    } catch {
      return getTodayDateString();
    }
  });
  const [newOrderDeadline, setNewOrderDeadline] = useState(() => {
    try {
      const saved = localStorage.getItem('sukunaru_order_deadline');
      if (saved) return saved;
    } catch {}
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [newOrderItems, setNewOrderItems] = useState<
    Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      costPrice: number;
      subtotal: number;
      notes?: string;
    }>
  >(() => {
    try {
      const saved = localStorage.getItem('sukunaru_order_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newOrderDiscount, setNewOrderDiscount] = useState(() => {
    try {
      const saved = localStorage.getItem('sukunaru_order_discount');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [newOrderDp, setNewOrderDp] = useState(() => {
    try {
      const saved = localStorage.getItem('sukunaru_order_dp');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [newOrderPaymentMethod, setNewOrderPaymentMethod] = useState<PaymentMethod>(() => {
    try {
      return (localStorage.getItem('sukunaru_order_pay_method') as PaymentMethod) || 'CASH';
    } catch {
      return 'CASH';
    }
  });
  const [newOrderNotes, setNewOrderNotes] = useState(() => {
    try {
      return localStorage.getItem('sukunaru_order_notes') || '';
    } catch {
      return '';
    }
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('sukunaru_order_items', JSON.stringify(newOrderItems));
      localStorage.setItem('sukunaru_order_cust_name', newOrderCustomerName);
      localStorage.setItem('sukunaru_order_cust_phone', newOrderCustomerPhone);
      localStorage.setItem('sukunaru_order_cust_id', newOrderCustomerId);
      localStorage.setItem('sukunaru_order_date', newOrderDate);
      localStorage.setItem('sukunaru_order_deadline', newOrderDeadline);
      localStorage.setItem('sukunaru_order_discount', newOrderDiscount.toString());
      localStorage.setItem('sukunaru_order_dp', newOrderDp.toString());
      localStorage.setItem('sukunaru_order_pay_method', newOrderPaymentMethod);
      localStorage.setItem('sukunaru_order_notes', newOrderNotes);
    } catch (e) {
      console.error(e);
    }
  }, [
    newOrderItems,
    newOrderCustomerName,
    newOrderCustomerPhone,
    newOrderCustomerId,
    newOrderDate,
    newOrderDeadline,
    newOrderDiscount,
    newOrderDp,
    newOrderPaymentMethod,
    newOrderNotes,
  ]);

  // Payment Add/PencilSquareIcon Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Invoice Print Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Batch Print & Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBatchPrintModalOpen, setIsBatchPrintModalOpen] = useState(false);

  // Quick Customer Add Modal State
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Customer selection
  const handleSelectCustomer = (customerId: string) => {
    setNewOrderCustomerId(customerId);
    if (!customerId) {
      setNewOrderCustomerName('Pelanggan Umum (Walk-in)');
      setNewOrderCustomerPhone('');
    } else {
      const c = customers.find(cust => cust.id === customerId);
      if (c) {
        setNewOrderCustomerName(c.name);
        setNewOrderCustomerPhone(c.whatsapp || c.phone || '');
      }
    }
  };

  // Handle Quick Add Customer
  const handleSaveNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      showToast('Nama pelanggan wajib diisi', 'error');
      return;
    }

    try {
      const created = await api.createCustomer({
        name: newCustName.trim(),
        whatsapp: newCustPhone.trim(),
      });
      setCustomers(prev => [created, ...prev]);
      setNewOrderCustomerId(created.id);
      setNewOrderCustomerName(created.name);
      setNewOrderCustomerPhone(created.whatsapp || '');
      setIsNewCustModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      showToast('Pelanggan baru berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menambah pelanggan', 'error');
    }
  };

  // Delete Confirm State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // File ArrowUpTrayIcon State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orderList, custList, prodList] = await Promise.all([
        api.getOrders(),
        api.getCustomers(),
        api.getProducts(),
      ]);
      setOrders(orderList);
      setCustomers(custList);
      setProducts(prodList);

      if (targetOrderId) {
        const found = orderList.find(o => o.id === targetOrderId);
        if (found) {
          setSelectedOrder(found);
          setIsDetailModalOpen(true);
          setViewMode('table');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat pesanan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => {
      api.getOrders().then(o => setOrders(o)).catch(() => {});
      api.getCustomers().then(c => setCustomers(c)).catch(() => {});
      api.getProducts().then(p => setProducts(p)).catch(() => {});
    };
    window.addEventListener('sukunaru:sync_completed', handleRefresh);
    window.addEventListener('sukunaru:data_mutation', handleRefresh);
    return () => {
      window.removeEventListener('sukunaru:sync_completed', handleRefresh);
      window.removeEventListener('sukunaru:data_mutation', handleRefresh);
    };
  }, [targetOrderId]);

  // Categories for POS mode
  const catalogCategories = ['SEMUA', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // Category scroll helpers
  const updateCatScrollButtons = () => {
    const el = catalogScrollRef.current;
    if (!el) return;
    setCanScrollCatLeft(el.scrollLeft > 4);
    setCanScrollCatRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollCatalogCategory = (direction: 'left' | 'right') => {
    const el = catalogScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  const onCatMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = catalogScrollRef.current;
    if (!el) return;
    isDraggingCatRef.current = true;
    startXCatRef.current = e.pageX - el.offsetLeft;
    scrollLeftCatRef.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  };

  const onCatMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingCatRef.current) return;
    const el = catalogScrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const delta = x - startXCatRef.current;
    el.scrollLeft = scrollLeftCatRef.current - delta;
  };

  const onCatMouseUp = () => {
    isDraggingCatRef.current = false;
    const el = catalogScrollRef.current;
    if (el) el.style.cursor = 'grab';
  };

  useEffect(() => {
    const frame = requestAnimationFrame(updateCatScrollButtons);
    return () => cancelAnimationFrame(frame);
  }, [catalogCategories.length, viewMode]);

  // Filtered products in catalog
  const filteredCatalogProducts = products.filter(p => {
    if (p.isActive === false) return false;
    const matchesCat = catalogSelectedCategory === 'SEMUA' || p.category === catalogSelectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(catalogSearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Add Product Card into Order (POS Mode)
  const addProductToOrder = (product: Product) => {
    setNewOrderItems(prev => {
      const existingIdx = prev.findIndex(item => item.productId === product.id);
      if (existingIdx > -1) {
        const copy = [...prev];
        const newQ = copy[existingIdx].quantity + 1;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: newQ,
          subtotal: newQ * copy[existingIdx].unitPrice,
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: product.sellingPrice,
            costPrice: product.costPrice,
            subtotal: product.sellingPrice,
            notes: '',
          },
        ];
      }
    });
  };

  // Modify quantity of item
  const handleUpdateItemQty = (idx: number, delta: number) => {
    setNewOrderItems(prev => {
      const copy = [...prev];
      const newQ = Math.max(1, copy[idx].quantity + delta);
      copy[idx] = {
        ...copy[idx],
        quantity: newQ,
        subtotal: newQ * copy[idx].unitPrice,
      };
      return copy;
    });
  };

  const handleUpdateItemField = (idx: number, field: string, value: any) => {
    setNewOrderItems(prev => {
      const copy = [...prev];
      if (field === 'quantity') {
        const valStr = String(value);
        if (valStr === '' || valStr === '0') {
          copy[idx] = { ...copy[idx], quantity: 0, subtotal: 0 };
        } else {
          const parsed = parseInt(valStr, 10);
          const q = isNaN(parsed) ? 0 : Math.max(0, parsed);
          copy[idx] = { ...copy[idx], quantity: q, subtotal: q * copy[idx].unitPrice };
        }
      } else if (field === 'unitPrice') {
        const p = Math.max(0, parseInt(value, 10) || 0);
        copy[idx] = { ...copy[idx], unitPrice: p, subtotal: copy[idx].quantity * p };
      } else if (field === 'notes') {
        copy[idx] = { ...copy[idx], notes: value };
      }
      return copy;
    });
  };

  const handleBlurItemQty = (idx: number) => {
    setNewOrderItems(prev => {
      const copy = [...prev];
      if (!copy[idx].quantity || copy[idx].quantity < 1) {
        copy[idx] = { ...copy[idx], quantity: 1, subtotal: copy[idx].unitPrice };
      }
      return copy;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setNewOrderItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleResetOrderForm = () => {
    setNewOrderCustomerName('');
    setNewOrderCustomerPhone('');
    setNewOrderCustomerId('');
    setNewOrderDate(getTodayDateString());
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setNewOrderDeadline(`${yyyy}-${mm}-${dd}`);
    setNewOrderItems([]);
    setNewOrderDiscount(0);
    setNewOrderDp(0);
    setNewOrderNotes('');
  };

  // Quick deadline setter
  const setQuickDeadlineDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setNewOrderDeadline(`${yyyy}-${mm}-${dd}`);
  };

  // Calculated totals
  const newOrderSubtotal = newOrderItems.reduce((s, i) => s + i.subtotal, 0);
  const newOrderTotal = Math.max(0, newOrderSubtotal - newOrderDiscount);

  // Submit Order from POS view
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderCustomerName.trim()) {
      showToast('Nama pelanggan wajib diisi', 'error');
      return;
    }
    if (newOrderItems.length === 0) {
      showToast('Pilih minimal 1 item produk dari katalog di sebelah kiri', 'error');
      return;
    }

    try {
      setIsSubmittingOrder(true);
      const payload = {
        customerId: newOrderCustomerId || undefined,
        customerName: newOrderCustomerName.trim(),
        customerPhone: newOrderCustomerPhone.trim(),
        orderDate: newOrderDate,
        deadlineDate: newOrderDeadline,
        items: newOrderItems,
        subtotal: newOrderSubtotal,
        discount: newOrderDiscount,
        totalAmount: newOrderTotal,
        dpAmount: newOrderDp,
        paymentMethod: newOrderPaymentMethod,
        notes: newOrderNotes,
      };

      const created = await api.createOrder(payload);
      showToast(`Pesanan #${created.orderNumber} berhasil diterbitkan!`, 'success');

      // Refresh orders
      await loadData();
      if (onRefreshDashboard) onRefreshDashboard();

      // Open Print Invoice & SPK modal directly
      setInvoiceOrder(created);
      setIsInvoiceModalOpen(true);

      // Reset form & return to catalog
      handleResetOrderForm();
      setMobileTab('catalog');
      setViewMode('pos');
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat pesanan', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Filters for Table / Kanban
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatusFilter === 'SEMUA'
        ? true
        : selectedStatusFilter === 'OVERDUE'
        ? isDeadlineOverdue(o.deadlineDate, o.status)
        : o.status === selectedStatusFilter;

    let matchesDeadline = true;
    if (deadlineFilter === 'TODAY') {
      matchesDeadline = isDeadlineToday(o.deadlineDate, o.status);
    } else if (deadlineFilter === 'OVERDUE') {
      matchesDeadline = isDeadlineOverdue(o.deadlineDate, o.status);
    }

    return matchesSearch && matchesStatus && matchesDeadline;
  });

  // Batch Selection Logic
  const handleToggleSelectOrder = (orderId: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const isAllFilteredSelected =
    filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id));
  const isSomeFilteredSelected =
    filteredOrders.some(o => selectedOrderIds.includes(o.id)) && !isAllFilteredSelected;

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredOrders.map(o => o.id));
      setSelectedOrderIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedOrderIds, ...filteredOrders.map(o => o.id)]);
      setSelectedOrderIds(Array.from(newIds));
    }
  };

  const handleSelectLaneOrders = (laneOrders: Order[]) => {
    const laneIds = laneOrders.map(o => o.id);
    const allInLaneSelected = laneIds.length > 0 && laneIds.every(id => selectedOrderIds.includes(id));
    if (allInLaneSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !laneIds.includes(id)));
    } else {
      const newIds = new Set([...selectedOrderIds, ...laneIds]);
      setSelectedOrderIds(Array.from(newIds));
    }
  };

  const handleDeselectAll = () => {
    setSelectedOrderIds([]);
  };

  const handleOpenBatchPrint = (presetIds?: string[]) => {
    if (presetIds && presetIds.length > 0) {
      setSelectedOrderIds(presetIds);
    } else if (selectedOrderIds.length === 0 && filteredOrders.length > 0) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
    setIsBatchPrintModalOpen(true);
  };

  const handleBatchUpdateStatus = async (orderIds: string[], newStatus: string) => {
    try {
      await Promise.all(orderIds.map(id => api.updateOrderStatus(id, newStatus as OrderStatus)));
      showToast(`Status ${orderIds.length} pesanan berhasil diubah menjadi ${newStatus}!`, 'success');
      await loadData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui status pesanan massal', 'error');
      throw err;
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus);
      showToast(`Status pesanan diubah ke ${newStatus}`, 'success');
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status', 'error');
    }
  };

  const handleOpenAddPayment = (order: Order) => {
    setSelectedOrder(order);
    setEditingPaymentId(null);
    setPaymentAmount(order.remainingAmount || 0);
    setPaymentMethod('CASH');
    setPaymentNotes('Pelunasan sisa tagihan');
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPayment = (order: Order, payment: OrderPaymentRecord) => {
    setSelectedOrder(order);
    setEditingPaymentId(payment.id);
    setPaymentAmount(payment.amount || 0);
    setPaymentMethod(payment.paymentMethod || 'CASH');
    setPaymentNotes(payment.notes || '');
    setIsPaymentModalOpen(true);
  };

  const handleDeletePayment = async (orderId: string, paymentId: string) => {
    if (!window.confirm('Yakin ingin menghapus catatan pembayaran ini? Sisa tagihan akan dihitung ulang.')) return;
    try {
      const updated = await api.deleteOrderPayment(orderId, paymentId);
      showToast('Catatan pembayaran berhasil dihapus', 'success');
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pembayaran', 'error');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (paymentAmount <= 0) {
      showToast('Nominal pembayaran harus lebih dari 0', 'error');
      return;
    }

    try {
      setIsSavingPayment(true);
      let updated: Order;
      if (editingPaymentId) {
        // Update existing payment record
        updated = await api.updateOrderPayment(selectedOrder.id, editingPaymentId, {
          amount: paymentAmount,
          paymentMethod,
          notes: paymentNotes,
        });
        showToast('Pembayaran berhasil diperbarui!', 'success');
      } else {
        // Add new payment record
        updated = await api.addOrderPayment(selectedOrder.id, {
          amount: paymentAmount,
          paymentMethod,
          notes: paymentNotes,
        });
        showToast('Pembayaran berhasil dicatat!', 'success');
      }

      setIsPaymentModalOpen(false);
      setEditingPaymentId(null);
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pembayaran', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedOrder) return;
    const file = e.target.files[0];

    try {
      setIsUploadingFile(true);
      await api.uploadOrderFile(selectedOrder.id, file);
      showToast(`File ${file.name} berhasil diunggah!`, 'success');
      const refreshed = await api.getOrder(selectedOrder.id);
      setSelectedOrder(refreshed);
      setOrders(prev => prev.map(o => (o.id === refreshed.id ? refreshed : o)));
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah file', 'error');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!selectedOrder) return;
    try {
      await api.deleteOrderFile(selectedOrder.id, fileId);
      showToast('File lampiran berhasil dihapus', 'success');
      const refreshed = await api.getOrder(selectedOrder.id);
      setSelectedOrder(refreshed);
      setOrders(prev => prev.map(o => (o.id === refreshed.id ? refreshed : o)));
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus file', 'error');
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await api.deleteOrder(orderToDelete.id);
      showToast(`Pesanan #${orderToDelete.orderNumber} dihapus`, 'success');
      setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));
      if (selectedOrder?.id === orderToDelete.id) {
        setIsDetailModalOpen(false);
      }
      setOrderToDelete(null);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pesanan', 'error');
    }
  };

  return (
    <div id="orders-view" className="space-y-3.5 max-w-7xl mx-auto pb-12">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 space-y-2">
        {/* Row 1: [ ← Judul ] ... [ Aksi (+ Buat Pesanan) ] */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {viewMode === 'pos' && (
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
                title="Kembali ke Daftar Pesanan"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
                {viewMode === 'pos' ? 'Pesanan Kerja' : 'Daftar Pesanan'}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
                {viewMode === 'pos' ? 'Pilih produk dari katalog untuk membuat pesanan' : 'Manajemen status produksi, timeline &amp; cetak faktur'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewMode === 'pos' ? (
              <button
                type="button"
                id="btn-top-create-order"
                onClick={() => setViewMode('table')}
                className="h-9 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer shrink-0 active:scale-95 bg-[#EAEFEF] text-[#25343F] hover:bg-slate-300"
              >
                <ListBulletIcon className="w-3.5 h-3.5" />
                <span>Lihat Daftar</span>
              </button>
            ) : (
              <>
                {/* Search Toggle Icon Button */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
                    isSearchOpen || searchQuery
                      ? 'bg-[#25343F] text-white border-slate-900'
                      : 'bg-white hover:bg-[#EAEFEF] border-[#BFC9D1]/25 text-[#25343F]'
                  }`}
                  title="Cari Pesanan"
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                </button>

                {/* Batch Print Button */}
                {filteredOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenBatchPrint()}
                    className="h-9 px-3 bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                    title="Cetak Massal SPK"
                  >
                    <PrinterIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Cetak Massal</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Collapsible Search Input (Only shown when active or searching in table mode) */}
        {viewMode !== 'pos' && (isSearchOpen || searchQuery) && (
          <div className="relative animate-in fade-in slide-in-from-top-1 duration-150 pt-1">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#898989] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nomor order, nama pelanggan, produk..."
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

      {/* ========================================================================= */}
      {/* MODE 1: POS / CREATE ORDER (BUAT PESANAN)                                 */}
      {/* ========================================================================= */}
      {viewMode === 'pos' && (
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 min-h-[calc(100vh-10rem)] lg:h-[calc(100vh-8.5rem)] relative pb-20 lg:pb-0">

          {/* LEFT COLUMN: Product Catalog Grid */}
          <div className={`flex-1 flex-col min-w-0 bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden ${
            mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* MagnifyingGlassIcon & Category FunnelIcon Header */}
            <div className="px-3 py-2 border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/40 space-y-2">
              <div className="flex items-center gap-1.5">
                {/* FunnelIcon Icon Button */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCatalogFilterOpen(!isCatalogFilterOpen)}
                    className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      catalogSelectedCategory !== 'SEMUA' || isCatalogFilterOpen
                        ? 'bg-[#25343F] text-white border-[#25343F]'
                        : 'bg-white text-[#898989] border-[#BFC9D1] hover:bg-[#EAEFEF]'
                    }`}
                    title="Filter Kategori Produk"
                    aria-label="Filter Kategori"
                  >
                    <FunnelIcon className="w-3.5 h-3.5" />
                    {catalogSelectedCategory !== 'SEMUA' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF9B51] border border-white" />
                    )}
                  </button>
                </div>

                {/* MagnifyingGlassIcon Bar */}
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#898989]/70 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-orders-catalog-search"
                    type="text"
                    value={catalogSearchQuery}
                    onChange={e => setCatalogSearchQuery(e.target.value)}
                    placeholder="Cari produk..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-lg text-xs focus:outline-none focus:border-[#25343F] font-medium placeholder:text-[#898989]/60 placeholder:font-normal"
                  />
                </div>
                {catalogSearchQuery && (
                  <button
                    onClick={() => setCatalogSearchQuery('')}
                    className="px-2 py-1.5 text-[11px] font-semibold text-[#898989] hover:text-[#25343F] bg-[#EAEFEF] hover:bg-[#BFC9D1]/50 rounded-lg cursor-pointer shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Active Category Indicator / FunnelIcon Dropdown (Toggled via FunnelIcon Icon or Desktop) */}
              {(isCatalogFilterOpen || catalogSelectedCategory !== 'SEMUA') && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 animate-in fade-in duration-150">
                  <span className="text-[11px] font-bold text-[#898989] uppercase tracking-wider mr-1">
                    Kategori:
                  </span>
                  {catalogCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCatalogSelectedCategory(cat);
                        setIsCatalogFilterOpen(false);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        catalogSelectedCategory === cat
                          ? 'bg-[#25343F] text-white shadow-md'
                          : 'bg-white border border-[#BFC9D1]/25 text-[#898989] hover:bg-[#EAEFEF]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  {catalogSelectedCategory !== 'SEMUA' && (
                    <button
                      onClick={() => {
                        setCatalogSelectedCategory('SEMUA');
                        setIsCatalogFilterOpen(false);
                      }}
                      className="px-2 py-1 text-xs text-[#c45e00] hover:bg-[#FF9B51]/8 rounded-lg font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <XMarkIcon className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Product ListBulletIcon / Grid */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
              {loading ? (
                <div className="text-center py-16 text-[#898989] text-sm">Memuat katalog produk...</div>
              ) : filteredCatalogProducts.length === 0 ? (
                <div className="text-center py-16 text-[#898989] text-sm">
                  Tidak ada produk yang cocok dengan pencarian.
                </div>
              ) : (
                <>
                  {/* ── MOBILE: 1-Column Horizontal ListBulletIcon (< sm) ── */}
                  <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800/60 bg-white rounded-xl border border-[#BFC9D1]/25 dark:border-slate-800/80 shadow-md overflow-hidden">
                    {filteredCatalogProducts.map(product => {
                      const existingInCart = newOrderItems.find(i => i.productId === product.id);

                      return (
                        <div
                          key={product.id}
                          id={`order-product-item-mobile-${product.id}`}
                          onClick={() => addProductToOrder(product)}
                          className={`p-3 flex items-center gap-3 active:bg-[#EAEFEF] transition-colors cursor-pointer ${
                            existingInCart ? 'bg-[#EAEFEF]/40' : 'bg-white'
                          }`}
                        >
                          {/* 1. Thumbnail (60x60 square) */}
                          <div className="w-[60px] h-[60px] rounded-xl overflow-hidden bg-[#EAEFEF] border border-[#BFC9D1]/25 flex items-center justify-center shrink-0 relative">
                            <ProductImage
                              thumbnailPath={product.thumbnailPath}
                              imagePath={product.imagePath}
                              productName={product.name}
                              size="md"
                              className="w-full h-full object-cover"
                              rounded="rounded-xl"
                            />
                            {existingInCart && (
                              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#25343F] text-white font-black text-[9px] flex items-center justify-center shadow-sm">
                                {existingInCart.quantity}x
                              </span>
                            )}
                          </div>

                          {/* 2. Product Info (Center) */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[14px] text-[#25343F] line-clamp-1 leading-snug">
                              {product.name}
                            </h4>
                            <div className="text-[11px] text-[#898989] font-medium mt-1">
                              HPP {formatRupiah(product.costPrice)}
                            </div>
                          </div>

                          {/* 3. Price & Add/Qty Action (Right) */}
                          <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                            <div className="font-extrabold text-[13px] text-[#25343F] font-mono flex items-baseline gap-0.5 justify-end">
                              <span className="font-mono">{formatRupiah(product.sellingPrice)}</span>
                              <span className="text-[10px] text-[#898989] font-medium font-sans">/{product.unit}</span>
                            </div>

                            {existingInCart ? (
                              <div
                                className="flex items-center gap-0.5 mt-1 bg-[#EAEFEF] rounded-lg p-0.5"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const idx = newOrderItems.findIndex(i => i.productId === product.id);
                                    if (idx > -1) {
                                      if (existingInCart.quantity <= 1) {
                                        handleRemoveItem(idx);
                                      } else {
                                        handleUpdateItemQty(idx, -1);
                                      }
                                    }
                                  }}
                                  className="w-6 h-6 rounded-md bg-white active:bg-[#EAEFEF] text-[#25343F] flex items-center justify-center font-bold shadow-md transition-transform active:scale-90 cursor-pointer"
                                  title="Kurangi jumlah"
                                  aria-label="Kurangi"
                                >
                                  <MinusIcon className="w-3 h-3" />
                                </button>
                                <span className="text-[11px] font-black text-[#25343F] min-w-[18px] text-center font-mono">
                                  {existingInCart.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addProductToOrder(product)}
                                  className="w-6 h-6 rounded-md bg-[#25343F] active:bg-[#FF9B51] text-white flex items-center justify-center font-bold shadow-md transition-transform active:scale-90 cursor-pointer"
                                  title="Tambah jumlah"
                                  aria-label="Tambah"
                                >
                                  <PlusIcon className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addProductToOrder(product);
                                }}
                                className="h-7 px-2.5 rounded-lg bg-[#25343F] active:bg-[#FF9B51] text-white flex items-center justify-center gap-1 text-[11px] font-bold shadow-md transition-transform active:scale-95 cursor-pointer mt-1"
                                aria-label="Tambah produk"
                              >
                                <PlusIcon className="w-3 h-3 stroke-[2.5]" />
                                <span>Tambah</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── DESKTOP: Grid (>= sm) ── */}
                  <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredCatalogProducts.map(product => {
                      const existingInCart = newOrderItems.find(i => i.productId === product.id);

                      return (
                        <div
                          key={product.id}
                          id={`order-product-card-${product.id}`}
                          onClick={() => addProductToOrder(product)}
                          className={`p-3 rounded-xl border bg-white hover:border-[#BFC9D1] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                            existingInCart ? 'border-slate-900 ring-1 ring-slate-800/10' : 'border-[#BFC9D1]'
                          }`}
                        >
                          <div>
                            {/* Visual Thumbnail (1:1 StopIcon Aspect Ratio) */}
                            <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 bg-[#EAEFEF] border border-slate-100 flex items-center justify-center relative">
                              <ProductImage
                                thumbnailPath={product.thumbnailPath}
                                imagePath={product.imagePath}
                                productName={product.name}
                                size="xl"
                                className="w-full h-full object-cover"
                                rounded="rounded-lg"
                              />
                              {existingInCart && (
                                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#25343F] text-white font-black text-[9px] flex items-center justify-center shadow-sm">
                                  {existingInCart.quantity}x
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-xs text-[#25343F] group-hover:text-[#25343F] line-clamp-2 leading-snug">
                              {product.name}
                            </h4>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs text-[#25343F] truncate flex items-baseline gap-0.5">
                                <span className="font-mono">{formatRupiah(product.sellingPrice)}</span>
                                <span className="text-[9px] text-[#898989] font-medium font-sans">/{product.unit}</span>
                              </div>
                              <div className="text-[10px] text-[#898989] font-medium truncate">
                                HPP: <span className="font-mono">{formatRupiah(product.costPrice)}</span>
                              </div>
                            </div>

                            {/* Stepper or Add button on Desktop */}
                            {existingInCart ? (
                              <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const idx = newOrderItems.findIndex(i => i.productId === product.id);
                                    if (idx > -1) {
                                      if (existingInCart.quantity <= 1) {
                                        handleRemoveItem(idx);
                                      } else {
                                        handleUpdateItemQty(idx, -1);
                                      }
                                    }
                                  }}
                                  className="w-5 h-5 rounded-md bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] flex items-center justify-center text-xs transition-colors cursor-pointer"
                                  title="Kurangi"
                                >
                                  <MinusIcon className="w-2.5 h-2.5" />
                                </button>
                                <span className="text-[11px] font-bold text-[#25343F] min-w-[14px] text-center font-mono">
                                  {existingInCart.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addProductToOrder(product)}
                                  className="w-5 h-5 rounded-md bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] flex items-center justify-center text-xs transition-colors cursor-pointer"
                                  title="Tambah"
                                >
                                  <PlusIcon className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addProductToOrder(product);
                                }}
                                className="w-6 h-6 rounded-lg bg-[#EAEFEF] text-[#25343F] hover:bg-[#FF9B51] hover:text-[#25343F] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                              >
                                <PlusIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Order & SPK Configurator Panel (Full page on mobile) */}
          <form
            onSubmit={handleSubmitOrder}
            className={`w-full lg:w-[420px] xl:w-[460px] flex-col bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden shrink-0 ${
              mobileTab === 'order' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Mobile Top Back Bar */}
            <div className="lg:hidden px-3.5 py-2.5 bg-[#25343F] text-white flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMobileTab('catalog')}
                className="flex items-center gap-1 text-xs font-bold hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Kembali ke Katalog</span>
              </button>
              <span className="text-[11px] font-semibold text-slate-300">
                {newOrderItems.reduce((s, i) => s + i.quantity, 0)} item
              </span>
            </div>

            {/* Header: Customer & Deadline Info */}
            <div className="p-3 sm:p-4 border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WrenchScrewdriverIcon className="w-4 h-4 text-[#25343F]" />
                  <h3 className="font-extrabold text-sm text-[#25343F]">Rincian Pesanan &amp; SPK</h3>
                </div>
                {newOrderItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetOrderForm}
                    className="text-[11px] font-bold text-[#898989] hover:text-[#c45e00] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowPathIcon className="w-3 h-3" /> Kosongkan
                  </button>
                )}
              </div>

              {/* Customer Selector */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#25343F] uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-[#25343F]" /> Pelanggan
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewCustModalOpen(true)}
                    className="text-[11px] font-semibold text-[#25343F] hover:text-[#25343F] flex items-center gap-1 cursor-pointer"
                  >
                    <PlusIcon className="w-3 h-3" /> Tambah Baru
                  </button>
                </div>

                <select
                  id="select-order-customer"
                  value={newOrderCustomerId}
                  onChange={e => handleSelectCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl text-xs font-semibold text-[#25343F] focus:outline-hidden focus:border-[#BFC9D1] cursor-pointer"
                >
                  <option value="">Pelanggan Umum (Walk-in)</option>
                  {customers.map(cust => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} {cust.whatsapp ? `(${cust.whatsapp})` : ''}
                    </option>
                  ))}
                </select>

                {/* Dates & Quick Deadline Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block font-semibold text-[#898989] mb-1 text-[11px]">Tgl Masuk</label>
                    <input
                      type="date"
                      required
                      value={newOrderDate}
                      onChange={e => setNewOrderDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#c45e00] mb-1 text-[11px]">Target Selesai *</label>
                    <input
                      type="date"
                      required
                      value={newOrderDeadline}
                      onChange={e => setNewOrderDeadline(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-xl text-xs font-bold text-[#c45e00]"
                    />
                  </div>
                </div>

                {/* Quick deadline pills */}
                <div className="flex items-center gap-1.5 pt-0.5 text-[10px]">
                  <span className="text-[#898989] font-semibold">Cepat:</span>
                  <button
                    type="button"
                    onClick={() => setQuickDeadlineDays(1)}
                    className="px-2 py-0.5 bg-[#EAEFEF] hover:bg-slate-300 text-[#25343F] font-bold rounded-md cursor-pointer"
                  >
                    +1 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadlineDays(2)}
                    className="px-2 py-0.5 bg-[#EAEFEF] hover:bg-slate-300 text-[#25343F] font-bold rounded-md cursor-pointer"
                  >
                    +2 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadlineDays(3)}
                    className="px-2 py-0.5 bg-[#EAEFEF] hover:bg-slate-300 text-[#25343F] font-bold rounded-md cursor-pointer"
                  >
                    +3 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadlineDays(7)}
                    className="px-2 py-0.5 bg-[#EAEFEF] hover:bg-slate-300 text-[#25343F] font-bold rounded-md cursor-pointer"
                  >
                    +1 Minggu
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Items ListBulletIcon */}
            <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-100 text-xs">
              {newOrderItems.length === 0 ? (
                <div className="text-center py-12 text-[#898989] space-y-2">
                  <ShoppingBagIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-[#898989]">Daftar item pesanan masih kosong</p>
                  <p className="text-[11px] text-[#898989] max-w-xs mx-auto">
                    Klik produk di katalog sebelah kiri untuk memasukkannya ke rincian pesanan.
                  </p>
                </div>
              ) : (
                newOrderItems.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);

                  return (
                    <div key={idx} className="py-2.5 space-y-1.5 first:pt-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <ProductImage
                            thumbnailPath={prod?.thumbnailPath}
                            imagePath={prod?.imagePath}
                            productName={item.productName}
                            size="xs"
                            rounded="rounded-md"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-[#25343F] text-xs truncate leading-tight">
                              {item.productName}
                            </h5>
                            <span className="text-[11px] text-[#898989] font-mono">
                              @ {formatRupiah(item.unitPrice)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Qty Counter */}
                          <div className="flex items-center border border-[#BFC9D1]/25 rounded-lg bg-[#EAEFEF]">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, -1)}
                              className="p-1 hover:bg-[#EAEFEF] rounded-l text-[#898989] cursor-pointer"
                            >
                              <MinusIcon className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={e => handleUpdateItemField(idx, 'quantity', e.target.value)}
                              onBlur={() => handleBlurItemQty(idx)}
                              className="w-10 text-center font-bold text-[#25343F] bg-transparent text-xs py-0.5"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, 1)}
                              className="p-1 hover:bg-[#EAEFEF] rounded-r text-[#898989] cursor-pointer"
                            >
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-black text-[#25343F] font-mono text-xs w-20 text-right">
                            {formatRupiah(item.subtotal)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-[#898989] hover:text-[#c45e00] rounded cursor-pointer"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Custom Item Notes Input */}
                      <input
                        type="text"
                        placeholder="Instruksi spesifik (misal: laminasi doff, ukuran custom 20x30)..."
                        value={item.notes || ''}
                        onChange={e => handleUpdateItemField(idx, 'notes', e.target.value)}
                        className="w-full px-2.5 py-1 bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded text-[11px] text-[#25343F] italic focus:bg-white"
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Summary, DP & Submit Section */}
            <div className="p-3 sm:p-4 border-t border-[#BFC9D1]/40 bg-[#EAEFEF]/90 space-y-2.5 text-xs">
              {/* Subtotal & Discount */}
              <div className="space-y-1">
                <div className="flex justify-between text-[#898989]">
                  <span>Subtotal ({newOrderItems.reduce((s, i) => s + i.quantity, 0)} pcs):</span>
                  <span className="font-bold font-mono text-[#25343F]">{formatRupiah(newOrderSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-[#898989]">
                  <span>Potongan Diskon (Rp):</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={newOrderDiscount ? newOrderDiscount.toLocaleString('id-ID') : ''}
                    onChange={e => setNewOrderDiscount(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
                    className="w-24 text-right px-2 py-0.5 bg-white border border-[#BFC9D1]/25 rounded font-bold text-[#c45e00] font-mono text-xs"
                  />
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#BFC9D1]/40 font-extrabold text-sm text-[#25343F]">
                  <span>Total Tagihan:</span>
                  <span className="text-base font-black text-[#25343F] font-mono">{formatRupiah(newOrderTotal)}</span>
                </div>
              </div>

              {/* DP & Payment Method */}
              <div className="p-2.5 bg-white rounded-xl border border-[#BFC9D1]/25 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#25343F] mb-0.5 text-[11px]">Uang Muka (DP)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={newOrderDp ? newOrderDp.toLocaleString('id-ID') : ''}
                      onChange={e => setNewOrderDp(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
                      className="w-full px-2.5 py-1 bg-white border border-[#BFC9D1]/25 rounded-lg font-bold text-[#25343F] font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#25343F] mb-0.5 text-[11px]">Metode DP</label>
                    <select
                      value={newOrderPaymentMethod}
                      onChange={e => setNewOrderPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-2.5 py-1 bg-white border border-[#BFC9D1]/25 rounded-lg text-xs"
                    >
                      <option value="CASH">CASH (Tunai)</option>
                      <option value="TRANSFER">TRANSFER Bank</option>
                      <option value="QRIS">QRIS</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-[#898989]">Sisa Tagihan Nanti:</span>
                  <span className="font-extrabold text-[#25343F] font-mono text-xs">
                    {formatRupiah(Math.max(0, newOrderTotal - newOrderDp))}
                  </span>
                </div>
              </div>

              {/* General Order Notes */}
              <div>
                <input
                  type="text"
                  placeholder="Catatan umum pesanan (misal: packaging kayu tebal, softfile via WA)..."
                  value={newOrderNotes}
                  onChange={e => setNewOrderNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-lg text-[11px]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-submit-pos-order"
                disabled={isSubmittingOrder || newOrderItems.length === 0}
                className="w-full py-2.5 bg-[#FF9B51] hover:bg-[#ff8c38] disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingOrder ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span>Menerbitkan Pesanan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Simpan Pesanan &amp; Terbitkan SPK</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sticky Bottom Bar on Mobile when viewing catalog and items exist */}
          {mobileTab === 'catalog' && newOrderItems.length > 0 && (
            <div
              className="lg:hidden fixed bottom-[92px] left-3 right-3 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2 drop-shadow-xl"
              style={{ bottom: 'calc(86px + env(safe-area-inset-bottom, 12px))' }}
            >
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handleResetOrderForm();
                }}
                className="bg-[#25343F] hover:bg-[#1c2730] active:scale-95 text-white px-3.5 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer border border-white/10 shrink-0 transition-all"
                title="Batal / Reset Pesanan"
              >
                <TrashIcon className="w-4 h-4 text-rose-400" />
                <span>Batal</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('order')}
                className="flex-1 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between font-black text-xs cursor-pointer border border-[#FF9B51]/30 active:scale-[0.99] transition-transform min-w-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-[#25343F] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                    {newOrderItems.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                  <span className="truncate text-xs font-black">Lihat Rincian Pesanan</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[#25343F] font-black font-mono text-xs">{formatRupiah(newOrderTotal)}</span>
                  <span className="text-sm font-black">&rarr;</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: TABLE LIST VIEW (DAFTAR PESANAN)                                   */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="space-y-3 pb-8">
          {/* Pipeline Status Filter Chips (Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs scrollbar-none">
            {[
              { id: 'SEMUA', label: 'Semua' },
              { id: 'BARU', label: 'Baru' },
              { id: 'DIPROSES', label: 'Diproses' },
              { id: 'SIAP DIAMBIL', label: 'Siap' },
              { id: 'SELESAI', label: 'Selesai' },
            ].map(tab => {
              const tabKey = tab.id === 'SIAP' ? 'SIAP DIAMBIL' : tab.id;
              const count =
                tab.id === 'SEMUA'
                  ? orders.length
                  : orders.filter(o => o.status === tabKey).length;

              const isMatch =
                selectedStatusFilter === tab.id ||
                (tab.id === 'SIAP' && selectedStatusFilter === 'SIAP DIAMBIL');

              return (
                <button
                  key={tab.id}
                  ref={el => { filterTabRefs.current[tabKey] = el; }}
                  onClick={() => setSelectedStatusFilter(tabKey)}
                  className={`min-h-[34px] px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 ${
                    isMatch
                      ? 'bg-[#25343F] text-white shadow-sm'
                      : 'bg-white border border-[#BFC9D1]/25 text-[#898989] hover:bg-[#EAEFEF]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isMatch
                        ? 'bg-slate-700 text-white'
                        : 'bg-[#EAEFEF] text-[#898989]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* MOBILE COMPACT ORDER LIST (< md) WITH SWIPE GESTURE                 */}
          {/* ------------------------------------------------------------------- */}
          {filteredOrders.length > 0 && (
            <div className="md:hidden flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-[#BFC9D1]/25 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  onChange={handleToggleSelectAllFiltered}
                  className="w-4 h-4 rounded text-[#25343F] focus:ring-[#25343F] border-[#BFC9D1] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#25343F]">
                  {isAllFilteredSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua Pesanan'}
                </span>
              </label>
              {selectedOrderIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenBatchPrint()}
                  className="px-2.5 py-1 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  <span>Cetak ({selectedOrderIds.length})</span>
                </button>
              )}
            </div>
          )}

          <div
            className="md:hidden space-y-2 select-none touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-white p-3 rounded-2xl border border-[#BFC9D1]/25 animate-pulse space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 bg-[#EAEFEF] rounded w-1/3" />
                      <div className="h-4 bg-[#EAEFEF] rounded w-1/4" />
                    </div>
                    <div className="h-3 bg-[#EAEFEF] rounded w-1/2" />
                    <div className="h-3 bg-[#EAEFEF] rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 p-8 text-center shadow-md">
                <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-[#25343F]">
                  {searchQuery ? 'Pesanan tidak ditemukan' : 'Belum ada pesanan'}
                </h4>
                <p className="text-xs text-[#898989] mt-1 max-w-xs mx-auto">
                  {searchQuery
                    ? 'Coba nomor order atau nama pelanggan lain.'
                    : 'Pesanan baru yang diterbitkan akan muncul di sini.'}
                </p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isOverdue = isDeadlineOverdue(order.deadlineDate, order.status);
                const isToday = isDeadlineToday(order.deadlineDate, order.status);
                const isSelected = selectedOrderIds.includes(order.id);
                const firstItem = order.items[0];
                const otherItemsCount = order.items.length - 1;

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsDetailModalOpen(true);
                    }}
                    className={`bg-white p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] space-y-1.5 shadow-md relative ${
                      isSelected
                        ? 'border-[#BFC9D1] ring-2 ring-[#25343F] bg-[#EAEFEF]/20'
                        : isOverdue
                        ? 'border-[#FF9B51]/40 bg-[#FF9B51]/8'
                        : 'border-[#BFC9D1]/90 hover:border-[#BFC9D1]'
                    }`}
                  >
                    {/* Line 1: Checkbox + Order Number (Left) | Total Price (Right) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => handleToggleSelectOrder(order.id, e)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded text-[#25343F] focus:ring-[#25343F] border-[#BFC9D1] cursor-pointer shrink-0"
                          aria-label="Pilih pesanan"
                        />
                        <span className="font-black text-xs text-[#25343F] font-mono truncate">
                          {order.orderNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-xs sm:text-sm text-[#25343F] font-mono">
                          {formatRupiah(order.totalAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setInvoiceOrder(order);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="p-1 text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] rounded-lg cursor-pointer"
                          title="Cetak Faktur / SPK"
                        >
                          <PrinterIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Line 2: Customer Name (Left) | Payment & Work Status (Right) */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-[#25343F] truncate min-w-0">
                        {order.customerName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            order.paymentStatus === 'LUNAS'
                              ? 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/50'
                              : order.paymentStatus === 'DP'
                              ? 'bg-[#FFAF2A]/15 text-[#b45309] border border-[#FFAF2A]/40'
                              : 'bg-[#FFE6D6] text-[#C25400] border border-[#FFCCA8]'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        {/* Status Pengerjaan — tappable select for quick edit */}
                        <select
                          value={order.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => {
                            e.stopPropagation();
                            handleUpdateStatus(order.id, e.target.value);
                          }}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border cursor-pointer appearance-none text-center ${getStatusBadgeClass(order.status)}`}
                          title="Ubah status pengerjaan"
                        >
                          <option value="BARU">BARU</option>
                          <option value="DIPROSES">DIPROSES</option>
                          <option value="SIAP DIAMBIL">SIAP DIAMBIL</option>
                          <option value="SELESAI">SELESAI</option>
                          <option value="BATAL">BATAL</option>
                        </select>
                      </div>
                    </div>

                    {/* Line 3: Product Name & Quantity summary */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#898989] bg-[#EAEFEF]/80 px-2 py-1 rounded-lg">
                      <span className="truncate min-w-0">
                        {firstItem ? firstItem.productName : 'Item Pesanan'}
                        {otherItemsCount > 0 && (
                          <span className="text-[#898989] font-semibold"> +{otherItemsCount} item lainnya</span>
                        )}
                      </span>
                      <span className="font-black text-[#25343F] font-mono shrink-0">
                        {firstItem ? `${firstItem.quantity}x` : ''}
                      </span>
                    </div>

                    {/* Line 4: Date & Deadline */}
                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <span className="text-[#898989] font-medium">
                        {formatDate(order.orderDate)}
                      </span>

                      <div
                        className={`flex items-center gap-1 font-bold ${
                          isOverdue
                            ? 'text-[#FF4267] font-black'
                            : 'text-[#FF9B51] font-bold'
                        }`}
                      >
                        <ClockIcon className="w-3 h-3" />
                        <span>Deadline: {formatDate(order.deadlineDate)}</span>
                        {isOverdue && <span className="uppercase text-[9px] font-black">(Telat)</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* DESKTOP FULL TABLE VIEW (>= md)                                      */}
          {/* ------------------------------------------------------------------- */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-[#898989] text-sm">Memuat data pesanan...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-[#898989]">
                <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#25343F]">Tidak ada pesanan ditemukan</p>
                <p className="text-xs text-[#898989] mt-1">Gunakan tab &quot;Buat Pesanan&quot; untuk menerbitkan pesanan baru.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/80 text-[#898989] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllFilteredSelected}
                          ref={el => {
                            if (el) el.indeterminate = isSomeFilteredSelected;
                          }}
                          onChange={handleToggleSelectAllFiltered}
                          className="w-4 h-4 rounded text-[#25343F] focus:ring-[#25343F] border-[#BFC9D1] cursor-pointer"
                          title="Pilih Semua Pesanan"
                        />
                      </th>
                      <th className="py-3.5 px-4">No. Order &amp; Pelanggan</th>
                      <th className="py-3.5 px-4">Item &amp; Detail</th>
                      <th className="py-3.5 px-4">Tanggal &amp; Deadline</th>
                      <th className="py-3.5 px-4 text-right">Nilai Tagihan</th>
                      <th className="py-3.5 px-4 text-center">Status Pembayaran</th>
                      <th className="py-3.5 px-4 text-center">Status Pengerjaan</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map(order => {
                      const isOverdue = isDeadlineOverdue(order.deadlineDate, order.status);
                      const isToday = isDeadlineToday(order.deadlineDate, order.status);
                      const isSelected = selectedOrderIds.includes(order.id);

                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-[#EAEFEF]/60 transition-colors ${
                            isSelected ? 'bg-[#EAEFEF]/40' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => handleToggleSelectOrder(order.id, e)}
                              className="w-4 h-4 rounded text-[#25343F] focus:ring-[#25343F] border-[#BFC9D1] cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-extrabold text-[#25343F] font-mono">{order.orderNumber}</div>
                            <div className="font-medium text-[#25343F] mt-0.5">{order.customerName}</div>
                            {order.customerPhone && (
                              <div className="text-[10px] text-[#898989] font-mono">{order.customerPhone}</div>
                            )}
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <div className="space-y-0.5">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="truncate text-[#25343F]">
                                  <span className="font-bold">{it.quantity}x</span> {it.productName}
                                  {it.notes && (
                                    <span className="text-[10px] text-[#c45e00] italic"> ({it.notes})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {order.files && order.files.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-[#25343F] mt-1">
                                <PaperClipIcon className="w-3 h-3" />
                                <span>{order.files.length} File Terlampir</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-[#898989]">{formatDate(order.orderDate)}</div>
                            <div
                              className={`font-bold mt-0.5 flex items-center gap-1 ${
                                isOverdue
                                  ? 'text-[#c45e00]'
                                  : isToday
                                  ? 'text-[#FF9B51]'
                                  : 'text-[#25343F]'
                              }`}
                            >
                              <ClockIcon className="w-3 h-3" />
                              <span>{formatDate(order.deadlineDate)}</span>
                              {isOverdue && <span className="text-[9px] font-black uppercase text-[#c45e00]">(Telat)</span>}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="font-bold font-mono text-[#25343F]">{formatRupiah(order.totalAmount)}</div>
                            {order.remainingAmount > 0 ? (
                              <div className="text-[10px] text-[#c45e00] font-medium">
                                Sisa: {formatRupiah(order.remainingAmount)}
                              </div>
                            ) : (
                              <div className="text-[10px] text-[#25343F] font-medium">Lunas</div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                order.paymentStatus === 'LUNAS'
                                  ? 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/50'
                                  : order.paymentStatus === 'DP'
                                  ? 'bg-[#FFAF2A]/15 text-[#b45309] border border-[#FFAF2A]/40'
                                  : 'bg-[#FFE6D6] text-[#C25400] border border-[#FFCCA8]'
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <select
                              value={order.status}
                              onChange={e => handleUpdateStatus(order.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${getStatusBadgeClass(
                                order.status
                              )} cursor-pointer`}
                            >
                              <option value="BARU">BARU</option>
                              <option value="DIPROSES">DIPROSES</option>
                              <option value="SIAP DIAMBIL">SIAP DIAMBIL</option>
                              <option value="SELESAI">SELESAI</option>
                              <option value="BATAL">BATAL</option>
                            </select>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] transition-colors cursor-pointer"
                                title="Lihat Detail &amp; File"
                              >
                                <EyeIcon className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setInvoiceOrder(order);
                                  setIsInvoiceModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] transition-colors cursor-pointer"
                                title="Cetak Faktur / SPK"
                              >
                                <PrinterIcon className="w-3.5 h-3.5" />
                              </button>

                              {order.remainingAmount > 0 && (
                                <button
                                  onClick={() => handleOpenAddPayment(order)}
                                  className="p-1.5 rounded-lg text-[#25343F] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 transition-colors cursor-pointer"
                                  title="Catat Pelunasan / Tambah DP"
                                >
                                  <CurrencyDollarIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: KANBAN WORKFLOW BOARD                                              */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-start pb-8">
          {[
            {
              status: 'BARU',
              title: 'Pesanan Masuk',
              subtitle: 'Antre setting & cetak',
              color: 'border-[#BFC9D1] bg-[#EAEFEF]/50 text-[#25343F]',
              badge: 'bg-[#25343F] text-white',
            },
            {
              status: 'DIPROSES',
              title: 'Sedang Diproses',
              subtitle: 'Desain, cetak & finishing',
              color: 'border-[#FF9B51]/40 bg-[#FF9B51]/8 text-[#c45e00]',
              badge: 'bg-[#FF9B51] text-white',
            },
            {
              status: 'SIAP DIAMBIL',
              title: 'Siap Diambil / Kirim',
              subtitle: 'Produksi beres, tunggu diambil',
              color: 'border-[#BFC9D1] bg-[#EAEFEF]/50 text-purple-900',
              badge: 'bg-[#25343F] text-white',
            },
            {
              status: 'SELESAI',
              title: 'Selesai',
              subtitle: 'Pesanan tuntas diserahkan',
              color: 'border-[#BFC9D1] bg-[#EAEFEF]/50 text-[#25343F]',
              badge: 'bg-[#25343F] text-white',
            },
          ].map(lane => {
            const laneOrders = filteredOrders.filter(o => o.status === lane.status);
            const allInLaneSelected = laneOrders.length > 0 && laneOrders.every(o => selectedOrderIds.includes(o.id));

            return (
              <div
                key={lane.status}
                className="bg-[#EAEFEF]/90 rounded-2xl border border-[#BFC9D1]/25 p-3 space-y-2.5 min-h-[300px] flex flex-col"
              >
                {/* Lane Header */}
                <div className={`p-2.5 sm:p-3 rounded-xl border ${lane.color} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    {laneOrders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSelectLaneOrders(laneOrders)}
                        className="p-1 rounded hover:bg-black/10 cursor-pointer"
                        title={allInLaneSelected ? 'Batalkan pilihan kolom ini' : 'Pilih semua di kolom ini'}
                      >
                        {allInLaneSelected ? (
                          <CheckCircleIcon className="w-4 h-4 text-[#25343F]" />
                        ) : (
                          <StopIcon className="w-4 h-4 opacity-60" />
                        )}
                      </button>
                    )}
                    <div>
                      <h4 className="font-extrabold text-xs">{lane.title}</h4>
                      <span className="text-[10px] opacity-80 hidden sm:inline">{lane.subtitle}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${lane.badge}`}>
                    {laneOrders.length}
                  </span>
                </div>

                {/* Lane Cards (Ultra-Compact on Mobile) */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {laneOrders.length === 0 ? (
                    <div className="text-center py-8 text-[#898989] text-[11px] border border-dashed border-[#BFC9D1] rounded-xl">
                      Tidak ada pesanan di tahap ini
                    </div>
                  ) : (
                    laneOrders.map(order => {
                      const isOverdue = isDeadlineOverdue(order.deadlineDate, order.status);
                      const isToday = isDeadlineToday(order.deadlineDate, order.status);
                      const isSelected = selectedOrderIds.includes(order.id);
                      const firstItem = order.items[0];
                      const otherItemsCount = order.items.length - 1;

                      return (
                        <div
                          key={order.id}
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailModalOpen(true);
                          }}
                          className={`bg-white p-3 rounded-xl border shadow-md space-y-1.5 transition-all cursor-pointer active:scale-[0.99] relative ${
                            isSelected
                              ? 'border-[#BFC9D1] ring-2 ring-[#25343F] bg-[#EAEFEF]/20'
                              : isOverdue
                              ? 'border-[#FF9B51]/40 ring-1 ring-[#FF9B51]'
                              : isToday
                              ? 'border-[#FF9B51]/40'
                              : 'border-[#BFC9D1]'
                          }`}
                        >
                          {/* Row 1: Checkbox + Order No | Price & Print */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <button
                                type="button"
                                onClick={e => handleToggleSelectOrder(order.id, e)}
                                className="p-0.5 text-[#898989] hover:text-[#25343F] cursor-pointer shrink-0"
                              >
                                {isSelected ? (
                                  <CheckCircleIcon className="w-3.5 h-3.5 text-[#25343F]" />
                                ) : (
                                  <StopIcon className="w-3.5 h-3.5 text-[#898989]" />
                                )}
                              </button>
                              <span className="font-black text-[#25343F] text-xs font-mono truncate">
                                {order.orderNumber}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-extrabold text-[#25343F] text-xs font-mono">
                                {formatRupiah(order.totalAmount)}
                              </span>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setInvoiceOrder(order);
                                  setIsInvoiceModalOpen(true);
                                }}
                                className="p-1 text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] rounded cursor-pointer"
                                title="Cetak Faktur"
                              >
                                <PrinterIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Customer Name | Payment Badge */}
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-[#25343F] truncate min-w-0">
                              {order.customerName}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0 ${
                                order.paymentStatus === 'LUNAS'
                                  ? 'bg-[#EAEFEF] text-[#25343F]'
                                  : order.paymentStatus === 'DP'
                                  ? 'bg-[#FF9B51]/15 text-[#c45e00]'
                                  : 'bg-[#FF9B51]/15 text-[#c45e00]'
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </div>

                          {/* Row 3: Product Summary */}
                          <div className="bg-[#EAEFEF] p-1.5 rounded-lg text-[11px] text-[#25343F] font-medium flex justify-between gap-2">
                            <span className="truncate min-w-0">
                              {firstItem ? firstItem.productName : 'Item'}
                              {otherItemsCount > 0 && <span className="text-[#898989]"> +{otherItemsCount}</span>}
                            </span>
                            <span className="font-bold text-[#25343F] font-mono shrink-0">
                              {firstItem ? `${firstItem.quantity}x` : ''}
                            </span>
                          </div>

                          {/* Row 4: Deadline & Files */}
                          <div className="flex items-center justify-between text-[10px] pt-0.5">
                            <div
                              className={`flex items-center gap-1 font-bold ${
                                isOverdue
                                  ? 'text-[#c45e00]'
                                  : isToday
                                  ? 'text-[#FF9B51]'
                                  : 'text-[#898989]'
                              }`}
                            >
                              <ClockIcon className="w-3 h-3" />
                              <span>{formatDate(order.deadlineDate)}</span>
                              {isOverdue && <span className="text-[9px] font-black text-[#c45e00]">⚠ TELAT</span>}
                            </div>

                            {order.files && order.files.length > 0 && (
                              <div className="flex items-center gap-1 text-[#25343F] font-bold">
                                <PaperClipIcon className="w-3 h-3" />
                                <span>{order.files.length} File</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Detail Order Dialog & Files                                      */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-2xl w-full max-h-[90vh] flex flex-col p-6 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#25343F] block">
                  #{selectedOrder.orderNumber}
                </span>
                <h3 className="font-extrabold text-sm text-[#25343F] mt-0.5">
                  Detail Pesanan &amp; File Produksi
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  selectedOrder.paymentStatus === 'LUNAS'
                    ? 'bg-[#EAEFEF] text-[#25343F]'
                    : selectedOrder.paymentStatus === 'DP'
                    ? 'bg-[#FF9B51]/15 text-[#c45e00]'
                    : 'bg-[#FF9B51]/15 text-[#c45e00]'
                }`}
              >
                {selectedOrder.paymentStatus}
              </span>
            </div>

            {/* Status Pengerjaan Quick Selector */}
            <div className="p-3 bg-[#EAEFEF]/80 rounded-xl border border-[#BFC9D1]/30 mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#25343F]">
                Status Pengerjaan:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'BARU', label: '1. Baru' },
                  { id: 'DIPROSES', label: '2. Proses' },
                  { id: 'SIAP DIAMBIL', label: '3. Diambil' },
                  { id: 'SELESAI', label: '4. Selesai' },
                  { id: 'BATAL', label: '5. Batal' },
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={async () => {
                      await handleUpdateStatus(selectedOrder.id, st.id);
                      setSelectedOrder(prev => prev ? { ...prev, status: st.id as any } : null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      selectedOrder.status === st.id
                        ? 'bg-[#25343F] text-white border-[#25343F] shadow-sm'
                        : 'bg-white text-[#898989] border-[#BFC9D1]/30 hover:bg-[#EAEFEF]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content Scroll */}
            <div className="overflow-y-auto flex-1 py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3.5 p-3.5 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25">
                <div>
                  <span className="text-[#898989] block font-semibold text-[11px]">Nama Pemesan:</span>
                  <span className="font-bold text-[#25343F] text-sm">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-[#898989] block font-semibold text-[11px]">Nomor WhatsApp:</span>
                  <span className="font-mono text-[#25343F]">{selectedOrder.customerPhone || '-'}</span>
                </div>
                <div>
                  <span className="text-[#898989] block font-semibold text-[11px]">Tanggal Masuk:</span>
                  <span className="font-medium text-[#25343F]">{formatDate(selectedOrder.orderDate)}</span>
                </div>
                <div>
                  <span className="text-[#898989] block font-semibold text-[11px]">Target Deadline:</span>
                  <span className="font-bold text-[#c45e00]">{formatDate(selectedOrder.deadlineDate)}</span>
                </div>
              </div>

              {/* Items ListBulletIcon */}
              <div className="space-y-2">
                <h4 className="font-bold text-[#25343F]">Rincian Item Pesanan:</h4>
                <div className="border border-[#BFC9D1]/25 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {selectedOrder.items.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            thumbnailPath={prod?.thumbnailPath}
                            imagePath={prod?.imagePath}
                            productName={item.productName}
                            size="sm"
                            rounded="rounded-lg"
                          />
                          <div>
                            <div className="font-bold text-[#25343F] text-xs">{item.productName}</div>
                            <div className="text-[#898989] text-[11px]">
                              {item.quantity} × {formatRupiah(item.unitPrice)}
                              {item.notes && <span className="text-[#c45e00]"> • {item.notes}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-[#25343F] font-mono text-xs">{formatRupiah(item.subtotal)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment History & Action */}
              <div className="p-4 bg-[#EAEFEF]/70 rounded-xl border border-[#BFC9D1]/25 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#25343F]">Riwayat Pembayaran</h4>
                  {selectedOrder.remainingAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenAddPayment(selectedOrder)}
                      className="px-3 py-1.5 rounded-lg bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <PlusIcon className="w-3.5 h-3.5" /> Catat Pelunasan / DP
                    </button>
                  )}
                </div>

                {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedOrder.payments.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="p-2.5 bg-white rounded-lg border border-[#BFC9D1]/25 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#25343F] font-mono">{formatRupiah(p.amount)}</span>
                            <span className="text-[#898989] text-[11px]">via {p.paymentMethod}</span>
                          </div>
                          {p.notes && <p className="text-[10px] text-[#898989] truncate">{p.notes}</p>}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[#898989] text-[10.5px] mr-1">{formatDate(p.date)}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPayment(selectedOrder, p)}
                            className="p-1 rounded-md text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 transition-colors cursor-pointer"
                            title="Edit Pembayaran"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(selectedOrder.id, p.id)}
                            className="p-1 rounded-md text-[#898989] hover:text-[#c45e00] hover:bg-[#FF9B51]/8 border border-[#BFC9D1]/25 transition-colors cursor-pointer"
                            title="Hapus Pembayaran"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#898989] text-xs">Belum ada pembayaran yang dicatat.</p>
                )}
              </div>

              {/* File Management */}
              <div className="p-4 bg-white rounded-xl border border-[#BFC9D1]/25 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PaperClipIcon className="w-4 h-4 text-[#25343F]" />
                    <h4 className="font-bold text-[#25343F]">File Desain &amp; Cetak Terlampir</h4>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="upload-order-file-input"
                    />
                    <button
                      type="button"
                      disabled={isUploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-[#FF9B51] hover:bg-[#FF9B51] disabled:bg-slate-300 text-[#25343F] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                      {isUploadingFile ? 'Mengunggah...' : 'Unggah File Desain'}
                    </button>
                  </div>
                </div>

                {selectedOrder.files && selectedOrder.files.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedOrder.files.map(file => (
                      <div
                        key={file.id}
                        className="p-3 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#25343F] text-xs truncate">
                            {file.originalName}
                          </div>
                          <div className="text-[10px] text-[#898989] mt-0.5">
                            {(file.size / 1024).toFixed(0)} KB • {formatDate(file.createdAt)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-[#25343F] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25"
                            title="Buka / Unduh"
                          >
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1.5 rounded-lg text-[#c45e00] hover:bg-[#FF9B51]/8 border border-[#FF9B51]/40"
                            title="Hapus File"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#898989] text-xs">
                    Belum ada file desain terlampir pada pesanan ini.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#BFC9D1]/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setOrderToDelete(selectedOrder)}
                className="text-xs font-semibold text-[#c45e00] hover:text-[#c45e00] flex items-center gap-1 cursor-pointer"
              >
                <TrashIcon className="w-3.5 h-3.5" /> Hapus Pesanan
              </button>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Add Payment Dialog                                               */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-md w-full p-6">
            <h3 className="font-bold text-base text-[#25343F] mb-1">
              {editingPaymentId ? 'Edit Pembayaran' : 'Catat Pembayaran'} #{selectedOrder.orderNumber}
            </h3>
            <p className="text-xs text-[#898989] mb-4">Pemesan: {selectedOrder.customerName}</p>

            <form onSubmit={handleSubmitPayment} className="space-y-3.5 text-xs">
              {!editingPaymentId && (
                <div className="p-3 bg-[#FF9B51]/8 rounded-xl border border-[#FF9B51]/40 flex justify-between items-center">
                  <span className="font-medium text-[#c45e00]">Sisa Tagihan:</span>
                  <span className="font-extrabold text-sm text-[#c45e00] font-mono">{formatRupiah(selectedOrder.remainingAmount)}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Nominal Pembayaran Diterima *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={paymentAmount ? paymentAmount.toLocaleString('id-ID') : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setPaymentAmount(parseInt(raw, 10) || 0);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-bold text-[#25343F] text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                >
                  <option value="CASH">CASH (Tunai)</option>
                  <option value="TRANSFER">TRANSFER Bank (BCA / Mandiri / BRI)</option>
                  <option value="QRIS">QRIS Toko</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#25343F] mb-1">Catatan / No. Ref Transfer</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Contoh: Lunas transfer BCA a.n Budi"
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSavingPayment}
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setEditingPaymentId(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-[#BFC9D1]/25 font-semibold text-[#898989] hover:bg-[#EAEFEF] cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPayment}
                  className="px-5 py-2 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingPayment ? 'Menyimpan...' : editingPaymentId ? 'Perbarui Pembayaran' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice & SPK Modal */}
      <PrintInvoiceModal
        isOpen={isInvoiceModalOpen}
        order={invoiceOrder}
        settings={settings}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      {/* Batch Print Orders Modal */}
      <BatchPrintOrdersModal
        isOpen={isBatchPrintModalOpen}
        orders={orders.filter(o => selectedOrderIds.includes(o.id))}
        settings={settings}
        onClose={() => setIsBatchPrintModalOpen(false)}
        onUpdateBatchStatus={handleBatchUpdateStatus}
      />

      {/* Floating Bottom Batch Action Bar (Hidden when Modals are open) */}
      {selectedOrderIds.length > 0 && !isBatchPrintModalOpen && !isInvoiceModalOpen && (
        <div
          id="batch-actions-floating-bar"
          className="fixed bottom-[92px] lg:bottom-7 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[94%] sm:w-auto bg-[#25343F]/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-fade-in"
          style={{ bottom: 'calc(86px + env(safe-area-inset-bottom, 12px))' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#25343F] text-white font-black text-xs flex items-center justify-center shadow-sm">
              {selectedOrderIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                {selectedOrderIds.length} Pesanan Dipilih
              </p>
              <p className="text-[10px] text-slate-300">
                Total: {formatRupiah(orders.filter(o => selectedOrderIds.includes(o.id)).reduce((s, o) => s + o.totalAmount, 0))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-trigger-floating-batch-print"
              type="button"
              onClick={() => setIsBatchPrintModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <PrinterIcon className="w-3.5 h-3.5" />
              <span>Cetak Massal</span>
            </button>

            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 py-1.5 rounded-xl bg-[#FF9B51] hover:bg-slate-700 text-slate-300 hover:text-[#25343F] text-xs font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!orderToDelete}
        title="Hapus Pesanan?"
        message={`Apakah Anda yakin ingin menghapus pesanan #${orderToDelete?.orderNumber}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Pesanan"
        onConfirm={handleDeleteOrder}
        onCancel={() => setOrderToDelete(null)}
      />

      {/* Quick Customer Add Modal */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-sm w-full p-6">
            <h3 className="font-bold text-base text-[#25343F] mb-3">Tambah Pelanggan Baru</h3>
            <form onSubmit={handleSaveNewCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#25343F] mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#25343F] mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl text-xs"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-[#BFC9D1]/25 text-xs font-medium text-[#898989]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] text-xs font-bold"
                >
                  Simpan & Pilih
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating Batch Actions Bar (When items selected) ── */}
      {selectedOrderIds.length > 0 && (
        <div
          className="fixed bottom-[92px] sm:bottom-8 left-1/2 -translate-x-1/2 z-40 bg-[#25343F] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2.5 sm:gap-3 animate-fade-in max-w-[95vw]"
          style={{ bottom: 'calc(86px + env(safe-area-inset-bottom, 12px))' }}
        >
          <div className="text-xs font-black whitespace-nowrap">
            <span className="text-[#FF9B51]">{selectedOrderIds.length}</span> Dipilih
          </div>

          <div className="h-4 w-px bg-white/20 shrink-0" />

          <button
            type="button"
            onClick={() => handleOpenBatchPrint()}
            className="px-3 py-1.5 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
          >
            <PrinterIcon className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Cetak Massal</span>
          </button>

          <select
            onChange={e => {
              if (e.target.value) {
                handleBatchUpdateStatus(selectedOrderIds, e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/20 shrink-0"
          >
            <option value="" disabled className="text-zinc-800 font-normal">Ubah Status...</option>
            <option value="BARU" className="text-zinc-800">1. Baru</option>
            <option value="DIPROSES" className="text-zinc-800">2. Proses</option>
            <option value="SIAP DIAMBIL" className="text-zinc-800">3. Diambil</option>
            <option value="SELESAI" className="text-zinc-800">4. Selesai</option>
            <option value="BATAL" className="text-zinc-800">5. Batal</option>
          </select>

          <button
            type="button"
            onClick={handleDeselectAll}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Batal Pilihan"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Floating Action Button (FAB) Buat Pesanan Kerja ── */}
      {viewMode !== 'pos' && selectedOrderIds.length === 0 && (
        <button
          id="btn-add-order-fab"
          type="button"
          onClick={() => setViewMode('pos')}
          className="fixed bottom-[92px] right-4 sm:bottom-8 sm:right-8 z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] flex items-center justify-center shadow-xl border-2 border-white transition-all cursor-pointer active:scale-90 hover:scale-105"
          style={{ bottom: 'calc(86px + env(safe-area-inset-bottom, 12px))' }}
          title="Buat Pesanan Kerja Baru"
          aria-label="Buat Pesanan Kerja Baru"
        >
          <PlusIcon className="w-6 h-6 stroke-[2.5]" />
          {newOrderItems.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-[#25343F] text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
              {newOrderItems.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
