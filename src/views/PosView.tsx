import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon, PlusIcon, MinusIcon, TrashIcon, UserIcon, ShoppingCartIcon, ShoppingBagIcon, CreditCardIcon, PrinterIcon, CheckCircleIcon, TagIcon, DocumentTextIcon, ArrowPathIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon, FunnelIcon, XMarkIcon, QrCodeIcon, LockClosedIcon, StarIcon } from '@heroicons/react/24/outline';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Product, Customer, Transaction, BusinessSettings, PaymentMethod, ViewType } from '../types';
import { formatRupiah, parseRupiahInput } from '../lib/utils';
import { useToast } from '../components/Toast';
import { PrintReceiptModal } from '../components/PrintReceiptModal';
import { ProductImage } from '../components/ProductImage';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { startKeyboardScanner, stopKeyboardScanner, playScanSuccessFeedback, playScanErrorFeedback } from '../lib/barcodeScanner';
import { useLicense } from '../hooks/useLicense';

interface PosViewProps {
  settings: BusinessSettings;
  onRefreshDashboard?: () => void;
  onNavigate?: (view: ViewType) => void;
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
  unit: string;
  imagePath?: string;
  thumbnailPath?: string;
}

export const PosView: React.FC<PosViewProps> = ({ settings, onRefreshDashboard, onNavigate }) => {
  const { showToast } = useToast();
  const { isPro } = useLicense();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isBarcodeLockedModalOpen, setIsBarcodeLockedModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Category Bar Scroll and Drag state
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sukunaru_pos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    try {
      return localStorage.getItem('sukunaru_pos_cust_id') || '';
    } catch {
      return '';
    }
  });
  const [customCustomerName, setCustomCustomerName] = useState<string>(() => {
    try {
      return localStorage.getItem('sukunaru_pos_cust_name') || 'Pelanggan Umum (Walk-in)';
    } catch {
      return 'Pelanggan Umum (Walk-in)';
    }
  });
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('sukunaru_pos_cust_phone') || '';
    } catch {
      return '';
    }
  });
  const [discountAmount, setDiscountAmount] = useState<number>(() => {
    try {
      const val = localStorage.getItem('sukunaru_pos_discount');
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [transactionNotes, setTransactionNotes] = useState<string>(() => {
    try {
      return localStorage.getItem('sukunaru_pos_notes') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sukunaru_pos_cart', JSON.stringify(cart));
      localStorage.setItem('sukunaru_pos_cust_id', selectedCustomerId);
      localStorage.setItem('sukunaru_pos_cust_name', customCustomerName);
      localStorage.setItem('sukunaru_pos_cust_phone', customCustomerPhone);
      localStorage.setItem('sukunaru_pos_discount', discountAmount.toString());
      localStorage.setItem('sukunaru_pos_notes', transactionNotes);
    } catch (e) {
      console.error(e);
    }
  }, [cart, selectedCustomerId, customCustomerName, customCustomerPhone, discountAmount, transactionNotes]);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed DocumentTextIcon Modal State
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Quick Customer Add Modal
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Mobile View Tab: 'catalog' | 'cart'
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Barcode Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodList, custList] = await Promise.all([api.getProducts(), api.getCustomers()]);
      setProducts(prodList.filter(p => p.isActive));
      setCustomers(custList);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat katalog produk', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => {
      api.getProducts().then(p => setProducts(p.filter(prod => prod.isActive))).catch(() => {});
      api.getCustomers().then(c => setCustomers(c)).catch(() => {});
    };
    window.addEventListener('sukunaru:sync_completed', handleRefresh);
    window.addEventListener('sukunaru:data_mutation', handleRefresh);
    return () => {
      window.removeEventListener('sukunaru:sync_completed', handleRefresh);
      window.removeEventListener('sukunaru:data_mutation', handleRefresh);
    };
  }, []);

  // â”€â”€ Barcode scan handler (shared by camera modal & USB keyboard scanner) â”€â”€
  const handleBarcodeScan = async (code: string): Promise<boolean> => {
    if (!isPro) {
      playScanErrorFeedback();
      showToast('Fitur scan barcode kasir terkunci. Silakan aktivasi lisensi.', 'error');
      setIsBarcodeLockedModalOpen(true);
      return false;
    }
    const trimmed = code.trim();
    if (!trimmed) return false;
    try {
      const found = await api.getProductByBarcode(trimmed);
      if (found && found.isActive) {
        addToCart(found);
        playScanSuccessFeedback();
        showToast(`✓ ${found.name} ditambahkan ke keranjang`, 'success');
        return true;
      } else if (found && !found.isActive) {
        playScanErrorFeedback();
        showToast(`Produk "${found.name}" tidak aktif`, 'error');
        return false;
      } else {
        playScanErrorFeedback();
        showToast(`Barcode "${trimmed}" tidak ditemukan di katalog`, 'error');
        return false;
      }
    } catch (err: any) {
      playScanErrorFeedback();
      showToast(err.message || 'Gagal mencari produk barcode', 'error');
      return false;
    }
  };

  // â”€â”€ USB / Bluetooth scanner (keyboard emulation mode) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Active while POS view is mounted; ignores input when text field is focused
  useEffect(() => {
    const stopFn = startKeyboardScanner(handleBarcodeScan);
    return () => {
      stopFn();
      stopKeyboardScanner();
    };
  }, [products]); // re-bind when products list changes so addToCart is up-to-date

  // Categories list
  const categories = ['SEMUA', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // Update chevron button visibility based on scroll position
  const updateScrollButtons = () => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  // Scroll category bar left/right when chevron buttons are clicked
  const scrollCategory = (direction: 'left' | 'right') => {
    const el = categoryScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  // Mouse/pointer drag-to-scroll handlers for desktop
  const onCatMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  };

  const onCatMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = categoryScrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const delta = x - startXRef.current;
    el.scrollLeft = scrollLeftRef.current - delta;
  };

  const onCatMouseUp = () => {
    isDraggingRef.current = false;
    const el = categoryScrollRef.current;
    if (el) el.style.cursor = 'grab';
  };

  // Re-check scroll chevrons whenever category list changes (e.g. after products load)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollButtons);
    return () => cancelAnimationFrame(frame);
  }, [categories.length]);

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'SEMUA' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Add to cart
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
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
            unit: product.unit || 'pcs',
            imagePath: product.imagePath,
            thumbnailPath: product.thumbnailPath,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity: qty,
              subtotal: qty * item.unitPrice,
            }
          : item
      )
    );
  };

  const handleBlurCartQty = (productId: string) => {
    setCart(prev =>
      prev.map(item => {
        if (item.productId === productId && (!item.quantity || item.quantity < 1)) {
          return { ...item, quantity: 1, subtotal: item.unitPrice };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setTransactionNotes('');
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const finalTotal = Math.max(0, cartSubtotal - discountAmount);
  const changeAmount = Math.max(0, amountPaid - finalTotal);

  // Customer selection
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) {
      setCustomCustomerName('Pelanggan Umum (Walk-in)');
      setCustomCustomerPhone('');
    } else {
      const c = customers.find(cust => cust.id === customerId);
      if (c) {
        setCustomCustomerName(c.name);
        setCustomCustomerPhone(c.whatsapp || '');
      }
    }
  };

  // Open Payment
  const handleOpenPayment = () => {
    if (cart.length === 0) {
      showToast('Keranjang belanja masih kosong', 'error');
      return;
    }
    setAmountPaid(finalTotal); // default exact amount
    setIsPaymentModalOpen(true);
  };

  // Quick Amount preset
  const setQuickNominal = (val: number) => {
    setAmountPaid(val);
  };

  // Complete POS Transaction
  const handleCompleteTransaction = async () => {
    if (amountPaid < finalTotal) {
      showToast('Uang pembayaran kurang dari total tagihan!', 'error');
      return;
    }

    try {
      setIsProcessing(true);

      const payload = {
        type: 'INCOME' as const,
        category: 'Penjualan Kasir (POS)',
        amount: finalTotal,
        paymentMethod,
        customerId: selectedCustomerId || undefined,
        customerName: customCustomerName,
        customerPhone: customCustomerPhone,
        items: cart.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          costPrice: i.costPrice,
          subtotal: i.subtotal,
        })),
        subtotal: cartSubtotal,
        discount: discountAmount,
        totalAmount: finalTotal,
        paidAmount: amountPaid,
        changeAmount: changeAmount,
        notes: transactionNotes,
        cashierName: 'Owner',
      };

      const result = await api.createTransaction(payload);

      // Trigger Confetti
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      } catch (e) {
        // ignore
      }

      showToast(`Transaksi ${result.receiptNumber} berhasil disimpan!`, 'success');

      setIsPaymentModalOpen(false);
      setCompletedTransaction(result);
      setIsReceiptModalOpen(true);
      clearCart();
      setMobileTab('catalog');

      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyelesaikan transaksi', 'error');
    } finally {
      setIsProcessing(false);
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
      setSelectedCustomerId(created.id);
      setCustomCustomerName(created.name);
      setCustomCustomerPhone(created.whatsapp || '');
      setIsNewCustModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      showToast('Pelanggan baru berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menambah pelanggan', 'error');
    }
  };

  return (
    <div id="pos-view" className="flex flex-col lg:flex-row gap-3.5 lg:gap-4 max-w-7xl mx-auto min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] relative pb-16 lg:pb-0">
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
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  selectedCategory !== 'SEMUA' || isFilterOpen
                    ? 'bg-[#25343F] text-white border-[#25343F]'
                    : 'bg-white text-[#898989] border-[#BFC9D1] hover:bg-[#EAEFEF]'
                }`}
                title="Filter Kategori Produk"
                aria-label="Filter Kategori"
              >
                <FunnelIcon className="w-3.5 h-3.5" />
                {selectedCategory !== 'SEMUA' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF9B51] border border-white" />
                )}
              </button>
            </div>

            {/* MagnifyingGlassIcon Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#898989]/70 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-pos-product-search"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari produk..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#BFC9D1]/25 rounded-lg text-xs focus:outline-none focus:border-[#25343F] font-medium placeholder:text-[#898989]/60 placeholder:font-normal"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2 py-1.5 text-[11px] font-semibold text-[#898989] hover:text-[#25343F] bg-[#EAEFEF] hover:bg-[#BFC9D1]/50 rounded-lg cursor-pointer shrink-0"
              >
                Reset
              </button>
            )}

            {/* Barcode Scan Camera Button (Desktop Only) */}
            <button
              type="button"
              onClick={() => {
                if (!isPro) {
                  setIsBarcodeLockedModalOpen(true);
                  return;
                }
                setIsScannerOpen(true);
              }}
              aria-label={isPro ? "Scan Barcode Produk" : "Scan Barcode Produk (Terkunci)"}
              title={isPro ? "Scan Barcode Produk (Kamera / USB)" : "Scan Barcode Produk (Perlu Aktivasi)"}
              className={`hidden lg:flex h-8 rounded-lg border items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${
                !isPro
                  ? 'px-2 gap-1 border-[#FF9B51]/40 bg-[#FFF6F0] text-[#FF9B51]'
                  : 'w-8 border-[#BFC9D1]/25 bg-white hover:bg-[#FF9B51]/10 hover:border-[#FF9B51]/50 text-[#898989] hover:text-[#FF9B51]'
              }`}
            >
              <QrCodeIcon className="w-3.5 h-3.5" />
              {!isPro && <LockClosedIcon className="w-3 h-3 text-[#FF9B51]" />}
            </button>

            {/* Mobile Cart Icon Button (Right of search) */}
            <button
              type="button"
              onClick={() => setMobileTab('cart')}
              aria-label="Buka Keranjang Kasir"
              title="Buka Keranjang Kasir"
              className="lg:hidden h-8 w-8 rounded-lg border border-[#BFC9D1]/25 bg-white hover:bg-[#EAEFEF] text-[#25343F] flex items-center justify-center relative transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <ShoppingCartIcon className="w-3.5 h-3.5 text-[#25343F]" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#FF9B51] text-white font-black text-[9px] flex items-center justify-center shadow-sm">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Active Category Indicator / FunnelIcon Dropdown */}
          {(isFilterOpen || selectedCategory !== 'SEMUA') && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-[#898989] uppercase tracking-wider mr-1">
                Kategori:
              </span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsFilterOpen(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#25343F] text-white shadow-md'
                      : 'bg-white border border-[#BFC9D1]/25 text-[#898989] hover:bg-[#EAEFEF]'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {selectedCategory !== 'SEMUA' && (
                <button
                  onClick={() => {
                    setSelectedCategory('SEMUA');
                    setIsFilterOpen(false);
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

        {/* Product Cards Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-[#898989] text-sm">Memuat katalog produk...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-[#898989] text-sm">
              Tidak ada produk yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-3">
              {filteredProducts.map(product => {
                const existingInCart = cart.find(i => i.productId === product.id);

                return (
                  <div
                    key={product.id}
                    id={`product-card-${product.id}`}
                    onClick={() => addToCart(product)}
                    className={`p-1.5 sm:p-3 rounded-xl border bg-white hover:border-[#BFC9D1] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                      existingInCart ? 'border-slate-900 ring-1 ring-slate-800/10' : 'border-[#BFC9D1]'
                    }`}
                  >
                    <div>
                      {/* Visual Thumbnail (1:1 Square Aspect Ratio) */}
                      <div className="w-full aspect-square rounded-md sm:rounded-lg overflow-hidden mb-1.5 sm:mb-2 bg-[#EAEFEF] border border-slate-100 flex items-center justify-center relative">
                        <ProductImage
                          thumbnailPath={product.thumbnailPath}
                          imagePath={product.imagePath}
                          productName={product.name}
                          size="xl"
                          className="w-full h-full object-cover"
                          rounded="rounded-md sm:rounded-lg"
                        />
                        {existingInCart && (
                          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#25343F] text-white font-black text-[9px] flex items-center justify-center shadow-sm">
                            {existingInCart.quantity}x
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-[11px] sm:text-xs text-[#25343F] group-hover:text-[#25343F] line-clamp-2 leading-tight sm:leading-snug">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-1.5 sm:mt-2 pt-1 sm:pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-[11px] sm:text-sm text-[#25343F] truncate flex items-baseline gap-0.5">
                          <span className="font-mono">{formatRupiah(product.sellingPrice)}</span>
                          <span className="text-[9px] sm:text-[10px] text-[#898989] font-medium font-sans">/{product.unit}</span>
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-[#898989] font-medium truncate">
                          HPP: <span className="font-mono">{formatRupiah(product.costPrice)}</span>
                        </div>
                      </div>

                      {/* Quantity Stepper: MinusIcon, Count, PlusIcon */}
                      {existingInCart ? (
                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              if (existingInCart.quantity <= 1) {
                                removeFromCart(product.id);
                              } else {
                                updateQuantity(product.id, existingInCart.quantity - 1);
                              }
                            }}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#EAEFEF] active:bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] flex items-center justify-center transition-colors cursor-pointer"
                            title="Kurangi jumlah"
                            aria-label="Kurangi"
                          >
                            <MinusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                          <span className="text-[10px] sm:text-xs font-black text-[#25343F] min-w-[14px] text-center font-mono">
                            {existingInCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#25343F] active:bg-[#FF9B51] text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Tambah jumlah"
                            aria-label="Tambah"
                          >
                            <PlusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-[#EAEFEF] text-[#25343F] hover:bg-[#FF9B51] hover:text-[#25343F] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                          title="Tambah ke keranjang"
                          aria-label="Tambah ke keranjang"
                        >
                          <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Cart & Checkout Panel */}
      <div className={`w-full lg:w-96 flex-col bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden shrink-0 ${
        mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
      }`}>
        {/* Mobile Back to Catalog Bar */}
        <div className="lg:hidden px-3.5 py-2.5 bg-[#25343F] text-white flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className="flex items-center gap-1 text-xs font-bold hover:text-[#25343F] transition-colors cursor-pointer"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </button>
          <span className="text-[11px] font-semibold text-slate-300">
            {cart.reduce((s, i) => s + i.quantity, 0)} item
          </span>
        </div>

        {/* Customer Selector Header */}
        <div className="p-3 sm:p-4 border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#25343F] uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[#25343F]" /> Pelanggan
            </span>
            <button
              onClick={() => setIsNewCustModalOpen(true)}
              className="text-[11px] font-semibold text-[#25343F] hover:text-[#25343F] flex items-center gap-1 cursor-pointer"
            >
              <PlusIcon className="w-3 h-3" /> Tambah Baru
            </button>
          </div>

          <select
            id="select-pos-customer"
            value={selectedCustomerId}
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
        </div>

        {/* Cart Item List */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto divide-y divide-slate-100 min-h-[160px] max-h-[40vh] lg:max-h-none">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-[#898989]">
              <ShoppingCartIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium">Keranjang masih kosong</p>
              <p className="text-[11px] text-[#898989] mt-1">
                {mobileTab === 'cart' ? (
                  <button
                    type="button"
                    onClick={() => setMobileTab('catalog')}
                    className="text-[#25343F] font-bold underline mt-2 block mx-auto cursor-pointer"
                  >
                    Buka Katalog Produk
                  </button>
                ) : (
                  'Klik item produk di sebelah kiri untuk menambahkan'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center justify-between gap-3 pt-2">
                  <ProductImage
                    thumbnailPath={item.thumbnailPath}
                    imagePath={item.imagePath}
                    productName={item.productName}
                    size="xs"
                    rounded="rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-[#25343F] truncate">{item.productName}</h5>
                    <div className="text-[11px] text-[#898989] font-mono">{formatRupiah(item.unitPrice)} / {item.unit}
                    </div>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#898989] flex items-center justify-center text-xs cursor-pointer"
                    >
                      <MinusIcon className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={e => {
                        const val = e.target.value;
                        const q = val === '' ? 0 : parseInt(val, 10);
                        updateQuantity(item.productId, isNaN(q) ? 0 : Math.max(0, q));
                      }}
                      onBlur={() => handleBlurCartQty(item.productId)}
                      className="w-10 text-center text-xs font-bold text-[#25343F] border border-[#BFC9D1]/25 rounded-md py-0.5"
                    />
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#898989] flex items-center justify-center text-xs cursor-pointer"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <div className="font-bold text-xs text-[#25343F] font-mono">{formatRupiah(item.subtotal)}</div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-[#898989] hover:text-[#c45e00] text-[10px] cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Calculation & Checkout Controls */}
        <div className="p-3 sm:p-4 border-t border-[#BFC9D1]/40 bg-[#EAEFEF]/80 space-y-3">
          <div className="space-y-1.5 text-xs text-[#898989]">
            <div className="flex justify-between">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} item):</span>
              <span className="font-bold text-[#25343F] font-mono">{formatRupiah(cartSubtotal)}</span>
            </div>

            {/* Discount Input */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[#898989]">
                <TagIcon className="w-3 h-3" /> Diskon (Rp):
              </span>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                placeholder="0"
                onChange={e => setDiscountAmount(parseInt(e.target.value, 10) || 0)}
                className="w-24 text-right px-2 py-1 bg-white border border-[#BFC9D1]/25 rounded text-xs font-semibold text-[#c45e00]"
              />
            </div>

            <div className="flex justify-between text-sm font-extrabold text-[#25343F] pt-2 border-t border-[#BFC9D1]/40">
              <span>Total Tagihan:</span>
              <span className="text-[#25343F] text-base font-mono">{formatRupiah(finalTotal)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="p-2.5 rounded-xl border border-[#BFC9D1]/25 text-[#898989] hover:text-[#c45e00] hover:bg-[#EAEFEF] disabled:opacity-40 transition-colors cursor-pointer"
              title="Kosongkan Keranjang"
            >
              <TrashIcon className="w-4 h-4" />
            </button>

            <button
              id="btn-pos-checkout"
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className="flex-1 py-3 px-4 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] disabled:bg-slate-300 text-[#25343F] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <CreditCardIcon className="w-4 h-4" />
              <span>Bayar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Mobile Cart summary bar when in catalog view and items in cart */}
      {mobileTab === 'catalog' && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-[92px] left-3 right-3 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2 drop-shadow-xl"
             style={{ bottom: 'calc(86px + env(safe-area-inset-bottom, 12px))' }}>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              clearCart();
            }}
            className="bg-[#25343F] hover:bg-[#1c2730] active:scale-95 text-white px-3.5 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer border border-white/10 shrink-0 transition-all"
            title="Batal / Kosongkan Keranjang"
          >
            <TrashIcon className="w-4 h-4 text-rose-400" />
            <span>Batal</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="flex-1 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between font-black text-xs cursor-pointer border border-[#FF9B51]/30 active:scale-[0.99] transition-transform min-w-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-5 h-5 rounded-full bg-[#25343F] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span className="truncate text-xs font-black">Lihat Keranjang</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-[#25343F] font-black font-mono text-xs">{formatRupiah(finalTotal)}</span>
              <span className="text-sm font-black">&rarr;</span>
            </div>
          </button>
        </div>
      )}

      {/* MODAL 1: Payment Checkout Dialog */}
      {isPaymentModalOpen && (
        <div id="payment-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-lg w-full p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-[#25343F]">Pembayaran Kasir</h3>
                <p className="text-xs text-[#898989]">Pelanggan: {customCustomerName}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded text-[#898989] hover:text-[#25343F]"
              >
                âœ•
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              {/* Total display */}
              <div className="p-4 bg-[#EAEFEF]/60 rounded-xl border border-[#BFC9D1]/25 text-center">
                <span className="text-xs font-bold text-[#25343F] uppercase tracking-wider">Total Tagihan</span>
                <div className="text-2xl font-black text-[#25343F] mt-0.5 font-mono">{formatRupiah(finalTotal)}</div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-[#25343F] mb-2">Metode Pembayaran</label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {(['CASH', 'TRANSFER', 'QRIS', 'OTHER'] as PaymentMethod[]).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-[#25343F] text-white border-slate-900 shadow-md'
                          : 'bg-white text-[#898989] border-[#BFC9D1] hover:bg-[#EAEFEF]'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Paid input */}
              <div>
                <label className="block text-xs font-bold text-[#25343F] mb-1.5">Nominal Diterima (Rp)</label>
                <input
                  id="input-pos-amount-paid"
                  type="number"
                  min="0"
                  value={amountPaid || ''}
                  onChange={e => setAmountPaid(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-white border border-[#BFC9D1]/25 rounded-xl text-lg font-bold text-[#25343F] focus:outline-hidden focus:border-[#BFC9D1]"
                />

                {/* Quick Nominal Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setQuickNominal(finalTotal)}
                    className="px-2.5 py-1 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] text-xs font-semibold cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  {[10000, 20000, 50000, 100000, 200000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQuickNominal(val)}
                      className="px-2.5 py-1 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] text-xs font-semibold cursor-pointer font-mono"
                    >{formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change / Kembalian Calculation */}
              <div className="p-3.5 rounded-xl border border-[#BFC9D1]/25 bg-[#EAEFEF] flex items-center justify-between">
                <span className="text-xs font-bold text-[#898989]">Kembalian:</span>
                <span
                  className={`text-lg font-black ${
                    amountPaid < finalTotal ? 'text-[#c45e00]' : 'text-[#25343F]'
                  }`}
                >
                  {amountPaid < finalTotal
                    ? `Kurang ${formatRupiah(finalTotal - amountPaid)}`
                    : formatRupiah(changeAmount)}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[#898989] mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={transactionNotes}
                  onChange={e => setTransactionNotes(e.target.value)}
                  placeholder="Contoh: Titip cetak amplop, dll"
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl text-xs text-[#25343F]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#BFC9D1]/25 text-[#25343F] text-xs font-semibold hover:bg-[#EAEFEF] cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-pos-payment"
                type="button"
                disabled={isProcessing || amountPaid < finalTotal}
                onClick={handleCompleteTransaction}
                className="px-6 py-2.5 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] disabled:bg-slate-300 text-[#25343F] text-xs font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {isProcessing ? 'Menyimpan...' : 'Selesaikan Transaksi & Cetak Struk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Customer Quick Modal */}
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

      {/* Printable Thermal DocumentTextIcon Modal */}
      <PrintReceiptModal
        isOpen={isReceiptModalOpen}
        transaction={completedTransaction}
        settings={settings}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanned={handleBarcodeScan}
        stayOpenAfterScan={false}
      />

      {/* Barcode Feature Locked Modal */}
      {isBarcodeLockedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/40 max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FF9B51]/10 border border-[#FF9B51]/20 flex items-center justify-center mx-auto text-[#FF9B51]">
              <LockClosedIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#25343F]">Fitur Scan Barcode</h3>
              <p className="text-xs font-bold text-[#FF9B51] mt-0.5">Memerlukan Lisensi Pro</p>
              <p className="text-xs text-[#898989] mt-2 leading-relaxed">
                Pemindaian barcode produk fisik (kamera & scanner USB/Bluetooth) hanya tersedia untuk pengguna yang telah melakukan aktivasi.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsBarcodeLockedModalOpen(false);
                  if (onNavigate) onNavigate('activation');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FF9B51] hover:bg-[#e8894a] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#FF9B51]/25 active:scale-95 transition-all cursor-pointer"
              >
                <StarIcon className="w-3.5 h-3.5" />
                <span>Aktivasi Lisensi Sekarang</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBarcodeLockedModalOpen(false)}
                className="w-full py-2 px-4 rounded-xl bg-[#EAEFEF] hover:bg-[#dce4e8] text-[#25343F] font-semibold text-xs active:scale-95 transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING BARCODE SCANNER BUTTON (FAB) ON MOBILE ── */}
      {mobileTab === 'catalog' && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 lg:hidden pointer-events-auto animate-fade-in">
          <button
            type="button"
            onClick={() => {
              if (!isPro) {
                setIsBarcodeLockedModalOpen(true);
                return;
              }
              setIsScannerOpen(true);
            }}
            aria-label={isPro ? "Scan Barcode Produk" : "Scan Barcode Produk (Terkunci)"}
            className={`h-11 px-5 rounded-full flex items-center justify-center gap-2 font-black text-xs shadow-xl active:scale-95 transition-all cursor-pointer border ${
              !isPro
                ? 'bg-[#25343F] text-white border-[#FF9B51]/50 shadow-[#25343F]/35'
                : 'bg-[#25343F] text-white border-white/25 hover:bg-[#1b2730] shadow-lg shadow-[#25343F]/40'
            }`}
          >
            <QrCodeIcon className="w-4 h-4 text-[#FF9B51]" />
            <span>Scan Barcode</span>
            {!isPro && (
              <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-[#FF9B51] text-[#25343F]">
                PRO
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
