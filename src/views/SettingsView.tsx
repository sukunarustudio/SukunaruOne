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
  ServerIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';
import { api, getApiBaseUrl, setApiBaseUrl } from '../services/api';
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

  // Server API URL Configuration (Capacitor Android / Multi-Device support)
  const [serverUrl, setServerUrl] = useState<string>(() => getApiBaseUrl());
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleTestConnection = async () => {
    setIsTestingServer(true);
    setTestResult(null);
    try {
      const res = await api.checkConnection(serverUrl);
      setTestResult(res);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Koneksi gagal' });
      showToast(err.message || 'Koneksi gagal', 'error');
    } finally {
      setIsTestingServer(false);
    }
  };

  const handleSaveServerUrl = () => {
    setApiBaseUrl(serverUrl);
    showToast('Alamat server API berhasil disimpan!', 'success');
    if (onRefreshDashboard) onRefreshDashboard();
  };

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

      {/* ── KONEKSI SERVER API (UNTUK APK ANDROID & MULTI-DEVICE) ── */}
      <div className="bg-white p-6 rounded-2xl border border-[#BFC9D1]/25 shadow-md space-y-4 text-xs">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="p-2 bg-[#FF9B51]/15 text-[#FF9B51] rounded-xl">
            <ServerIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#25343F]">Koneksi Server API (APK Android / Multi-Device)</h3>
            <p className="text-[#898989] text-xs">
              Hubungkan aplikasi HP Android ke database komputer/server toko Anda.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block font-bold text-[#25343F] mb-1">
              Alamat URL Server Backend (IP / Domain)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={serverUrl}
                onChange={e => {
                  setServerUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="misal: http://192.168.1.15:3000 atau https://api.domainanda.com"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-[#BFC9D1]/30 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9B51]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTestingServer}
                  onClick={handleTestConnection}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#25343F] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <WifiIcon className="w-4 h-4" />
                  <span>{isTestingServer ? 'Menguji...' : 'Tes Koneksi'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveServerUrl}
                  className="px-4 py-2.5 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md active:scale-95"
                >
                  <span>Simpan URL</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#898989] mt-1.5 leading-relaxed">
              💡 <strong>Tips APK:</strong> Pastikan HP dan Komputer Kasir terhubung di <strong>jaringan Wi-Fi yang sama</strong>. Masukkan alamat IP komputer Anda diikuti port 3000 (contoh: <code>http://192.168.1.50:3000</code>). Jika kosong, aplikasi menggunakan server bawaan.
            </p>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
