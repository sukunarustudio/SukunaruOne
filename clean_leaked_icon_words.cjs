const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const textFixes = [
  { search: /InformationCircleIcon Versi Aplikasi/g, replace: 'Info Versi Aplikasi' },
  { search: /InformationCircleIcon/g, replace: 'Info' }, // for comments / remaining
  { search: /PencilSquareIcon Data Pelanggan/g, replace: 'Edit Data Pelanggan' },
  { search: /PencilSquareIcon Pelanggan/g, replace: 'Edit Pelanggan' },
  { search: /PencilSquareIcon Bahan Baku/g, replace: 'Edit Bahan Baku' },
  { search: /PencilSquareIcon Bahan/g, replace: 'Edit Bahan' },
  { search: /PencilSquareIcon Produk & HPP/g, replace: 'Edit Produk & HPP' },
  { search: /PencilSquareIcon Produk/g, replace: 'Edit Produk' },
  { search: /PencilSquareIcon Pembayaran/g, replace: 'Edit Pembayaran' },
  { search: /<span>PencilSquareIcon<\/span>/g, replace: '<span>Edit</span>' },
  { search: /title="PencilSquareIcon ([^"]+)"/g, replace: 'title="Edit $1"' },
  { search: /title="PencilSquareIcon"/g, replace: 'title="Edit"' },
  
  // Settings Database words
  { search: /Cadangan & Pemulihan CircleStackIcon/g, replace: 'Cadangan & Pemulihan Database' },
  { search: /Unduh Cadangan CircleStackIcon/g, replace: 'Unduh Cadangan Database' },
  { search: /Pulihkan CircleStackIcon dari File/g, replace: 'Pulihkan Database dari File' },
  { search: /Reset CircleStackIcon ke Contoh Awal/g, replace: 'Reset Database ke Contoh Awal' },
  { search: /CircleStackIcon tersimpan/g, replace: 'Database tersimpan' },
  { search: /CircleStackIcon berhasil dipulihkan/g, replace: 'Database berhasil dipulihkan' },
  
  // Activation Key words
  { search: /Serial KeyIcon Terdaftar/g, replace: 'Serial Key Terdaftar' },
  { search: /Kode Serial KeyIcon/g, replace: 'Kode Serial Key' },
  { search: /Serial KeyIcon/g, replace: 'Serial Key' },
  
  // Upload words
  { search: /ArrowUpTrayIcon File Desain/g, replace: 'Unggah File Desain' },
  
  // TopBar Menu words
  { search: /Tampilkan Bars3Icon/g, replace: 'Tampilkan Menu' },
  { search: /Sembunyikan Bars3Icon/g, replace: 'Sembunyikan Menu' },
  
  // Contact View
  { search: /name: 'CameraIcon'/g, replace: "name: 'Instagram'" },
  
  // Filter words
  { search: /FunnelIcon Kategori/g, replace: 'Filter Kategori' },
  { search: /FunnelIcon Tipe/g, replace: 'Filter Tipe' },
  { search: /FunnelIcon Aktif/g, replace: 'Filter Aktif' },
];

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedCount = 0;

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    textFixes.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Cleaned text in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished cleaning leaked icon words. Modified ${modifiedCount} files.`);
