import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { DatabaseService } from './database/dbService';
import { migrateJsonToSqlite } from './database/migrator';
import { initializeDatabaseSchema } from './database/schema';
import { getDatabasePath } from './database/connection';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable CORS for web and Capacitor clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Set up storage for uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// Initialize database schema and perform automatic migration from db.json if needed
try {
  initializeDatabaseSchema();
  const migrationResult = migrateJsonToSqlite(false);
  console.log(`[Database Init]: ${migrationResult.message}`);
} catch (err) {
  console.error('[Database Init Error]:', err);
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Sukunaru Studio API (SQLite Edition)',
    database: 'SQLite 3 via better-sqlite3',
    time: new Date().toISOString(),
  });
});

// Reset Sample Data
app.post('/api/reset-sample-data', (req, res) => {
  try {
    const result = DatabaseService.resetSampleData();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mereset data sample' });
  }
});

// Settings API
app.get('/api/settings', (req, res) => {
  try {
    const settings = DatabaseService.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat pengaturan' });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const updated = DatabaseService.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memperbarui pengaturan' });
  }
});

// Business Logo / Profile Picture Upload
const businessLogoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format logo tidak didukung. Gunakan JPG, PNG, atau WebP.'));
    }
  },
}).single('logo');

app.post('/api/settings/logo', (req, res) => {
  businessLogoUpload(req, res, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Ukuran file foto profil terlalu besar. Maksimal 10MB.' });
      }
      return res.status(400).json({ error: err.message || 'Gagal memproses file yang diunggah.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file gambar logo yang diunggah.' });
      }

      const sharp = (await import('sharp')).default;
      sharp.cache(false);

      const businessDir = path.join(UPLOADS_DIR, 'business');
      if (!fs.existsSync(businessDir)) {
        fs.mkdirSync(businessDir, { recursive: true });
      }

      const timestamp = Date.now();
      const logoFilename = `logo_${timestamp}.webp`;
      const logoFullPath = path.join(businessDir, logoFilename);

      // Process crisp square/fit logo (max 600x600)
      await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(logoFullPath);

      const logoUrl = `/uploads/business/${logoFilename}`;

      // Clean up previous logo files
      try {
        const files = fs.readdirSync(businessDir);
        for (const f of files) {
          if (f !== logoFilename && (f.startsWith('logo_') || f === 'logo.webp')) {
            const oldPath = path.join(businessDir, f);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
        }
      } catch (_) {}

      const updated = DatabaseService.updateSettings({ logoUrl });
      res.json({
        success: true,
        logoUrl,
        settings: updated,
      });
    } catch (uploadErr: any) {
      console.error('[Business Logo Upload Error]:', uploadErr);
      res.status(500).json({ error: 'Foto profil / logo tidak dapat diproses. Gunakan format JPG, PNG, atau WebP.' });
    }
  });
});

app.delete('/api/settings/logo', (req, res) => {
  try {
    const businessDir = path.join(UPLOADS_DIR, 'business');
    if (fs.existsSync(businessDir)) {
      const files = fs.readdirSync(businessDir);
      for (const f of files) {
        if (f.startsWith('logo_') || f === 'logo.webp') {
          const oldPath = path.join(businessDir, f);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      }
    }
    const updated = DatabaseService.updateSettings({ logoUrl: '' });
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus foto profil bisnis' });
  }
});


// Dashboard Stats API
app.get('/api/stats', (req, res) => {
  try {
    const stats = DatabaseService.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat statistik' });
  }
});

// Customers API
app.get('/api/customers', (req, res) => {
  try {
    const customers = DatabaseService.getCustomers();
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat pelanggan' });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama pelanggan wajib diisi' });
    }
    const customer = DatabaseService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menambah pelanggan' });
  }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const customer = DatabaseService.updateCustomer(req.params.id, req.body);
    res.json(customer);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memperbarui pelanggan' });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  try {
    DatabaseService.deleteCustomer(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus pelanggan' });
  }
});

// Materials (Inventory) API
app.get('/api/materials', (req, res) => {
  try {
    const materials = DatabaseService.getMaterials();
    res.json(materials);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat bahan baku' });
  }
});

app.post('/api/materials', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama material / bahan baku wajib diisi' });
    }
    const material = DatabaseService.createMaterial(req.body);
    res.status(201).json(material);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menambah material' });
  }
});

