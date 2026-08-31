import React, { useState, useRef } from 'react';
import {
  ArrowLeftIcon,
  CircleStackIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ViewType, BusinessSettings } from '../types';
import { downloadJsonFile } from '../lib/fileDownloader';

interface BackupRestoreViewProps {
  onNavigate?: (view: ViewType) => void;
  onUpdateSettings?: (settings: BusinessSettings) => void;
  onRefreshDashboard?: () => void;
  onResetSampleData?: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  onNavigate,
  onUpdateSettings,
  onRefreshDashboard,
  onResetSampleData,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearingTransactions, setIsClearingTransactions] = useState(false);
  const [isClearTransactionsConfirmOpen, setIsClearTransactionsConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Full Database Backup Download (.json)
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

  // Trigger file picker
  const handleSelectRestoreFile = () => {
    fileInputRef.current?.click();
  };

  // Handle file restore
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsRestoring(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await api.restoreDatabase(parsed);
      showToast(res.message || 'Database berhasil dipulihkan!', 'success');

      if (parsed.settings && onUpdateSettings) {
        onUpdateSettings(parsed.settings);
      }
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Format file backup tidak valid', 'error');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Clear / Reset All Transactions
  const handleClearAllTransactions = async () => {
    try {
      setIsClearingTransactions(true);
      const res = await api.clearAllTransactions({ resetExpenses: true, resetMovements: true });
      showToast(res.message || 'Semua riwayat transaksi berhasil dihapus dan direset!', 'success');
      setIsClearTransactionsConfirmOpen(false);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset transaksi', 'error');
    } finally {
      setIsClearingTransactions(false);
    }
  };

  return (
    <div id="backup-restore-view" className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-24 select-none">
      {/* Hidden File Input for JSON Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json,application/json"
        className="hidden"
      />

      {/* ── STICKY TOP HEADER: [ ← Judul ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate?.('profile')}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
            title="Kembali ke Profil"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Cadangan & Pemulihan Data
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Manajemen cadangan offline database SQLite Sukunaru Studio
            </p>
          </div>
        </div>
      </div>

      {/* ── INFO BANNER: Local-First Offline Database ── */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-5 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#25343F] text-white flex items-center justify-center shrink-0 shadow-md">
            <CircleStackIcon className="w-6 h-6 text-[#FF9B51]" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm sm:text-base text-[#25343F]">
                Database Lokal (Local-First)
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                <ShieldCheckIcon className="w-3 h-3" /> Offline Aman
              </span>
            </div>
            <p className="text-xs text-[#898989] leading-relaxed">
              Seluruh data transaksi kasir, pesanan kerja, pelanggan, inventaris bahan, dan laporan keuangan tersimpan aman di komputer Anda secara mandiri tanpa memerlukan koneksi internet.
            </p>
          </div>
        </div>
      </div>

      {/* ── 2 KARTU UTAMA: UNDUH & PULIHKAN ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Unduh Cadangan JSON */}
        <div className="bg-white p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shadow-xs">
              <ArrowDownTrayIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#25343F]">
                Unduh Cadangan Database
              </h3>
              <p className="text-[#898989] text-xs mt-1 leading-relaxed">
                Ekspor seluruh data bisnis ke dalam satu file backup JSON terenkripsi secara instan untuk diarsipkan di harddisk atau flashdisk.
              </p>
            </div>
          </div>

          <button
            id="btn-download-full-backup"
            type="button"
            disabled={isDownloadingBackup}
            onClick={handleDownloadFullBackup}
            className="w-full py-2.5 px-4 bg-[#FF9B51] hover:bg-[#ff8c38] disabled:opacity-50 text-[#25343F] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
          >
            {isDownloadingBackup ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowDownTrayIcon className="w-4 h-4" />
            )}
            <span>{isDownloadingBackup ? 'Menyiapkan Data...' : 'Unduh Backup (.json)'}</span>
          </button>
        </div>

        {/* Card 2: Pulihkan Database dari File */}
        <div className="bg-white p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shadow-xs">
              <DocumentArrowUpIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#25343F]">
                Pulihkan Database dari File
              </h3>
              <p className="text-[#898989] text-xs mt-1 leading-relaxed">
                Impor file cadangan JSON yang telah Anda miliki untuk memulihkan seluruh data atau memindahkan toko ke perangkat komputer baru.
              </p>
            </div>
          </div>

          <button
            id="btn-restore-full-backup"
            type="button"
            disabled={isRestoring}
            onClick={handleSelectRestoreFile}
            className="w-full py-2.5 px-4 bg-[#FF9B51] hover:bg-[#ff8c38] disabled:opacity-50 text-[#25343F] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
          >
            {isRestoring ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUpTrayIcon className="w-4 h-4" />
            )}
            <span>{isRestoring ? 'Memulihkan Data...' : 'Pilih File Backup (.json)'}</span>
          </button>
        </div>
      </div>

      {/* ── ZONA BAHAYA & MANAJEMEN DATA ── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#FF9B51]/40 shadow-md space-y-4">
        <div className="border-b border-[#FF9B51]/30 pb-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFE6D6] text-[#c45e00] flex items-center justify-center shrink-0">
            <ExclamationTriangleIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-sm text-[#c45e00]">
              Zona Bahaya & Manajemen Transaksi
            </h3>
            <p className="text-[#898989] text-[11px]">
              Tindakan di bawah ini bersifat permanen. Harap berhati-hati.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Action 1: Hapus & Reset Semua Riwayat Transaksi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 bg-[#FF9B51]/8 rounded-xl border border-[#FF9B51]/30">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 font-bold text-rose-950 text-xs sm:text-sm">
                <TrashIcon className="w-4 h-4 text-[#c45e00] shrink-0" />
                <span>Hapus & Reset Riwayat Transaksi</span>
              </div>
              <p className="text-[#898989] text-[11px] leading-relaxed">
                Menghapus semua riwayat kasir (POS), pesanan kerja, pengeluaran operasional, dan arus kas. <strong>Katalog produk, bahan baku, dan pelanggan tetap aman tersimpan.</strong>
              </p>
            </div>

            <button
              id="btn-clear-all-transactions"
              type="button"
              disabled={isClearingTransactions}
              onClick={() => setIsClearTransactionsConfirmOpen(true)}
              className="px-4 py-2.5 bg-[#FF9B51] hover:bg-[#ff8c38] disabled:opacity-50 text-[#25343F] rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 shadow-md shrink-0 active:scale-95"
            >
              {isClearingTransactions ? (
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <TrashIcon className="w-3.5 h-3.5" />
              )}
              <span>{isClearingTransactions ? 'Mereset...' : 'Hapus Semua Transaksi'}</span>
            </button>
          </div>

          {/* Action 2: Reset Sample Data Demo */}
          {onResetSampleData && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 font-bold text-[#25343F] text-xs sm:text-sm">
                  <ArrowPathIcon className="w-4 h-4 text-[#898989] shrink-0" />
                  <span>Reset Database ke Contoh Demo</span>
                </div>
                <p className="text-[#898989] text-[11px] leading-relaxed">
                  Mengisi ulang database dengan produk demo, bahan baku sampel, dan simulasi transaksi bawaan Sukunaru Studio.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-4 py-2 bg-white hover:bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25 rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 shadow-md shrink-0 active:scale-95"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                <span>Reset Sample Data</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog: Clear All Transactions */}
      <ConfirmDialog
        isOpen={isClearTransactionsConfirmOpen}
        title="Hapus Seluruh Riwayat Transaksi?"
        message="Apakah Anda yakin ingin menghapus SEMUA data transaksi kasir (POS), pesanan kerja, pengeluaran, dan buku kas arus kas? Tindakan ini akan mengosongkan statistik laporan dan omset menjadi Rp0. Data produk, bahan baku, dan daftar pelanggan tetap aman tersimpan."
        confirmLabel="Ya, Hapus Semua Transaksi"
        onConfirm={handleClearAllTransactions}
        onCancel={() => setIsClearTransactionsConfirmOpen(false)}
      />

      {/* Confirmation Dialog: Reset Sample Data */}
      {onResetSampleData && (
        <ConfirmDialog
          isOpen={isResetConfirmOpen}
          title="Reset Data ke Contoh Demo?"
          message="Apakah Anda yakin ingin memuat ulang sample data Sukunaru Studio? Seluruh data saat ini akan digantikan dengan data contoh default."
          confirmLabel="Ya, Reset Sample Data"
          onConfirm={() => {
            setIsResetConfirmOpen(false);
            onResetSampleData();
          }}
          onCancel={() => setIsResetConfirmOpen(false)}
        />
      )}
    </div>
  );
};
