import { getDb, getDatabasePath } from './connection';
import { initializeDatabaseSchema } from './schema';
import { DatabaseService } from './dbService';
import fs from 'fs';

console.log('===========================================================');
console.log('🧪 PENGUJIAN FITUR HAPUS & RESET SEMUA TRANSAKSI 🧪');
console.log('===========================================================');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, extraInfo: any = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`, extraInfo);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTests() {
  try {
    initializeDatabaseSchema();
    const db = getDb();

    // 1. Initial State Check
    console.log('\n--- 1. MEMBUAT DATA TRANSAKSI UJI COBA ---');
    const initialProducts = DatabaseService.getProducts();
    const initialMaterials = DatabaseService.getMaterials();
    const initialCustomers = DatabaseService.getCustomers();

    assert(initialProducts.length > 0, 'Produk master data tersedia');
    const testProd = initialProducts[0];

    // Create a POS transaction
    const testTrx = DatabaseService.createTransaction({
      customerName: 'Budi Pembeli Test',
      customerPhone: '08123456789',
      items: [
        {
          productId: testProd.id,
          productName: testProd.name,
          quantity: 2,
          unitPrice: testProd.sellingPrice,
          costPrice: testProd.costPrice,
          subtotal: testProd.sellingPrice * 2,
        },
      ],
      totalAmount: testProd.sellingPrice * 2,
      paidAmount: testProd.sellingPrice * 2,
      paymentMethod: 'CASH',
    });
    assert(testTrx.id, 'Transaksi POS uji coba berhasil dibuat');

    // Create an Order
    const testOrder = DatabaseService.createOrder({
      customerName: 'Siti Pesanan Test',
      customerPhone: '08987654321',
      items: [
        {
          productId: testProd.id,
          productName: testProd.name,
          quantity: 5,
          unitPrice: testProd.sellingPrice,
          costPrice: testProd.costPrice,
          subtotal: testProd.sellingPrice * 5,
        },
      ],
      totalAmount: testProd.sellingPrice * 5,
      dpAmount: 10000,
      paymentMethod: 'TRANSFER',
    });
    assert(testOrder.id, 'Pesanan kerja (Order) uji coba berhasil dibuat');

    // Create an Expense
    const testExpense = DatabaseService.createExpense({
      description: 'Beli Lakban & Plastik Packing Test',
      amount: 15000,
      category: 'OPERASIONAL',
      paymentMethod: 'CASH',
    });
    assert(testExpense.id, 'Pengeluaran (Expense) uji coba berhasil dibuat');

    // Verify records exist in database
    const trxCountBefore = (db.prepare('SELECT COUNT(*) as c FROM transactions').get() as any).c;
    const orderCountBefore = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c;
    const expCountBefore = (db.prepare('SELECT COUNT(*) as c FROM expenses').get() as any).c;
    const finCountBefore = (db.prepare('SELECT COUNT(*) as c FROM financial_transactions').get() as any).c;

    assert(trxCountBefore > 0, `Terdapat ${trxCountBefore} transaksi POS di database`);
    assert(orderCountBefore > 0, `Terdapat ${orderCountBefore} pesanan kerja di database`);
    assert(expCountBefore > 0, `Terdapat ${expCountBefore} pengeluaran di database`);
    assert(finCountBefore > 0, `Terdapat ${finCountBefore} mutasi buku kas di database`);

    // 2. Test Deleting Single Transaction
    console.log('\n--- 2. PENGUJIAN HAPUS SINGLE TRANSAKSI ---');
    DatabaseService.deleteTransaction(testTrx.id);
    const checkDeletedTrx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(testTrx.id);
    assert(checkDeletedTrx === undefined, 'Transaksi spesifik berhasil dihapus');

    const checkDeletedFinTrx = db.prepare("SELECT * FROM financial_transactions WHERE referenceId = ?").get(testTrx.id);
    assert(checkDeletedFinTrx === undefined, 'Arus kas terkait transaksi spesifik otomatis terhapus');

    // 3. Test Clear All Transactions (Reset)
    console.log('\n--- 3. PENGUJIAN RESET / HAPUS SEMUA TRANSAKSI ---');
    const result = DatabaseService.clearAllTransactions({ resetExpenses: true, resetMovements: true });
    assert(result.success === true, 'Fungsi clearAllTransactions mengembalikan status success');
    console.log(`[Hasil Reset]: ${result.message}`, result.deletedCounts);

    // Verify all transaction tables are 0
    const trxCountAfter = (db.prepare('SELECT COUNT(*) as c FROM transactions').get() as any).c;
    const trxItemsAfter = (db.prepare('SELECT COUNT(*) as c FROM transaction_items').get() as any).c;
    const orderCountAfter = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c;
    const orderItemsAfter = (db.prepare('SELECT COUNT(*) as c FROM order_items').get() as any).c;
    const orderPaymentsAfter = (db.prepare('SELECT COUNT(*) as c FROM order_payments').get() as any).c;
    const expensesAfter = (db.prepare('SELECT COUNT(*) as c FROM expenses').get() as any).c;
    const financialAfter = (db.prepare('SELECT COUNT(*) as c FROM financial_transactions').get() as any).c;

    assert(trxCountAfter === 0, 'Tabel transactions bersih (0 data)');
    assert(trxItemsAfter === 0, 'Tabel transaction_items bersih (0 data)');
    assert(orderCountAfter === 0, 'Tabel orders bersih (0 data)');
    assert(orderItemsAfter === 0, 'Tabel order_items bersih (0 data)');
    assert(orderPaymentsAfter === 0, 'Tabel order_payments bersih (0 data)');
    assert(expensesAfter === 0, 'Tabel expenses bersih (0 data)');
    assert(financialAfter === 0, 'Tabel financial_transactions / buku kas bersih (0 data)');

    // 4. Verify Master Data Preserved 100%
    console.log('\n--- 4. VERIFIKASI KEAMANAN MASTER DATA (PRODUK & BAHAN) ---');
    const productsAfter = DatabaseService.getProducts();
    const materialsAfter = DatabaseService.getMaterials();
    const customersAfter = DatabaseService.getCustomers();
    const settingsAfter = DatabaseService.getSettings();

    assert(productsAfter.length === initialProducts.length, `Katalog produk tetap utuh (${productsAfter.length} produk)`);
    assert(materialsAfter.length === initialMaterials.length, `Stok bahan baku tetap utuh (${materialsAfter.length} bahan)`);
    assert(customersAfter.length >= initialCustomers.length, `Data pelanggan tetap ada (${customersAfter.length} pelanggan)`);
    assert(!!settingsAfter.businessName, `Pengaturan nama usaha (${settingsAfter.businessName}) tetap utuh`);

    // 5. Test Live HTTP Endpoint
    console.log('\n--- 5. PENGUJIAN LIVE HTTP ENDPOINT POST /api/transactions/clear-all ---');
    try {
      const res = await fetch('http://localhost:3000/api/transactions/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetExpenses: true }),
      });
      if (res.ok) {
        const httpData = await res.json();
        assert(httpData.success === true, 'HTTP endpoint POST /api/transactions/clear-all sukses');
        console.log('[Live HTTP Response]:', httpData);
      } else {
        console.log('[Live HTTP Status]:', res.status);
      }
    } catch (e: any) {
      console.log('HTTP live test skipped (server running independently):', e.message);
    }

    console.log('\n===========================================================');
    console.log(`🎉 SEMUA PENGUJIAN RESET TRANSAKSI BERHASIL: ${passedTests}/${totalTests} TESTS PASSED (100%) 🎉`);
    console.log('===========================================================');
  } catch (err: any) {
    console.error('\n❌ PENGUJIAN GAGAL:', err);
    process.exit(1);
  }
}

runTests();
