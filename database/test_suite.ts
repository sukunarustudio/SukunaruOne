import { DatabaseService } from './dbService';
import { getDb, getDatabasePath } from './connection';
import fs from 'fs';

console.log('====================================================');
console.log('🧪 MEMULAI PENGUJIAN LENGKAP LOGIKA BISNIS (E2E) 🧪');
console.log('====================================================');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, extraInfo: any = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`, extraInfo);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runTests() {
  try {
    // ----------------------------------------------------
    // TEST 1: SETTINGS
    // ----------------------------------------------------
    console.log('\n--- 1. PENGUJIAN SETTINGS ---');
    const settings = DatabaseService.getSettings();
    assert(!!settings.businessName, 'Settings berhasil dimuat', settings.businessName);

    const updatedSettings = DatabaseService.updateSettings({ tagline: 'Solusi Percetakan & Desain Kreatif Malang' });
    assert(updatedSettings.tagline === 'Solusi Percetakan & Desain Kreatif Malang', 'Settings berhasil diperbarui');

    // ----------------------------------------------------
    // TEST 2: CUSTOMERS (CREATE, EDIT, SEARCH, DELETE)
    // ----------------------------------------------------
    console.log('\n--- 2. PENGUJIAN CUSTOMERS ---');
    const customer = DatabaseService.createCustomer({
      name: 'Budi Santoso Test',
      whatsapp: '081234567899',
      address: 'Sukun, Malang',
      notes: 'Pelanggan VIP percetakan',
    });
    assert(!!customer.id && customer.name === 'Budi Santoso Test', 'Customer baru berhasil dibuat');

    const editedCust = DatabaseService.updateCustomer(customer.id, {
      notes: 'Pelanggan VIP - Langganan MDF',
    });
    assert(editedCust.notes === 'Pelanggan VIP - Langganan MDF', 'Customer berhasil diedit');

    const searchCust = DatabaseService.search('Budi Santoso Test');
    assert(searchCust.customers.length > 0, 'Customer ditemukan melalui fitur Global Search');

    // ----------------------------------------------------
    // TEST 3: MATERIALS & INVENTORY
    // ----------------------------------------------------
    console.log('\n--- 3. PENGUJIAN INVENTORI & BAHAN BAKU ---');
    const material = DatabaseService.createMaterial({
      name: 'MDF Board A4 6mm Test',
      sku: 'MAT-MDF-TEST-' + Date.now(),
      category: 'Kayu/MDF',
      unit: 'pcs',
      currentStock: 20,
      minStock: 5,
      purchasePrice: 3000,
      unitCost: 3000,
      supplier: 'CV Mitra Kayuindo',
    });
    assert(material.currentStock === 20, 'Material baru berhasil dibuat dengan stok awal 20');

    // Restock with Auto Expense & Finance
    const restockResult = DatabaseService.restockMaterial(material.id, {
      quantity: 10,
      unitPrice: 3000,
      paymentMethod: 'CASH',
      supplier: 'CV Mitra Kayuindo',
      recordExpense: true,
      notes: 'Restock uji coba 10 pcs',
    });
    assert(restockResult.material.currentStock === 30, 'Restock menambah stok menjadi 30');

    // Verify Expense & Financial transaction recorded
    const expenses = DatabaseService.getExpenses();
    const restockExpense = expenses.find(e => e.description.includes('MDF Board A4 6mm Test'));
    assert(!!restockExpense && restockExpense.amount === 30000, 'Pengeluaran restock Rp30.000 tercatat otomatis');

    // ----------------------------------------------------
    // TEST 4: PRODUCTS & BOM (HPP)
    // ----------------------------------------------------
    console.log('\n--- 4. PENGUJIAN PRODUK & KALKULATOR HPP (BOM) ---');
    const product = DatabaseService.createProduct({
      name: 'MDF Photo A4 Cetak Mewah',
      sku: 'PRD-MDF-LUX-' + Date.now(),
      category: 'Cetak Kayu & MDF',
      type: 'PHYSICAL',
      sellingPrice: 35000,
      costPrice: 10000,
      trackStock: true,
      components: [
        {
          materialId: material.id,
          componentName: 'MDF Board A4 6mm Test',
          quantity: 1,
          unit: 'pcs',
          unitCost: 3000,
          subtotal: 3000,
        },
      ],
    });
    assert(product.sellingPrice === 35000, 'Produk berhasil dibuat dengan harga jual Rp35.000');
    assert(product.components.length === 1, 'Komponen BOM produk tersimpan dengan relasi material');

    // ----------------------------------------------------
    // TEST 5: POS TRANSACTION (KASIR CEPAT)
    // ----------------------------------------------------
    console.log('\n--- 5. PENGUJIAN TRANSAKSI POS (KASIR) & PEMOTONGAN STOK ---');
    const initialMatStock = DatabaseService.getMaterialById(material.id).currentStock;

    const posTrx = DatabaseService.createTransaction({
      customerId: customer.id,
      customerName: customer.name,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 2,
          unitPrice: 35000,
          costPrice: 10000,
          subtotal: 70000,
        },
      ],
      subtotal: 70000,
      discount: 0,
      totalAmount: 70000,
      paidAmount: 100000,
      changeAmount: 30000,
      paymentMethod: 'CASH',
      cashierName: 'Kasir Utama',
    });
    assert(!!posTrx.receiptNumber, 'Transaksi kasir POS berhasil dicatat #' + posTrx.receiptNumber);

    const postPosMatStock = DatabaseService.getMaterialById(material.id).currentStock;
    assert(postPosMatStock === initialMatStock - 2, 'Stok bahan baku otomatis berkurang 2 pcs setelah transaksi kasir POS');

    // ----------------------------------------------------
    // TEST 6: ORDERS & PAYMENT (DP & PELUNASAN)
    // ----------------------------------------------------
    console.log('\n--- 6. PENGUJIAN PESANAN / ORDER & PELUNASAN ---');
    const orderMatStockBefore = DatabaseService.getMaterialById(material.id).currentStock;

    const order = DatabaseService.createOrder({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.whatsapp,
      orderDate: new Date().toISOString().split('T')[0],
      deadlineDate: new Date().toISOString().split('T')[0],
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 3,
          unitPrice: 35000,
          costPrice: 10000,
          subtotal: 105000,
        },
      ],
      subtotal: 105000,
      discount: 5000,
      totalAmount: 100000,
      dpAmount: 50000,
      paymentMethod: 'QRIS',
      notes: 'Mohon warna dibuat sedikit warm',
    });
    assert(order.paymentStatus === 'DP', 'Status pesanan dengan DP tercatat sebagai DP');
    assert(order.remainingAmount === 50000, 'Sisa tagihan pesanan adalah Rp50.000');

    const orderMatStockAfter = DatabaseService.getMaterialById(material.id).currentStock;
    assert(orderMatStockAfter === orderMatStockBefore - 3, 'Stok bahan baku otomatis berkurang 3 pcs untuk order');

    // Pelunasan Sisa Pembayaran
    const paidOrder = DatabaseService.addOrderPayment(order.id, {
      amount: 50000,
      paymentMethod: 'TRANSFER',
      notes: 'Pelunasan sisa tagihan pesanan via BCA',
    });
    assert(paidOrder.paymentStatus === 'LUNAS', 'Status pesanan berubah menjadi LUNAS setelah pelunasan');
    assert(paidOrder.remainingAmount === 0, 'Sisa tagihan menjadi Rp0');

    // ----------------------------------------------------
    // TEST 7: STATS & DASHBOARD REVENUE
    // ----------------------------------------------------
    console.log('\n--- 7. PENGUJIAN AGREGASI DASHBOARD & LABA RUGI ---');
    const stats = DatabaseService.getStats();
    assert(stats.todayRevenue > 0, 'Omset hari ini terhitung positif', stats.todayRevenue);
    assert(stats.todayTransactionsCount > 0, 'Jumlah transaksi hari ini terhitung', stats.todayTransactionsCount);

    // ----------------------------------------------------
    // TEST 8: BACKUP & RESTORE
    // ----------------------------------------------------
    console.log('\n--- 8. PENGUJIAN BACKUP & RESTORE DATABASE ---');
    const backupData = DatabaseService.getBackupData();
    assert(Array.isArray(backupData.customers) && backupData.customers.length > 0, 'Backup data terstruktur dengan valid');

    const dbPath = getDatabasePath();
    assert(fs.existsSync(dbPath), 'File database SQLite fisik ada di ' + dbPath);
    console.log(`[Info Database File]: Ukuran file sukunaru.db = ${fs.statSync(dbPath).size} bytes`);

    const restoreResult = DatabaseService.restoreDatabase(backupData);
    assert(restoreResult.success === true, 'Restore database berjalan mulus dengan auto pre-restore safety snapshot');

    // ----------------------------------------------------
    // HASIL AKHIR
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`🎉 SEMUA PENGUJIAN BERHASIL: ${passedTests}/${totalTests} TESTS PASSED (100%) 🎉`);
    console.log('====================================================');
  } catch (err: any) {
    console.error('\n❌ PENGUJIAN GAGAL DENGAN KESALAHAN:', err.message);
    process.exit(1);
  }
}

runTests();
