import { Transaction, Order, Material, Expense, BusinessSettings } from '../types';
import { formatRupiah, formatDate, formatDateTime } from './utils';
import { downloadExcelFile, downloadCsvFile } from './fileDownloader';

/**
 * Escapes XML special characters.
 */
function escapeXml(str: any): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface ExcelColumnDef {
  width?: number; // In points (e.g. 120)
}

export interface ExcelTableDef {
  title?: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  types?: ('string' | 'number' | 'currency' | 'percent' | 'bold' | 'center')[];
  totals?: (string | number | null | undefined)[];
}

export interface ExcelSheetDef {
  name: string;
  title?: string;
  subtitle?: string;
  businessName?: string;
  dateInfo?: string;
  columns?: ExcelColumnDef[];
  tables: ExcelTableDef[];
}

/**
 * Builds a valid Microsoft Excel XML Spreadsheet 2003 workbook.
 * Fully compatible with Microsoft Excel (Windows/Mac/Android), Google Sheets, LibreOffice, and WPS Office.
 */
export function buildXmlSpreadsheetWorkbook(sheets: ExcelSheetDef[]): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>BisnisUrang</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9.5" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="CompanyTitle">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#25343F"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="ReportTitle">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FF6A00"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Subtitle">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Italic="1" ss:Color="#64748B"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SectionHeader">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#25343F"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#25343F" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="CellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellBold">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#25343F"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellNumber">
   <NumberFormat ss:Format="#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCurrency">
   <NumberFormat ss:Format="&quot;Rp&quot;#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellPercent">
   <NumberFormat ss:Format="0.0%"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalRowLabel">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#25343F"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#25343F"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#25343F"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalRowCurrency">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#25343F"/>
   <NumberFormat ss:Format="&quot;Rp&quot;#,##0"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#25343F"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#25343F"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalRowNumber">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#25343F"/>
   <NumberFormat ss:Format="#,##0"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#25343F"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#25343F"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
 </Styles>`;

  let worksheetsXml = '';

  for (const sheet of sheets) {
    const cleanSheetName = escapeXml(sheet.name.slice(0, 31)); // Excel max sheet name length is 31
    let tableXml = '  <Table>\n';

    // Columns config
    if (sheet.columns && sheet.columns.length > 0) {
      sheet.columns.forEach(col => {
        const width = col.width ? ` ss:Width="${col.width}"` : ' ss:Width="100"';
        tableXml += `   <Column${width}/>\n`;
      });
    } else {
      // Default columns
      tableXml += '   <Column ss:Width="50"/>\n';
      tableXml += '   <Column ss:Width="180"/>\n';
      tableXml += '   <Column ss:Width="110"/>\n';
      tableXml += '   <Column ss:Width="120"/>\n';
      tableXml += '   <Column ss:Width="120"/>\n';
      tableXml += '   <Column ss:Width="90"/>\n';
      tableXml += '   <Column ss:Width="140"/>\n';
    }

    // Header Meta rows
    if (sheet.businessName) {
      tableXml += `   <Row ss:Height="24">\n    <Cell ss:StyleID="CompanyTitle"><Data ss:Type="String">${escapeXml(sheet.businessName)}</Data></Cell>\n   </Row>\n`;
    }
    if (sheet.title) {
      tableXml += `   <Row ss:Height="20">\n    <Cell ss:StyleID="ReportTitle"><Data ss:Type="String">${escapeXml(sheet.title)}</Data></Cell>\n   </Row>\n`;
    }
    if (sheet.subtitle || sheet.dateInfo) {
      const sub = [sheet.subtitle, sheet.dateInfo ? `Periode: ${sheet.dateInfo}` : ''].filter(Boolean).join(' | ');
      tableXml += `   <Row ss:Height="18">\n    <Cell ss:StyleID="Subtitle"><Data ss:Type="String">${escapeXml(sub)}</Data></Cell>\n   </Row>\n`;
    }

    // Blank row
    tableXml += '   <Row ss:Height="10"/>\n';

    // Tables
    for (const tbl of sheet.tables) {
      if (tbl.title) {
        tableXml += `   <Row ss:Height="20">\n    <Cell ss:StyleID="SectionHeader"><Data ss:Type="String">${escapeXml(tbl.title)}</Data></Cell>\n   </Row>\n`;
      }
      if (tbl.subtitle) {
        tableXml += `   <Row ss:Height="16">\n    <Cell ss:StyleID="Subtitle"><Data ss:Type="String">${escapeXml(tbl.subtitle)}</Data></Cell>\n   </Row>\n`;
      }

      // Headers
      tableXml += '   <Row ss:Height="22">\n';
      tbl.headers.forEach(h => {
        tableXml += `    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`;
      });
      tableXml += '   </Row>\n';

      // Rows
      tbl.rows.forEach(row => {
        tableXml += '   <Row ss:Height="19">\n';
        row.forEach((cellVal, colIdx) => {
          const type = tbl.types?.[colIdx] || 'string';
          if (cellVal === null || cellVal === undefined || cellVal === '') {
            tableXml += '    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">-</Data></Cell>\n';
          } else if (type === 'currency' || (typeof cellVal === 'number' && type !== 'percent' && type !== 'number' && type !== 'center')) {
            tableXml += `    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">${Number(cellVal) || 0}</Data></Cell>\n`;
          } else if (type === 'percent') {
            const num = typeof cellVal === 'number' ? cellVal : (parseFloat(String(cellVal).replace('%', '')) / 100 || 0);
            tableXml += `    <Cell ss:StyleID="CellPercent"><Data ss:Type="Number">${num}</Data></Cell>\n`;
          } else if (type === 'number') {
            tableXml += `    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${Number(cellVal) || 0}</Data></Cell>\n`;
          } else if (type === 'center') {
            tableXml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(cellVal)}</Data></Cell>\n`;
          } else if (type === 'bold') {
            tableXml += `    <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(cellVal)}</Data></Cell>\n`;
          } else {
            tableXml += `    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(cellVal)}</Data></Cell>\n`;
          }
        });
        tableXml += '   </Row>\n';
      });

      // Totals row if provided
      if (tbl.totals && tbl.totals.length > 0) {
        tableXml += '   <Row ss:Height="22">\n';
        tbl.totals.forEach((totVal, colIdx) => {
          const type = tbl.types?.[colIdx] || 'string';
          if (totVal === null || totVal === undefined || totVal === '') {
            tableXml += '    <Cell ss:StyleID="TotalRowLabel"><Data ss:Type="String"></Data></Cell>\n';
          } else if (type === 'currency' || typeof totVal === 'number') {
            tableXml += `    <Cell ss:StyleID="TotalRowCurrency"><Data ss:Type="Number">${Number(totVal) || 0}</Data></Cell>\n`;
          } else if (type === 'number') {
            tableXml += `    <Cell ss:StyleID="TotalRowNumber"><Data ss:Type="Number">${Number(totVal) || 0}</Data></Cell>\n`;
          } else {
            tableXml += `    <Cell ss:StyleID="TotalRowLabel"><Data ss:Type="String">${escapeXml(totVal)}</Data></Cell>\n`;
          }
        });
        tableXml += '   </Row>\n';
      }

      // Spacing between tables
      tableXml += '   <Row ss:Height="12"/>\n';
    }

    tableXml += '  </Table>\n';

    worksheetsXml += ` <Worksheet ss:Name="${cleanSheetName}">\n${tableXml} </Worksheet>\n`;
  }

  return `${xmlHeader}\n${worksheetsXml}</Workbook>`;
}

export interface ReportExportData {
  businessSettings?: BusinessSettings;
  periodLabel: string;
  startDateStr: string;
  endDateStr: string;
  transactions: Transaction[];
  orders: Order[];
  materials: Material[];
  expenses: Expense[];
  topProducts: {
    name: string;
    qty: number;
    revenue: number;
    hpp: number;
    profit: number;
    contribution: number;
  }[];
  paymentMethodStats: { [method: string]: { count: number; total: number } };
  expensesByCategory: { category: string; amount: number; percentage: number }[];
  financials: {
    totalSalesRevenue: number;
    totalHppCost: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    grossMarginPercent: number;
    netMarginPercent: number;
    totalTrxCount: number;
    averageOrderValue: number;
    posRevenue: number;
    ordersRevenue: number;
    posHppCost: number;
    ordersHppCost: number;
  };
}

/**
 * Generates and downloads Excel file for Sales Report.
 */
export async function downloadSalesReportExcel(data: ReportExportData, filename?: string) {
  const businessName = data.businessSettings?.businessName || 'SUKUNARU STUDIO';
  const fname = filename || `Laporan-Penjualan-${data.startDateStr}_${data.endDateStr}.xls`;

  const sheet: ExcelSheetDef = {
    name: 'Laporan Penjualan',
    businessName: businessName,
    title: 'LAPORAN PENJUALAN & REKAP TRANSAKSI',
    subtitle: 'Sistem POS & SPK Workshop Percetakan',
    dateInfo: data.periodLabel,
    columns: [
      { width: 45 },
      { width: 180 },
      { width: 85 },
      { width: 120 },
      { width: 130 },
      { width: 120 },
      { width: 80 },
    ],
    tables: [
      {
        title: '1. RINGKASAN KINERJA PENJUALAN (KPI)',
        headers: ['Metrik Finansial', 'Nilai (Rupiah / Jumlah)', 'Keterangan'],
        rows: [
          ['Total Omzet Penjualan', data.financials.totalSalesRevenue, `${data.financials.totalTrxCount} Transaksi Selesai`],
          ['Total HPP Bahan Baku', data.financials.totalHppCost, 'Biaya modal bahan produksi'],
          ['Estimasi Laba Kotor', data.financials.grossProfit, `Margin Kotor: ${data.financials.grossMarginPercent}%`],
          ['Rata-rata Nilai Transaksi (AOV)', data.financials.averageOrderValue, 'Rata-rata omzet per transaksi'],
        ],
        types: ['bold', 'currency', 'string'],
      },
      {
        title: '2. REKAPITULASI METODE PEMBAYARAN',
        headers: ['Metode Pembayaran', 'Jumlah Transaksi', 'Total Nominal (Rp)'],
        rows: [
          ['Tunai (Cash)', data.paymentMethodStats.CASH?.count || 0, data.paymentMethodStats.CASH?.total || 0],
          ['Transfer Bank', data.paymentMethodStats.TRANSFER?.count || 0, data.paymentMethodStats.TRANSFER?.total || 0],
          ['QRIS / E-Wallet', data.paymentMethodStats.QRIS?.count || 0, data.paymentMethodStats.QRIS?.total || 0],
        ],
        types: ['bold', 'number', 'currency'],
        totals: [
          'TOTAL PENERIMAAN',
          (data.paymentMethodStats.CASH?.count || 0) + (data.paymentMethodStats.TRANSFER?.count || 0) + (data.paymentMethodStats.QRIS?.count || 0),
          data.financials.totalSalesRevenue,
        ],
      },
      {
        title: '3. REKAPITULASI PENJUALAN PER PRODUK / JASA',
        headers: ['No', 'Nama Produk / Jasa', 'Qty Terjual', 'Total HPP (Rp)', 'Omzet Penjualan (Rp)', 'Laba Kotor (Rp)', 'Kontribusi (%)'],
        rows: data.topProducts.map((p, idx) => [
          idx + 1,
          p.name,
          p.qty,
          p.hpp,
          p.revenue,
          p.profit,
          p.contribution / 100,
        ]),
        types: ['center', 'bold', 'number', 'currency', 'currency', 'currency', 'percent'],
        totals: [
          'TOTAL',
          '',
          data.topProducts.reduce((sum, p) => sum + p.qty, 0),
          data.topProducts.reduce((sum, p) => sum + p.hpp, 0),
          data.topProducts.reduce((sum, p) => sum + p.revenue, 0),
          data.topProducts.reduce((sum, p) => sum + p.profit, 0),
          1.0,
        ],
      },
      {
        title: '4. RINCIAN RIWAYAT TRANSAKSI PENJUALAN',
        headers: ['Tanggal', 'Nomor Transaksi/Nota', 'Tipe', 'Nama Pelanggan', 'Metode Bayar', 'Status', 'Total Tagihan (Rp)'],
        rows: [
          ...data.transactions.map(t => [
            formatDateTime(t.date || t.createdAt),
            t.receiptNumber || t.id,
            'Kasir POS Retail',
            t.customerName || 'Pelanggan Umum',
            t.paymentMethod || 'CASH',
            t.status || 'SELESAI',
            t.totalAmount || 0,
          ]),
          ...data.orders.map(o => [
            formatDateTime(o.createdAt),
            o.orderNumber,
            'Pesanan SPK Custom',
            o.customerName || 'Pelanggan Custom',
            o.payments?.[0]?.paymentMethod || 'CASH',
            o.status || 'SELESAI',
            o.paidAmount || o.totalAmount || 0,
          ]),
        ],
        types: ['center', 'bold', 'center', 'string', 'center', 'center', 'currency'],
        totals: [
          'TOTAL PENERIMAAN TRANSAKSI',
          '',
          '',
          '',
          '',
          '',
          data.financials.totalSalesRevenue,
        ],
      },
    ],
  };

  const xmlContent = buildXmlSpreadsheetWorkbook([sheet]);
  return downloadExcelFile(xmlContent, fname);
}

/**
 * Generates and downloads Excel file for Profit & Loss Report.
 */
export async function downloadProfitReportExcel(data: ReportExportData, filename?: string) {
  const businessName = data.businessSettings?.businessName || 'SUKUNARU STUDIO';
  const fname = filename || `Laporan-Laba-Rugi-${data.startDateStr}_${data.endDateStr}.xls`;

  const sheet: ExcelSheetDef = {
    name: 'Laporan Laba Rugi',
    businessName: businessName,
    title: 'LAPORAN LABA / RUGI KOMPREHENSIF',
    subtitle: 'Sistem Laporan Keuangan & Analisis Finansial Bisnis',
    dateInfo: data.periodLabel,
    columns: [
      { width: 45 },
      { width: 220 },
      { width: 140 },
      { width: 140 },
      { width: 180 },
    ],
    tables: [
      {
        title: '1. PENDAPATAN USAHA (OMZET)',
        headers: ['No', 'Komponen Pendapatan', 'Nominal (Rp)', 'Porsi (%)', 'Keterangan'],
        rows: [
          [1, 'Penjualan Kasir POS Retail', data.financials.posRevenue, data.financials.totalSalesRevenue > 0 ? data.financials.posRevenue / data.financials.totalSalesRevenue : 0, 'Transaksi kasir langsung'],
          [2, 'Penerimaan Pesanan SPK Workshop', data.financials.ordersRevenue, data.financials.totalSalesRevenue > 0 ? data.financials.ordersRevenue / data.financials.totalSalesRevenue : 0, 'Pembayaran order percetakan'],
        ],
        types: ['center', 'string', 'currency', 'percent', 'string'],
        totals: ['TOTAL PENDAPATAN', '', data.financials.totalSalesRevenue, 1.0, '100% Total Omzet'],
      },
      {
        title: '2. BIAYA POKOK PRODUKSI (HPP BAHAN BAKU)',
        headers: ['No', 'Komponen HPP', 'Nominal (Rp)', 'Porsi dari Omzet', 'Keterangan'],
        rows: [
          [1, 'Bahan Baku Produk Kasir', data.financials.posHppCost, data.financials.totalSalesRevenue > 0 ? data.financials.posHppCost / data.financials.totalSalesRevenue : 0, 'Modal stok barang retail terjual'],
          [2, 'Material Pesanan SPK Workshop', data.financials.ordersHppCost, data.financials.totalSalesRevenue > 0 ? data.financials.ordersHppCost / data.financials.totalSalesRevenue : 0, 'Modal bahan produksi custom'],
        ],
        types: ['center', 'string', 'currency', 'percent', 'string'],
        totals: ['TOTAL HPP PRODUKSI', '', data.financials.totalHppCost, data.financials.totalSalesRevenue > 0 ? data.financials.totalHppCost / data.financials.totalSalesRevenue : 0, 'Total Biaya Pokok'],
      },
      {
        title: '3. LABA KOTOR (GROSS PROFIT)',
        headers: ['Metrik', '', 'Nominal (Rp)', 'Gross Margin (%)', 'Status'],
        rows: [
          ['LABA KOTOR', '', data.financials.grossProfit, data.financials.grossMarginPercent / 100, data.financials.grossProfit >= 0 ? 'Surplus' : 'Defisit'],
        ],
        types: ['bold', 'string', 'currency', 'percent', 'center'],
      },
      {
        title: '4. BEBAN OPERASIONAL & UMUM',
        headers: ['No', 'Kategori Pengeluaran', 'Nominal (Rp)', 'Porsi Beban (%)', 'Keterangan'],
        rows: data.expensesByCategory.length === 0
          ? [[1, 'Tidak ada pengeluaran tercatat', 0, 0, '-']]
          : data.expensesByCategory.map((c, idx) => [
              idx + 1,
              c.category,
              c.amount,
              c.percentage / 100,
              `Beban operasional ${c.category.toLowerCase()}`,
            ]),
        types: ['center', 'string', 'currency', 'percent', 'string'],
        totals: ['TOTAL BEBAN OPERASIONAL', '', data.financials.totalExpenses, 1.0, 'Total Seluruh Pengeluaran'],
      },
      {
        title: '5. LABA BERSIH FINAL (NET PROFIT)',
        headers: ['Metrik Finansial', '', 'Nominal (Rp)', 'Net Margin (%)', 'Hasil Finansial'],
        rows: [
          ['LABA BERSIH USAHA (NET PROFIT)', '', data.financials.netProfit, data.financials.netMarginPercent / 100, data.financials.netProfit >= 0 ? 'PROFIT BERSIH (SURPLUS)' : 'RUGI (DEFISIT)'],
        ],
        types: ['bold', 'string', 'currency', 'percent', 'bold'],
      },
      {
        title: '6. RINCIAN CATATAN PENGELUARAN / BEBAN PADA PERIODE INI',
        headers: ['Tanggal', 'Keterangan Pengeluaran', 'Kategori', 'Metode Pembayaran', 'Nominal (Rp)'],
        rows: data.expenses.map(e => [
          formatDateTime(e.date || e.createdAt),
          e.description || e.name || 'Pengeluaran',
          e.category || 'Operasional',
          e.paymentMethod || 'TUNAI',
          Number(e.amount) || 0,
        ]),
        types: ['center', 'string', 'center', 'center', 'currency'],
        totals: ['TOTAL BEBAN TERCATAT', '', '', '', data.financials.totalExpenses],
      },
    ],
  };

  const xmlContent = buildXmlSpreadsheetWorkbook([sheet]);
  return downloadExcelFile(xmlContent, fname);
}

/**
 * Generates and downloads Excel file for Inventory & Material Stock Valuation.
 */
export async function downloadStockReportExcel(data: ReportExportData, filename?: string) {
  const businessName = data.businessSettings?.businessName || 'SUKUNARU STUDIO';
  const fname = filename || `Laporan-Nilai-Stok-${new Date().toISOString().slice(0, 10)}.xls`;
  const totalStockAsset = data.materials.reduce((sum, m) => sum + (m.currentStock || 0) * (m.unitCost || 0), 0);
  const lowStockCount = data.materials.filter(m => (m.currentStock || 0) <= (m.minStock || 0)).length;

  const sheet: ExcelSheetDef = {
    name: 'Nilai Persediaan Bahan',
    businessName: businessName,
    title: 'LAPORAN NILAI ASET PERSEDIAAN BAHAN BAKU',
    subtitle: 'Inventori & Valuasi Stok Bahan Produksi Workshop',
    dateInfo: `Per Tanggal: ${formatDate(new Date())}`,
    columns: [
      { width: 45 },
      { width: 200 },
      { width: 120 },
      { width: 90 },
      { width: 70 },
      { width: 90 },
      { width: 120 },
      { width: 140 },
      { width: 100 },
    ],
    tables: [
      {
        title: '1. RINGKASAN VALUASI PERSEDIAAN',
        headers: ['Metrik Inventori', 'Nilai / Jumlah', 'Keterangan'],
        rows: [
          ['Total Nilai Modal Persediaan Bahan', totalStockAsset, 'Total valuasi fisik bahan di studio'],
          ['Total Jenis Item Bahan Baku', data.materials.length, 'Jumlah SKU/Item terdaftar'],
          ['Item Perlu Restock Segera', lowStockCount, 'Stok berada di bawah batas minimum'],
        ],
        types: ['bold', 'currency', 'string'],
      },
      {
        title: '2. RINCIAN STOK & NILAI ASET PER BAHAN BAKU',
        headers: [
          'No',
          'Nama Bahan Baku',
          'Kategori',
          'Stok Saat Ini',
          'Satuan',
          'Min. Stok',
          'Harga Beli Satuan (Rp)',
          'Total Nilai Persediaan (Rp)',
          'Status Stok',
        ],
        rows: data.materials.map((m, idx) => {
          const isLow = (m.currentStock || 0) <= (m.minStock || 0);
          const totalVal = (m.currentStock || 0) * (m.unitCost || 0);
          return [
            idx + 1,
            m.name,
            m.category || 'Umum',
            m.currentStock || 0,
            m.unit || 'pcs',
            m.minStock || 0,
            m.unitCost || 0,
            totalVal,
            isLow ? 'PERLU RESTOCK' : 'AMAN',
          ];
        }),
        types: ['center', 'bold', 'center', 'number', 'center', 'number', 'currency', 'currency', 'center'],
        totals: [
          'TOTAL VALUASI PERSEDIAAN',
          '',
          '',
          '',
          '',
          '',
          '',
          totalStockAsset,
          '',
        ],
      },
    ],
  };

  const xmlContent = buildXmlSpreadsheetWorkbook([sheet]);
  return downloadExcelFile(xmlContent, fname);
}

/**
 * Generates and downloads Full Business Multi-Sheet Master Workbook (Buku Besar Komprehensif).
 */
export async function downloadFullWorkbookExcel(data: ReportExportData, filename?: string) {
  const businessName = data.businessSettings?.businessName || 'SUKUNARU STUDIO';
  const fname = filename || `Laporan-Bisnis-Komprehensif-${data.startDateStr}_${data.endDateStr}.xls`;
  const totalStockAsset = data.materials.reduce((sum, m) => sum + (m.currentStock || 0) * (m.unitCost || 0), 0);

  // Sheet 1: Executive Summary
  const summarySheet: ExcelSheetDef = {
    name: 'Ringkasan Eksekutif',
    businessName: businessName,
    title: 'BUKU BESAR & RINGKASAN EKSEKUTIF BISNIS',
    subtitle: 'Kompilasi Laporan Keuangan, Operasional & Valuasi Persediaan',
    dateInfo: data.periodLabel,
    columns: [
      { width: 45 },
      { width: 220 },
      { width: 140 },
      { width: 110 },
      { width: 200 },
    ],
    tables: [
      {
        title: 'IKHTISAR KINERJA KEUANGAN',
        headers: ['No', 'Komponen Finansial', 'Nilai (Rupiah)', 'Rasio Margin', 'Catatan Evaluasi'],
        rows: [
          [1, 'Total Omzet Pendapatan', data.financials.totalSalesRevenue, '100.0%', `${data.financials.totalTrxCount} transaksi terselesaikan`],
          [2, 'Total Beban Pokok (HPP Bahan)', data.financials.totalHppCost, `${data.financials.totalSalesRevenue > 0 ? ((data.financials.totalHppCost / data.financials.totalSalesRevenue) * 100).toFixed(1) : 0}%`, 'Modal langsung material & kaos'],
          [3, 'Laba Kotor Usaha (Gross Profit)', data.financials.grossProfit, `${data.financials.grossMarginPercent}%`, 'Margin kotor operasional'],
          [4, 'Beban Operasional & Umum', data.financials.totalExpenses, `${data.financials.totalSalesRevenue > 0 ? ((data.financials.totalExpenses / data.financials.totalSalesRevenue) * 100).toFixed(1) : 0}%`, 'Gaji, sewa, utilitas & maintenance'],
          [5, 'Laba Bersih Riil (Net Profit)', data.financials.netProfit, `${data.financials.netMarginPercent}%`, data.financials.netProfit >= 0 ? 'Surplus laba bersih' : 'Defisit operasional'],
          [6, 'Valuasi Aset Stok Bahan Fisik', totalStockAsset, '-', 'Total nilai aset di gudang/workshop'],
        ],
        types: ['center', 'bold', 'currency', 'center', 'string'],
      },
    ],
  };

  // Sheet 2: Sales
  const salesSheet: ExcelSheetDef = {
    name: 'Rincian Penjualan',
    businessName: businessName,
    title: 'REKAPITULASI PENJUALAN PRODUK',
    subtitle: 'Peringkat Produk Berdasarkan Omzet & Margin',
    dateInfo: data.periodLabel,
    columns: [
      { width: 45 },
      { width: 200 },
      { width: 85 },
      { width: 120 },
      { width: 130 },
      { width: 120 },
      { width: 80 },
    ],
    tables: [
      {
        title: 'DAFTAR PRODUK & JASA TERJUAL',
        headers: ['No', 'Nama Produk / Jasa', 'Qty Terjual', 'Total HPP (Rp)', 'Omzet Penjualan (Rp)', 'Laba Kotor (Rp)', 'Kontribusi (%)'],
        rows: data.topProducts.map((p, idx) => [
          idx + 1,
          p.name,
          p.qty,
          p.hpp,
          p.revenue,
          p.profit,
          p.contribution / 100,
        ]),
        types: ['center', 'bold', 'number', 'currency', 'currency', 'currency', 'percent'],
        totals: [
          'TOTAL',
          '',
          data.topProducts.reduce((sum, p) => sum + p.qty, 0),
          data.topProducts.reduce((sum, p) => sum + p.hpp, 0),
          data.topProducts.reduce((sum, p) => sum + p.revenue, 0),
          data.topProducts.reduce((sum, p) => sum + p.profit, 0),
          1.0,
        ],
      },
    ],
  };

  // Sheet 3: Profit & Expenses
  const profitSheet: ExcelSheetDef = {
    name: 'Laba Rugi & Beban',
    businessName: businessName,
    title: 'RINCIAN LABA RUGI & PENGELUARAN',
    subtitle: 'Struktur Beban Operasional Usaha',
    dateInfo: data.periodLabel,
    columns: [
      { width: 45 },
      { width: 220 },
      { width: 140 },
      { width: 120 },
      { width: 180 },
    ],
    tables: [
      {
        title: 'RINCIAN BEBAN OPERASIONAL',
        headers: ['No', 'Kategori Pengeluaran', 'Nominal (Rp)', 'Porsi Beban (%)', 'Keterangan'],
        rows: data.expensesByCategory.map((c, idx) => [
          idx + 1,
          c.category,
          c.amount,
          c.percentage / 100,
          `Beban operasional ${c.category.toLowerCase()}`,
        ]),
        types: ['center', 'string', 'currency', 'percent', 'string'],
        totals: ['TOTAL BEBAN OPERASIONAL', '', data.financials.totalExpenses, 1.0, ''],
      },
    ],
  };

  // Sheet 4: Inventory
  const stockSheet: ExcelSheetDef = {
    name: 'Nilai Stok Bahan',
    businessName: businessName,
    title: 'VALUASI STOK BAHAN BAKU',
    subtitle: 'Daftar Material Workshop',
    dateInfo: `Per: ${formatDate(new Date())}`,
    columns: [
      { width: 45 },
      { width: 200 },
      { width: 120 },
      { width: 90 },
      { width: 70 },
      { width: 120 },
      { width: 140 },
      { width: 100 },
    ],
    tables: [
      {
        title: 'DAFTAR BAHAN BAKU & MATERIAL',
        headers: ['No', 'Nama Bahan', 'Kategori', 'Stok Saat Ini', 'Satuan', 'Harga Beli (Rp)', 'Total Aset (Rp)', 'Status'],
        rows: data.materials.map((m, idx) => [
          idx + 1,
          m.name,
          m.category || 'Umum',
          m.currentStock || 0,
          m.unit || 'pcs',
          m.unitCost || 0,
          (m.currentStock || 0) * (m.unitCost || 0),
          (m.currentStock || 0) <= (m.minStock || 0) ? 'RESTOCK' : 'AMAN',
        ]),
        types: ['center', 'bold', 'center', 'number', 'center', 'currency', 'currency', 'center'],
        totals: ['TOTAL NILAI PERSEDIAAN', '', '', '', '', '', totalStockAsset, ''],
      },
    ],
  };

  // Sheet 5: Transactions
  const trxSheet: ExcelSheetDef = {
    name: 'Riwayat Transaksi',
    businessName: businessName,
    title: 'LOG TRANSAKSI PENJUALAN LENGKAP',
    subtitle: 'Data Transaksi POS & SPK',
    dateInfo: data.periodLabel,
    columns: [
      { width: 130 },
      { width: 130 },
      { width: 130 },
      { width: 160 },
      { width: 90 },
      { width: 90 },
      { width: 130 },
    ],
    tables: [
      {
        title: 'DAFTAR SELURUH TRANSAKSI PADA PERIODE',
        headers: ['Tanggal & Jam', 'No Transaksi', 'Tipe Layanan', 'Pelanggan', 'Metode Bayar', 'Status', 'Nominal Terbayar (Rp)'],
        rows: [
          ...data.transactions.map(t => [
            formatDateTime(t.date || t.createdAt),
            t.receiptNumber || t.id,
            'Kasir POS Retail',
            t.customerName || 'Pelanggan Umum',
            t.paymentMethod || 'CASH',
            t.status || 'SELESAI',
            t.totalAmount || 0,
          ]),
          ...data.orders.map(o => [
            formatDateTime(o.createdAt),
            o.orderNumber,
            'Pesanan SPK Custom',
            o.customerName || 'Pelanggan Custom',
            o.payments?.[0]?.paymentMethod || 'CASH',
            o.status || 'SELESAI',
            o.paidAmount || o.totalAmount || 0,
          ]),
        ],
        types: ['center', 'bold', 'center', 'string', 'center', 'center', 'currency'],
        totals: ['TOTAL TRANSAKSI', '', '', '', '', '', data.financials.totalSalesRevenue],
      },
    ],
  };

  const xmlContent = buildXmlSpreadsheetWorkbook([summarySheet, salesSheet, profitSheet, stockSheet, trxSheet]);
  return downloadExcelFile(xmlContent, fname);
}

/**
 * Downloads report in CSV format with UTF-8 BOM.
 */
export async function downloadReportCsv(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const bom = '\uFEFF';
  const csvContent = bom + [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      row
        .map(cell => {
          const str = cell !== undefined && cell !== null ? String(cell) : '';
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  return downloadCsvFile(csvContent, filename);
}
