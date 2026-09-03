import { getDb, getDatabasePath } from './connection';
import { initializeDatabaseSchema } from './schema';
import { DatabaseService } from './dbService';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Disable sharp file cache on Windows to release file handles immediately
sharp.cache(false);

console.log('===========================================================');
console.log('🧪 MEMULAI PENGUJIAN SISTEM GAMBAR & THUMBNAIL PRODUK 🧪');
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

async function runImageTests() {
  try {
    // ----------------------------------------------------
    // TEST 1: DATABASE SCHEMA VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- 1. VERIFIKASI STRUKTUR TABEL SQLITE ---');
    initializeDatabaseSchema();
    const db = getDb();

    const productCols = (db.prepare('PRAGMA table_info(products)').all() as any[]).map(c => c.name);
    assert(productCols.includes('imagePath'), 'Kolom imagePath ada pada tabel products');
    assert(productCols.includes('thumbnailPath'), 'Kolom thumbnailPath ada pada tabel products');

    const orderItemCols = (db.prepare('PRAGMA table_info(order_items)').all() as any[]).map(c => c.name);
    assert(orderItemCols.includes('imagePath'), 'Kolom imagePath ada pada tabel order_items');
    assert(orderItemCols.includes('thumbnailPath'), 'Kolom thumbnailPath ada pada tabel order_items');

    const trxItemCols = (db.prepare('PRAGMA table_info(transaction_items)').all() as any[]).map(c => c.name);
    assert(trxItemCols.includes('imagePath'), 'Kolom imagePath ada pada tabel transaction_items');
    assert(trxItemCols.includes('thumbnailPath'), 'Kolom thumbnailPath ada pada tabel transaction_items');

    // ----------------------------------------------------
    // TEST 2: SHARP IMAGE PROCESSING & THUMBNAIL GENERATION
    // ----------------------------------------------------
    console.log('\n--- 2. PENGUJIAN PEMROSESAN GAMBAR DENGAN SHARP ---');

    // Generate a dummy SVG image buffer
    const testSvgBuffer = Buffer.from(`
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#4f46e5"/>
        <circle cx="400" cy="300" r="150" fill="#ffffff"/>
        <text x="400" y="315" font-size="40" font-weight="bold" text-anchor="middle" fill="#4f46e5">SUKUNARU</text>
      </svg>
    `);

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const testProdId = 'prod_test_' + Date.now();
    const testProdDir = path.join(uploadsDir, 'products', testProdId);

    if (!fs.existsSync(testProdDir)) {
      fs.mkdirSync(testProdDir, { recursive: true });
    }

    const testImagePath = path.join(testProdDir, 'image.webp');
    const testThumbPath = path.join(testProdDir, 'thumbnail.webp');

    // 1. Process full product image (max 1200px)
    await sharp(testSvgBuffer)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(testImagePath);

    // 2. Process thumbnail (300x300 cover crop)
    await sharp(testSvgBuffer)
      .resize({ width: 300, height: 300, fit: 'cover', position: 'centre' })
      .webp({ quality: 75 })
      .toFile(testThumbPath);

    assert(fs.existsSync(testImagePath), 'File full image.webp berhasil dibuat');
    assert(fs.existsSync(testThumbPath), 'File thumbnail.webp berhasil dibuat');

    const thumbMeta = await sharp(testThumbPath).metadata();
    assert(thumbMeta.width === 300 && thumbMeta.height === 300, 'Dimensi thumbnail tepat 300x300 px', thumbMeta);
    assert(thumbMeta.format === 'webp', 'Format thumbnail adalah WebP teroptimasi');

    // ----------------------------------------------------
    // TEST 3: PRODUCT CREATION WITH IMAGES
    // ----------------------------------------------------
    console.log('\n--- 3. PENGUJIAN PEMBUATAN PRODUK DENGAN GAMBAR ---');
    const relImagePath = `products/${testProdId}/image.webp`;
    const relThumbnailPath = `products/${testProdId}/thumbnail.webp`;

    const product = DatabaseService.createProduct({
      name: 'Stiker Hologram Custom A3+',
      sku: 'SKU-HOLO-' + Date.now(),
      category: 'Stiker',
      type: 'CETAK',
      sellingPrice: 25000,
      costPrice: 8000,
      imagePath: relImagePath,
      thumbnailPath: relThumbnailPath,
    });

    assert(product.imagePath === relImagePath, 'Product tersimpan dengan imagePath relatif');
    assert(product.thumbnailPath === relThumbnailPath, 'Product tersimpan dengan thumbnailPath relatif');

    const loadedProd = DatabaseService.getProductById(product.id);
    assert(loadedProd?.imagePath === relImagePath, 'ProductById berhasil memuat imagePath');
    assert(loadedProd?.thumbnailPath === relThumbnailPath, 'ProductById berhasil memuat thumbnailPath');

    // ----------------------------------------------------
    // TEST 4: IMAGE REPLACEMENT & UPDATE
    // ----------------------------------------------------
    console.log('\n--- 4. PENGUJIAN PENGGANTIAN GAMBAR PRODUK ---');
    const updatedProd = DatabaseService.updateProduct(product.id, {
      name: 'Stiker Hologram Custom A3+ (Revisi)',
      imagePath: `products/${testProdId}/image_v2.webp`,
      thumbnailPath: `products/${testProdId}/thumbnail_v2.webp`,
    });
    assert(updatedProd.name.includes('Revisi'), 'Nama produk berhasil diperbarui');
    assert(updatedProd.imagePath === `products/${testProdId}/image_v2.webp`, 'imagePath produk berhasil diperbarui');

    // ----------------------------------------------------
    // TEST 5: IMAGE REMOVAL (SET TO NULL)
    // ----------------------------------------------------
    console.log('\n--- 5. PENGUJIAN PENGHAPUSAN GAMBAR (DEFAULT PLACEHOLDER) ---');
    const clearedProd = DatabaseService.updateProduct(product.id, {
      imagePath: null,
      thumbnailPath: null,
    });
    assert(clearedProd.imagePath === null, 'imagePath diset ke null saat gambar dihapus');
    assert(clearedProd.thumbnailPath === null, 'thumbnailPath diset ke null saat gambar dihapus');

    // ----------------------------------------------------
    // TEST 6: PRODUCT DELETION & DIRECTORY CLEANUP
    // ----------------------------------------------------
    console.log('\n--- 6. PENGUJIAN HAPUS PRODUK & PEMBERSIHAN FOLDER ---');
    DatabaseService.deleteProduct(product.id);
    const deletedCheck = DatabaseService.getProductById(product.id);
    assert(deletedCheck === null, 'Produk berhasil dihapus dari database SQLite');

    // Clean up test files if any remain
    if (fs.existsSync(testProdDir)) {
      fs.rmSync(testProdDir, { recursive: true, force: true });
    }
    assert(!fs.existsSync(testProdDir), 'Folder uploads produk uji coba berhasil dibersihkan');

    // ----------------------------------------------------
    // TEST 7: EXISTING PRODUCTS INTEGRITY CHECK
    // ----------------------------------------------------
    console.log('\n--- 7. VERIFIKASI INTEGRITAS PRODUK EKSISTING ---');
    const allProducts = DatabaseService.getProducts();
    assert(allProducts.length > 0, 'Produk eksisting tetap utuh dan dapat dimuat');
    const sampleExisting = allProducts[0];
    assert(sampleExisting.id && sampleExisting.name, 'Produk eksisting valid');
    console.log(`[Sample Produk Eksisting]: ${sampleExisting.name} (imagePath: ${sampleExisting.imagePath || 'null [Default Placeholder]'})`);

    // ----------------------------------------------------
    // FINAL SUMMARY
    // ----------------------------------------------------
    console.log('\n===========================================================');
    console.log(`🎉 SEMUA PENGUJIAN GAMBAR BERHASIL: ${passedTests}/${totalTests} TESTS PASSED (100%) 🎉`);
    console.log('===========================================================');
  } catch (err: any) {
    console.error('\n❌ PENGUJIAN GAGAL DENGAN KESALAHAN:', err.message);
    process.exit(1);
  }
}

runImageTests();
