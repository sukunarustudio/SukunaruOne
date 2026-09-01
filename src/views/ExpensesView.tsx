import React, { useState, useEffect } from 'react';
import { ReceiptPercentIcon, PlusIcon, MagnifyingGlassIcon, CurrencyDollarIcon, CalendarIcon, TrashIcon, TagIcon, ArrowTrendingDownIcon, CreditCardIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { Expense, PaymentMethod } from '../types';
import { formatRupiah, formatDate, getTodayDateString } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface ExpensesViewProps {
  onRefreshDashboard?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onRefreshDashboard }) => {
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Add Expense Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [category, setCategory] = useState('Bahan Baku');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');

  // Delete Confirm State
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const categories = [
    'SEMUA',
    'Bahan Baku / Material',
    'Operasional & Utilitas',
    'Pemeliharaan & Alat',
    'Kemasan & Perlengkapan',
    'Konsumsi',
    'Sewa Tempat',
    'Gaji & Upah',
    'Operasional Lainnya',
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat pengeluaran', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => {
      api.getExpenses().then(e => setExpenses(e)).catch(() => {});
    };
    window.addEventListener('sukunaru:sync_completed', handleRefresh);
    window.addEventListener('sukunaru:data_mutation', handleRefresh);
    return () => {
      window.removeEventListener('sukunaru:sync_completed', handleRefresh);
      window.removeEventListener('sukunaru:data_mutation', handleRefresh);
    };
  }, []);

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const filteredExpenses = expenses.filter(exp => {
    const matchesCat = selectedCategory === 'SEMUA' || exp.category === selectedCategory;
    const matchesSearch =
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Nominal pengeluaran harus lebih dari 0', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Keterangan pengeluaran wajib diisi', 'error');
      return;
    }

    try {
      const created = await api.createExpense({
        category,
        amount,
        paymentMethod,
        description: description.trim(),
        date,
        notes: notes.trim(),
      });

      setExpenses(prev => [created, ...prev]);
      showToast('Pengeluaran berhasil dicatat & masuk ke laporan kas!', 'success');
      setIsAddModalOpen(false);
      setAmount(0);
      setDescription('');
      setNotes('');
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengeluaran', 'error');
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await api.deleteExpense(expenseToDelete.id);
      setExpenses(prev => prev.filter(e => e.id !== expenseToDelete.id));
      showToast('Pengeluaran berhasil dihapus', 'success');
      setExpenseToDelete(null);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pengeluaran', 'error');
    }
  };

  return (
    <div id="expenses-view" className="space-y-3.5 max-w-7xl mx-auto pb-24">
      {/* Top Banner Summary + MagnifyingGlassIcon - Sticky Top */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] pt-3 pb-3 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40">
        <div className="flex items-center justify-between gap-3.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#898989]">
              Total Pengeluaran
            </span>
            <div className="text-xl font-black text-[#25343F] font-mono mt-0.5">
              {formatRupiah(totalExpense)}
            </div>
          </div>

          <button
            id="btn-add-expense"
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[38px] px-3.5 py-2 bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer shrink-0"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Catat Pengeluaran</span>
            <span className="sm:hidden">Catat</span>
          </button>
        </div>

        {/* MagnifyingGlassIcon & Category FunnelIcon Header */}
        <div className="flex items-center gap-2">
          {/* FunnelIcon Icon Button (Left of search) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-10 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedCategory !== 'SEMUA' || isFilterOpen
                  ? 'bg-[#25343F] text-white border-slate-900 shadow-sm'
                  : 'bg-white text-[#898989] border-[#BFC9D1] hover:bg-[#EAEFEF]'
              }`}
              title="Filter Kategori Pengeluaran"
              aria-label="Filter Kategori"
            >
              <FunnelIcon className="w-4 h-4" />
              {selectedCategory !== 'SEMUA' && (
                <span className="w-2 h-2 rounded-full bg-[#FF9B51]" />
              )}
            </button>

            {/* Category Dropdown Popover */}
            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-xl p-2 z-30 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[11px] font-bold text-[#898989] uppercase tracking-wider">
                    Pilih Kategori Biaya
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-[#25343F] text-white'
                            : 'text-[#25343F] hover:bg-[#EAEFEF]'
                        }`}
                      >
                        <span>{cat === 'SEMUA' ? 'Semua Kategori' : cat}</span>
                        {selectedCategory === cat && <span className="text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* MagnifyingGlassIcon Input */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-[#898989] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari pengeluaran..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#BFC9D1]/25 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#FF9B51]/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-[#898989] hover:text-[#898989] rounded-full cursor-pointer"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Category TagIcon Indicator */}
        {selectedCategory !== 'SEMUA' && (
          <div className="flex items-center gap-1.5 text-xs pt-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF9B51]/8 border border-[#FF9B51]/40 text-[#c45e00] font-bold text-[11px]">
              Kategori: {selectedCategory}
              <XMarkIcon
                className="w-3 h-3 cursor-pointer hover:text-[#c45e00]"
                onClick={() => setSelectedCategory('SEMUA')}
              />
            </span>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1,2,3].map(n => (
              <div key={n} className="animate-pulse flex gap-3 items-center py-2">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-[#EAEFEF] rounded w-1/2" />
                  <div className="h-3 bg-[#EAEFEF] rounded w-1/3" />
                </div>
                <div className="h-4 w-20 bg-[#EAEFEF] rounded" />
              </div>
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-16 text-[#898989]">
            <ReceiptPercentIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#25343F]">Belum ada catatan pengeluaran</p>
            <p className="text-xs text-[#898989] mt-1">
              Catat biaya listrik, belanja bahan, servis mesin, dan lainnya.
            </p>
          </div>
        ) : (
          <>
            {/* ── MOBILE: Compact Expense List ── */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredExpenses.map(exp => (
                <div key={exp.id} className="flex items-center gap-3 px-4 py-3.5">
                  {/* Amount first, prominent */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] text-[#25343F] truncate">{exp.description}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[#898989]">{formatDate(exp.date)}</span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF9B51]/8 text-[#c45e00] font-medium">{exp.category}</span>
                    </div>
                    {exp.notes && (
                      <div className="text-[10px] text-[#898989] mt-0.5 truncate">{exp.notes}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-sm text-[#c45e00]">-{formatRupiah(exp.amount)}</div>
                    <button
                      onClick={() => setExpenseToDelete(exp)}
                      className="mt-1 p-1 rounded-lg text-[#FF9B51] hover:text-[#c45e00] hover:bg-[#FF9B51]/8 transition-colors cursor-pointer"
                      title="Hapus Pengeluaran"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
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
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Keterangan Biaya</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Metode Bayar</th>
                    <th className="py-3.5 px-4 text-right">Nominal Pengeluaran</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-[#EAEFEF]/60 transition-colors">
                      <td className="py-3 px-4 text-[#898989] whitespace-nowrap">{formatDate(exp.date)}</td>
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-[#25343F]">{exp.description}</div>
                        {exp.notes && <div className="text-[11px] text-[#898989] mt-0.5">{exp.notes}</div>}
                      </td>
                      <td className="py-3 px-4"><span className="font-semibold text-[#25343F] px-2 py-0.5 rounded bg-[#EAEFEF]">{exp.category}</span></td>
                      <td className="py-3 px-4 font-mono text-[#898989]">{exp.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-black text-[#c45e00] text-sm">-{formatRupiah(exp.amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => setExpenseToDelete(exp)} className="p-1.5 rounded-lg text-[#c45e00] hover:bg-[#FF9B51]/8 border border-[#FF9B51]/40" title="Hapus Pengeluaran">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL: Add Expense */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-md w-full p-6">
            <h3 className="font-bold text-base text-[#25343F] mb-1">Catat Pengeluaran Operasional</h3>
            <p className="text-xs text-[#898989] mb-4">Otomatis dicatat ke buku kas pengeluaran</p>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#25343F] mb-1">Nominal Biaya (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount || ''}
                  onChange={e => setAmount(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl text-base font-bold text-[#25343F] text-[#c45e00]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Kategori Pengeluaran</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-medium"
                >
                  <option value="Bahan Baku / Material">Bahan Baku / Material Pokok</option>
                  <option value="Operasional & Utilitas">Operasional &amp; Utilitas (Listrik, Air, Wifi)</option>
                  <option value="Pemeliharaan & Alat">Pemeliharaan, Servis &amp; Alat Kerja</option>
                  <option value="Kemasan & Perlengkapan">Kemasan &amp; Perlengkapan (Packaging, Lakban)</option>
                  <option value="Konsumsi">Konsumsi &amp; Makanan Operasional</option>
                  <option value="Sewa Tempat">Sewa Tempat / Lokasi Usaha</option>
                  <option value="Gaji & Upah">Gaji, Upah &amp; Uang Saku</option>
                  <option value="Operasional Lainnya">Operasional Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Keterangan Biaya *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: Beli bahan baku produksi, token listrik..."
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                  >
                    <option value="CASH">CASH (Tunai)</option>
                    <option value="TRANSFER">TRANSFER Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: Nota tersimpan di map fisik..."
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#BFC9D1]/25 font-semibold text-[#898989] hover:bg-[#EAEFEF] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold shadow-sm cursor-pointer"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!expenseToDelete}
        title="Hapus Catatan Pengeluaran?"
        message={`Apakah Anda yakin ingin menghapus pengeluaran "${expenseToDelete?.description}" senilai ${formatRupiah(expenseToDelete?.amount || 0)}?`}
        confirmLabel="Hapus"
        onConfirm={handleDeleteExpense}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
