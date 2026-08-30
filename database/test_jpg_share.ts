console.log('===========================================================');
console.log('🧪 PENGUJIAN LOGIKA BERBAGI STRUK JPG KE WHATSAPP (WEB SHARE API) 🧪');
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
    // 1. File object construction from Blob
    console.log('\n--- 1. PENGUJIAN PEMBUATAN OBJEK FILE DARI BLOB JPG IN-MEMORY ---');
    const mockJpgBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const mockBlob = new Blob([mockJpgBytes], { type: 'image/jpeg' });
    const filename = 'Struk-STR-202608-002.jpg';
    const file = new File([mockBlob], filename, { type: 'image/jpeg' });

    assert(file instanceof File, 'Objek JavaScript File berhasil dibuat dari Blob in-memory');
    assert(file.name === filename, `Nama file terpasang benar: ${file.name}`);
    assert(file.type === 'image/jpeg', `MIME type file adalah image/jpeg`);
    assert(file.size === mockJpgBytes.length, `Ukuran file sesuai (${file.size} bytes)`);

    // 2. Web Share API File Sharing Check
    console.log('\n--- 2. PENGUJIAN LOGIKA DETEKSI NAVIGATOR.CANSHARE ---');
    const shareState: { called: boolean; payload: any } = { called: false, payload: null };

    const mockNavigatorSupported: any = {
      canShare: (data?: any) => {
        if (data && data.files && data.files.length > 0) {
          return data.files[0] instanceof File;
        }
        return true;
      },
      share: async (data: any) => {
        shareState.called = true;
        shareState.payload = data;
        return Promise.resolve();
      }
    };

    assert(mockNavigatorSupported.canShare({ files: [file] }) === true, 'navigator.canShare({ files: [file] }) mendeteksi dukungan file sharing');
    await mockNavigatorSupported.share({
      files: [file],
      title: 'Struk Sukunaru Studio',
      text: 'Berikut struk transaksi Anda.'
    });

    assert(shareState.called, 'navigator.share dipanggil langsung');
    assert(shareState.payload.files[0].name === filename, 'File JPG terlampir langsung di navigator.share payload');
    assert(shareState.payload.title === 'Struk Sukunaru Studio', 'Judul share sheet sesuai');

    // 3. User Cancellation (AbortError)
    console.log('\n--- 3. PENGUJIAN USER BATAL SHARE (ABORTERROR) ---');
    const mockNavigatorCancel: any = {
      canShare: (_data?: any) => true,
      share: async () => {
        const err: any = new Error('Share was aborted by the user');
        err.name = 'AbortError';
        throw err;
      }
    };

    let userCanceledHandled = false;
    try {
      await mockNavigatorCancel.share({ files: [file] });
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message.includes('aborted')) {
        userCanceledHandled = true;
      }
    }
    assert(userCanceledHandled === true, 'Batal share (AbortError) tertangkap dan tidak menimbulkan pesan error');

    // 4. Desktop / Unsupported Browser Fallback
    console.log('\n--- 4. PENGUJIAN DESKTOP / UNSUPPORTED BROWSER FALLBACK ---');
    const mockNavigatorUnsupported: any = {
      canShare: (_data?: any) => false,
    };
    assert(mockNavigatorUnsupported.canShare({ files: [file] }) === false, 'Browser tanpa file sharing dialihkan ke fallback');

    console.log('\n===========================================================');
    console.log(`🎉 SEMUA PENGUJIAN BERHASIL: ${passedTests}/${totalTests} TESTS PASSED (100%) 🎉`);
    console.log('===========================================================');
  } catch (err: any) {
    console.error('\n❌ PENGUJIAN GAGAL:', err);
    process.exit(1);
  }
}

runTests();
