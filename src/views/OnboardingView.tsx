import React, { useState, useRef } from 'react';
import {
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  CubeIcon,
  CalculatorIcon,
  Square3Stack3DIcon,
  WalletIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
  CloudArrowUpIcon,
  CameraIcon,
  FolderIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { BusinessSettings } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { verifyLicenseInCloud, isSupabaseConfigured } from '../services/supabaseClient';
import appLogo from '../assets/app-logo.png';

interface OnboardingViewProps {
  settings: BusinessSettings;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'intro' | 'features' | 'profile' | 'license' | 'permissions' | 'done';

const MASTER_KEYS = [
  'SKNR-PRO-2026-LIFETIME',
  'SKNR-LIFETIME-PREMIUM',
  'SKNR-STUDIO-UNLIMITED',
  'SKNR-AKTIF-SELAMANYA',
  'SUKUNARU-PRO-UNLIMITED',
];

const validateSerialKey = (key: string): boolean => {
  const clean = key.trim().toUpperCase();
  if (MASTER_KEYS.includes(clean)) return true;
  const pattern = /^SKNR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!pattern.test(clean)) return false;
  const chars = clean.replace(/-/g, '');
  let sum = 0;
  for (let i = 0; i < chars.length; i++) {
    sum += chars.charCodeAt(i);
  }
  return sum > 0;
};

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  settings,
  onUpdateSettings,
  onComplete,
}) => {
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [featureSlide, setFeatureSlide] = useState<number>(1);

  // Profile form state
  const [profileForm, setProfileForm] = useState<BusinessSettings>({ ...settings });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // License state
  const [serialKeyInput, setSerialKeyInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<'idle' | 'success' | 'error' | 'active'>(() => {
    try {
      const saved = localStorage.getItem('sukunaru_license_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isActivated) return 'active';
      }
    } catch {}
    return 'idle';
  });
  const [licenseErrorMessage, setLicenseErrorMessage] = useState('');

  // ── Step Navigation Helpers ──────────────────────────────────────────────
  const goToNextStep = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('intro');
        break;
      case 'intro':
        setFeatureSlide(1);
        setCurrentStep('features');
        break;
      case 'features':
        if (featureSlide < 3) {
          setFeatureSlide(prev => prev + 1);
        } else {
          setCurrentStep('profile');
        }
        break;
      case 'profile':
        setCurrentStep('license');
        break;
      case 'license':
        setCurrentStep('permissions');
        break;
      case 'permissions':
        setCurrentStep('done');
        break;
      case 'done':
        onComplete();
        break;
    }
  };

  const goToPrevStep = () => {
    switch (currentStep) {
      case 'intro':
        setCurrentStep('welcome');
        break;
      case 'features':
        if (featureSlide > 1) {
          setFeatureSlide(prev => prev - 1);
        } else {
          setCurrentStep('intro');
        }
        break;
      case 'profile':
        setFeatureSlide(3);
        setCurrentStep('features');
        break;
      case 'license':
        setCurrentStep('profile');
        break;
      case 'permissions':
        setCurrentStep('license');
        break;
      case 'done':
        setCurrentStep('permissions');
        break;
    }
  };

  // ── Profile Handlers ─────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Format gambar harus JPG, PNG, atau WebP.', 'error');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran foto terlalu besar (Maksimal 10MB).', 'error');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingLogo(true);
      const res = await api.uploadBusinessLogo(file);
      setProfileForm(prev => ({ ...prev, logoUrl: res.logoUrl }));
      onUpdateSettings(res.settings);
      showToast('Foto profil / logo bisnis berhasil diunggah!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah foto profil', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSaveProfileAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.businessName.trim()) {
      showToast('Nama Studio / Toko wajib diisi', 'error');
      return;
    }

    try {
      setIsSavingProfile(true);
      const updated = await api.updateSettings(profileForm);
      onUpdateSettings(updated);
      showToast('Profil bisnis berhasil disimpan!', 'success');
      setCurrentStep('license');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan profil bisnis', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── License Handlers ─────────────────────────────────────────────────────
  const handleFormatSerialKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    let clean = val.replace(/[^A-Z0-9]/g, '');
    if (clean.startsWith('SKNR')) {
      clean = clean.slice(4);
      let formatted = 'SKNR';
      for (let i = 0; i < clean.length && i < 12; i++) {
        if (i % 4 === 0) formatted += '-';
        formatted += clean[i];
      }
      setSerialKeyInput(formatted);
    } else {
      setSerialKeyInput(val);
    }
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = serialKeyInput.trim().toUpperCase();
    if (!cleanKey) {
      showToast('Masukkan License Key terlebih dahulu', 'error');
      return;
    }

    setIsActivating(true);
    setLicenseErrorMessage('');

    try {
      let isValid = false;
      let licenseTier = cleanKey.startsWith('SKNR-T') ? 'TRIAL_14_DAYS' : 'PRO_LIFETIME';
      let cloudLic: any = null;

      // 1. Check cloud if online & configured
      if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
        let devId = 'DEV-DEFAULT';
        try {
          devId = localStorage.getItem('sukunaru_device_id') || 'DEV-DEFAULT';
        } catch {}

        const cloudRes = await verifyLicenseInCloud(
          cleanKey,
          devId,
          profileForm.businessName || settings.businessName || 'Owner'
        );
        if (cloudRes.valid) {
          isValid = true;
          cloudLic = cloudRes.license;
          licenseTier = cloudLic?.tier || licenseTier;
        } else {
          setLicenseStatus('error');
          setLicenseErrorMessage(cloudRes.message || 'License Key tidak valid. Periksa kembali key yang kamu masukkan.');
          setIsActivating(false);
          return;
        }
      } else {
        isValid = validateSerialKey(cleanKey);
      }

      if (isValid) {
        const now = new Date();
        const isTrial = licenseTier === 'TRIAL_14_DAYS' || Boolean(cloudLic?.duration_days);
        const expiresAt = isTrial
          ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

        const licenseData = {
          isActivated: true,
          licenseKey: cleanKey,
          licenseType: licenseTier,
          activatedAt: now.toISOString(),
          expiresAt,
          durationDays: isTrial ? 14 : null,
          registeredTo: profileForm.businessName || settings.businessName || 'BisnisUrang User',
        };

        try {
          localStorage.setItem('sukunaru_license_info', JSON.stringify(licenseData));
        } catch {}

        setLicenseStatus('success');
        showToast('✓ License Key berhasil diaktifkan.', 'success');
        setTimeout(() => {
          setCurrentStep('permissions');
        }, 1200);
      } else {
        setLicenseStatus('error');
        setLicenseErrorMessage('License Key tidak valid. Periksa kembali key yang kamu masukkan.');
      }
    } catch {
      setLicenseStatus('error');
      setLicenseErrorMessage('Verifikasi License Key membutuhkan koneksi internet.');
    } finally {
      setIsActivating(false);
    }
  };

  // Progress steps calculation
  const getStepProgressIndex = () => {
    switch (currentStep) {
      case 'welcome':
        return 0;
      case 'intro':
        return 1;
      case 'features':
        return 2;
      case 'profile':
        return 3;
      case 'license':
        return 4;
      case 'permissions':
        return 5;
      case 'done':
        return 6;
      default:
        return 0;
    }
  };

  const totalSteps = 7;
  const currentStepIdx = getStepProgressIndex();

  return (
    <div
      className="min-h-screen bg-[#EAEFEF] text-[#25343F] flex flex-col justify-between p-4 sm:p-6 select-none overflow-y-auto font-sans"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
      }}
    >
      {/* ── TOP HEADER / BRANDING ── */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          <img
            src={profileForm.logoUrl || appLogo}
            alt="BisnisUrang Logo"
            className="w-9 h-9 rounded-xl object-contain bg-white shadow-xs border border-[#BFC9D1]/30 p-1"
          />
          <div>
            <span className="font-black text-sm text-[#25343F] tracking-tight block leading-tight">
              BisnisUrang
            </span>
            <span className="text-[10px] text-[#898989] font-semibold block leading-tight">
              Kelola bisnis, jadi lebih mudah.
            </span>
          </div>
        </div>

        {/* Step Indicator dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <span
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStepIdx
                  ? 'w-6 bg-[#25343F]'
                  : idx < currentStepIdx
                  ? 'w-2 bg-[#10B981]'
                  : 'w-2 bg-[#BFC9D1]/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col justify-center my-auto py-2">
        {/* ============================================================ */}
        {/* 1. STEP: WELCOME                                             */}
        {/* ============================================================ */}
        {currentStep === 'welcome' && (
          <div className="bg-white rounded-3xl border border-[#BFC9D1]/30 shadow-lg p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-br from-[#25343F] to-[#1B2730] p-4 flex items-center justify-center shadow-lg shadow-[#25343F]/15">
              <img src={appLogo} alt="BisnisUrang" className="w-full h-full object-contain filter drop-shadow" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF9B51]/15 text-[#D97706] text-xs font-bold">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Kelola bisnis, jadi lebih mudah.</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#25343F] tracking-tight">
                Selamat datang di BisnisUrang
              </h1>
              <p className="text-xs sm:text-sm text-[#898989] font-medium max-w-md mx-auto leading-relaxed">
                Satu aplikasi untuk membantu mengelola operasional bisnis sehari-hari.
              </p>
            </div>

            <div className="pt-4 space-y-2.5">
              <button
                type="button"
                onClick={goToNextStep}
                className="w-full py-3.5 bg-[#25343F] hover:bg-[#1B2730] text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <span>Mulai</span>
                <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep('intro')}
                className="w-full py-2.5 text-xs font-bold text-[#898989] hover:text-[#25343F] transition-colors cursor-pointer"
              >
                Lewati
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. STEP: PENGENALAN BISNISURANG                              */}
        {/* ============================================================ */}
        {currentStep === 'intro' && (
          <div className="bg-white rounded-3xl border border-[#BFC9D1]/30 shadow-lg p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF9B51]">
                Tentang BisnisUrang
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#25343F]">
                Semua kebutuhan bisnis dalam satu tempat.
              </h2>
              <p className="text-xs sm:text-sm text-[#898989] leading-relaxed">
                BisnisUrang membantu kamu mengelola transaksi, produk, pelanggan, keuangan, dan operasional bisnis dengan lebih sederhana.
              </p>
            </div>

            {/* 3 Value Pillars */}
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/60 border border-[#BFC9D1]/25 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 text-[#059669] flex items-center justify-center shrink-0">
                  <BuildingStorefrontIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-[#25343F]">Operasional Praktis &amp; Kasir POS</h4>
                  <p className="text-[11px] text-[#898989] mt-0.5">
                    Catat penjualan kasir, scan barcode, pantau pesanan kustom, dan kelola pelanggan.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/60 border border-[#BFC9D1]/25 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FF9B51]/15 text-[#D97706] flex items-center justify-center shrink-0">
                  <WalletIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-[#25343F]">Keuangan &amp; HPP Otomatis</h4>
                  <p className="text-[11px] text-[#898989] mt-0.5">
                    Hitung HPP produk akurat, catat mutasi kas masuk/keluar, dan laporan perkembangan usaha.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/60 border border-[#BFC9D1]/25 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#25343F]/10 text-[#25343F] flex items-center justify-center shrink-0">
                  <CloudArrowUpIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-[#25343F]">100% Offline-First &amp; Cloud Backup</h4>
                  <p className="text-[11px] text-[#898989] mt-0.5">
                    Aplikasi tetap berfungsi lancar tanpa koneksi internet, dengan opsi sinkronisasi cloud aman.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#BFC9D1]/20 gap-3">
              <button
                type="button"
                onClick={goToPrevStep}
                className="px-4 py-2.5 rounded-xl border border-[#BFC9D1]/30 text-xs font-bold text-[#898989] hover:bg-[#EAEFEF] cursor-pointer"
              >
                Kembali
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('features')}
                  className="px-3 py-2.5 text-xs font-bold text-[#898989] hover:text-[#25343F] cursor-pointer"
                >
                  Lewati
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-5 py-2.5 bg-[#25343F] hover:bg-[#1B2730] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Berikutnya</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. STEP: PENGENALAN FITUR (3 SLIDES)                         */}
        {/* ============================================================ */}
        {currentStep === 'features' && (
          <div className="bg-white rounded-3xl border border-[#BFC9D1]/30 shadow-lg p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header with slide counter */}
            <div className="flex items-center justify-between pb-3 border-b border-[#BFC9D1]/20">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF9B51]">
                  Fitur BisnisUrang
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#25343F]">
                  {featureSlide === 1 && 'Kelola Operasional'}
                  {featureSlide === 2 && 'Kelola Keuangan'}
                  {featureSlide === 3 && 'Atur Bisnis'}
                </h3>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-[#EAEFEF] text-[11px] font-mono font-bold text-[#25343F]">
                {featureSlide} / 3
              </div>
            </div>

            {/* Slide Content */}
            <div className="min-h-[260px] flex flex-col justify-center space-y-2.5">
              {featureSlide === 1 && (
                <>
                  <div className="p-3 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 text-[#059669] flex items-center justify-center shrink-0">
                      <BuildingStorefrontIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">KASIR &amp; SCAN BARCODE</div>
                      <div className="text-[11px] text-[#898989]">Kelola transaksi penjualan dengan cepat. Mendukung scan barcode produk.</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FF9B51]/15 text-[#D97706] flex items-center justify-center shrink-0">
                      <ClipboardDocumentListIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">PESANAN</div>
                      <div className="text-[11px] text-[#898989]">Kelola dan pantau pesanan kustom &amp; nota SPK dengan lebih mudah.</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 text-[#7C3AED] flex items-center justify-center shrink-0">
                      <UsersIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">PELANGGAN</div>
                      <div className="text-[11px] text-[#898989]">Simpan riwayat kontak pelanggan dan pesanan loyalitas.</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0B90FE]/15 text-[#0284C7] flex items-center justify-center shrink-0">
                      <CubeIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">PRODUK</div>
                      <div className="text-[11px] text-[#898989]">Kelola katalog produk, harga jual, stok, dan barcode barang.</div>
                    </div>
                  </div>
                </>
              )}

              {featureSlide === 2 && (
                <>
                  <div className="p-3 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 text-[#D97706] flex items-center justify-center shrink-0">
                      <CalculatorIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">HITUNG HPP</div>
                      <div className="text-[11px] text-[#898989]">Bantu menghitung harga pokok produksi (BOM, bahan, tenaga, mesin).</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 text-[#4F46E5] flex items-center justify-center shrink-0">
                      <Square3Stack3DIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">BAHAN BAKU</div>
                      <div className="text-[11px] text-[#898989]">Kelola bahan baku yang digunakan dalam bisnis dan supplier.</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0D9488]/15 text-[#0F766E] flex items-center justify-center shrink-0">
                      <WalletIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">ARUS KAS</div>
                      <div className="text-[11px] text-[#898989]">Pantau pemasukan, pengeluaran operasional, dan saldo kas usaha.</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F43F5E]/15 text-[#E11D48] flex items-center justify-center shrink-0">
                      <ArrowTrendingUpIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">LAPORAN &amp; ANALISIS</div>
                      <div className="text-[11px] text-[#898989]">Lihat ringkasan omzet, laba rugi, dan tren perkembangan bisnis.</div>
                    </div>
                  </div>
                </>
              )}

              {featureSlide === 3 && (
                <>
                  <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#25343F]/10 text-[#25343F] flex items-center justify-center shrink-0">
                      <Cog6ToothIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">PENGATURAN &amp; TEMA</div>
                      <div className="text-[11px] text-[#898989]">Atur format nota struk, faktur invoice, pajak, diskon, dan tema aplikasi.</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FF9B51]/15 text-[#D97706] flex items-center justify-center shrink-0">
                      <BuildingStorefrontIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">PROFIL BISNIS</div>
                      <div className="text-[11px] text-[#898989]">Identitas usaha yang akan otomatis tampil pada nota kasir dan dokumen.</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/50 border border-[#BFC9D1]/20 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 text-[#059669] flex items-center justify-center shrink-0">
                      <CloudArrowUpIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-[#25343F]">CADANGAN &amp; SINKRONISASI</div>
                      <div className="text-[11px] text-[#898989]">Backup database lokal &amp; sinkronisasi multi-device dengan Supabase.</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#BFC9D1]/20 gap-3">
              <button
                type="button"
                onClick={goToPrevStep}
                className="px-4 py-2.5 rounded-xl border border-[#BFC9D1]/30 text-xs font-bold text-[#898989] hover:bg-[#EAEFEF] cursor-pointer"
              >
                Kembali
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('profile')}
                  className="px-3 py-2.5 text-xs font-bold text-[#898989] hover:text-[#25343F] cursor-pointer"
                >
                  Lewati
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-5 py-2.5 bg-[#25343F] hover:bg-[#1B2730] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>{featureSlide === 3 ? 'Setup Profil' : 'Berikutnya'}</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. STEP: SETUP PROFIL BISNIS                                */}
        {/* ============================================================ */}
        {currentStep === 'profile' && (
          <div className="bg-white rounded-3xl border border-[#BFC9D1]/30 shadow-lg p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="pb-2 border-b border-[#BFC9D1]/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF9B51]">
                Langkah 1 dari 2
              </span>
              <h3 className="text-lg font-black text-[#25343F]">
                Setup Profil Bisnis
              </h3>
              <p className="text-xs text-[#898989] mt-0.5">
                Identitas ini akan tampil pada nota kasir, invoice pesanan, dan laporan tokomu.
              </p>
            </div>

            <form onSubmit={handleSaveProfileAndContinue} className="space-y-3.5 text-xs">
              {/* Logo / Foto Profil Upload */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#F8FAFC] border border-[#BFC9D1]/25">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#BFC9D1]/40 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {profileForm.logoUrl ? (
                    <img src={profileForm.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <BuildingStorefrontIcon className="w-6 h-6 text-[#898989]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-[#25343F]">Foto Profil / Logo Toko</div>
                  <div className="text-[10px] text-[#898989] mt-0.5">Format JPG/PNG/WebP, maks 10MB</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="px-2.5 py-1 bg-white border border-[#BFC9D1]/40 hover:bg-[#EAEFEF] text-[#25343F] font-bold rounded-lg text-[11px] shadow-2xs transition-colors cursor-pointer"
                    >
                      {isUploadingLogo ? 'Mengunggah...' : 'Unggah Foto'}
                    </button>
                    {profileForm.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setProfileForm(prev => ({ ...prev, logoUrl: '' }))}
                        className="p-1 text-[#E11D48] hover:bg-[#E11D48]/10 rounded-lg transition-colors"
                        title="Hapus Logo"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nama Toko * (Satu-satunya yang wajib) */}
              <div>
                <label className="block font-bold text-[#25343F] mb-1">
                  Nama Studio / Toko <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.businessName}
                  onChange={e => setProfileForm(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Contoh: Sukunaru Studio"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-bold text-[#25343F] focus:bg-white focus:border-[#FF9B51] outline-none"
                />
              </div>

              {/* Slogan */}
              <div>
                <label className="block font-bold text-[#25343F] mb-1">
                  Slogan / Tagline
                </label>
                <input
                  type="text"
                  value={profileForm.tagline || ''}
                  onChange={e => setProfileForm(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Contoh: Solusi Usaha & Layanan Kreatif"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] focus:bg-white focus:border-[#FF9B51] outline-none"
                />
              </div>

              {/* No Telepon & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">
                    No. Telepon Toko
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone || ''}
                    onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] focus:bg-white focus:border-[#FF9B51] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">
                    WhatsApp Customer Service
                  </label>
                  <input
                    type="text"
                    value={profileForm.whatsapp || ''}
                    onChange={e => setProfileForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="0895-1920-3345"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] focus:bg-white focus:border-[#FF9B51] outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-[#25343F] mb-1">
                  Email Bisnis
                </label>
                <input
                  type="email"
                  value={profileForm.email || ''}
                  onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="bisnisanda@gmail.com"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] focus:bg-white focus:border-[#FF9B51] outline-none"
                />
              </div>

              {/* Alamat */}
              <div>
                <label className="block font-bold text-[#25343F] mb-1">
                  Alamat Lengkap Workshop / Toko
                </label>
                <textarea
                  rows={2}
                  value={profileForm.address || ''}
                  onChange={e => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Jl. Raya Utama No. 88, Indonesia"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] focus:bg-white focus:border-[#FF9B51] outline-none resize-none"
                />
              </div>

              <div className="text-[10px] text-[#898989] italic">
                * Rekening bank dan detail lainnya dapat dilengkapi nanti di menu Pengaturan.
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#BFC9D1]/20 gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('license')}
                  className="px-4 py-2.5 rounded-xl border border-[#BFC9D1]/30 text-xs font-bold text-[#898989] hover:bg-[#EAEFEF] cursor-pointer"
                >
                  Lewati
                </button>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 bg-[#25343F] hover:bg-[#1B2730] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan & Lanjut'}</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. STEP: AKTIVASI LICENSE KEY (OPTIONAL & NON-BLOCKING)       */}
        {/* ============================================================ */}
        {currentStep === 'license' && (
          <div className="bg-white rounded-3xl border border-[#BFC9D1]/30 shadow-lg p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="pb-2 border-b border-[#BFC9D1]/20 text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#10B981]/15 text-[#059669] flex items-center justify-center mx-auto mb-2">
                <KeyIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981]">
                Aktivasi Lisensi (Opsional)
              </span>
              <h3 className="text-xl font-black text-[#25343F]">
                Sudah punya License Key?
              </h3>
              <p className="text-xs text-[#898989]">
                Masukkan License Key untuk mengaktifkan aplikasi secara penuh.
              </p>
            </div>

            {licenseStatus === 'active' || licenseStatus === 'success' ? (
              <div className="p-4 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669]">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>✓ License Key Aktif</span>
                </div>
                <p className="text-xs text-[#25343F]">
                  Aplikasi telah teraktivasi dan seluruh fitur siap digunakan.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95"
                  >
                    Lanjutkan ke Izin Aplikasi →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleActivateLicense} className="space-y-4">
                <div>
                  <label className="block font-bold text-[#25343F] text-xs mb-1">
                    Masukkan License Key
                  </label>
                  <input
                    type="text"
                    value={serialKeyInput}
                    onChange={handleFormatSerialKey}
                    placeholder="SKNR-XXXX-XXXX-XXXX"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#BFC9D1]/40 rounded-xl text-sm font-mono font-bold text-[#25343F] uppercase tracking-wider focus:bg-white focus:border-[#10B981] outline-none text-center"
                  />
                  {licenseStatus === 'error' && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#E11D48] font-bold">
                      <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{licenseErrorMessage}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={isActivating || !serialKeyInput.trim()}
                    className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <ShieldCheckIcon className="w-4 h-4 stroke-[2.5]" />
                    <span>{isActivating ? 'Memverifikasi...' : 'Aktifkan Sekarang'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="w-full py-2.5 text-xs font-bold text-[#898989] hover:text-[#25343F] cursor-pointer"
                  >
                    Lewati untuk Sekarang
                  </button>
                </div>
              </form>
            )}

            <div className="text-[10px] text-[#898989] text-center">
              Kamu tetap dapat mengaktivasi License Key kapan saja melalui menu Profil → Aktivasi.
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. STEP: INFORMASI PERMISSION                                */}
        {/* ============================================================ */}
        {currentStep === 'permissions' && (
          <div className="bg-white rounded-3xl border border-[#BFC9D1]/30 shadow-lg p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="pb-2 border-b border-[#BFC9D1]/20 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B90FE]">
                Izin Perangkat
              </span>
              <h3 className="text-xl font-black text-[#25343F]">
                Beberapa izin diperlukan
              </h3>
              <p className="text-xs text-[#898989]">
                Izin hanya akan diminta pada saat kamu menggunakan fitur terkait.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/60 border border-[#BFC9D1]/25 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0B90FE]/15 text-[#0284C7] flex items-center justify-center shrink-0">
                  <CameraIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-[#25343F]">Kamera</h4>
                  <p className="text-[11px] text-[#898989] mt-0.5">
                    Digunakan untuk fitur scan barcode produk saat transaksi kasir.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/60 border border-[#BFC9D1]/25 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 text-[#7C3AED] flex items-center justify-center shrink-0">
                  <FolderIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-[#25343F]">File &amp; Media</h4>
                  <p className="text-[11px] text-[#898989] mt-0.5">
                    Digunakan untuk menyimpan atau membagikan file seperti nota JPG dan laporan PDF.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0B90FE]/8 border border-[#0B90FE]/20 text-[11px] text-[#0284C7] flex items-start gap-2">
              <SparklesIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Transparan &amp; Aman:</strong> Izin di atas tidak diminta sekaligus sekarang, melainkan saat Anda pertama kali menekan tombol kamera atau tombol unduh.
              </span>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={goToNextStep}
                className="w-full py-3 bg-[#25343F] hover:bg-[#1B2730] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Lanjut</span>
                <ArrowRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 7. STEP: SELESAI                                             */}
        {/* ============================================================ */}
        {currentStep === 'done' && (
          <div className="bg-white rounded-3xl border border-[#BFC9D1]/30 shadow-lg p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-[#10B981]/15 text-[#059669] flex items-center justify-center mx-auto shadow-md">
              <CheckCircleIcon className="w-12 h-12 stroke-[2]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#059669] text-xs font-bold">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Kelola bisnis, jadi lebih mudah.</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#25343F] tracking-tight">
                BisnisUrang siap digunakan
              </h1>
              <p className="text-xs sm:text-sm text-[#898989] font-medium max-w-sm mx-auto leading-relaxed">
                Semua sudah siap. Yuk mulai kelola bisnis kamu sekarang!
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={onComplete}
                className="w-full py-3.5 bg-[#25343F] hover:bg-[#1B2730] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <span>Mulai Gunakan BisnisUrang</span>
                <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER / COPYRIGHT ── */}
      <div className="max-w-xl w-full mx-auto text-center py-1">
        <p className="text-[10px] text-[#898989] font-medium">
          BisnisUrang © {new Date().getFullYear()} — Solusi Operasional &amp; Manajemen Bisnis
        </p>
      </div>
    </div>
  );
};
