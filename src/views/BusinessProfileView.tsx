import React, { useState, useRef } from 'react';
import { BuildingStorefrontIcon, DocumentCheckIcon, CameraIcon, ArrowPathIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { BusinessSettings, ViewType } from '../types';
import { useToast } from '../components/Toast';

interface BusinessProfileViewProps {
  settings: BusinessSettings;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
  onNavigate: (view: ViewType) => void;
}

export const BusinessProfileView: React.FC<BusinessProfileViewProps> = ({
  settings,
  onUpdateSettings,
  onNavigate,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

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
      showToast('Profil bisnis berhasil disimpan!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan profil bisnis', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-3.5 animate-fade-in pb-24">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
            title="Kembali ke Profil"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Profil Bisnis Saya
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Identitas usaha yang akan tampil pada dokumen
            </p>
          </div>
        </div>

        <button
          form="business-profile-form"
          type="submit"
          disabled={isSaving}
          className="h-9 px-3.5 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-50 shrink-0 active:scale-95"
        >
          <DocumentCheckIcon className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
        </button>
      </div>

      <form
        id="business-profile-form"
        onSubmit={handleSave}
        className="bg-white p-6 rounded-2xl border border-[#BFC9D1]/25 shadow-md space-y-3.5 text-xs"
      >

        {/* Business Profile Picture / Logo Section */}
        <div className="p-4 bg-[#EAEFEF]/80 rounded-2xl border border-[#BFC9D1]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FF9B51] text-[#25343F] font-extrabold flex items-center justify-center text-xl sm:text-2xl shadow-md border-2 border-white ring-1 ring-slate-200 overflow-hidden">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt={formData.businessName || 'Logo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="tracking-widest uppercase text-sm sm:text-base font-black">
                    {formData.businessName ? formData.businessName.slice(0, 2) : 'SS'}
                  </span>
                )}
              </div>

              {isUploadingLogo && (
                <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white">
                  <ArrowPathIcon className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-[#25343F] flex items-center gap-2">
                <span>Foto Profil / Logo Bisnis</span>
                {formData.logoUrl && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#EAEFEF] text-[#25343F] rounded-full">
                    Terpasang
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-[#898989] mt-0.5 leading-relaxed">
                Foto/logo akan tampil di Menu Sidebar, Header Nota Kasir, dan Faktur SPK.
              </p>
              <p className="text-[10px] text-[#898989] font-mono mt-0.5">
                Format: JPG, PNG, WebP (Maks. 10MB) · Rekomendasi 1:1
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />

            <button
              type="button"
              disabled={isUploadingLogo}
              onClick={() => logoInputRef.current?.click()}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-white hover:bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUploadingLogo ? (
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-[#898989]" />
              ) : (
                <CameraIcon className="w-3.5 h-3.5 text-[#898989]" />
              )}
              <span>{formData.logoUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
            </button>

            {formData.logoUrl && (
              <button
                type="button"
                disabled={isDeletingLogo || isUploadingLogo}
                onClick={handleDeleteLogo}
                className="px-3.5 py-2 bg-[#FF9B51]/8 hover:bg-[#FF9B51]/15 text-[#c45e00] border border-[#FF9B51]/40 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Hapus Logo"
              >
                {isDeletingLogo ? (
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-[#c45e00]" />
                ) : (
                  <TrashIcon className="w-3.5 h-3.5 text-[#c45e00]" />
                )}
                <span>Hapus Foto</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-bold text-[#25343F] mb-1">Nama Studio / Toko *</label>
            <input
              type="text"
              required
              value={formData.businessName || ''}
              onChange={e => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-bold text-[#25343F]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#25343F] mb-1">Slogan / Tagline</label>
            <input
              type="text"
              value={formData.tagline || ''}
              onChange={e => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Contoh: Percetakan & Desain Grafis Cepat"
              className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-[#25343F] mb-1">Nomor Telepon Toko</label>
            <input
              type="text"
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0812-3456-7890"
              className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-[#25343F] mb-1">WhatsApp Customer Service</label>
            <input
              type="text"
              value={formData.whatsapp || ''}
              onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="081234567890"
              className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-[#25343F] mb-1">Email Bisnis</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="studio@sukunaru.com"
              className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-[#25343F] mb-1">Nomor Rekening & Bank Pembayaran</label>
            <textarea
              rows={2}
              value={formData.bankAccount || ''}
              onChange={e => setFormData({ ...formData, bankAccount: e.target.value })}
              placeholder="BCA: 123-456-7890 a.n Sukunaru Studio&#10;Mandiri: 987-654-3210 a.n Sukunaru Studio"
              className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl font-mono text-[11px]"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-[#25343F] mb-1">Alamat Lengkap Workshop / Toko</label>
          <textarea
            rows={2}
            value={formData.address || ''}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            placeholder="Jl. Percetakan Studio No. 12, Malang, Jawa Timur"
            className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
          />
        </div>
      </form>
    </div>
  );
};
