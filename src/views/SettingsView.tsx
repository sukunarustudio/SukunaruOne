import React, { useState, useRef } from 'react';
import {
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  ArrowLeftIcon,
  SwatchIcon,
  ChevronRightIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { BusinessSettings } from '../types';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface SettingsViewProps {
  settings: BusinessSettings;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
  onRefreshDashboard?: () => void;
  onNavigate?: (view: string) => void;
  previousView?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onRefreshDashboard,
  onNavigate,
  previousView = 'dashboard',
}) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);

  const [isClearingTransactions, setIsClearingTransactions] = useState(false);
  const [isClearTransactionsConfirmOpen, setIsClearTransactionsConfirmOpen] = useState(false);

  const handleClearAllTransactions = async () => {
    try {
      setIsClearingTransactions(true);
      const res = await api.clearAllTransactions({ resetExpenses: true, resetMovements: true });
      showToast(res.message || 'Semua riwayat transaksi & arus kas berhasil dihapus!', 'success');
      setIsClearTransactionsConfirmOpen(false);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus transaksi', 'error');
    } finally {
      setIsClearingTransactions(false);
    }
  };

  // Handle Save Form Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await api.updateSettings(formData);
      onUpdateSettings(updated);
      showToast('Pengaturan bisnis berhasil diperbarui!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="settings-view" className="space-y-3.5 max-w-4xl mx-auto pb-12">

      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF]/90 dark:bg-[#0B0F17]/90 backdrop-blur-xl py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate?.(previousView)}
            className="p-2 -ml-2 text-[#25343F] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer active:scale-90 shrink-0"
            title="Kembali ke Beranda"
          >
            <ArrowLeftIcon className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] dark:text-white leading-tight tracking-tight truncate">
              Pengaturan
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] dark:text-slate-400 font-medium mt-0.5 truncate hidden sm:block">
              Konfigurasi tampilan, dokumen &amp; data aplikasi
            </p>
          </div>
        </div>

        <button
          form="settings-form"
          type="submit"
          disabled={isSaving}
          className="h-9 px-4 bg-[#FF6A00] hover:bg-[#e65c00] text-white rounded-full text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-95"
        >
          <DocumentCheckIcon className="w-4 h-4 stroke-[2]" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
        </button>
      </div>

      {/* Form Container */}
      <form
        id="settings-form"
        onSubmit={handleSave}
        className="bg-white p-6 rounded-2xl border border-[#BFC9D1]/25 shadow-md space-y-4 text-xs"
      >
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-sm text-[#25343F]">Format Penomoran Dokumen & Struk</h3>
          <p className="text-[#898989] text-xs">
            Konfigurasi penomoran nota kasir, faktur invoice, dan pesan footer struk.
          </p>
        </div>

        {/* Document Prefixes & Notes */}
        <div className="space-y-3.5">
          <h4 className="font-bold text-sm text-[#25343F]">Prefix Dokumen & Pesan Struk</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-[#25343F] mb-1">Prefix Faktur / Invoice</label>
              <input
                type="text"
                value={formData.invoicePrefix || 'INV-'}
                onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-[#25343F] mb-1">Prefix Struk Kasir (POS)</label>
              <input
                type="text"
                value={formData.receiptPrefix || 'STR-'}
                onChange={e => setFormData({ ...formData, receiptPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#25343F] mb-1">Pesan Footer Struk & Invoice</label>
            <textarea
              rows={2}
              value={formData.footerNotes || ''}
              onChange={e => setFormData({ ...formData, footerNotes: e.target.value })}
              placeholder="Terima kasih telah mempercayakan kebutuhan cetak & desain Anda kepada kami!"
              className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
            />
          </div>
        </div>
      </form>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ZONA BAHAYA                                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200/80 shadow-md space-y-3.5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-rose-100">
          <div className="w-8 h-8 rounded-lg bg-[#FFE6D6] text-[#c45e00] flex items-center justify-center shrink-0">
            <ExclamationTriangleIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-sm text-[#c45e00]">Zona Bahaya</h3>
            <p className="text-[#898989] text-[11px]">Tindakan berikut bersifat permanen.</p>
          </div>
        </div>

        {/* Hapus Riwayat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-rose-50/60 rounded-xl border border-rose-200/60">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-xs sm:text-sm">
              <TrashIcon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Hapus Riwayat Data</span>
            </div>
            <p className="text-[11px] text-[#898989] mt-1 leading-relaxed">
              Hapus seluruh riwayat transaksi, pesanan, produk, dan bahan baku (Lokal &amp; Cloud). Akun, lisensi, dan profil bisnis tetap aman.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsClearTransactionsConfirmOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer active:scale-95 transition-colors shadow-sm"
          >
            Hapus Riwayat
          </button>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={isClearTransactionsConfirmOpen}
        title="Hapus Semua Riwayat Data?"
        message="Tindakan ini akan mengosongkan seluruh riwayat transaksi, pesanan, produk, dan bahan baku baik di perangkat ini maupun di Supabase Cloud. Akun, lisensi, dan profil bisnis Anda tetap aman."
        confirmLabel={isClearingTransactions ? 'Menghapus...' : 'Ya, Hapus Semua'}
        isDanger={true}
        onConfirm={handleClearAllTransactions}
        onCancel={() => setIsClearTransactionsConfirmOpen(false)}
      />
    </div>
  );
};
