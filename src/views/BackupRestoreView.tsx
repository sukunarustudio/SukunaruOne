import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftIcon,
  CircleStackIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ViewType, BusinessSettings } from '../types';
import { downloadJsonFile } from '../lib/fileDownloader';
import { isSupabaseConfigured, uploadTenantFile, listTenantBackups, downloadTenantBackup, deleteTenantFile } from '../services/supabaseClient';
import {
  syncWithSupabase,
  getSyncState,
  subscribeSyncState,
  SyncState,
  getActiveLicenseKey,
  subscribeToRealtimeChanges,
} from '../services/syncManager';

interface BackupRestoreViewProps {
  onNavigate?: (view: ViewType) => void;
  onUpdateSettings?: (settings: BusinessSettings) => void;
  onRefreshDashboard?: () => void;
  onResetSampleData?: () => void;
  previousView?: ViewType;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  onNavigate,
  onUpdateSettings,
  onRefreshDashboard,
  onResetSampleData,
  previousView = 'profile',
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOCAL BACKUP STATE ---
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearingTransactions, setIsClearingTransactions] = useState(false);
  const [isClearTransactionsConfirmOpen, setIsClearTransactionsConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // --- CLOUD BACKUP SNAPSHOTS STATE ---
  const [isCreatingCloudBackup, setIsCreatingCloudBackup] = useState(false);
  const [isRestoringCloudBackup, setIsRestoringCloudBackup] = useState(false);
  const [isDeletingCloudBackup, setIsDeletingCloudBackup] = useState(false);
  const [cloudBackups, setCloudBackups] = useState<Array<{ name: string; size: number; createdAt: string; path: string }>>([]);
  const [selectedCloudBackupToRestore, setSelectedCloudBackupToRestore] = useState<{ name: string; path: string } | null>(null);

  // --- CLOUD SYNC STATE ---
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());

  const fetchCloudBackups = async () => {
    if (!isSupabaseConfigured()) return;
    const licenseKey = getActiveLicenseKey();
    const list = await listTenantBackups(licenseKey);
    setCloudBackups(list);
  };

  useEffect(() => {
    const unsubscribe = subscribeSyncState(s => setSyncState(s));
    fetchCloudBackups();
    return () => unsubscribe();
  }, []);

  const handleCreateCloudBackup = async () => {
    if (!isSupabaseConfigured()) {
      showToast('Cloud Supabase belum terhubung.', 'error');
      return;
    }
    try {
      setIsCreatingCloudBackup(true);
      const dbData = await api.getBackupData();
      const licenseKey = getActiveLicenseKey();
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `backup_cloud_${dateStr}.json`;
      const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });

      const res = await uploadTenantFile(licenseKey, 'backups', blob, fileName);
      if (res.success) {
        showToast('Snapshot database online berhasil dicadangkan ke Cloud!', 'success');
        await fetchCloudBackups();
      } else {
        showToast(res.error || 'Gagal mencadangkan ke cloud', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat cadangan online', 'error');
    } finally {
      setIsCreatingCloudBackup(false);
    }
  };

  const handleRestoreFromCloudBackup = async (backupPath: string) => {
    try {
      setIsRestoringCloudBackup(true);
      const res = await downloadTenantBackup(backupPath);
      if (!res.success || !res.data) {
        showToast(res.error || 'Gagal mengunduh file cadangan cloud', 'error');
        return;
      }
      const restoreRes = await api.restoreDatabase(res.data);
      showToast(restoreRes.message || 'Database berhasil dipulihkan dari Cloud!', 'success');
      if (res.data.settings && onUpdateSettings) onUpdateSettings(res.data.settings);
      if (onRefreshDashboard) onRefreshDashboard();
      setSelectedCloudBackupToRestore(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal memulihkan database', 'error');
    } finally {
      setIsRestoringCloudBackup(false);
    }
  };

  const handleDeleteCloudBackup = async (backupPath: string) => {
    try {
      setIsDeletingCloudBackup(true);
      const licenseKey = getActiveLicenseKey();
      await deleteTenantFile(licenseKey, backupPath);
      showToast('File cadangan cloud berhasil dihapus.', 'success');
      await fetchCloudBackups();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus file cadangan', 'error');
    } finally {
      setIsDeletingCloudBackup(false);
    }
  };

  // --- LOCAL BACKUP HANDLERS ---
  const handleDownloadFullBackup = async () => {
    try {
      setIsDownloadingBackup(true);
      const dbData = await api.getBackupData();
      const filename = `sukunaru_studio_backup_${new Date().toISOString().slice(0, 10)}.json`;
      const result = await downloadJsonFile(dbData, filename);
      if (result.success) {
        showToast('File backup database lengkap berhasil disimpan!', 'success');
      } else {
        showToast(result.error || 'Gagal menyimpan backup database', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunduh backup database', 'error');
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  const handleSelectRestoreFile = () => fileInputRef.current?.click();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsRestoring(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await api.restoreDatabase(parsed);
      showToast(res.message || 'Database berhasil dipulihkan!', 'success');
      if (parsed.settings && onUpdateSettings) onUpdateSettings(parsed.settings);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Format file backup tidak valid', 'error');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearAllTransactions = async () => {
    try {
      setIsClearingTransactions(true);
      const res = await api.clearAllTransactions({ resetExpenses: true, resetMovements: true });
      showToast(res.message || 'Semua riwayat transaksi berhasil dihapus!', 'success');
      setIsClearTransactionsConfirmOpen(false);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset transaksi', 'error');
    } finally {
      setIsClearingTransactions(false);
    }
  };



  const handleTriggerSync = async () => {
    if (!isSupabaseConfigured()) {
      showToast('Konfigurasi Cloud Supabase belum lengkap!', 'error');
      return;
    }
    showToast('Memulai sinkronisasi dua arah dengan Supabase...', 'info');
    subscribeToRealtimeChanges(true);
    const res = await syncWithSupabase();
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success && onRefreshDashboard) onRefreshDashboard();
  };

  const configured = isSupabaseConfigured();
  const isSyncing = syncState.status === 'SYNCING';

  const getStatusBadge = () => {
    if (!configured) return { label: '○ Belum Dikonfigurasi', cls: 'bg-amber-100 text-amber-800' };
    switch (syncState.status) {
      case 'CONNECTED': return { label: '● Terhubung Realtime', cls: 'bg-emerald-100 text-emerald-800' };
      case 'SYNCING': return { label: '⟳ Menyinkronkan...', cls: 'bg-blue-100 text-blue-800' };
      case 'RECONNECTING': return { label: '⟳ Menghubungkan Ulang...', cls: 'bg-amber-100 text-amber-800' };
      case 'OFFLINE': return { label: '○ Offline', cls: 'bg-slate-100 text-slate-700' };
      case 'ERROR': return { label: '⚠ Gangguan Jaringan', cls: 'bg-rose-100 text-rose-800' };
      default: return { label: '● Terhubung', cls: 'bg-emerald-100 text-emerald-800' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div id="backup-cloud-sync-view" className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-28 select-none">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json,application/json"
        className="hidden"
      />

      {/* ── STICKY HEADER ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate?.(previousView || 'profile')}
          className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-black text-[#25343F] leading-tight tracking-tight truncate">
            Cadangan Data & Sinkronisasi Cloud
          </h1>
          <p className="text-[11px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
            Sinkronisasi real-time Supabase & cadangan database lokal
          </p>
        </div>
      </div>

      {/* ── INFO CARD BANNER (DI BAWAH TOP BAR) ── */}
      <div className="bg-gradient-to-br from-[#25343F] to-[#1E293B] text-white rounded-2xl p-4 sm:p-5 shadow-md">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#FF9B51]/20 border border-[#FF9B51]/40 flex items-center justify-center shrink-0">
            <SparklesIcon className="w-4 h-4 text-[#FF9B51]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm text-white">Pusat Cadangan & Sinkronisasi Studio</h3>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              Kelola keamanan data studio Anda dalam satu tempat: sinkronisasi otomatis antar-perangkat (Android, Tablet, PC) via Supabase Realtime, buat & pulihkan snapshot cadangan database online di Cloud Storage, serta ekspor/impor file cadangan lokal (.json) secara offline kapan saja.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BAGIAN 1: SINKRONISASI CLOUD                              */}
      {/* ═══════════════════════════════════════════════════════════ */}

      {/* Section divider */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-8 h-8 rounded-xl bg-[#25343F] flex items-center justify-center shrink-0">
          <CloudArrowUpIcon className="w-4 h-4 text-[#FF9B51]" />
        </div>
        <div>
          <h2 className="font-black text-sm text-[#25343F]">Sinkronisasi Cloud</h2>
          <p className="text-[11px] text-[#898989]">Real-time multi-perangkat via Supabase</p>
        </div>
        <span className={`ml-auto px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Cloud Status + Sync Button */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#25343F]">
            {configured ? `Cloud Sync: ${syncState.status}` : 'Cloud Sync Belum Dikonfigurasi'}
          </p>
          <p className="text-xs text-[#898989] mt-0.5">
            {syncState.lastSyncAt
              ? `Terakhir sinkron: ${new Date(syncState.lastSyncAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Belum pernah sinkronisasi'}
            {syncState.pendingCount > 0 && ` • ${syncState.pendingCount} data tertunda`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isCreatingCloudBackup || !configured}
            onClick={handleCreateCloudBackup}
            className="px-4 py-2.5 bg-[#25343F] hover:bg-[#1b262f] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <CloudArrowUpIcon className={`w-4 h-4 ${isCreatingCloudBackup ? 'animate-bounce' : ''}`} />
            <span>{isCreatingCloudBackup ? 'Mencadangkan...' : 'Cadangkan DB Online'}</span>
          </button>
          <button
            type="button"
            disabled={isSyncing || !configured}
            onClick={handleTriggerSync}
            className="px-4 py-2.5 bg-[#FF9B51] hover:bg-[#ff8c38] disabled:opacity-50 text-[#25343F] font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* ── DAFTAR SNAPSHOT CADANGAN ONLINE ── */}
      {configured && (
        <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CloudArrowUpIcon className="w-4 h-4 text-[#0284C7]" />
              <h3 className="font-bold text-xs sm:text-sm text-[#25343F]">Riwayat Snapshot Cadangan Online (Cloud)</h3>
            </div>
            <button
              type="button"
              onClick={fetchCloudBackups}
              className="text-[11px] font-bold text-[#FF6A00] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowPathIcon className="w-3 h-3" />
              <span>Muat Ulang</span>
            </button>
          </div>

          {cloudBackups.length === 0 ? (
            <p className="text-xs text-[#898989] py-3 text-center">
              Belum ada file snapshot cadangan online. Klik tombol <span className="font-bold text-[#25343F]">Cadangkan DB Online</span> di atas untuk membuat salinan aman di Cloud.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto space-y-1">
              {cloudBackups.map(cb => (
                <div key={cb.path} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono font-bold text-[#25343F] truncate">{cb.name}</p>
                    <p className="text-[10px] text-[#898989] mt-0.5">
                      {cb.createdAt ? new Date(cb.createdAt).toLocaleString('id-ID') : 'Cloud Backup'} • {(cb.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isRestoringCloudBackup}
                      onClick={() => setSelectedCloudBackupToRestore(cb)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-[11px] shadow-xs cursor-pointer active:scale-95"
                    >
                      Pulihkan
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingCloudBackup}
                      onClick={() => handleDeleteCloudBackup(cb.path)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Hapus Backup Cloud"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BAGIAN 2: CADANGAN DATABASE LOKAL                         */}
      {/* ═══════════════════════════════════════════════════════════ */}

      {/* Divider */}
      <div className="border-t border-[#BFC9D1]/40 pt-2" />

      <div className="flex items-center gap-3 px-1">
        <div className="w-8 h-8 rounded-xl bg-[#0284C7]/10 border border-[#0284C7]/20 flex items-center justify-center shrink-0">
          <CircleStackIcon className="w-4 h-4 text-[#0284C7]" />
        </div>
        <div>
          <h2 className="font-black text-sm text-[#25343F]">Cadangan Database Lokal</h2>
          <p className="text-[11px] text-[#898989]">Ekspor & pulihkan data secara offline (.json)</p>
        </div>
        <span className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
          <ShieldCheckIcon className="w-3 h-3" /> 100% Offline
        </span>
      </div>

      {/* 2 Items: Unduh & Pulihkan */}
      <div className="space-y-3">
        {/* Row Unduh */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
              <ArrowDownTrayIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-xs sm:text-sm text-[#25343F] truncate">Unduh Cadangan</h3>
              <p className="text-[#898989] text-[11px] sm:text-xs mt-0.5 truncate">
                Ekspor data bisnis ke file .json offline
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDownloadingBackup}
            onClick={handleDownloadFullBackup}
            className="px-3.5 py-2 bg-[#FF9B51] hover:bg-[#ff8c38] disabled:opacity-50 text-[#25343F] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
          >
            {isDownloadingBackup
              ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              : <ArrowDownTrayIcon className="w-3.5 h-3.5" />}
            <span>{isDownloadingBackup ? 'Menyiapkan...' : 'Unduh (.json)'}</span>
          </button>
        </div>

        {/* Row Pulihkan */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
              <DocumentArrowUpIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-xs sm:text-sm text-[#25343F] truncate">Pulihkan Database</h3>
              <p className="text-[#898989] text-[11px] sm:text-xs mt-0.5 truncate">
                Impor file .json untuk pemulihan data
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isRestoring}
            onClick={handleSelectRestoreFile}
            className="px-3.5 py-2 bg-[#25343F] hover:bg-[#1b262f] disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
          >
            {isRestoring
              ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              : <ArrowUpTrayIcon className="w-3.5 h-3.5" />}
            <span>{isRestoring ? 'Memulihkan...' : 'Pilih File (.json)'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Backup Restore Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(selectedCloudBackupToRestore)}
        title="Pulihkan Database dari Cloud?"
        message={`Apakah Anda yakin ingin memulihkan database dari snapshot cloud "${selectedCloudBackupToRestore?.name}"? Data saat ini di perangkat akan digantikan sesuai isi snapshot tersebut.`}
        confirmLabel={isRestoringCloudBackup ? 'Memulihkan...' : 'Ya, Pulihkan Sekarang'}
        isDanger={false}
        onConfirm={() => {
          if (selectedCloudBackupToRestore) {
            handleRestoreFromCloudBackup(selectedCloudBackupToRestore.path);
          }
        }}
        onCancel={() => setSelectedCloudBackupToRestore(null)}
      />
    </div>
  );
};