app.put('/api/materials/:id', (req, res) => {
  try {
    const material = DatabaseService.updateMaterial(req.params.id, req.body);
    res.json(material);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memperbarui material' });
  }
});

app.post('/api/materials/:id/movement', (req, res) => {
  try {
    const result = DatabaseService.addStockMovement(req.params.id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mencatat mutasi stok' });
  }
});

app.post('/api/materials/:id/restock', (req, res) => {
  try {
    const result = DatabaseService.restockMaterial(req.params.id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal melakukan restock material' });
  }
});

app.delete('/api/materials/:id', (req, res) => {
  try {
    DatabaseService.deleteMaterial(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus material' });
  }
});

app.get('/api/inventory/movements', (req, res) => {
  try {
    const movements = DatabaseService.getInventoryMovements();
    res.json(movements);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat riwayat mutasi' });
  }
});

// Products & HPP API
app.get('/api/products', (req, res) => {
  try {
    const products = DatabaseService.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat produk' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama produk wajib diisi' });
    }
    const product = DatabaseService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal membuat produk' });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const product = DatabaseService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memperbarui produk' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    DatabaseService.deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus produk' });
  }
});

// Product Image Upload
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_MB = 10;

const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.'));
    }
  },
}).single('image');

app.post('/api/products/:id/image', (req, res) => {
  productImageUpload(req, res, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `Ukuran gambar terlalu besar. Maksimal ${MAX_IMAGE_SIZE_MB}MB.` });
      }
      return res.status(400).json({ error: err.message || 'Gagal memproses file yang diunggah.' });
    }

    try {
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file gambar yang diunggah.' });
      }

      const product = DatabaseService.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: 'Produk tidak ditemukan.' });
      }

      const sharp = (await import('sharp')).default;
      sharp.cache(false);

      const productDir = path.join(UPLOADS_DIR, 'products', id);
      if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir, { recursive: true });
      }

      const imagePath = path.join(productDir, 'image.webp');
      const thumbnailPath = path.join(productDir, 'thumbnail.webp');

      // Save full image (max 1200px wide)
      await sharp(req.file.buffer)
        .rotate() // auto-orient EXIF
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(imagePath);

      // Save thumbnail (300x300 centered crop)
      await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 300, height: 300, fit: 'cover', position: 'centre' })
        .webp({ quality: 75 })
        .toFile(thumbnailPath);

      // Store relative paths
      const relImagePath = `products/${id}/image.webp`;
      const relThumbnailPath = `products/${id}/thumbnail.webp`;

      // Delete old files if paths changed
      if (product.imagePath && product.imagePath !== relImagePath) {
        const oldImage = path.join(UPLOADS_DIR, product.imagePath);
        if (fs.existsSync(oldImage)) fs.unlinkSync(oldImage);
      }

      const updated = DatabaseService.updateProduct(id, {
        imagePath: relImagePath,
        thumbnailPath: relThumbnailPath,
      });

      res.json({
        success: true,
        imagePath: relImagePath,
        thumbnailPath: relThumbnailPath,
        imageUrl: `/uploads/${relImagePath}`,
        thumbnailUrl: `/uploads/${relThumbnailPath}`,
        product: updated,
      });
    } catch (err: any) {
      console.error('[Product Image Upload Error]:', err);
      res.status(500).json({ error: 'Gambar tidak dapat diproses. Gunakan JPG, PNG, atau WebP.' });
    }
  });
});

