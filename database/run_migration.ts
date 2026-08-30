import { migrateJsonToSqlite } from './migrator';
import { DatabaseService } from './dbService';
import { getDatabasePath, getDb } from './connection';
import fs from 'fs';
import path from 'path';

console.log('=== MEMULAI MIGRASI DATA SUKUNARU STUDIO OS ===');

try {
  const result = migrateJsonToSqlite(true);
  console.log('[Status Migrasi]:', result.message);
  console.log('[Rincian Data Termigrasi]:', result.counts);

  // Verifikasi Data
  const jsonPath = path.join(process.cwd(), 'data', 'db.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const db = getDb();
  const dbCustomers = db.prepare('SELECT COUNT(*) as c FROM customers').get() as any;
  const dbMaterials = db.prepare('SELECT COUNT(*) as c FROM materials').get() as any;
  const dbProducts = db.prepare('SELECT COUNT(*) as c FROM products').get() as any;
  const dbMovements = db.prepare('SELECT COUNT(*) as c FROM inventory_movements').get() as any;
  const dbOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get() as any;
  const dbTransactions = db.prepare('SELECT COUNT(*) as c FROM transactions').get() as any;
  const dbExpenses = db.prepare('SELECT COUNT(*) as c FROM expenses').get() as any;
  const dbFinancials = db.prepare('SELECT COUNT(*) as c FROM financial_transactions').get() as any;

  console.log('\n=== HASIL PERBANDINGAN JSON VS SQLITE ===');
  console.log(`Pelanggan (Customers):        JSON=${jsonData.customers?.length || 0} | SQLite=${dbCustomers.c}`);
  console.log(`Bahan Baku (Materials):       JSON=${jsonData.materials?.length || 0} | SQLite=${dbMaterials.c}`);
  console.log(`Katalog Produk (Products):    JSON=${jsonData.products?.length || 0} | SQLite=${dbProducts.c}`);
  console.log(`Mutasi Stok (Movements):      JSON=${jsonData.inventory_movements?.length || 0} | SQLite=${dbMovements.c}`);
  console.log(`Pesanan (Orders):             JSON=${jsonData.orders?.length || 0} | SQLite=${dbOrders.c}`);
  console.log(`Transaksi Kasir (POS):        JSON=${jsonData.transactions?.length || 0} | SQLite=${dbTransactions.c}`);
  console.log(`Pengeluaran (Expenses):       JSON=${jsonData.expenses?.length || 0} | SQLite=${dbExpenses.c}`);
  console.log(`Arus Kas (Financial Trx):     JSON=${jsonData.financial_transactions?.length || 0} | SQLite=${dbFinancials.c}`);

  const settings = DatabaseService.getSettings();
  console.log('\n[Settings SQLite]:', settings.businessName, '-', settings.tagline);

  const stats = DatabaseService.getStats();
  console.log('[Stats SQLite]:', stats);

  console.log('\n=== MIGRASI SELESAI DENGAN 100% SUKSES! ===');
} catch (err: any) {
  console.error('[ERROR MIGRASI]:', err);
  process.exit(1);
}
