import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { DatabaseService } from './dbService';

console.log('===========================================================');
console.log('🧪 PENGUJIAN FITUR FOTO PROFIL / LOGO BISNIS 🧪');
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
    const uploadsDir = path.join(process.cwd(), 'uploads', 'business');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log('\n--- 1. PENGUJIAN MEMBUAT DAN MENYIMPAN LOGO BISNIS (WEBP) ---');
    // Create a 200x200 sample logo buffer
    const sampleLogoBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 16, g: 185, b: 129, alpha: 1 }
      }
    })
    .png()
    .toBuffer();

    const timestamp = Date.now();
    const testLogoFilename = `logo_test_${timestamp}.webp`;
    const testLogoFullPath = path.join(uploadsDir, testLogoFilename);

    await sharp(sampleLogoBuffer)
      .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(testLogoFullPath);

    assert(fs.existsSync(testLogoFullPath), 'File WebP logo berhasil diproses dan disimpan di folder uploads/business');

    console.log('\n--- 2. PENGUJIAN INTEGRASI DATABASE SETTINGS LOGO_URL ---');
    const relativeLogoUrl = `/uploads/business/${testLogoFilename}`;
    const updatedSettings = DatabaseService.updateSettings({ logoUrl: relativeLogoUrl });

    assert(updatedSettings.logoUrl === relativeLogoUrl, 'Settings database berhasil menyimpan logoUrl');

    const fetchedSettings = DatabaseService.getSettings();
    assert(fetchedSettings.logoUrl === relativeLogoUrl, 'Settings yang dibaca kembali dari database memuat logoUrl yang sama');

    console.log('\n--- 3. PENGUJIAN PENGHAPUSAN LOGO BISNIS ---');
    if (fs.existsSync(testLogoFullPath)) {
      fs.unlinkSync(testLogoFullPath);
    }
    const clearedSettings = DatabaseService.updateSettings({ logoUrl: '' });
    assert(clearedSettings.logoUrl === '', 'Settings logoUrl berhasil dikosongkan saat dihapus');

    console.log('\n===========================================================');
    console.log(`🎉 SEMUA PENGUJIAN LOGO BERHASIL: ${passedTests}/${totalTests} TESTS PASSED (100%) 🎉`);
    console.log('===========================================================');
  } catch (err: any) {
    console.error('\n❌ PENGUJIAN GAGAL:', err);
    process.exit(1);
  }
}

runTests();
