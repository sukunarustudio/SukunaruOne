import React, { useState, useRef } from 'react';
import { Cog6ToothIcon, BuildingStorefrontIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, DocumentTextIcon, CreditCardIcon, ArrowPathIcon, DocumentCheckIcon, CheckCircleIcon, PhotoIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { BusinessSettings } from '../types';
import { useToast } from '../components/Toast';

interface SettingsViewProps {
  settings: BusinessSettings;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
  onResetSampleData?: () => void;
  onRefreshDashboard?: () => void;
  onNavigate?: (view: string) => void;
  previousView?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSampleData,
  onRefreshDashboard,
  onNavigate,
  previousView = 'dashboard',
}) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Handle Business Logo / Profile Picture ArrowUpTrayIcon
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.', 'error');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran foto terlalu besar. Maksimal 10MB.', 'error');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingLogo(true);
      const res = await api.uploadBusinessLogo(file);
      setFormData(prev => ({ ...prev, logoUrl: res.logoUrl }));
      onUpdateSettings(res.settings);
      showToast('Foto profil / logo bisnis berhasil diunggah!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah foto profil bisnis', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Handle Delete Business Logo
  const handleDeleteLogo = async () => {
    try {
      setIsDeletingLogo(true);
      const res = await api.deleteBusinessLogo();
      setFormData(prev => ({ ...prev, logoUrl: '' }));
      onUpdateSettings(res.settings);
      showToast('Foto profil bisnis berhasil dihapus.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus foto profil', 'error');
    } finally {
      setIsDeletingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await api.updateSettings(formData);
      onUpdateSettings(updated);
      showToast('Pengaturan bisnis berhasil disimpan!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="settings-view" className="space-y-3.5 max-w-4xl mx-auto pb-12">

      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate?.(previousView)}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
            title="Kembali ke Beranda"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Pengaturan
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Konfigurasi bisnis, dokumen & data aplikasi
            </p>
          </div>
        </div>

        <button
          form="settings-form"
          type="submit"
          disabled={isSaving}
          className="h-9 px-3.5 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-50 shrink-0 active:scale-95"
        >
          <DocumentCheckIcon className="w-4 h-4" />
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
            Konfigurasi tampilan nota kasir dan penomoran SPK.
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
    </div>
  );
};
