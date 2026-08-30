import React, { useState, useEffect } from 'react';
import { UsersIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon, ChatBubbleLeftEllipsisIcon, PhoneIcon, MapPinIcon, DocumentTextIcon, ShoppingBagIcon, CurrencyDollarIcon, PencilSquareIcon, TrashIcon, ArrowTopRightOnSquareIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { Customer, Order } from '../types';
import { formatRupiah, formatDate } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface CustomersViewProps {
  targetCustomerId?: string;
  onNavigateToOrder?: (orderId: string) => void;
  onNavigate?: (view: any) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  targetCustomerId,
  onNavigateToOrder,
  onNavigate,
}) => {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Selected customer for detail
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Add / PencilSquareIcon Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    address: '',
    notes: '',
  });

  // Delete Confirm
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [custList, orderList] = await Promise.all([api.getCustomers(), api.getOrders()]);
      setCustomers(custList);
      setOrders(orderList);

      if (targetCustomerId) {
        const found = custList.find(c => c.id === targetCustomerId);
        if (found) {
          setSelectedCustomer(found);
          setIsDetailModalOpen(true);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat pelanggan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetCustomerId]);

  const filteredCustomers = customers.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.whatsapp.includes(searchQuery) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', whatsapp: '', address: '', notes: '' });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      whatsapp: customer.whatsapp || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setIsFormModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Nama pelanggan wajib diisi', 'error');
      return;
    }

    try {
      if (editingCustomer) {
        const updated = await api.updateCustomer(editingCustomer.id, formData);
        setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
        if (selectedCustomer?.id === updated.id) setSelectedCustomer(updated);
        showToast('Data pelanggan berhasil diperbarui', 'success');
      } else {
        const created = await api.createCustomer(formData);
        setCustomers(prev => [created, ...prev]);
        showToast('Pelanggan baru berhasil ditambahkan', 'success');
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pelanggan', 'error');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      await api.deleteCustomer(customerToDelete.id);
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
      if (selectedCustomer?.id === customerToDelete.id) setIsDetailModalOpen(false);
      showToast('Pelanggan berhasil dihapus', 'success');
      setCustomerToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pelanggan', 'error');
    }
  };

  const getWhatsAppLink = (phone: string) => {
    if (!phone) return '#';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  const customerOrders = selectedCustomer
    ? orders.filter(
        o =>
          o.customerId === selectedCustomer.id ||
          o.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  return (
    <div id="customers-view" className="space-y-3.5 max-w-7xl mx-auto pb-24 md:pb-12">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 space-y-2">
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
                Pelanggan
              </h1>
              <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
                Database & riwayat kontak pelanggan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Search Toggle Icon Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
                isSearchOpen || searchQuery
                  ? 'bg-[#25343F] text-white border-slate-900'
                  : 'bg-white hover:bg-[#EAEFEF] border-[#BFC9D1]/25 text-[#25343F]'
              }`}
              title="Cari Pelanggan"
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
              id="input-customers-search"
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama pelanggan, no. WhatsApp, alamat..."
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


      {/* Customers Cards / Table Container */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-[#898989] text-sm">Memuat data pelanggan...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-[#898989]">
            <UsersIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#25343F]">Belum ada data pelanggan</p>
            <p className="text-xs text-[#898989] mt-1">Tambahkan pelanggan untuk mencatat riwayat transaksi.</p>
          </div>
        ) : (
          <>
            {/* ── MOBILE: Compact Touch Card List (md:hidden) ── */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  className="p-3 space-y-2 hover:bg-[#EAEFEF]/50 transition-colors"
                >
                  {/* Row 1: Avatar / Name + Total Spent */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-[#EAEFEF] border border-[#BFC9D1]/25 flex items-center justify-center text-[#25343F] font-bold text-xs shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-[#25343F] leading-tight truncate">
                          {customer.name}
                        </h4>
                        <div className="text-[9.5px] text-[#898989]">
                          Terdaftar: {formatDate(customer.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-[#25343F] leading-tight font-mono">
                        {formatRupiah(customer.totalSpent || 0)}
                      </div>
                      <div className="text-[9.5px] text-[#25343F] font-semibold">
                        {customer.totalOrders || 0} order
                      </div>
                    </div>
                  </div>

                  {/* Row 2: WhatsApp & Address / Notes */}
                  <div className="space-y-1 text-xs">
                    {/* WhatsApp */}
                    {customer.whatsapp ? (
                      <div>
                        <a
                          href={getWhatsAppLink(customer.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EAEFEF] text-[#25343F] hover:bg-[#BFC9D1]/40 font-semibold border border-[#BFC9D1]/25 text-[10px] transition-colors"
                        >
                          <ChatBubbleLeftEllipsisIcon className="w-3 h-3 text-[#25343F]" />
                          <span>{customer.whatsapp}</span>
                        </a>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#898989] italic">Tanpa nomor WhatsApp</div>
                    )}

                    {/* Address & Notes */}
                    {(customer.address || customer.notes) && (
                      <div className="px-2 py-1 rounded-md bg-[#EAEFEF] border border-slate-100 text-[10px] space-y-0.5">
                        {customer.address && (
                          <div className="flex items-start gap-1 text-[#25343F]">
                            <MapPinIcon className="w-2.5 h-2.5 text-[#898989] shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{customer.address}</span>
                          </div>
                        )}
                        {customer.notes && (
                          <div className="flex items-start gap-1 text-[#898989] italic">
                            <DocumentTextIcon className="w-2.5 h-2.5 text-[#898989] shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{customer.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Row 3: Action Buttons */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsDetailModalOpen(true);
                      }}
                      className="flex-1 h-7 px-2.5 rounded-lg bg-[#EAEFEF] hover:bg-[#BFC9D1]/40 text-[#25343F] font-bold border border-[#BFC9D1]/25 flex items-center justify-center gap-1 text-[11px] transition-colors cursor-pointer"
                    >
                      <DocumentTextIcon className="w-3 h-3" />
                      <span>Riwayat Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(customer)}
                      className="h-7 px-2.5 rounded-lg border border-[#BFC9D1]/25 text-[#25343F] hover:bg-[#EAEFEF] flex items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <PencilSquareIcon className="w-3 h-3 text-[#898989]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerToDelete(customer)}
                      className="h-7 w-7 rounded-lg border border-[#FF9B51]/40 text-[#c45e00] hover:bg-[#FF9B51]/8 flex items-center justify-center text-[11px] transition-colors cursor-pointer shrink-0"
                      title="Hapus Pelanggan"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── DESKTOP: Full Table (hidden md:block) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/80 text-[#898989] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Nama Pelanggan</th>
                    <th className="py-3.5 px-4">WhatsApp & Kontak</th>
                    <th className="py-3.5 px-4">Alamat & Catatan</th>
                    <th className="py-3.5 px-4 text-center">Total Pesanan</th>
                    <th className="py-3.5 px-4 text-right">Total Belanja</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-[#EAEFEF]/60 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#25343F] text-sm">{customer.name}</div>
                        <div className="text-[11px] text-[#898989]">
                          Terdaftar: {formatDate(customer.createdAt)}
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3 px-4">
                        {customer.whatsapp ? (
                          <a
                            href={getWhatsAppLink(customer.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAEFEF] text-[#25343F] hover:bg-[#EAEFEF] font-semibold border border-[#BFC9D1]/25 transition-colors"
                          >
                            <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5 text-[#25343F]" />
                            <span>{customer.whatsapp}</span>
                          </a>
                        ) : (
                          <span className="text-[#898989] italic">Tanpa nomor</span>
                        )}
                      </td>

                      {/* Address & Notes */}
                      <td className="py-3 px-4 max-w-xs">
                        {customer.address ? (
                          <div className="text-[#25343F] truncate">{customer.address}</div>
                        ) : (
                          <span className="text-[#898989]">-</span>
                        )}
                        {customer.notes && (
                          <div className="text-[11px] text-[#898989] mt-0.5 truncate">
                            {customer.notes}
                          </div>
                        )}
                      </td>

                      {/* Orders count */}
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-[#EAEFEF] text-[#25343F] font-bold">
                          {customer.totalOrders || 0} order
                        </span>
                      </td>

                      {/* Total spent */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-extrabold text-[#25343F] font-mono">{formatRupiah(customer.totalSpent || 0)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#25343F] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 cursor-pointer"
                            title="Lihat Riwayat Transaksi"
                          >
                            <DocumentTextIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1.5 rounded-lg text-[#898989] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 cursor-pointer"
                            title="Edit Pelanggan"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCustomerToDelete(customer)}
                            className="p-1.5 rounded-lg text-[#c45e00] hover:bg-[#FF9B51]/8 border border-[#FF9B51]/40 cursor-pointer"
                            title="Hapus Pelanggan"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: Add / PencilSquareIcon Customer */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-md w-full p-6">
            <h3 className="font-bold text-base text-[#25343F] mb-3">
              {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
            </h3>
            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#25343F] mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Alamat Pengiriman / Domisili</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Melati No. 12, Malang..."
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Pelanggan langganan sticker kemasan"
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-[#BFC9D1]/25 text-[#898989] font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Customer Detail & Order History */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-2xl w-full p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#BFC9D1]/40">
              <div>
                <h3 className="font-bold text-lg text-[#25343F]">{selectedCustomer.name}</h3>
                <p className="text-xs text-[#898989]">Profil dan riwayat transaksi belanja</p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded text-[#898989] hover:text-[#25343F]"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25">
                  <span className="text-[#898989] font-bold uppercase text-[10px]">Total Pesanan</span>
                  <p className="font-extrabold text-[#25343F] text-base mt-1">
                    {selectedCustomer.totalOrders || customerOrders.length} order
                  </p>
                </div>
                <div className="p-3 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25">
                  <span className="text-[#898989] font-bold uppercase text-[10px]">Total Pembelian</span>
                  <p className="font-extrabold text-[#25343F] text-base mt-1 font-mono">{formatRupiah(selectedCustomer.totalSpent || 0)}
                  </p>
                </div>
                <div className="p-3 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25">
                  <span className="text-[#898989] font-bold uppercase text-[10px]">Transaksi Terakhir</span>
                  <p className="font-bold text-[#25343F] text-xs mt-1">
                    {formatDate(selectedCustomer.lastTransactionDate) || '-'}
                  </p>
                </div>
              </div>

              {/* Contact and address details */}
              <div className="p-3.5 bg-[#EAEFEF]/70 rounded-xl border border-[#BFC9D1]/25 space-y-1.5">
                <div className="flex items-center gap-2 text-[#25343F]">
                  <PhoneIcon className="w-3.5 h-3.5 text-[#898989]" />
                  <span>WhatsApp: {selectedCustomer.whatsapp || '-'}</span>
                  {selectedCustomer.whatsapp && (
                    <a
                      href={getWhatsAppLink(selectedCustomer.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#25343F] hover:underline font-semibold ml-2"
                    >
                      Chat WhatsApp
                    </a>
                  )}
                </div>
                <div className="flex items-start gap-2 text-[#25343F]">
                  <MapPinIcon className="w-3.5 h-3.5 text-[#898989] mt-0.5" />
                  <span>Alamat: {selectedCustomer.address || '-'}</span>
                </div>
                {selectedCustomer.notes && (
                  <div className="flex items-start gap-2 text-[#898989]">
                    <DocumentTextIcon className="w-3.5 h-3.5 text-[#898989] mt-0.5" />
                    <span>Catatan: {selectedCustomer.notes}</span>
                  </div>
                )}
              </div>

              {/* Order History */}
              <div>
                <h4 className="font-bold text-[#25343F] mb-2">Riwayat Pesanan Pelanggan</h4>
                {customerOrders.length === 0 ? (
                  <p className="text-[#898989] text-center py-6">Belum ada catatan pesanan resmi.</p>
                ) : (
                  <div className="border border-[#BFC9D1]/25 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {customerOrders.map(order => (
                      <div
                        key={order.id}
                        className="p-3 flex items-center justify-between hover:bg-[#EAEFEF]/60"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#25343F] font-mono">{order.orderNumber}</span>
                            <span className="text-[#898989]">• {formatDate(order.orderDate)}</span>
                          </div>
                          <div className="text-[#898989] mt-0.5">
                            {order.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-[#25343F] font-mono">{formatRupiah(order.totalAmount)}</div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAEFEF] text-[#25343F]">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#BFC9D1]/40 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-[#FF9B51] text-[#25343F] rounded-xl font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!customerToDelete}
        title="Hapus Pelanggan?"
        message={`Apakah Anda yakin ingin menghapus pelanggan "${customerToDelete?.name}"?`}
        confirmLabel="Hapus"
        onConfirm={handleDeleteCustomer}
        onCancel={() => setCustomerToDelete(null)}
      />

      {/* ── Floating Action Button (FAB) Tambah Pelanggan ── */}
      <button
        id="btn-add-customer-fab"
        type="button"
        onClick={handleOpenAdd}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] flex items-center justify-center shadow-xl border-2 border-white transition-all cursor-pointer active:scale-90 hover:scale-105"
        title="Tambah Pelanggan Baru"
        aria-label="Tambah Pelanggan Baru"
      >
        <PlusIcon className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
