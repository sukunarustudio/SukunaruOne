import fs from 'fs';
import path from 'path';
import { getDb } from './connection';
import { initializeDatabaseSchema } from './schema';

export interface MigrationResult {
  migrated: boolean;
  message: string;
  counts?: {
    settings: number;
    customers: number;
    materials: number;
    inventory_movements: number;
    products: number;
    product_components: number;
    orders: number;
    order_items: number;
    order_payments: number;
    order_files: number;
    transactions: number;
    transaction_items: number;
    expenses: number;
    financial_transactions: number;
  };
}

export function migrateJsonToSqlite(force: boolean = false): MigrationResult {
  initializeDatabaseSchema();
  const db = getDb();

  // Check if migration was already executed
  const metaMigrated = db.prepare('SELECT value FROM _meta WHERE key = ?').get('migration_completed') as { value: string } | undefined;
  if (metaMigrated && !force) {
    return {
      migrated: false,
      message: 'Database SQLite sudah termigrasi sebelumnya.',
    };
  }

  const jsonDbPath = path.join(process.cwd(), 'data', 'db.json');
  if (!fs.existsSync(jsonDbPath)) {
    return {
      migrated: false,
      message: 'File db.json tidak ditemukan, inisialisasi database SQLite kosong selesai.',
    };
  }

  // Backup original db.json
  const backupPath = path.join(process.cwd(), 'data', 'db.backup.json');
  try {
    fs.copyFileSync(jsonDbPath, backupPath);
    console.log(`[Migrator] Backup berhasil dibuat di: ${backupPath}`);
  } catch (err) {
    console.error('[Migrator] Gagal membuat backup db.backup.json:', err);
  }

  let jsonData: any;
  try {
    const raw = fs.readFileSync(jsonDbPath, 'utf-8');
    jsonData = JSON.parse(raw);
  } catch (err: any) {
    throw new Error(`Gagal membaca file JSON sumber: ${err.message}`);
  }

  const counts = {
    settings: 0,
    customers: 0,
    materials: 0,
    inventory_movements: 0,
    products: 0,
    product_components: 0,
    orders: 0,
    order_items: 0,
    order_payments: 0,
    order_files: 0,
    transactions: 0,
    transaction_items: 0,
    expenses: 0,
    financial_transactions: 0,
  };

  const runMigration = db.transaction(() => {
    // Temporarily turn off foreign keys during bulk load
    db.pragma('foreign_keys = OFF');

    if (force) {
      db.exec(`
        DELETE FROM product_components;
        DELETE FROM products;
        DELETE FROM order_files;
        DELETE FROM order_payments;
        DELETE FROM order_items;
        DELETE FROM orders;
        DELETE FROM transaction_items;
        DELETE FROM transactions;
        DELETE FROM inventory_movements;
        DELETE FROM materials;
        DELETE FROM customers;
        DELETE FROM expenses;
        DELETE FROM financial_transactions;
      `);
    }

    // 1. Settings
    if (jsonData.settings) {
      const s = jsonData.settings;
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO settings (
          id, businessName, tagline, phone, whatsapp, email, address,
          receiptHeader, receiptFooter, bankAccount, logoUrl, currency,
          invoicePrefix, receiptPrefix, defaultTaxPercent, defaultDiscountPercent, footerNotes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        'default_settings',
        s.businessName || 'SUKUNARU STUDIO',
        s.tagline || '',
        s.phone || '',
        s.whatsapp || '',
        s.email || '',
        s.address || '',
        s.receiptHeader || '',
        s.receiptFooter || '',
        s.bankAccount || '',
        s.logoUrl || '',
        s.currency || 'IDR',
        s.invoicePrefix || 'INV-',
        s.receiptPrefix || 'STR-',
        Number(s.defaultTaxPercent) || 0,
        Number(s.defaultDiscountPercent) || 0,
        s.footerNotes || ''
      );
      counts.settings = 1;
    }

    // 2. Customers
    const existingCustomerIds = new Set<string>();
    if (Array.isArray(jsonData.customers)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO customers (
          id, name, whatsapp, phone, address, notes, totalOrders, totalSpent, lastTransactionDate, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of jsonData.customers) {
        existingCustomerIds.add(c.id);
        stmt.run(
          c.id,
          c.name,
          c.whatsapp || '',
          c.phone || '',
          c.address || '',
          c.notes || '',
          Number(c.totalOrders) || 0,
          Number(c.totalSpent) || 0,
          c.lastTransactionDate || '',
          c.createdAt || new Date().toISOString().split('T')[0],
          c.updatedAt || new Date().toISOString().split('T')[0]
        );
        counts.customers++;
      }
    }

    // Auto-create customer stubs for transactions or orders referencing deleted customer IDs so FKs are clean
    const custStubStmt = db.prepare(`
      INSERT OR IGNORE INTO customers (
        id, name, whatsapp, phone, address, notes, totalOrders, totalSpent, lastTransactionDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (Array.isArray(jsonData.transactions)) {
      for (const t of jsonData.transactions) {
        if (t.customerId && !existingCustomerIds.has(t.customerId)) {
          existingCustomerIds.add(t.customerId);
          custStubStmt.run(
            t.customerId,
            t.customerName || 'Pelanggan POS',
            t.customerPhone || '',
            t.customerPhone || '',
            '',
            'Customer dari riwayat transaksi kasir',
            1,
            Number(t.totalAmount) || 0,
            t.date || '',
            t.createdAt || new Date().toISOString().split('T')[0],
            t.createdAt || new Date().toISOString().split('T')[0]
          );
          counts.customers++;
        }
      }
    }

    if (Array.isArray(jsonData.orders)) {
      for (const o of jsonData.orders) {
        if (o.customerId && !existingCustomerIds.has(o.customerId)) {
          existingCustomerIds.add(o.customerId);
          custStubStmt.run(
            o.customerId,
            o.customerName || 'Pelanggan Order',
            o.customerPhone || '',
            o.customerPhone || '',
            '',
            'Customer dari riwayat pesanan',
            1,
            Number(o.totalAmount) || 0,
            o.orderDate || '',
            o.createdAt || new Date().toISOString().split('T')[0],
            o.createdAt || new Date().toISOString().split('T')[0]
          );
          counts.customers++;
        }
      }
    }

    // 3. Materials
    const existingMaterialIds = new Set<string>();
    if (Array.isArray(jsonData.materials)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO materials (
          id, name, sku, category, unit, currentStock, minStock, purchasePrice, unitCost, supplier, supplierContact, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const m of jsonData.materials) {
        existingMaterialIds.add(m.id);
        const cost = Number(m.unitCost ?? m.purchasePrice ?? 0);
        stmt.run(
          m.id,
          m.name,
          m.sku || `MAT-${m.id}`,
          m.category || 'Umum',
          m.unit || 'pcs',
          Number(m.currentStock) || 0,
          Number(m.minStock) || 0,
          Number(m.purchasePrice) || cost,
          cost,
          m.supplier || '',
          m.supplierContact || m.supplierPhone || '',
          m.notes || '',
          m.createdAt || new Date().toISOString().split('T')[0],
          m.updatedAt || new Date().toISOString().split('T')[0]
        );
        counts.materials++;
      }
    }

    // 4. Inventory Movements
    if (Array.isArray(jsonData.inventory_movements)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO inventory_movements (
          id, materialId, materialName, type, quantity, previousStock, newStock, referenceType, referenceId, notes, date, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const mov of jsonData.inventory_movements) {
        stmt.run(
          mov.id,
          mov.materialId,
          mov.materialName || '',
          mov.type || 'IN',
          Number(mov.quantity) || 0,
          mov.previousStock !== undefined ? Number(mov.previousStock) : null,
          mov.newStock !== undefined ? Number(mov.newStock) : null,
          mov.referenceType || 'MANUAL',
          mov.referenceId || '',
          mov.notes || '',
          mov.date || mov.createdAt || new Date().toISOString().split('T')[0],
          mov.createdAt || new Date().toISOString().split('T')[0]
        );
        counts.inventory_movements++;
      }
    }

    // 5. Products & Product Components
    const existingProductIds = new Set<string>();
    if (Array.isArray(jsonData.products)) {
      const prodStmt = db.prepare(`
        INSERT OR REPLACE INTO products (
          id, name, sku, category, type, sellingPrice, costPrice, profit, profitMargin,
          marginPercent, laborCost, machineCost, otherCost, trackStock, minStock, currentStock,
          unit, description, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const compStmt = db.prepare(`
        INSERT OR REPLACE INTO product_components (
          id, productId, materialId, componentName, quantity, unit, unitCost, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of jsonData.products) {
        existingProductIds.add(p.id);
        prodStmt.run(
          p.id,
          p.name,
          p.sku || `PRD-${p.id}`,
          p.category || 'Umum',
          p.type || 'PHYSICAL',
          Number(p.sellingPrice) || 0,
          Number(p.costPrice) || 0,
          Number(p.profit) || 0,
          Number(p.profitMargin) || 0,
          Number(p.marginPercent) || 0,
          Number(p.laborCost) || 0,
          Number(p.machineCost) || 0,
          Number(p.otherCost) || 0,
          p.trackStock ? 1 : 0,
          Number(p.minStock) || 0,
          Number(p.currentStock) || 0,
          p.unit || 'pcs',
          p.description || '',
          p.isActive !== false ? 1 : 0,
          p.createdAt || new Date().toISOString().split('T')[0],
          p.updatedAt || new Date().toISOString().split('T')[0]
        );
        counts.products++;

        if (Array.isArray(p.components)) {
          for (const c of p.components) {
            const validMatId = c.materialId && existingMaterialIds.has(c.materialId) ? c.materialId : null;
            compStmt.run(
              c.id || `comp_${p.id}_${Math.random().toString(36).substr(2, 6)}`,
              p.id,
              validMatId,
              c.componentName || 'Komponen',
              Number(c.quantity) || 1,
              c.unit || 'pcs',
              Number(c.unitCost) || 0,
              Number(c.subtotal) || 0
            );
            counts.product_components++;
          }
        }
      }
    }

    // 6. Orders, Items, Payments, Files
    if (Array.isArray(jsonData.orders)) {
      const orderStmt = db.prepare(`
        INSERT OR REPLACE INTO orders (
          id, orderNumber, customerId, customerName, customerPhone, orderDate, deadlineDate,
          status, paymentStatus, subtotal, discount, totalAmount, totalCost, paidAmount, remainingAmount,
          notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const itemStmt = db.prepare(`
        INSERT OR REPLACE INTO order_items (
          id, orderId, productId, productName, quantity, unitPrice, costPrice, subtotal, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const payStmt = db.prepare(`
        INSERT OR REPLACE INTO order_payments (
          id, orderId, amount, paymentMethod, date, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const fileStmt = db.prepare(`
        INSERT OR REPLACE INTO order_files (
          id, orderId, originalName, storedName, mimeType, size, url, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const o of jsonData.orders) {
        orderStmt.run(
          o.id,
          o.orderNumber,
          o.customerId || null,
          o.customerName,
          o.customerPhone || '',
          o.orderDate || new Date().toISOString().split('T')[0],
          o.deadlineDate || '',
          o.status || 'BARU',
          o.paymentStatus || 'BELUM_BAYAR',
          Number(o.subtotal) || 0,
          Number(o.discount) || 0,
          Number(o.totalAmount) || 0,
          Number(o.totalCost) || 0,
          Number(o.paidAmount) || 0,
          Number(o.remainingAmount) || 0,
          o.notes || '',
          o.createdAt || new Date().toISOString().split('T')[0],
          o.updatedAt || new Date().toISOString().split('T')[0]
        );
        counts.orders++;

        if (Array.isArray(o.items)) {
          for (const item of o.items) {
            const validProdId = item.productId && existingProductIds.has(item.productId) ? item.productId : null;
            itemStmt.run(
              item.id || `item_${o.id}_${Math.random().toString(36).substr(2, 6)}`,
              o.id,
              validProdId,
              item.productName,
              Number(item.quantity) || 1,
              Number(item.unitPrice) || 0,
              Number(item.costPrice) || 0,
              Number(item.subtotal) || 0,
              item.notes || ''
            );
            counts.order_items++;
          }
        }

        if (Array.isArray(o.payments)) {
          for (const pay of o.payments) {
            payStmt.run(
              pay.id || `pay_${o.id}_${Math.random().toString(36).substr(2, 6)}`,
              o.id,
              Number(pay.amount) || 0,
              pay.paymentMethod || 'CASH',
              pay.date || o.orderDate || new Date().toISOString().split('T')[0],
              pay.notes || '',
              pay.createdAt || new Date().toISOString().split('T')[0]
            );
            counts.order_payments++;
          }
        }

        if (Array.isArray(o.files)) {
          for (const f of o.files) {
            fileStmt.run(
              f.id || `file_${o.id}_${Math.random().toString(36).substr(2, 6)}`,
              o.id,
              f.originalName || 'file',
              f.storedName || '',
              f.mimeType || 'application/octet-stream',
              Number(f.size) || 0,
              f.url || '',
              f.notes || '',
              f.createdAt || new Date().toISOString().split('T')[0]
            );
            counts.order_files++;
          }
        }
      }
    }

    // 7. Transactions & Transaction Items (POS)
    if (Array.isArray(jsonData.transactions)) {
      const trxStmt = db.prepare(`
        INSERT OR REPLACE INTO transactions (
          id, receiptNumber, type, orderId, customerId, customerName, customerPhone,
          date, subtotal, discount, totalAmount, totalCost, profit, paidAmount, changeAmount,
          paymentMethod, cashierName, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const trxItemStmt = db.prepare(`
        INSERT OR REPLACE INTO transaction_items (
          id, transactionId, productId, productName, quantity, unitPrice, costPrice, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const t of jsonData.transactions) {
        trxStmt.run(
          t.id,
          t.receiptNumber,
          t.type || 'POS',
          t.orderId || null,
          t.customerId || null,
          t.customerName || 'Pelanggan Umum',
          t.customerPhone || '',
          t.date || new Date().toISOString().split('T')[0],
          Number(t.subtotal) || 0,
          Number(t.discount) || 0,
          Number(t.totalAmount) || 0,
          Number(t.totalCost) || 0,
          Number(t.profit) || 0,
          Number(t.paidAmount) || 0,
          Number(t.changeAmount) || 0,
          t.paymentMethod || 'CASH',
          t.cashierName || 'Owner',
          t.notes || '',
          t.createdAt || new Date().toISOString().split('T')[0]
        );
        counts.transactions++;

        if (Array.isArray(t.items)) {
          for (const item of t.items) {
            const validProdId = item.productId && existingProductIds.has(item.productId) ? item.productId : null;
            trxItemStmt.run(
              item.id || `t_item_${t.id}_${Math.random().toString(36).substr(2, 6)}`,
              t.id,
              validProdId,
              item.productName,
              Number(item.quantity) || 1,
              Number(item.unitPrice) || 0,
              Number(item.costPrice) || 0,
              Number(item.subtotal) || 0
            );
            counts.transaction_items++;
          }
        }
      }
    }

    // 8. Expenses
    if (Array.isArray(jsonData.expenses)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO expenses (
          id, category, description, amount, date, paymentMethod, reference, notes, receiptUrl, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of jsonData.expenses) {
        stmt.run(
          e.id,
          e.category || 'Operasional',
          e.description || '',
          Number(e.amount) || 0,
          e.date || new Date().toISOString().split('T')[0],
          e.paymentMethod || 'CASH',
          e.reference || '',
          e.notes || '',
          e.receiptUrl || '',
          e.createdAt || new Date().toISOString().split('T')[0]
        );
        counts.expenses++;
      }
    }

    // 9. Financial Transactions
    if (Array.isArray(jsonData.financial_transactions)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO financial_transactions (
          id, date, type, category, description, amount, referenceNumber, referenceType, referenceId, paymentMethod, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const f of jsonData.financial_transactions) {
        stmt.run(
          f.id,
          f.date || new Date().toISOString().split('T')[0],
          f.type || 'INCOME',
          f.category || 'Umum',
          f.description || '',
          Number(f.amount) || 0,
          f.referenceNumber || '',
          f.referenceType || 'MANUAL',
          f.referenceId || '',
          f.paymentMethod || 'CASH',
          f.notes || '',
          f.createdAt || new Date().toISOString().split('T')[0]
        );
        counts.financial_transactions++;
      }
    }

    // Mark migration completed in metadata
    db.prepare('INSERT OR REPLACE INTO _meta (key, value) VALUES (?, ?)').run('migration_completed', new Date().toISOString());
    db.prepare('INSERT OR REPLACE INTO _meta (key, value) VALUES (?, ?)').run('migration_source', jsonDbPath);

    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');
  });

  runMigration();

  return {
    migrated: true,
    message: 'Migrasi database Sukunaru Studio ke SQLite berhasil dengan sukses!',
    counts,
  };
}
