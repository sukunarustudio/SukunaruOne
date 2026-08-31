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

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'BARU':
      // Primary 100 soft cream + Primary 400 border + bold orange text
      return 'bg-[#FFF3E8] text-[#C25400] border-[#FFB27D] font-bold';
    case 'DIPROSES':
      // Semantic Info (#0890FE) = sedang aktif dikerjakan
      return 'bg-[#0890FE]/10 text-[#0890FE] border-[#0890FE]/30 font-bold';
    case 'SIAP DIAMBIL':
      // Semantic Accent (#FB6B18) / Navy milestone
      return 'bg-[#25343F] text-white border-[#25343F] font-bold';
    case 'SELESAI':
      // Neutral Mist / Success subtle
      return 'bg-[#EAEFEF] text-[#25343F] border-[#BFC9D1] font-bold';
    case 'BATAL':
      // Semantic Danger (#FF4267) = dibatalkan
      return 'bg-[#FF4267]/15 text-[#FF4267] border-[#FF4267]/30 font-bold';
    case 'LUNAS':
      // Neutral Mist / Success subtle
      return 'bg-[#EAEFEF] text-[#25343F] border-[#BFC9D1]/50 font-bold';
    case 'DP':
      // Semantic Warning (#FFAF2A) = butuh pelunasan
      return 'bg-[#FFAF2A]/15 text-[#b45309] border-[#FFAF2A]/40 font-bold';
    case 'BELUM_BAYAR':
      // Primary 200 soft peach + Primary 300 border + orange text
      return 'bg-[#FFE6D6] text-[#C25400] border-[#FFCCA8] font-bold';
    case 'HABIS':
      // Semantic Danger (#FF4267) = stok habis
      return 'bg-[#FF4267]/15 text-[#FF4267] border-[#FF4267]/30 font-bold';
    case 'MENIPIS':
    case 'STOK MENIPIS':
      // Semantic Warning (#FFAF2A) = stok menipis
      return 'bg-[#FFAF2A]/15 text-[#b45309] border-[#FFAF2A]/40 font-bold';
    case 'AMAN':
      // Semantic Success (#52D5BA) = stok aman
      return 'bg-[#52D5BA]/20 text-[#0f766e] border-[#52D5BA]/40 font-bold';
    default:
      return 'bg-[#EAEFEF] text-[#898989] border-[#BFC9D1] font-bold';
  }
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
