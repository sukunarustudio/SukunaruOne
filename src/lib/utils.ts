import { ProductComponent } from '../types';
import { downloadCsvFile } from './fileDownloader';

export function formatRupiah(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Rp0';
  }
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${formatted}`;
}

export function parseRupiahInput(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const cleaned = value.replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatDate(date?: string | Date): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return typeof date === 'string' ? date : '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return typeof date === 'string' ? date : '-';
  }
}

export function formatDateTime(date?: string | Date): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return typeof date === 'string' ? date : '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return typeof date === 'string' ? date : '-';
  }
}

export function formatShortDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDeadlineOverdue(deadlineStr: string, status: string): boolean {
  if (status === 'SELESAI' || status === 'BATAL') return false;
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr);
  const now = new Date();
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime() < now.getTime();
}

export function isDeadlineToday(deadlineStr: string, status: string): boolean {
  if (status === 'SELESAI' || status === 'BATAL') return false;
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr);
  const now = new Date();
  return (
    deadline.getFullYear() === now.getFullYear() &&
    deadline.getMonth() === now.getMonth() &&
    deadline.getDate() === now.getDate()
  );
}

export function formatPaymentStatus(status?: string): string {
  if (!status) return 'BELUM BAYAR';
  const clean = status.replace(/_/g, ' ').toUpperCase().trim();
  if (clean === 'BELUM BAYAR' || clean === 'UNPAID') return 'BELUM BAYAR';
  return clean;
}

export function formatOrderStatus(status?: string): string {
  if (!status) return 'Menunggu';
  const norm = status.toUpperCase().trim();
  switch (norm) {
    case 'BARU':
    case 'MENUNGGU':
      return 'Menunggu';
    case 'DIPROSES':
    case 'PROSES':
      return 'Diproses';
    case 'SIAP DIAMBIL':
    case 'SIAP':
      return 'Siap Diambil';
    case 'SELESAI':
      return 'Selesai';
    case 'BATAL':
    case 'DIBATALKAN':
      return 'Dibatalkan';
    default:
      return status;
  }
}

export function getStatusBadgeClass(status: string): string {
  const norm = (status || '').toUpperCase().trim();
  switch (norm) {
    case 'BARU':
    case 'MENUNGGU':
      // Soft Amber/Warm Yellow
      return 'bg-amber-50 text-amber-800 border border-amber-200/80 font-bold';
    case 'DIPROSES':
    case 'PROSES':
      // Soft Sky/Blue
      return 'bg-sky-50 text-sky-800 border border-sky-200/80 font-bold';
    case 'SIAP DIAMBIL':
    case 'SIAP':
      // Soft Indigo/Purple
      return 'bg-indigo-50 text-indigo-800 border border-indigo-200/80 font-bold';
    case 'SELESAI':
      // Soft Emerald/Green
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold';
    case 'BATAL':
    case 'DIBATALKAN':
      // Soft Rose/Red
      return 'bg-rose-50 text-rose-700 border border-rose-200/80 font-bold';
    case 'LUNAS':
      // Soft Emerald/Green
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold';
    case 'DP':
      // Soft Amber
      return 'bg-amber-50 text-amber-800 border border-amber-200/80 font-bold';
    case 'BELUM_BAYAR':
    case 'BELUM BAYAR':
      // Soft Rose/Orange
      return 'bg-rose-50 text-rose-700 border border-rose-200/80 font-bold';
    case 'HABIS':
      return 'bg-rose-50 text-rose-700 border border-rose-200/80 font-bold';
    case 'MENIPIS':
    case 'STOK MENIPIS':
      return 'bg-amber-50 text-amber-800 border border-amber-200/80 font-bold';
    case 'AMAN':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold';
    default:
      return 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/50 font-bold';
  }
}

export type PaperSize = 'a5' | 'a4' | 'f4';

export interface PaperDimension {
  id: PaperSize;
  name: string;
  label: string;
  shortLabel: string;
  widthMm: number;
  heightMm: number;
  widthPx: number; // Width in CSS px for preview (A5: 560px, A4/F4: 794px)
}

export const PAPER_CONFIGS: Record<PaperSize, PaperDimension> = {
  a5: {
    id: 'a5',
    name: 'A5',
    label: 'A5 — 148 × 210 mm (Default)',
    shortLabel: 'A5 (148×210mm)',
    widthMm: 148,
    heightMm: 210,
    widthPx: 560,
  },
  a4: {
    id: 'a4',
    name: 'A4',
    label: 'A4 — 210 × 297 mm',
    shortLabel: 'A4 (210×297mm)',
    widthMm: 210,
    heightMm: 297,
    widthPx: 794,
  },
  f4: {
    id: 'f4',
    name: 'F4',
    label: 'F4 — 210 × 330 mm (Folio)',
    shortLabel: 'F4 (210×330mm)',
    widthMm: 210,
    heightMm: 330,
    widthPx: 794,
  },
};

/**
 * Reusable payment status color mapping with SOLID BACKGROUND and WHITE TEXT for Faktur, Invoice, SPK, and Print outputs.
 * - LUNAS -> Solid green (#15803d) + White text
 * - DP / SEBAGIAN -> Solid orange/amber (#ea580c) + White text
 * - BELUM BAYAR -> Solid red/rose (#dc2626) + White text
 * - BATAL / REFUND -> Solid dark slate (#475569) + White text
 */
export function getPrintStatusBadgeStyle(status?: string, remainingAmount: number = 0): {
  bgHex: string;
  textHex: string;
  label: string;
  className: string;
  style: React.CSSProperties;
} {
  const norm = (status || '').toUpperCase().trim().replace(/_/g, ' ');
  if (norm === 'LUNAS' || norm === 'PAID' || (remainingAmount <= 0 && norm !== 'BATAL' && norm !== 'DIBATALKAN' && norm !== 'REFUND')) {
    return {
      bgHex: '#15803d',
      textHex: '#ffffff',
      label: 'LUNAS',
      className: 'bg-[#15803d] text-white',
      style: {
        backgroundColor: '#15803d',
        color: '#ffffff',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      },
    };
  }
  if (norm === 'DP' || norm === 'SEBAGIAN' || norm === 'PARTIAL' || norm === 'UANG MUKA') {
    return {
      bgHex: '#ea580c',
      textHex: '#ffffff',
      label: 'DP / SEBAGIAN',
      className: 'bg-[#ea580c] text-white',
      style: {
        backgroundColor: '#ea580c',
        color: '#ffffff',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      },
    };
  }
  if (norm === 'BATAL' || norm === 'DIBATALKAN' || norm === 'CANCELED' || norm === 'REFUND') {
    return {
      bgHex: '#475569',
      textHex: '#ffffff',
      label: norm === 'REFUND' ? 'REFUND' : 'DIBATALKAN',
      className: 'bg-[#475569] text-white',
      style: {
        backgroundColor: '#475569',
        color: '#ffffff',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      },
    };
  }
  // Default: BELUM BAYAR
  return {
    bgHex: '#dc2626',
    textHex: '#ffffff',
    label: 'BELUM BAYAR',
    className: 'bg-[#dc2626] text-white',
    style: {
      backgroundColor: '#dc2626',
      color: '#ffffff',
      WebkitPrintColorAdjust: 'exact',
      printColorAdjust: 'exact',
    },
  };
}


export function calculateHppFromComponents(
  components: ProductComponent[] = [],
  laborCost = 0,
  machineCost = 0,
  otherCost = 0
): { materialHpp: number; totalHpp: number } {
  const materialHpp = components.reduce((sum, c) => sum + (c.subtotal || 0), 0);
  const totalHpp = materialHpp + (laborCost || 0) + (machineCost || 0) + (otherCost || 0);
  return { materialHpp, totalHpp };
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      row
        .map(cell => {
          const str = cell !== undefined && cell !== null ? String(cell) : '';
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  downloadCsvFile(csvContent, filename);
}
