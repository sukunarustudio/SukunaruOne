import { getDb } from './connection';

export const SCHEMA_VERSION = 1;

export function initializeDatabaseSchema(): void {
  const db = getDb();

  db.exec(`
    -- Metadata / System Table
    CREATE TABLE IF NOT EXISTS _meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Settings Table (Single-row or key-value)
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      businessName TEXT NOT NULL,
      tagline TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      address TEXT,
      receiptHeader TEXT,
      receiptFooter TEXT,
      bankAccount TEXT,
      logoUrl TEXT,
      currency TEXT DEFAULT 'IDR',
      invoicePrefix TEXT DEFAULT 'INV-',
      receiptPrefix TEXT DEFAULT 'STR-',
      defaultTaxPercent REAL DEFAULT 0,
      defaultDiscountPercent REAL DEFAULT 0,
      footerNotes TEXT
    );

    -- Customers Table
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      whatsapp TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      totalOrders INTEGER DEFAULT 0,
      totalSpent REAL DEFAULT 0,
      lastTransactionDate TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);

    -- Materials / Raw Materials (Inventory)
    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      category TEXT,
      unit TEXT DEFAULT 'pcs',
      currentStock REAL DEFAULT 0,
      minStock REAL DEFAULT 0,
      purchasePrice REAL DEFAULT 0,
      unitCost REAL DEFAULT 0,
      supplier TEXT,
      supplierContact TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_materials_sku ON materials(sku);
    CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);

    -- Inventory Movements (Audit Log of Stock In / Out / Adjustments)
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      materialId TEXT NOT NULL,
      materialName TEXT,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      previousStock REAL,
      newStock REAL,
      referenceType TEXT,
      referenceId TEXT,
      notes TEXT,
      date TEXT,
      createdAt TEXT,
      FOREIGN KEY (materialId) REFERENCES materials(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_movements_materialId ON inventory_movements(materialId);
    CREATE INDEX IF NOT EXISTS idx_movements_date ON inventory_movements(date);

    -- Products (Catalog & HPP)
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      category TEXT,
      type TEXT DEFAULT 'PHYSICAL',
      sellingPrice REAL DEFAULT 0,
      costPrice REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      profitMargin REAL DEFAULT 0,
      marginPercent REAL DEFAULT 0,
      laborCost REAL DEFAULT 0,
      machineCost REAL DEFAULT 0,
      otherCost REAL DEFAULT 0,
      trackStock INTEGER DEFAULT 0,
      minStock REAL DEFAULT 0,
      currentStock REAL DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      description TEXT,
      isActive INTEGER DEFAULT 1,
      imagePath TEXT,
      thumbnailPath TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

    -- Product Components (BOM - Bill of Materials for HPP)
    CREATE TABLE IF NOT EXISTS product_components (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      materialId TEXT,
      componentName TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT,
      unitCost REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (materialId) REFERENCES materials(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_prod_comp_productId ON product_components(productId);

    -- Orders Table (Custom Print & Graphic Design Jobs)
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderNumber TEXT NOT NULL UNIQUE,
      customerId TEXT,
      customerName TEXT NOT NULL,
      customerPhone TEXT,
      orderDate TEXT NOT NULL,
      deadlineDate TEXT,
      status TEXT DEFAULT 'BARU',
      paymentStatus TEXT DEFAULT 'BELUM_BAYAR',
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      totalAmount REAL DEFAULT 0,
      totalCost REAL DEFAULT 0,
      paidAmount REAL DEFAULT 0,
      remainingAmount REAL DEFAULT 0,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON orders(orderNumber);
    CREATE INDEX IF NOT EXISTS idx_orders_customerId ON orders(customerId);
    CREATE INDEX IF NOT EXISTS idx_orders_orderDate ON orders(orderDate);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productId TEXT,
      productName TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unitPrice REAL DEFAULT 0,
      costPrice REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items(orderId);

    -- Order Payments (DP & Installments)
    CREATE TABLE IF NOT EXISTS order_payments (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentMethod TEXT DEFAULT 'CASH',
      date TEXT,
      notes TEXT,
      createdAt TEXT,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_order_payments_orderId ON order_payments(orderId);

    -- Order Files (Design Attachments & Proofs)
    CREATE TABLE IF NOT EXISTS order_files (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      originalName TEXT NOT NULL,
      storedName TEXT NOT NULL,
      mimeType TEXT,
      size INTEGER,
      url TEXT,
      notes TEXT,
      createdAt TEXT,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_order_files_orderId ON order_files(orderId);

    -- Transactions (POS / Cashier Direct Sales)
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      receiptNumber TEXT NOT NULL UNIQUE,
      type TEXT DEFAULT 'POS',
      orderId TEXT,
      customerId TEXT,
      customerName TEXT NOT NULL,
      customerPhone TEXT,
      date TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      totalAmount REAL DEFAULT 0,
      totalCost REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      paidAmount REAL DEFAULT 0,
      changeAmount REAL DEFAULT 0,
      paymentMethod TEXT DEFAULT 'CASH',
      cashierName TEXT DEFAULT 'Owner',
      notes TEXT,
      createdAt TEXT,
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_receiptNumber ON transactions(receiptNumber);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

    -- Transaction Items
    CREATE TABLE IF NOT EXISTS transaction_items (
      id TEXT PRIMARY KEY,
      transactionId TEXT NOT NULL,
      productId TEXT,
      productName TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unitPrice REAL DEFAULT 0,
      costPrice REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      FOREIGN KEY (transactionId) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_trx_items_transactionId ON transaction_items(transactionId);

    -- Operational Expenses
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      paymentMethod TEXT DEFAULT 'CASH',
      reference TEXT,
      notes TEXT,
      receiptUrl TEXT,
      createdAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

    -- Financial Cashflow / Buku Kas
    CREATE TABLE IF NOT EXISTS financial_transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      referenceNumber TEXT,
      referenceType TEXT,
      referenceId TEXT,
      paymentMethod TEXT DEFAULT 'CASH',
      notes TEXT,
      createdAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_fin_date ON financial_transactions(date);
    CREATE INDEX IF NOT EXISTS idx_fin_type ON financial_transactions(type);
    CREATE INDEX IF NOT EXISTS idx_fin_ref ON financial_transactions(referenceType, referenceId);
  `);

  // Safe dynamic migration for existing databases: check and add missing columns
  const productCols = (db.prepare("PRAGMA table_info(products)").all() as any[]).map(c => c.name);
  if (!productCols.includes('imagePath')) {
    db.prepare('ALTER TABLE products ADD COLUMN imagePath TEXT').run();
  }
  if (!productCols.includes('thumbnailPath')) {
    db.prepare('ALTER TABLE products ADD COLUMN thumbnailPath TEXT').run();
  }

  const orderItemCols = (db.prepare("PRAGMA table_info(order_items)").all() as any[]).map(c => c.name);
  if (!orderItemCols.includes('imagePath')) {
    db.prepare('ALTER TABLE order_items ADD COLUMN imagePath TEXT').run();
  }
  if (!orderItemCols.includes('thumbnailPath')) {
    db.prepare('ALTER TABLE order_items ADD COLUMN thumbnailPath TEXT').run();
  }

  const trxItemCols = (db.prepare("PRAGMA table_info(transaction_items)").all() as any[]).map(c => c.name);
  if (!trxItemCols.includes('imagePath')) {
    db.prepare('ALTER TABLE transaction_items ADD COLUMN imagePath TEXT').run();
  }
  if (!trxItemCols.includes('thumbnailPath')) {
    db.prepare('ALTER TABLE transaction_items ADD COLUMN thumbnailPath TEXT').run();
  }

  // Ensure schema version is saved in _meta
  const row = db.prepare('SELECT value FROM _meta WHERE key = ?').get('schema_version') as { value: string } | undefined;
  if (!row) {
    db.prepare('INSERT INTO _meta (key, value) VALUES (?, ?)').run('schema_version', String(SCHEMA_VERSION));
  }
}
