import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckCircleIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon,
  ArrowLeftIcon,
  ReceiptRefundIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { Transaction, Order, BusinessSettings } from '../types';
import { formatRupiah, formatDate, formatDateTime, getStatusBadgeClass, formatPaymentStatus, formatOrderStatus } from '../lib/utils';
import { useToast } from '../components/Toast';
import { PrintReceiptModal } from '../components/PrintReceiptModal';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal';
import { RefundConfirmationModal } from '../components/RefundConfirmationModal';

interface InvoicesViewProps {
  settings: BusinessSettings;
  onNavigate?: (view: any) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ settings, onNavigate }) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'receipts' | 'invoices'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modals
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Refund Modal
  const [selectedRefundTrx, setSelectedRefundTrx] = useState<Transaction | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trxList, orderList] = await Promise.all([api.getTransactions(), api.getOrders()]);
      setTransactions(trxList);
      setOrders(orderList);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat arsip transaksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => {
      api.getTransactions().then(t => setTransactions(t)).catch(() => {});
      api.getOrders().then(o => setOrders(o)).catch(() => {});
    };
    window.addEventListener('sukunaru:sync_completed', handleRefresh);
    window.addEventListener('sukunaru:data_mutation', handleRefresh);
    return () => {
      window.removeEventListener('sukunaru:sync_completed', handleRefresh);
      window.removeEventListener('sukunaru:data_mutation', handleRefresh);
    };
  }, []);

  const handleRefundConfirm = async (reason: string) => {
    if (!selectedRefundTrx) return;
    try {
      const res = await api.refundTransaction(selectedRefundTrx.id, reason);
      showToast(res.message || 'Transaksi berhasil dibatalkan dan stok dikembalikan.', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membatalkan transaksi.', 'error');
      throw err;
    }
  };

  const filteredTransactions = transactions.filter(
    t =>
      t.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredOrders = orders.filter(
    o =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combined sorted list for 'all' mode
  const combinedHistory = [
    ...filteredTransactions.map(t => ({
      kind: 'receipt' as const,
      id: t.id,
      code: t.receiptNumber,
      customerName: t.customerName,
      date: t.date,
      createdAt: t.createdAt || t.date,
      amount: t.totalAmount,
      profit: t.profit,
      paymentMethod: t.paymentMethod,
      isRefunded: t.status === 'REFUNDED' || t.status === 'CANCELLED',
      items: t.items.map(i => `${i.productName}(${i.quantity})`).join(' · '),
      rawTransaction: t,
    })),
    ...filteredOrders.map(o => ({
      kind: 'invoice' as const,
      id: o.id,
      code: o.orderNumber,
      customerName: o.customerName,
      date: o.orderDate,
      createdAt: o.createdAt || o.orderDate,
      amount: o.totalAmount,
      profit: o.totalAmount - (o.totalCost || 0),
      paymentMethod: o.paymentStatus,
      status: o.status,
      isRefunded: o.status === 'BATAL',
      items: o.items.map(i => `${i.productName}(${i.quantity})`).join(' · '),
      rawOrder: o,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handlePrintReceipt = (trx: Transaction) => {
    setSelectedTransaction(trx);
    setIsReceiptModalOpen(true);
  };

  const handlePrintInvoice = (order: Order) => {
    setSelectedOrder(order);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenRefund = (trx: Transaction) => {
    setSelectedRefundTrx(trx);
    setIsRefundModalOpen(true);
  };

  return (
    <div id="invoices-view" className="space-y-3.5 max-w-7xl mx-auto pb-24">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 space-y-2">
        {/* Row 1: Header + Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
                Riwayat Transaksi
              </h1>
              <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
                Arsip cetak ulang nota kasir POS, pembatalan/refund &amp; invoice pesanan
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
              title="Cari Transaksi"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>

            {/* Filter Button */}
            <div className="relative shrink-0">
              <button
                type="button"
                id="btn-filter-transaction-type"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="h-9 px-2.5 rounded-xl border border-[#BFC9D1]/25 bg-white hover:bg-[#EAEFEF] text-[#25343F] flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                title="Filter Tipe Transaksi"
                aria-label="Filter Tipe Transaksi"
              >
                <FunnelIcon className="w-3.5 h-3.5 text-[#898989]" />
                <span className="text-[#25343F] text-xs hidden sm:inline">
                  {activeTab === 'all'
                    ? `Semua (${transactions.length + orders.length})`
                    : activeTab === 'receipts'
                    ? `Struk POS (${transactions.length})`
                    : `Invoice (${orders.length})`}
                </span>
              </button>

              {/* FunnelIcon Dropdown Popover */}
              {isFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsFilterOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl border border-[#BFC9D1]/25 shadow-xl p-2 z-30 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1 text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                      Pilih Tipe Transaksi
                    </div>

                    {/* Option: Semua Transaksi */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('all');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        activeTab === 'all'
                          ? 'bg-[#25343F] text-white'
                          : 'text-[#25343F] hover:bg-[#EAEFEF]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-3.5 h-3.5" />
                        <span>Semua Transaksi</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                        activeTab === 'all' ? 'bg-[#FF9B51] text-[#25343F]' : 'bg-[#EAEFEF] text-[#898989]'
                      }`}>
                        {transactions.length + orders.length}
                      </span>
                    </button>

                    {/* Option: Struk POS */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('receipts');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        activeTab === 'receipts'
                          ? 'bg-[#25343F] text-white'
                          : 'text-[#25343F] hover:bg-[#EAEFEF]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-3.5 h-3.5" />
                        <span>Struk Kasir (POS)</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                        activeTab === 'receipts' ? 'bg-[#FF9B51] text-[#25343F]' : 'bg-[#EAEFEF] text-[#898989]'
                      }`}>
                        {transactions.length}
                      </span>
                    </button>

                    {/* Option: Invoice Pesanan */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('invoices');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        activeTab === 'invoices'
                          ? 'bg-[#25343F] text-white'
                          : 'text-[#25343F] hover:bg-[#EAEFEF]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-3.5 h-3.5" />
                        <span>Invoice Pesanan</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                        activeTab === 'invoices' ? 'bg-[#FF9B51] text-[#25343F]' : 'bg-[#EAEFEF] text-[#898989]'
                      }`}>
                        {orders.length}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
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
              placeholder={activeTab === 'receipts' ? "Cari nomor struk, nama pelanggan..." : "Cari nomor order, pemesan..."}
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

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
        {activeTab === 'all' ? (
          /* Semua Transaksi Gabungan */
          loading ? (
            <div className="space-y-3 p-4">
              {[1,2,3].map(n => (
                <div key={n} className="animate-pulse flex gap-3 items-center py-2">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-[#EAEFEF] rounded w-1/3" />
                    <div className="h-3 bg-[#EAEFEF] rounded w-1/2" />
                  </div>
                  <div className="h-5 w-20 bg-[#EAEFEF] rounded" />
                </div>
              ))}
            </div>
          ) : combinedHistory.length === 0 ? (
            <div className="text-center py-16 text-[#898989]">
              <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#25343F]">Belum ada riwayat transaksi</p>
              <p className="text-xs text-[#898989] mt-1">Transaksi kasir dan pesanan baru akan muncul di sini.</p>
            </div>
          ) : (
            <>
              {/* MOBILE: Combined List */}
              <div className="md:hidden divide-y divide-slate-100">
                {combinedHistory.map(item => (
                  <div key={item.id} className={`px-4 py-3.5 space-y-1.5 ${item.isRefunded ? 'bg-rose-50/40 opacity-80' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#EAEFEF] text-[#25343F]">
                            {item.kind === 'receipt' ? 'KASIR' : 'PESANAN'}
                          </span>
                          <span className="font-black text-[13px] text-[#25343F] font-mono">{item.code}</span>
                          {item.isRefunded && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                              Dibatalkan
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#898989] font-medium mt-0.5">{item.customerName}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-black text-sm font-mono ${item.isRefunded ? 'text-[#898989] line-through' : 'text-[#25343F]'}`}>
                          {formatRupiah(item.amount)}
                        </div>
                        {item.kind === 'receipt' ? (
                          !item.isRefunded && (
                            <div className="text-[10px] text-emerald-700 font-bold">+{formatRupiah(item.profit)} profit</div>
                          )
                        ) : (
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${getStatusBadgeClass(item.paymentMethod || '')}`}>
                            {formatPaymentStatus(item.paymentMethod)}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.items && (
                      <div className="text-[10px] text-[#898989] truncate">
                        {item.items}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[#898989]">{formatDate(item.date)}</span>
                      <div className="flex items-center gap-1.5">
                        {item.kind === 'receipt' ? (
                          <>
                            {!item.isRefunded && (
                              <button
                                onClick={() => handleOpenRefund(item.rawTransaction)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] transition-colors cursor-pointer"
                                title="Batalkan / Refund Transaksi"
                              >
                                <ReceiptRefundIcon className="w-3 h-3 stroke-[2]" />
                                Refund
                              </button>
                            )}
                            <button
                              onClick={() => handlePrintReceipt(item.rawTransaction)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              <PrinterIcon className="w-3 h-3" />
                              Struk
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handlePrintInvoice(item.rawOrder)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <PrinterIcon className="w-3 h-3" />
                            Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP: Combined Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/80 text-[#898989] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Tipe</th>
                      <th className="py-3.5 px-4">No. Bukti</th>
                      <th className="py-3.5 px-4">Tanggal</th>
                      <th className="py-3.5 px-4">Pelanggan</th>
                      <th className="py-3.5 px-4">Item / Keterangan</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Nilai Transaksi</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {combinedHistory.map(item => (
                      <tr key={item.id} className={`hover:bg-[#EAEFEF]/60 transition-colors ${item.isRefunded ? 'bg-rose-50/20 text-[#898989]' : ''}`}>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25">
                            <DocumentTextIcon className="w-3 h-3" />
                            {item.kind === 'receipt' ? 'Struk POS' : 'Invoice'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-[#25343F]">{item.code}</td>
                        <td className="py-3 px-4 text-[#898989] whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3 px-4 font-bold text-[#25343F]">{item.customerName}</td>
                        <td className="py-3 px-4 max-w-xs text-[#898989] truncate">{item.items}</td>
                        <td className="py-3 px-4">
                          {item.isRefunded ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                              Dibatalkan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Sukses
                            </span>
                          )}
                        </td>
                        <td className={`py-3 px-4 text-right font-black font-mono ${item.isRefunded ? 'text-[#898989] line-through' : 'text-[#25343F]'}`}>
                          {formatRupiah(item.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.kind === 'receipt' ? (
                              <>
                                {!item.isRefunded && (
                                  <button
                                    onClick={() => handleOpenRefund(item.rawTransaction)}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Batalkan / Refund Transaksi"
                                  >
                                    <ReceiptRefundIcon className="w-3.5 h-3.5 stroke-[2]" />
                                    <span>Refund</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handlePrintReceipt(item.rawTransaction)}
                                  className="px-3 py-1.5 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <PrinterIcon className="w-3.5 h-3.5" /><span>Struk</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handlePrintInvoice(item.rawOrder)}
                                className="px-3 py-1.5 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <PrinterIcon className="w-3.5 h-3.5" /><span>Invoice</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : activeTab === 'receipts' ? (
          /* Struk POS */
          loading ? (
            <div className="space-y-3 p-4">
              {[1,2,3].map(n => (
                <div key={n} className="animate-pulse flex gap-3 items-center py-2">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-[#EAEFEF] rounded w-1/3" />
                    <div className="h-3 bg-[#EAEFEF] rounded w-1/2" />
                  </div>
                  <div className="h-5 w-20 bg-[#EAEFEF] rounded" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16 text-[#898989]">
              <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#25343F]">Belum ada struk kasir</p>
              <p className="text-xs text-[#898989] mt-1">Lakukan transaksi di Kasir POS untuk mencetak struk.</p>
            </div>
          ) : (
            <>
              {/* ── MOBILE: Compact DocumentTextIcon List ── */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredTransactions.map(trx => {
                  const isRefunded = trx.status === 'REFUNDED' || trx.status === 'CANCELLED';
                  return (
                    <div key={trx.id} className={`px-4 py-3.5 ${isRefunded ? 'bg-rose-50/40 opacity-80' : ''}`}>
                      {/* Row 1: DocumentTextIcon No + Amount */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-[13px] text-[#25343F] font-mono">{trx.receiptNumber}</span>
                            {isRefunded && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                                Dibatalkan
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#898989] font-medium">{trx.customerName}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-black text-sm font-mono ${isRefunded ? 'text-[#898989] line-through' : 'text-[#25343F]'}`}>
                            {formatRupiah(trx.totalAmount)}
                          </div>
                          {!isRefunded && (
                            <div className="text-[10px] text-emerald-700 font-bold">+{formatRupiah(trx.profit)} profit</div>
                          )}
                        </div>
                      </div>
                      {/* Row 2: Items + meta */}
                      <div className="text-[10px] text-[#898989] truncate mb-2">
                        {trx.items.map(i => `${i.productName}(${i.quantity})`).join(' · ')}
                      </div>
                      {/* Row 3: Date + payment + actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#898989]">{formatDate(trx.date)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAEFEF] text-[#898989] font-medium">{trx.paymentMethod}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!isRefunded && (
                            <button
                              onClick={() => handleOpenRefund(trx)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Batalkan / Refund Transaksi"
                            >
                              <ReceiptRefundIcon className="w-3 h-3 stroke-[2]" />
                              Refund
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintReceipt(trx)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <PrinterIcon className="w-3 h-3" />
                            Struk
                          </button>
                        </div>
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
                      <th className="py-3.5 px-4">No. Struk</th>
                      <th className="py-3.5 px-4">Waktu Transaksi</th>
                      <th className="py-3.5 px-4">Pelanggan</th>
                      <th className="py-3.5 px-4">Item Terjual</th>
                      <th className="py-3.5 px-4">Metode Bayar</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                      <th className="py-3.5 px-4 text-right">Profit Bersih</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map(trx => {
                      const isRefunded = trx.status === 'REFUNDED' || trx.status === 'CANCELLED';
                      return (
                        <tr key={trx.id} className={`hover:bg-[#EAEFEF]/60 transition-colors ${isRefunded ? 'bg-rose-50/20 text-[#898989]' : ''}`}>
                          <td className="py-3 px-4 font-mono font-extrabold text-[#25343F]">{trx.receiptNumber}</td>
                          <td className="py-3 px-4 text-[#898989] whitespace-nowrap">{formatDateTime(trx.createdAt || trx.date)}</td>
                          <td className="py-3 px-4 font-bold text-[#25343F]">{trx.customerName}</td>
                          <td className="py-3 px-4 max-w-xs text-[#898989] truncate">{trx.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#898989]">{trx.paymentMethod}</td>
                          <td className="py-3 px-4">
                            {isRefunded ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                Dibatalkan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Sukses
                              </span>
                            )}
                          </td>
                          <td className={`py-3 px-4 text-right font-black font-mono ${isRefunded ? 'text-[#898989] line-through' : 'text-[#25343F]'}`}>
                            {formatRupiah(trx.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#25343F]">
                            {isRefunded ? '-' : `+${formatRupiah(trx.profit)}`}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isRefunded && (
                                <button
                                  onClick={() => handleOpenRefund(trx)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Batalkan / Refund Transaksi"
                                >
                                  <ReceiptRefundIcon className="w-3.5 h-3.5 stroke-[2]" />
                                  <span>Refund</span>
                                </button>
                              )}
                              <button
                                onClick={() => handlePrintReceipt(trx)}
                                className="px-3 py-1.5 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <PrinterIcon className="w-3.5 h-3.5" /><span>Struk</span>
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
          )
        ) : (
          /* Faktur Orders */
          loading ? (
            <div className="space-y-3 p-4">
              {[1,2,3].map(n => (
                <div key={n} className="animate-pulse flex gap-3 items-center py-2">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-[#EAEFEF] rounded w-1/3" />
                    <div className="h-3 bg-[#EAEFEF] rounded w-1/2" />
                  </div>
                  <div className="h-5 w-24 bg-[#EAEFEF] rounded" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-[#898989]">
              <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#25343F]">Belum ada invoice pesanan</p>
            </div>
          ) : (
            <>
              {/* ── MOBILE: Compact Invoice Card List ── */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredOrders.map(order => (
                  <div key={order.id} className={`px-4 py-3.5 ${order.status === 'BATAL' ? 'bg-rose-50/40 opacity-80' : ''}`}>
                    {/* Row 1: Order No + Amount */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-[13px] text-[#25343F] font-mono">{order.orderNumber}</span>
                          {order.status === 'BATAL' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                              Dibatalkan
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#898989] font-medium">{order.customerName}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-black text-sm font-mono ${order.status === 'BATAL' ? 'text-[#898989] line-through' : 'text-[#25343F]'}`}>
                          {formatRupiah(order.totalAmount)}
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getStatusBadgeClass(order.paymentStatus)}`}>
                          {formatPaymentStatus(order.paymentStatus)}
                        </span>
                      </div>
                    </div>
                    {/* Row 2: Date + status + print */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#898989]">{formatDate(order.orderDate)}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getStatusBadgeClass(order.status)}`}>
                          {formatOrderStatus(order.status)}
                        </span>
                      </div>
                      <button
                        onClick={() => handlePrintInvoice(order)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <PrinterIcon className="w-3 h-3" />
                        Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── DESKTOP: Full Table ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/80 text-[#898989] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">No. Invoice / SPK</th>
                      <th className="py-3.5 px-4">Tanggal Pesanan</th>
                      <th className="py-3.5 px-4">Nama Pemesan</th>
                      <th className="py-3.5 px-4">Status Produksi</th>
                      <th className="py-3.5 px-4 text-center">Status Pembayaran</th>
                      <th className="py-3.5 px-4 text-right">Nilai Faktur</th>
                      <th className="py-3.5 px-4 text-center">Cetak Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map(order => (
                      <tr key={order.id} className={`hover:bg-[#EAEFEF]/60 transition-colors ${order.status === 'BATAL' ? 'bg-rose-50/20 text-[#898989]' : ''}`}>
                        <td className="py-3 px-4 font-mono font-extrabold text-[#25343F]">{order.orderNumber}</td>
                        <td className="py-3 px-4 text-[#898989] whitespace-nowrap">{formatDate(order.orderDate)}</td>
                        <td className="py-3 px-4 font-bold text-[#25343F]">{order.customerName}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(order.status)}`}>
                            {formatOrderStatus(order.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(order.paymentStatus)}`}>
                            {formatPaymentStatus(order.paymentStatus)}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-black font-mono ${order.status === 'BATAL' ? 'text-[#898989] line-through' : 'text-[#25343F]'}`}>
                          {formatRupiah(order.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => handlePrintInvoice(order)} className="px-3 py-1.5 rounded-lg bg-[#EAEFEF] hover:bg-[#EAEFEF] text-[#25343F] font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer">
                            <PrinterIcon className="w-3.5 h-3.5" /><span>Invoice / SPK</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </div>

      {/* Printable Modals */}
      <PrintReceiptModal
        isOpen={isReceiptModalOpen}
        transaction={selectedTransaction}
        settings={settings}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      <PrintInvoiceModal
        isOpen={isInvoiceModalOpen}
        order={selectedOrder}
        settings={settings}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      {/* Refund Confirmation Modal */}
      <RefundConfirmationModal
        isOpen={isRefundModalOpen}
        transaction={selectedRefundTrx}
        onConfirm={handleRefundConfirm}
        onClose={() => {
          setIsRefundModalOpen(false);
          setSelectedRefundTrx(null);
        }}
      />
    </div>
  );
};