app.delete('/api/products/:id/image', (req, res) => {
  try {
    const { id } = req.params;
    const product = DatabaseService.getProductById(id);
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

    // Remove image files
    const productDir = path.join(UPLOADS_DIR, 'products', id);
    ['image.webp', 'thumbnail.webp'].forEach(f => {
      const p = path.join(productDir, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    const updated = DatabaseService.updateProduct(id, { imagePath: null, thumbnailPath: null });
    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus gambar produk.' });
  }
});

// POS Checkout Transactions API
app.get('/api/transactions', (req, res) => {
  try {
    const transactions = DatabaseService.getTransactions();
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat transaksi' });
  }
});

app.post('/api/transactions', (req, res) => {
  try {
    const newTrx = DatabaseService.createTransaction(req.body);
    res.status(201).json(newTrx);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memproses transaksi kasir' });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  try {
    DatabaseService.deleteTransaction(req.params.id);
    res.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus transaksi' });
  }
});

// Refund / Revert Transaction Route
app.post('/api/transactions/:id/refund', (req, res) => {
  try {
    const { reason, refundedBy } = req.body || {};
    const result = DatabaseService.refundTransaction(req.params.id, reason, refundedBy);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal membatalkan transaksi' });
  }
});

// Clear / Reset All Transactions Route
app.post('/api/transactions/clear-all', (req, res) => {
  try {
    const result = DatabaseService.clearAllTransactions(req.body || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mereset semua transaksi' });
  }
});

// Orders API
app.get('/api/orders', (req, res) => {
  try {
    const orders = DatabaseService.getOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat pesanan' });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = DatabaseService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat detail pesanan' });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const order = DatabaseService.createOrder(req.body);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal membuat pesanan' });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status, reason } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Status wajib diisi' });
    const order = DatabaseService.updateOrderStatus(req.params.id, status, reason);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memperbarui status pesanan' });
  }
});

app.post('/api/orders/:id/payment', (req, res) => {
  try {
    const order = DatabaseService.addOrderPayment(req.params.id, req.body);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mencatat pembayaran pesanan' });
  }
});

app.put('/api/orders/:id/payment/:paymentId', (req, res) => {
  try {
    const order = DatabaseService.updateOrderPayment(req.params.id, req.params.paymentId, req.body);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memperbarui pembayaran pesanan' });
  }
});

app.delete('/api/orders/:id/payment/:paymentId', (req, res) => {
  try {
    const order = DatabaseService.deleteOrderPayment(req.params.id, req.params.paymentId);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menghapus pembayaran pesanan' });
  }
});

app.post('/api/orders/:id/files', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'File tidak ditemukan' });
    const fileObj = DatabaseService.addOrderFile(req.params.id, {
      ...file,
      notes: req.body.notes,
    });
    res.status(201).json(fileObj);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengunggah file ke pesanan' });
  }
});

app.delete('/api/orders/:id/files/:fileId', (req, res) => {
  try {
    DatabaseService.deleteOrderFile(req.params.id, req.params.fileId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus file pesanan' });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  try {
    DatabaseService.deleteOrder(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus pesanan' });
  }
});

// Expenses API
app.get('/api/expenses', (req, res) => {
  try {
    const expenses = DatabaseService.getExpenses();
    res.json(expenses);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat pengeluaran' });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const expense = DatabaseService.createExpense(req.body);
    res.status(201).json(expense);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mencatat pengeluaran' });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    DatabaseService.deleteExpense(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus pengeluaran' });
  }
});

// Financial Transactions / Cashflow API
app.get('/api/finance', (req, res) => {
  try {
    const financials = DatabaseService.getFinancialTransactions();
    res.json(financials);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat data keuangan' });
  }
});

app.post('/api/finance', (req, res) => {
  try {
    const fin = DatabaseService.createFinancialTransaction(req.body);
    res.status(201).json(fin);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mencatat mutasi kas' });
  }
});

// Global Search API
app.get('/api/search', (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();
    const result = DatabaseService.search(query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal melakukan pencarian' });
  }
});

// Backup & Restore API
app.get('/api/backup', (req, res) => {
  try {
    const backup = DatabaseService.getBackupData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=sukunaru_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    res.json(backup);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal membuat backup database' });
  }
});

// Direct SQLite DB File Download Endpoint
app.get('/api/backup/sqlite', (req, res) => {
  try {
    const dbPath = getDatabasePath();
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database SQLite belum dibuat' });
    }
    res.download(dbPath, `Sukunaru_Studio_${new Date().toISOString().slice(0, 10)}.db`);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengunduh file database' });
  }
});

app.post('/api/restore', (req, res) => {
  try {
    const backupData = req.body;
    const result = DatabaseService.restoreDatabase(backupData);
    res.json(result);
  } catch (err: any) {
    console.error('Restore error:', err);
    res.status(400).json({ error: err.message || 'Gagal memulihkan database' });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/uploads/**', '**/dist/**', '**/.git/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SUKUNARU STUDIO Server (SQLite Edition) running on http://localhost:${PORT}`);
  });
}

startServer();
