import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, UserIcon, CubeIcon, ShoppingCartIcon, DocumentTextIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { Customer, Product, Order, Transaction, ViewType } from '../types';
import { formatRupiah, formatDate } from '../lib/utils';
import { ProductImage } from './ProductImage';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: ViewType, recordId?: string) => void;
  onSelectResult?: (view: ViewType, recordId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    customers: Customer[];
    products: Product[];
    orders: Order[];
    transactions: Transaction[];
  }>({
    customers: [],
    products: [],
    orders: [],
    transactions: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const handleItemClick = (view: ViewType, recordId?: string) => {
    if (typeof onNavigate === 'function') {
      onNavigate(view, recordId);
    }
    if (typeof onSelectResult === 'function') {
      onSelectResult(view, recordId);
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({ customers: [], products: [], orders: [], transactions: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ customers: [], products: [], orders: [], transactions: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query);
        setResults(res);
      } catch (err) {
        console.error('MagnifyingGlassIcon error', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.customers.length +
    results.products.length +
    results.orders.length +
    results.transactions.length;

  return (
    <div
      id="global-search-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="global-search-card"
        className="bg-white rounded-xl shadow-2xl border border-[#BFC9D1]/25 w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* MagnifyingGlassIcon Input */}
        <div className="p-3.5 border-b border-[#BFC9D1]/40 flex items-center gap-3 bg-white">
          <MagnifyingGlassIcon className="w-4 h-4 text-[#898989] shrink-0" />
          <input
            id="input-global-search-modal"
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari pelanggan, produk, pesanan, atau struk..."
            className="w-full bg-transparent text-[#25343F] placeholder-zinc-400 text-sm focus:outline-hidden font-normal"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-[#898989] hover:text-zinc-600 cursor-pointer"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#898989] bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded">
            ESC
          </kbd>
        </div>

        {/* MagnifyingGlassIcon Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3.5">
          {loading && (
            <div className="text-center py-8 text-[#898989] text-xs">Mencari data...</div>
          )}

          {!loading && query && totalResults === 0 && (
            <div className="text-center py-8 text-[#898989] text-xs">
              Tidak ditemukan data yang cocok dengan &quot;{query}&quot;
            </div>
          )}

          {!query && (
            <div className="text-center py-8 text-[#898989] text-xs">
              Ketik kata kunci untuk mencari pelanggan, produk, pesanan, atau transaksi kasir.
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#898989] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> Pelanggan ({results.customers.length})
              </div>
              <div className="space-y-1.5">
                {results.customers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleItemClick('customers', c.id)}
                    className="p-2.5 rounded-lg border border-zinc-100 hover:border-[#BFC9D1] hover:bg-[#EAEFEF] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-[#25343F]">{c.name}</div>
                      <div className="text-[11px] text-[#898989]">{c.whatsapp || 'Tanpa No. WA'} • {c.totalOrders || 0} pesanan</div>
                    </div>
                    <ArrowRightIcon className="w-3.5 h-3.5 text-[#898989]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#898989] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CubeIcon className="w-3.5 h-3.5" /> Produk & Layanan ({results.products.length})
              </div>
              <div className="space-y-1.5">
                {results.products.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleItemClick('products', p.id)}
                    className="p-2.5 rounded-lg border border-zinc-100 hover:border-[#BFC9D1] hover:bg-[#EAEFEF] flex items-center justify-between cursor-pointer transition-colors gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProductImage
                        thumbnailPath={p.thumbnailPath}
                        imagePath={p.imagePath}
                        productName={p.name}
                        size="xs"
                        rounded="rounded-md"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-[#25343F] truncate">{p.name}</div>
                        <div className="text-[11px] text-[#898989]">{p.category} • HPP: <span className="font-mono">{formatRupiah(p.costPrice)}</span></div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-[#25343F] font-mono">{formatRupiah(p.sellingPrice)}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAEFEF] text-zinc-600 font-medium uppercase">
                        {p.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {results.orders.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#898989] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShoppingCartIcon className="w-3.5 h-3.5" /> Pesanan ({results.orders.length})
              </div>
              <div className="space-y-1.5">
                {results.orders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => handleItemClick('orders', o.id)}
                    className="p-2.5 rounded-lg border border-zinc-100 hover:border-[#BFC9D1] hover:bg-[#EAEFEF] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#25343F]">{o.orderNumber}</span>
                        <span className="text-xs font-semibold text-zinc-600">({o.customerName})</span>
                      </div>
                      <div className="text-[11px] text-[#898989] mt-0.5">
                        Deadline: {formatDate(o.deadlineDate)} • Status: <span className="font-semibold uppercase">{o.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs text-[#25343F] font-mono">{formatRupiah(o.totalAmount)}</div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EAEFEF] text-zinc-700">
                        {o.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          {results.transactions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#898989] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DocumentTextIcon className="w-3.5 h-3.5" /> Transaksi Kasir ({results.transactions.length})
              </div>
              <div className="space-y-1.5">
                {results.transactions.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleItemClick('invoices', t.id)}
                    className="p-2.5 rounded-lg border border-zinc-100 hover:border-[#BFC9D1] hover:bg-[#EAEFEF] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#25343F]">{t.receiptNumber}</div>
                      <div className="text-[11px] text-[#898989]">{t.customerName} • {formatDate(t.date)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs text-[#25343F] font-mono">{formatRupiah(t.totalAmount)}</div>
                      <span className="text-[10px] text-[#898989]">{t.paymentMethod}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
