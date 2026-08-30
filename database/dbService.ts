import { getDb, getDatabasePath, closeDb, reopenDb } from './connection';
import { initializeDatabaseSchema } from './schema';
import fs from 'fs';
import path from 'path';

export interface BusinessSettings {
  businessName: string;
  tagline?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  bankAccount?: string;
  logoUrl?: string;
  currency?: string;
  invoicePrefix?: string;
  receiptPrefix?: string;
  defaultTaxPercent?: number;
  defaultDiscountPercent?: number;
  footerNotes?: string;
}

export const DatabaseService = {
  // ----------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------
  getSettings(): BusinessSettings {
    initializeDatabaseSchema();
    const db = getDb();
    const row = db.prepare('SELECT * FROM settings WHERE id = ?').get('default_settings') as any;
    if (!row) {
      const defaultSettings: BusinessSettings = {
        businessName: 'SUKUNARU STUDIO',
        tagline: 'Percetakan & Desain Grafis Cepat',
        phone: '0812-3456-7890',
        whatsapp: '081234567890',
        email: 'sukunarustudio@gmail.com',
        address: 'Jl. Percetakan Studio No. 12, Malang, Jawa Timur',
        receiptHeader: 'SUKUNARU STUDIO - Cetak Stiker, MDF, Undangan & Desain',
        receiptFooter: 'Terima kasih atas kepercayaan Anda!',
        bankAccount: 'BCA: 123-456-7890 a.n Sukunaru Studio\nMandiri: 987-654-3210 a.n Sukunaru Studio',
        currency: 'IDR',
        invoicePrefix: 'INV-',
        receiptPrefix: 'STR-',
        defaultTaxPercent: 0,
        defaultDiscountPercent: 0,
        footerNotes: 'Terima kasih telah mempercayakan kebutuhan cetak & desain Anda kepada Sukunaru Studio!',
      };
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO settings (
          id, businessName, tagline, phone, whatsapp, email, address,
          receiptHeader, receiptFooter, bankAccount, logoUrl, currency,
          invoicePrefix, receiptPrefix, defaultTaxPercent, defaultDiscountPercent, footerNotes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        'default_settings',
        defaultSettings.businessName,
        defaultSettings.tagline,
        defaultSettings.phone,
        defaultSettings.whatsapp,
        defaultSettings.email,
        defaultSettings.address,
        defaultSettings.receiptHeader,
        defaultSettings.receiptFooter,
        defaultSettings.bankAccount,
        defaultSettings.logoUrl || '',
        defaultSettings.currency,
        defaultSettings.invoicePrefix,
        defaultSettings.receiptPrefix,
        defaultSettings.defaultTaxPercent,
        defaultSettings.defaultDiscountPercent,
        defaultSettings.footerNotes
      );
      return defaultSettings;
    }
    return row;
  },

  updateSettings(data: Partial<BusinessSettings>): BusinessSettings {
    initializeDatabaseSchema();
    const db = getDb();
    const current = (db.prepare('SELECT * FROM settings WHERE id = ?').get('default_settings') as any) || {};
    const updated = { ...current, ...data };

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settings (
        id, businessName, tagline, phone, whatsapp, email, address,
        receiptHeader, receiptFooter, bankAccount, logoUrl, currency,
        invoicePrefix, receiptPrefix, defaultTaxPercent, defaultDiscountPercent, footerNotes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      'default_settings',
      updated.businessName || 'SUKUNARU STUDIO',
      updated.tagline || '',
      updated.phone || '',
      updated.whatsapp || '',
      updated.email || '',
      updated.address || '',
      updated.receiptHeader || '',
      updated.receiptFooter || '',
      updated.bankAccount || '',
      updated.logoUrl || '',
      updated.currency || 'IDR',
      updated.invoicePrefix || 'INV-',
      updated.receiptPrefix || 'STR-',
      Number(updated.defaultTaxPercent) || 0,
      Number(updated.defaultDiscountPercent) || 0,
      updated.footerNotes || ''
    );

    return updated;
  },

  // ----------------------------------------------------
  // CUSTOMERS
  // ----------------------------------------------------
  getCustomers(): any[] {
    const db = getDb();
    return db.prepare('SELECT * FROM customers ORDER BY createdAt DESC, name ASC').all();
  },

  getCustomerById(id: string): any | null {
    const db = getDb();
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(id) || null;
  },

  createCustomer(data: { name: string; whatsapp?: string; phone?: string; address?: string; notes?: string }): any {
    const db = getDb();
    const now = new Date().toISOString().split('T')[0];
    const newCust = {
      id: 'cust_' + Date.now(),
      name: data.name.trim(),
      whatsapp: data.whatsapp || data.phone || '',
      phone: data.phone || data.whatsapp || '',
      address: data.address || '',
      notes: data.notes || '',
      totalOrders: 0,
      totalSpent: 0,
      lastTransactionDate: '',
      createdAt: now,
      updatedAt: now,
    };

    const stmt = db.prepare(`
      INSERT INTO customers (
        id, name, whatsapp, phone, address, notes, totalOrders, totalSpent, lastTransactionDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newCust.id,
      newCust.name,
      newCust.whatsapp,
      newCust.phone,
      newCust.address,
      newCust.notes,
      newCust.totalOrders,
      newCust.totalSpent,
      newCust.lastTransactionDate,
      newCust.createdAt,
      newCust.updatedAt
    );

    return newCust;
  },

  updateCustomer(id: string, data: any): any {
    const db = getDb();
    const existing = this.getCustomerById(id);
    if (!existing) throw new Error('Pelanggan tidak ditemukan');

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const stmt = db.prepare(`
      UPDATE customers SET
        name = ?, whatsapp = ?, phone = ?, address = ?, notes = ?,
        totalOrders = ?, totalSpent = ?, lastTransactionDate = ?, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.name,
      updated.whatsapp || '',
      updated.phone || '',
      updated.address || '',
      updated.notes || '',
      Number(updated.totalOrders) || 0,
      Number(updated.totalSpent) || 0,
      updated.lastTransactionDate || '',
      updated.updatedAt,
      id
    );

    return updated;
  },

  deleteCustomer(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  },

  // ----------------------------------------------------
  // MATERIALS & INVENTORY
  // ----------------------------------------------------
  getMaterials(): any[] {
    const db = getDb();
    return db.prepare('SELECT * FROM materials ORDER BY category ASC, name ASC').all();
  },

  getMaterialById(id: string): any | null {
    const db = getDb();
    return db.prepare('SELECT * FROM materials WHERE id = ?').get(id) || null;
  },

  createMaterial(data: any): any {
    const db = getDb();
    const now = new Date().toISOString().split('T')[0];
    const cost = Number(data.unitCost ?? data.purchasePrice ?? 0);
    const newMat = {
      id: 'mat_' + Date.now(),
      name: data.name.trim(),
      sku: data.sku || 'MAT-' + Date.now().toString().slice(-6),
      category: data.category || 'Kertas',
      unit: data.unit || 'pcs',
      currentStock: Number(data.currentStock) || 0,
      minStock: Number(data.minStock) || 0,
      purchasePrice: cost,
      unitCost: cost,
      supplier: data.supplier || '',
      supplierContact: data.supplierContact || data.supplierPhone || '',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    const createTransaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO materials (
          id, name, sku, category, unit, currentStock, minStock, purchasePrice, unitCost, supplier, supplierContact, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        newMat.id,
        newMat.name,
        newMat.sku,
        newMat.category,
        newMat.unit,
        newMat.currentStock,
        newMat.minStock,
        newMat.purchasePrice,
        newMat.unitCost,
        newMat.supplier,
        newMat.supplierContact,
        newMat.notes,
        newMat.createdAt,
        newMat.updatedAt
      );

      if (newMat.currentStock > 0) {
        db.prepare(`
          INSERT INTO inventory_movements (
            id, materialId, materialName, type, quantity, previousStock, newStock, referenceType, notes, date, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'mov_' + Date.now(),
          newMat.id,
          newMat.name,
          'IN',
          newMat.currentStock,
          0,
          newMat.currentStock,
          'RESTOCK',
          'Stok awal penambahan material',
          now,
          now
        );
      }
    });

    createTransaction();
    return newMat;
  },

  updateMaterial(id: string, data: any): any {
    const db = getDb();
    const old = this.getMaterialById(id);
    if (!old) throw new Error('Material tidak ditemukan');

    const cost = Number(data.unitCost ?? data.purchasePrice ?? old.unitCost);
    const newStock = Number(data.currentStock !== undefined ? data.currentStock : old.currentStock);
    const updated = {
      ...old,
      ...data,
      currentStock: newStock,
      minStock: Number(data.minStock ?? old.minStock),
      purchasePrice: cost,
      unitCost: cost,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updateTransaction = db.transaction(() => {
      // If stock was directly changed manually in edit
      if (newStock !== old.currentStock) {
        const diff = newStock - old.currentStock;
        const now = new Date().toISOString().split('T')[0];
        db.prepare(`
          INSERT INTO inventory_movements (
            id, materialId, materialName, type, quantity, previousStock, newStock, referenceType, notes, date, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'mov_' + Date.now(),
          updated.id,
          updated.name,
          diff > 0 ? 'IN' : 'OUT',
          Math.abs(diff),
          old.currentStock,
          newStock,
          'MANUAL',
          'Penyesuaian manual melalui edit material',
          now,
          now
        );
      }

      const stmt = db.prepare(`
        UPDATE materials SET
          name = ?, sku = ?, category = ?, unit = ?, currentStock = ?, minStock = ?,
          purchasePrice = ?, unitCost = ?, supplier = ?, supplierContact = ?, notes = ?, updatedAt = ?
        WHERE id = ?
      `);

      stmt.run(
        updated.name,
        updated.sku,
        updated.category,
        updated.unit,
        updated.currentStock,
        updated.minStock,
        updated.purchasePrice,
        updated.unitCost,
        updated.supplier || '',
        updated.supplierContact || '',
        updated.notes || '',
        updated.updatedAt,
        id
      );
    });

    updateTransaction();
    return updated;
  },

  addStockMovement(materialId: string, data: { type: string; quantity: number; referenceType?: string; notes?: string }): { material: any; movement: any } {
    const db = getDb();
    const material = this.getMaterialById(materialId);
    if (!material) throw new Error('Material tidak ditemukan');

    const qty = Number(data.quantity);
    if (!qty || qty <= 0) throw new Error('Jumlah harus lebih dari 0');

    const prev = material.currentStock;
    let newStock = prev;

    if (data.type === 'IN') {
      newStock = prev + qty;
    } else if (data.type === 'OUT') {
      newStock = Math.max(0, prev - qty);
    } else if (data.type === 'ADJUSTMENT') {
      newStock = qty;
    }

    const now = new Date().toISOString().split('T')[0];
    const movement = {
      id: 'mov_' + Date.now(),
      materialId: material.id,
      materialName: material.name,
      type: data.type || 'IN',
      quantity: data.type === 'ADJUSTMENT' ? Math.abs(newStock - prev) : qty,
      previousStock: prev,
      newStock,
      referenceType: data.referenceType || 'MANUAL',
      notes: data.notes || '',
      date: now,
      createdAt: now,
    };

    const movTx = db.transaction(() => {
      db.prepare('UPDATE materials SET currentStock = ?, updatedAt = ? WHERE id = ?').run(newStock, now, materialId);
      db.prepare(`
        INSERT INTO inventory_movements (
          id, materialId, materialName, type, quantity, previousStock, newStock, referenceType, notes, date, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movement.id,
        movement.materialId,
        movement.materialName,
        movement.type,
        movement.quantity,
        movement.previousStock,
        movement.newStock,
        movement.referenceType,
        movement.notes,
        movement.date,
        movement.createdAt
      );
    });

    movTx();
    material.currentStock = newStock;
    return { material, movement };
  },

  restockMaterial(id: string, data: { quantity: number; unitPrice?: number; paymentMethod?: string; supplier?: string; recordExpense?: boolean; notes?: string }): { success: boolean; material: any; movement: any } {
    const db = getDb();
    const material = this.getMaterialById(id);
    if (!material) throw new Error('Material tidak ditemukan');

    const qty = Number(data.quantity);
    if (!qty || qty <= 0) throw new Error('Jumlah restock harus lebih dari 0');

    const costPerUnit = Number(data.unitPrice ?? material.purchasePrice ?? material.unitCost ?? 0);
    const totalCost = qty * costPerUnit;
    const prev = material.currentStock;
    const newStock = prev + qty;
    const now = new Date().toISOString().split('T')[0];

    const movement = {
      id: 'mov_' + Date.now(),
      materialId: material.id,
      materialName: material.name,
      type: 'IN',
      quantity: qty,
      previousStock: prev,
      newStock,
      referenceType: 'RESTOCK',
      notes: data.notes || `Restock ${qty} ${material.unit} dari ${data.supplier || material.supplier || 'Supplier'}`,
      date: now,
      createdAt: now,
    };

    const restockTx = db.transaction(() => {
      // 1. Update Material
      db.prepare(`
        UPDATE materials SET
          currentStock = ?,
          purchasePrice = CASE WHEN ? > 0 THEN ? ELSE purchasePrice END,
          unitCost = CASE WHEN ? > 0 THEN ? ELSE unitCost END,
          supplier = CASE WHEN ? != '' THEN ? ELSE supplier END,
          updatedAt = ?
        WHERE id = ?
      `).run(
        newStock,
        costPerUnit, costPerUnit,
        costPerUnit, costPerUnit,
        data.supplier || '', data.supplier || '',
        now,
        id
      );

      // 2. Log Movement
      db.prepare(`
        INSERT INTO inventory_movements (
          id, materialId, materialName, type, quantity, previousStock, newStock, referenceType, notes, date, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movement.id,
        movement.materialId,
        movement.materialName,
        movement.type,
        movement.quantity,
        movement.previousStock,
        movement.newStock,
        movement.referenceType,
        movement.notes,
        movement.date,
        movement.createdAt
      );

      // 3. Auto-record expense & cashflow if requested
      if (data.recordExpense && totalCost > 0) {
        const expenseId = 'exp_' + Date.now();
        db.prepare(`
          INSERT INTO expenses (
            id, category, description, amount, date, paymentMethod, reference, notes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          expenseId,
          'Pembelian Bahan Baku',
          `Restock Bahan: ${material.name} (${qty} ${material.unit})`,
          totalCost,
          now,
          data.paymentMethod || 'CASH',
          `RESTOCK-${material.sku || material.id}`,
          data.notes || `Pembelian dari ${data.supplier || material.supplier || 'Supplier'}`,
          now
        );

        db.prepare(`
          INSERT INTO financial_transactions (
            id, date, type, category, description, amount, referenceType, referenceId, paymentMethod, notes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'fin_' + Date.now(),
          now,
          'EXPENSE',
          'Pembelian Bahan Baku',
          `Restock Bahan: ${material.name} (${qty} ${material.unit})`,
          totalCost,
          'EXPENSE',
          expenseId,
          data.paymentMethod || 'CASH',
          `Restock ${qty} ${material.unit} @ Rp${costPerUnit.toLocaleString('id-ID')}`,
          now
        );
      }
    });

    restockTx();
    material.currentStock = newStock;
    if (costPerUnit > 0) {
      material.purchasePrice = costPerUnit;
      material.unitCost = costPerUnit;
    }
    return { success: true, material, movement };
  },

  deleteMaterial(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM materials WHERE id = ?').run(id);
  },

  getInventoryMovements(): any[] {
    const db = getDb();
    return db.prepare('SELECT * FROM inventory_movements ORDER BY createdAt DESC, date DESC LIMIT 300').all();
  },

  // Helper to deduct material stocks during POS/Order within active transaction
  _deductMaterialStock(db: any, productId: string, quantity: number, refType: string, refId: string, customerName?: string) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const components = db.prepare('SELECT * FROM product_components WHERE productId = ?').all(productId);

    if (components && components.length > 0) {
      for (const comp of components) {
        if (comp.materialId) {
          const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(comp.materialId);
          if (material) {
            const deductQty = (Number(comp.quantity) || 1) * quantity;
            const prev = material.currentStock;
            const newStock = Math.max(0, prev - deductQty);

            db.prepare('UPDATE materials SET currentStock = ?, updatedAt = ? WHERE id = ?').run(newStock, todayStr, material.id);

            db.prepare(`
              INSERT INTO inventory_movements (
                id, materialId, materialName, type, quantity, previousStock, newStock, referenceType, referenceId, notes, date, createdAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              'mov_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              material.id,
              material.name,
              'OUT',
              deductQty,
              prev,
              newStock,
              refType,
              refId,
              `Digunakan untuk ${product.name} × ${quantity} (${refType} #${refId}${customerName ? ' - ' + customerName : ''})`,
              todayStr,
              todayStr
            );
          }
        }
      }
    } else if (product.trackStock) {
      const material = db.prepare('SELECT * FROM materials WHERE sku = ? OR LOWER(name) = LOWER(?)').get(product.sku, product.name);
      if (material) {
        const prev = material.currentStock;
        const newStock = Math.max(0, prev - quantity);

        db.prepare('UPDATE materials SET currentStock = ?, updatedAt = ? WHERE id = ?').run(newStock, todayStr, material.id);

        db.prepare(`
          INSERT INTO inventory_movements (
            id, materialId, materialName, type, quantity, previousStock, newStock, referenceType, referenceId, notes, date, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'mov_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          material.id,
          material.name,
          'OUT',
          quantity,
          prev,
          newStock,
          refType,
          refId,
          `Penjualan langsung ${product.name} × ${quantity} (${refType} #${refId})`,
          todayStr,
          todayStr
        );
      }
    }
  },

  // ----------------------------------------------------
  // PRODUCTS & HPP
  // ----------------------------------------------------
  getProducts(): any[] {
    const db = getDb();
    const prods = db.prepare('SELECT * FROM products ORDER BY category ASC, name ASC').all();
    const compStmt = db.prepare('SELECT * FROM product_components WHERE productId = ?');

    return prods.map((p: any) => ({
      ...p,
      trackStock: Boolean(p.trackStock),
      isActive: Boolean(p.isActive),
      components: compStmt.all(p.id),
    }));
  },

  getProductById(id: string): any | null {
    const db = getDb();
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!p) return null;

    p.trackStock = Boolean(p.trackStock);
    p.isActive = Boolean(p.isActive);
    p.components = db.prepare('SELECT * FROM product_components WHERE productId = ?').all(id);
    return p;
  },

  createProduct(data: any): any {
    const db = getDb();
    const now = new Date().toISOString().split('T')[0];
    const sp = Number(data.sellingPrice) || 0;
    const cp = Number(data.costPrice) || 0;
    const calculatedProfit = sp - cp;
    const calculatedMargin = sp > 0 ? Number(((calculatedProfit / sp) * 100).toFixed(1)) : 0;

    const newProd = {
      id: 'prod_' + Date.now(),
      name: data.name.trim(),
      sku: data.sku || 'PRD-' + Date.now().toString().slice(-6),
      category: data.category || 'Umum',
      type: data.type || 'PHYSICAL',
      sellingPrice: sp,
      costPrice: cp,
      profit: calculatedProfit,
      profitMargin: calculatedMargin,
      marginPercent: Number(data.marginPercent ?? calculatedMargin),
      laborCost: Number(data.laborCost) || 0,
      machineCost: Number(data.machineCost) || 0,
      otherCost: Number(data.otherCost) || 0,
      trackStock: Boolean(data.trackStock),
      minStock: Number(data.minStock) || 0,
      currentStock: Number(data.currentStock) || 0,
      unit: data.unit || 'pcs',
      description: data.description || '',
      isActive: data.isActive !== false,
      imagePath: data.imagePath || null,
      thumbnailPath: data.thumbnailPath || null,
      components: Array.isArray(data.components) ? data.components : [],
      createdAt: now,
      updatedAt: now,
    };

    const createTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO products (
          id, name, sku, category, type, sellingPrice, costPrice, profit, profitMargin,
          marginPercent, laborCost, machineCost, otherCost, trackStock, minStock, currentStock,
          unit, description, isActive, imagePath, thumbnailPath, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newProd.id,
        newProd.name,
        newProd.sku,
        newProd.category,
        newProd.type,
        newProd.sellingPrice,
        newProd.costPrice,
        newProd.profit,
        newProd.profitMargin,
        newProd.marginPercent,
        newProd.laborCost,
        newProd.machineCost,
        newProd.otherCost,
        newProd.trackStock ? 1 : 0,
        newProd.minStock,
        newProd.currentStock,
        newProd.unit,
        newProd.description,
        newProd.isActive ? 1 : 0,
        newProd.imagePath,
        newProd.thumbnailPath,
        newProd.createdAt,
        newProd.updatedAt
      );

      const compStmt = db.prepare(`
        INSERT INTO product_components (
          id, productId, materialId, componentName, quantity, unit, unitCost, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const c of newProd.components) {
          // Always resolve unitCost from materials table for accuracy
          let resolvedUnitCost = Number(c.unitCost) || 0;
          let resolvedName = c.componentName || 'Komponen';
          let resolvedUnit = c.unit || 'pcs';
          if (c.materialId) {
            const mat = db.prepare('SELECT unitCost, name, unit FROM materials WHERE id = ?').get(c.materialId) as any;
            if (mat) {
              resolvedUnitCost = Number(mat.unitCost) || resolvedUnitCost;
              resolvedName = mat.name || resolvedName;
              resolvedUnit = mat.unit || resolvedUnit;
            }
          }
          const resolvedSubtotal = resolvedUnitCost * (Number(c.quantity) || 0);
          compStmt.run(
            c.id || 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            newProd.id,
            c.materialId || null,
            resolvedName,
            Number(c.quantity) || 1,
            resolvedUnit,
            resolvedUnitCost,
            resolvedSubtotal
          );
        }
      });

    createTx();
    return newProd;
  },

  updateProduct(id: string, data: any): any {
    const db = getDb();
    const old = this.getProductById(id);
    if (!old) throw new Error('Produk tidak ditemukan');

    const sp = Number(data.sellingPrice ?? old.sellingPrice);
    const cp = Number(data.costPrice ?? old.costPrice);
    const calculatedProfit = sp - cp;
    const calculatedMargin = sp > 0 ? Number(((calculatedProfit / sp) * 100).toFixed(1)) : 0;
    const now = new Date().toISOString().split('T')[0];

    const updated = {
      ...old,
      ...data,
      sellingPrice: sp,
      costPrice: cp,
      profit: calculatedProfit,
      profitMargin: calculatedMargin,
      marginPercent: Number(data.marginPercent ?? calculatedMargin),
      laborCost: Number(data.laborCost ?? old.laborCost ?? 0),
      machineCost: Number(data.machineCost ?? old.machineCost ?? 0),
      otherCost: Number(data.otherCost ?? old.otherCost ?? 0),
      trackStock: Boolean(data.trackStock ?? old.trackStock),
      imagePath: data.imagePath !== undefined ? data.imagePath : old.imagePath,
      thumbnailPath: data.thumbnailPath !== undefined ? data.thumbnailPath : old.thumbnailPath,
      components: Array.isArray(data.components) ? data.components : old.components,
      updatedAt: now,
    };

    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE products SET
          name = ?, sku = ?, category = ?, type = ?, sellingPrice = ?, costPrice = ?,
          profit = ?, profitMargin = ?, marginPercent = ?, laborCost = ?, machineCost = ?,
          otherCost = ?, trackStock = ?, minStock = ?, currentStock = ?, unit = ?,
          description = ?, isActive = ?, imagePath = ?, thumbnailPath = ?, updatedAt = ?
        WHERE id = ?
      `).run(
        updated.name,
        updated.sku,
        updated.category,
        updated.type,
        updated.sellingPrice,
        updated.costPrice,
        updated.profit,
        updated.profitMargin,
        updated.marginPercent,
        updated.laborCost,
        updated.machineCost,
        updated.otherCost,
        updated.trackStock ? 1 : 0,
        Number(updated.minStock) || 0,
        Number(updated.currentStock) || 0,
        updated.unit || 'pcs',
        updated.description || '',
        updated.isActive ? 1 : 0,
        updated.imagePath || null,
        updated.thumbnailPath || null,
        updated.updatedAt,
        id
      );

      // Re-sync components
      if (Array.isArray(data.components)) {
        db.prepare('DELETE FROM product_components WHERE productId = ?').run(id);
        const compStmt = db.prepare(`
          INSERT INTO product_components (
            id, productId, materialId, componentName, quantity, unit, unitCost, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const c of data.components) {
          // Always resolve unitCost from materials table for accuracy
          let resolvedUnitCost = Number(c.unitCost) || 0;
          let resolvedName = c.componentName || 'Komponen';
          let resolvedUnit = c.unit || 'pcs';
          if (c.materialId) {
            const mat = db.prepare('SELECT unitCost, name, unit FROM materials WHERE id = ?').get(c.materialId) as any;
            if (mat) {
              resolvedUnitCost = Number(mat.unitCost) || resolvedUnitCost;
              resolvedName = mat.name || resolvedName;
              resolvedUnit = mat.unit || resolvedUnit;
            }
          }
          const resolvedSubtotal = resolvedUnitCost * (Number(c.quantity) || 0);
          compStmt.run(
            c.id || 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            id,
            c.materialId || null,
            resolvedName,
            Number(c.quantity) || 1,
            resolvedUnit,
            resolvedUnitCost,
            resolvedSubtotal
          );
        }
      }
    });

    updateTx();
    return updated;
  },

  deleteProduct(id: string): void {
    const db = getDb();
    const product = this.getProductById(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    // Clean up product images folder if exists
    try {
      const prodDir = path.join(process.cwd(), 'uploads', 'products', id);
      if (fs.existsSync(prodDir)) {
        fs.rmSync(prodDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('Failed to clean up product images folder:', e);
    }
  },

  // ----------------------------------------------------
  // POS TRANSACTIONS
  // ----------------------------------------------------
  getTransactions(): any[] {
    const db = getDb();
    const list = db.prepare('SELECT * FROM transactions ORDER BY createdAt DESC, date DESC').all();
    const itemStmt = db.prepare('SELECT * FROM transaction_items WHERE transactionId = ?');

    return list.map((t: any) => ({
      ...t,
      items: itemStmt.all(t.id),
    }));
  },

  createTransaction(data: any): any {
    const db = getDb();
    const items = data.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Keranjang belanja kosong');
    }

    const settings = this.getSettings();
    const todayStr = new Date().toISOString().split('T')[0];
    const prefix = settings.receiptPrefix || 'STR-';
    
    // Count existing for sequential number
    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM transactions').get() as { cnt: number };
    const count = (countRow ? countRow.cnt : 0) + 1;
    const receiptNumber = `${prefix}${todayStr.replace(/-/g, '').slice(0, 6)}-${String(count).padStart(3, '0')}`;
    const transactionId = 'trx_' + Date.now();

    let totalCost = 0;
    items.forEach((item: any) => {
      const itemCost = (Number(item.costPrice) || 0) * (Number(item.quantity) || 1);
      totalCost += itemCost;
    });

    const totAmount = Number(data.totalAmount) || 0;
    const profit = totAmount - totalCost;

    const newTrx = {
      id: transactionId,
      receiptNumber,
      type: 'POS',
      customerId: data.customerId || null,
      customerName: data.customerName || 'Pelanggan Umum (Walk-in)',
      customerPhone: data.customerPhone || '',
      date: todayStr,
      items,
      subtotal: Number(data.subtotal) || 0,
      discount: Number(data.discount) || 0,
      totalAmount: totAmount,
      totalCost,
      profit,
      paidAmount: Number(data.paidAmount) || totAmount,
      changeAmount: Number(data.changeAmount) || 0,
      paymentMethod: data.paymentMethod || 'CASH',
      cashierName: data.cashierName || 'Owner',
      notes: data.notes || '',
      createdAt: todayStr,
    };

    const trxOperation = db.transaction(() => {
      // 1. Insert Transaction Header
      db.prepare(`
        INSERT INTO transactions (
          id, receiptNumber, type, orderId, customerId, customerName, customerPhone,
          date, subtotal, discount, totalAmount, totalCost, profit, paidAmount, changeAmount,
          paymentMethod, cashierName, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newTrx.id,
        newTrx.receiptNumber,
        newTrx.type,
        null,
        newTrx.customerId,
        newTrx.customerName,
        newTrx.customerPhone,
        newTrx.date,
        newTrx.subtotal,
        newTrx.discount,
        newTrx.totalAmount,
        newTrx.totalCost,
        newTrx.profit,
        newTrx.paidAmount,
        newTrx.changeAmount,
        newTrx.paymentMethod,
        newTrx.cashierName,
        newTrx.notes,
        newTrx.createdAt
      );

      // 2. Insert Transaction Items & Deduct Stocks
      const itemStmt = db.prepare(`
        INSERT INTO transaction_items (
          id, transactionId, productId, productName, quantity, unitPrice, costPrice, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        itemStmt.run(
          item.id || 't_item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          newTrx.id,
          item.productId || null,
          item.productName,
          Number(item.quantity) || 1,
          Number(item.unitPrice) || 0,
          Number(item.costPrice) || 0,
          Number(item.subtotal) || 0
        );

        if (item.productId) {
          this._deductMaterialStock(db, item.productId, Number(item.quantity) || 1, 'POS', receiptNumber, newTrx.customerName);
        }
      }

      // 3. Auto-record income in financial transactions
      db.prepare(`
        INSERT INTO financial_transactions (
          id, date, type, category, description, amount, referenceType, referenceId, paymentMethod, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'fin_' + Date.now(),
        todayStr,
        'INCOME',
        'Penjualan Kasir',
        `Transaksi Kasir #${receiptNumber} - ${newTrx.customerName}`,
        totAmount,
        'POS',
        newTrx.id,
        newTrx.paymentMethod,
        `Item: ${items.map((i: any) => `${i.productName} (${i.quantity})`).join(', ')}`,
        todayStr
      );

      // 4. Update customer stats if linked
      if (newTrx.customerId) {
        db.prepare(`
          UPDATE customers SET
            totalOrders = totalOrders + 1,
            totalSpent = totalSpent + ?,
            lastTransactionDate = ?,
            updatedAt = ?
          WHERE id = ?
        `).run(totAmount, todayStr, todayStr, newTrx.customerId);
      }
    });

    trxOperation();
    return newTrx;
  },

  deleteTransaction(id: string): void {
    const db = getDb();
    const tx = db.transaction(() => {
      // 1. Delete associated financial transaction entries
      db.prepare("DELETE FROM financial_transactions WHERE referenceType = 'POS' AND referenceId = ?").run(id);
      // 2. Delete inventory movements generated by this transaction
      db.prepare("DELETE FROM inventory_movements WHERE referenceType = 'POS' AND referenceId = ?").run(id);
      // 3. Delete transaction items
      db.prepare("DELETE FROM transaction_items WHERE transactionId = ?").run(id);
      // 4. Delete transaction
      db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
    });
    tx();
  },

  deleteOrder(id: string): void {
    const db = getDb();
    const tx = db.transaction(() => {
      // 1. Delete associated financial transaction entries
      db.prepare("DELETE FROM financial_transactions WHERE referenceType = 'ORDER' AND referenceId = ?").run(id);
      // 2. Delete inventory movements generated by this order
      db.prepare("DELETE FROM inventory_movements WHERE referenceType = 'ORDER' AND referenceId = ?").run(id);
      // 3. Delete order payments, files, items, and order
      db.prepare("DELETE FROM order_payments WHERE orderId = ?").run(id);
      db.prepare("DELETE FROM order_files WHERE orderId = ?").run(id);
      db.prepare("DELETE FROM order_items WHERE orderId = ?").run(id);
      db.prepare("DELETE FROM orders WHERE id = ?").run(id);
    });
    tx();
  },

  clearAllTransactions(options: { resetExpenses?: boolean; resetMovements?: boolean } = {}): {
    success: boolean;
    message: string;
    deletedCounts: {
      transactions: number;
      orders: number;
      expenses: number;
      financialTransactions: number;
    };
  } {
    initializeDatabaseSchema();
    const db = getDb();

    // 1. Safety snapshot before wiping transactions
    try {
      const dbPath = getDatabasePath();
      if (fs.existsSync(dbPath)) {
        const backupPath = path.join(
          path.dirname(dbPath),
          `sukunaru_pre_clear_transactions_${Date.now()}.db`
        );
        fs.copyFileSync(dbPath, backupPath);
        console.log(`[Safety Backup]: Pre-clear snapshot saved to ${backupPath}`);
      }
    } catch (e) {
      console.warn('Failed to create pre-clear safety snapshot:', e);
    }

    const resetExpenses = options.resetExpenses !== false;
    const resetMovements = options.resetMovements !== false;

    let trxCount = 0;
    let orderCount = 0;
    let expCount = 0;
    let finCount = 0;

    const clearTx = db.transaction(() => {
      // Count records being removed
      const tc = db.prepare('SELECT COUNT(*) as c FROM transactions').get() as any;
      const oc = db.prepare('SELECT COUNT(*) as c FROM orders').get() as any;
      const ec = db.prepare('SELECT COUNT(*) as c FROM expenses').get() as any;
      const fc = db.prepare('SELECT COUNT(*) as c FROM financial_transactions').get() as any;

      trxCount = tc?.c || 0;
      orderCount = oc?.c || 0;
      expCount = ec?.c || 0;
      finCount = fc?.c || 0;

      // 1. Delete POS transactions & items
      db.prepare('DELETE FROM transaction_items').run();
      db.prepare('DELETE FROM transactions').run();

      // 2. Delete Orders & sub-records
      db.prepare('DELETE FROM order_payments').run();
      db.prepare('DELETE FROM order_files').run();
      db.prepare('DELETE FROM order_items').run();
      db.prepare('DELETE FROM orders').run();

      // 3. Delete Expenses
      if (resetExpenses) {
        db.prepare('DELETE FROM expenses').run();
      }

      // 4. Delete Financial Cashflow Entries
      db.prepare('DELETE FROM financial_transactions').run();

      // 5. Reset Inventory Movements
      if (resetMovements) {
        db.prepare("DELETE FROM inventory_movements WHERE referenceType IN ('POS', 'ORDER', 'RESTOCK', 'MANUAL')").run();
      }

      // 6. Reset Customer spend & order counters (keep customer master data intact)
      db.prepare('UPDATE customers SET totalSpent = 0, totalOrders = 0, lastTransactionDate = NULL').run();
    });

    clearTx();

    return {
      success: true,
      message: 'Semua data transaksi kasir, pesanan, dan arus kas berhasil dihapus dan direset.',
      deletedCounts: {
        transactions: trxCount,
        orders: orderCount,
        expenses: expCount,
        financialTransactions: finCount,
      },
    };
  },

  // ----------------------------------------------------
  // ORDERS
  // ----------------------------------------------------
  getOrders(): any[] {
    const db = getDb();
    const orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC, orderDate DESC').all();
    const itemStmt = db.prepare('SELECT * FROM order_items WHERE orderId = ?');
    const payStmt = db.prepare('SELECT * FROM order_payments WHERE orderId = ? ORDER BY createdAt ASC');
    const fileStmt = db.prepare('SELECT * FROM order_files WHERE orderId = ? ORDER BY createdAt DESC');

    return orders.map((o: any) => ({
      ...o,
      items: itemStmt.all(o.id),
      payments: payStmt.all(o.id),
      files: fileStmt.all(o.id),
    }));
  },

  getOrderById(id: string): any | null {
    const db = getDb();
    const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!o) return null;

    o.items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(id);
    o.payments = db.prepare('SELECT * FROM order_payments WHERE orderId = ? ORDER BY createdAt ASC').all(id);
    o.files = db.prepare('SELECT * FROM order_files WHERE orderId = ? ORDER BY createdAt DESC').all(id);
    return o;
  },

  createOrder(data: any): any {
    const db = getDb();
    const items = data.items;
    if (!data.customerName || !data.customerName.trim()) {
      throw new Error('Nama pelanggan wajib diisi');
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Item pesanan wajib diisi');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM orders').get() as { cnt: number };
    const orderCount = (countRow ? countRow.cnt : 0) + 1;
    const orderNumber = `ORD-${todayStr.replace(/-/g, '').slice(0, 6)}-${String(orderCount).padStart(3, '0')}`;
    const orderId = 'ord_' + Date.now();

    let totalCost = 0;
    items.forEach((item: any) => {
      const itemCost = (Number(item.costPrice) || 0) * (Number(item.quantity) || 1);
      totalCost += itemCost;
    });

    const totAmount = Number(data.totalAmount) || 0;
    const initialDp = Number(data.dpAmount) || 0;
    const remaining = Math.max(0, totAmount - initialDp);

    let paymentStatus = 'BELUM_BAYAR';
    if (initialDp >= totAmount && totAmount > 0) {
      paymentStatus = 'LUNAS';
    } else if (initialDp > 0) {
      paymentStatus = 'DP';
    }

    const payments: any[] = [];
    if (initialDp > 0) {
      payments.push({
        id: 'pay_' + Date.now(),
        orderId,
        amount: initialDp,
        paymentMethod: data.paymentMethod || 'CASH',
        date: data.orderDate || todayStr,
        notes: initialDp >= totAmount ? 'Pembayaran Lunas Awal' : 'Pembayaran DP Awal',
        createdAt: todayStr,
      });
    }

    const newOrder = {
      id: orderId,
      orderNumber,
      customerId: data.customerId || '',
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone || '',
      orderDate: data.orderDate || todayStr,
      deadlineDate: data.deadlineDate || todayStr,
      status: 'BARU',
      paymentStatus,
      items,
      subtotal: Number(data.subtotal) || totAmount,
      discount: Number(data.discount) || 0,
      totalAmount: totAmount,
      totalCost,
      paidAmount: initialDp,
      remainingAmount: remaining,
      notes: data.notes || '',
      payments,
      files: [],
      createdAt: todayStr,
      updatedAt: todayStr,
    };

    const orderTx = db.transaction(() => {
      // 1. Resolve Customer
      if (newOrder.customerId) {
        db.prepare(`
          UPDATE customers SET
            totalOrders = totalOrders + 1,
            totalSpent = totalSpent + ?,
            lastTransactionDate = ?,
            updatedAt = ?
          WHERE id = ?
        `).run(totAmount, todayStr, todayStr, newOrder.customerId);
      } else {
        const existing = db.prepare('SELECT id FROM customers WHERE LOWER(name) = LOWER(?)').get(newOrder.customerName) as any;
        if (existing) {
          newOrder.customerId = existing.id;
          db.prepare(`
            UPDATE customers SET
              totalOrders = totalOrders + 1,
              totalSpent = totalSpent + ?,
              lastTransactionDate = ?,
              updatedAt = ?
            WHERE id = ?
          `).run(totAmount, todayStr, todayStr, existing.id);
        } else {
          const newCustId = 'cust_' + Date.now();
          db.prepare(`
            INSERT INTO customers (
              id, name, whatsapp, phone, address, notes, totalOrders, totalSpent, lastTransactionDate, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            newCustId,
            newOrder.customerName,
            newOrder.customerPhone,
            newOrder.customerPhone,
            '',
            'Dibuat otomatis dari pesanan #' + orderNumber,
            1,
            totAmount,
            todayStr,
            todayStr,
            todayStr
          );
          newOrder.customerId = newCustId;
        }
      }

      // 2. Insert Order Header
      db.prepare(`
        INSERT INTO orders (
          id, orderNumber, customerId, customerName, customerPhone, orderDate, deadlineDate,
          status, paymentStatus, subtotal, discount, totalAmount, totalCost, paidAmount, remainingAmount,
          notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newOrder.id,
        newOrder.orderNumber,
        newOrder.customerId || null,
        newOrder.customerName,
        newOrder.customerPhone,
        newOrder.orderDate,
        newOrder.deadlineDate,
        newOrder.status,
        newOrder.paymentStatus,
        newOrder.subtotal,
        newOrder.discount,
        newOrder.totalAmount,
        newOrder.totalCost,
        newOrder.paidAmount,
        newOrder.remainingAmount,
        newOrder.notes,
        newOrder.createdAt,
        newOrder.updatedAt
      );

      // 3. Insert Items & Deduct Stocks
      const itemStmt = db.prepare(`
        INSERT INTO order_items (
          id, orderId, productId, productName, quantity, unitPrice, costPrice, subtotal, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        itemStmt.run(
          item.id || 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          newOrder.id,
          item.productId || null,
          item.productName,
          Number(item.quantity) || 1,
          Number(item.unitPrice) || 0,
          Number(item.costPrice) || 0,
          Number(item.subtotal) || 0,
          item.notes || ''
        );

        if (item.productId) {
          this._deductMaterialStock(db, item.productId, Number(item.quantity) || 1, 'ORDER', orderNumber, newOrder.customerName);
        }
      }

      // 4. Insert Initial DP Payment & Finance Record
      if (initialDp > 0) {
        const pay = payments[0];
        db.prepare(`
          INSERT INTO order_payments (
            id, orderId, amount, paymentMethod, date, notes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(pay.id, pay.orderId, pay.amount, pay.paymentMethod, pay.date, pay.notes, pay.createdAt);

        db.prepare(`
          INSERT INTO financial_transactions (
            id, date, type, category, description, amount, referenceType, referenceId, paymentMethod, notes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'fin_' + Date.now(),
          data.orderDate || todayStr,
          'INCOME',
          initialDp >= totAmount ? 'Pelunasan Pesanan' : 'DP Pesanan',
          `Pembayaran ${initialDp >= totAmount ? 'Lunas' : 'DP'} #${orderNumber} - ${newOrder.customerName}`,
          initialDp,
          'ORDER',
          newOrder.id,
          data.paymentMethod || 'CASH',
          `Pesanan: ${items.map((i: any) => `${i.productName} × ${i.quantity}`).join(', ')}`,
          todayStr
        );
      }
    });

    orderTx();
    return newOrder;
  },

  updateOrderStatus(id: string, status: string): any {
    const db = getDb();
    const order = this.getOrderById(id);
    if (!order) throw new Error('Pesanan tidak ditemukan');

    const now = new Date().toISOString().split('T')[0];
    db.prepare('UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, id);
    order.status = status;
    order.updatedAt = now;
    return order;
  },

  addOrderPayment(id: string, data: { amount: number; paymentMethod: string; date?: string; notes?: string }): any {
    const db = getDb();
    const order = this.getOrderById(id);
    if (!order) throw new Error('Pesanan tidak ditemukan');

    const payAmount = Number(data.amount);
    if (!payAmount || payAmount <= 0) throw new Error('Nominal pembayaran tidak valid');

    const todayStr = data.date || new Date().toISOString().split('T')[0];
    const newPayment = {
      id: 'pay_' + Date.now(),
      orderId: order.id,
      amount: payAmount,
      paymentMethod: data.paymentMethod || 'CASH',
      date: todayStr,
      notes: data.notes || 'Pembayaran lanjutan',
      createdAt: todayStr,
    };

    const newPaidAmount = (Number(order.paidAmount) || 0) + payAmount;
    const newRemaining = Math.max(0, Number(order.totalAmount) - newPaidAmount);
    let newPayStatus = 'BELUM_BAYAR';
    if (newRemaining <= 0) {
      newPayStatus = 'LUNAS';
    } else if (newPaidAmount > 0) {
      newPayStatus = 'DP';
    }

    const payTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO order_payments (
          id, orderId, amount, paymentMethod, date, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        newPayment.id,
        newPayment.orderId,
        newPayment.amount,
        newPayment.paymentMethod,
        newPayment.date,
        newPayment.notes,
        newPayment.createdAt
      );

      db.prepare(`
        UPDATE orders SET
          paidAmount = ?,
          remainingAmount = ?,
          paymentStatus = ?,
          updatedAt = ?
        WHERE id = ?
      `).run(newPaidAmount, newRemaining, newPayStatus, todayStr, id);

      db.prepare(`
        INSERT INTO financial_transactions (
          id, date, type, category, description, amount, referenceType, referenceId, paymentMethod, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'fin_' + Date.now(),
        todayStr,
        'INCOME',
        newPayStatus === 'LUNAS' ? 'Pelunasan Pesanan' : 'DP / Angsuran Pesanan',
        `Pembayaran Pesanan #${order.orderNumber} - ${order.customerName}`,
        payAmount,
        'ORDER',
        order.id,
        data.paymentMethod || 'CASH',
        data.notes || `Sisa tagihan: Rp${newRemaining}`,
        todayStr
      );
    });

    payTx();
    return this.getOrderById(id);
  },

  updateOrderPayment(orderId: string, paymentId: string, data: { amount?: number; paymentMethod?: string; date?: string; notes?: string }): any {
    const db = getDb();
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan');

    const payment = db.prepare('SELECT * FROM order_payments WHERE id = ? AND orderId = ?').get(paymentId, orderId) as any;
    if (!payment) throw new Error('Catatan pembayaran tidak ditemukan');

    const newAmount = data.amount !== undefined ? Number(data.amount) : Number(payment.amount);
    if (newAmount <= 0) throw new Error('Nominal pembayaran harus lebih dari 0');

    const newMethod = data.paymentMethod || payment.paymentMethod;
    const newDate = data.date || payment.date;
    const newNotes = data.notes !== undefined ? data.notes : payment.notes;
    const todayStr = new Date().toISOString().split('T')[0];

    const updateTx = db.transaction(() => {
      // 1. Update the order_payments record
      db.prepare(`
        UPDATE order_payments SET
          amount = ?,
          paymentMethod = ?,
          date = ?,
          notes = ?
        WHERE id = ? AND orderId = ?
      `).run(newAmount, newMethod, newDate, newNotes, paymentId, orderId);

      // 2. Recalculate all payments for this order
      const allPayments = db.prepare('SELECT amount FROM order_payments WHERE orderId = ?').all(orderId) as any[];
      const totalPaid = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalAmount = Number(order.totalAmount) || 0;
      const remaining = Math.max(0, totalAmount - totalPaid);

      let newPayStatus = 'BELUM_BAYAR';
      if (remaining <= 0 && totalAmount > 0) {
        newPayStatus = 'LUNAS';
      } else if (totalPaid > 0) {
        newPayStatus = 'DP';
      }

      // 3. Update the order header
      db.prepare(`
        UPDATE orders SET
          paidAmount = ?,
          remainingAmount = ?,
          paymentStatus = ?,
          updatedAt = ?
        WHERE id = ?
      `).run(totalPaid, remaining, newPayStatus, todayStr, orderId);
    });

    updateTx();
    return this.getOrderById(orderId);
  },

  deleteOrderPayment(orderId: string, paymentId: string): any {
    const db = getDb();
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan');

    const payment = db.prepare('SELECT * FROM order_payments WHERE id = ? AND orderId = ?').get(paymentId, orderId) as any;
    if (!payment) throw new Error('Catatan pembayaran tidak ditemukan');

    const todayStr = new Date().toISOString().split('T')[0];

    const deleteTx = db.transaction(() => {
      // 1. Delete payment record
      db.prepare('DELETE FROM order_payments WHERE id = ? AND orderId = ?').run(paymentId, orderId);

      // 2. Recalculate remaining & paid amounts
      const allPayments = db.prepare('SELECT amount FROM order_payments WHERE orderId = ?').all(orderId) as any[];
      const totalPaid = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalAmount = Number(order.totalAmount) || 0;
      const remaining = Math.max(0, totalAmount - totalPaid);

      let newPayStatus = 'BELUM_BAYAR';
      if (remaining <= 0 && totalAmount > 0) {
        newPayStatus = 'LUNAS';
      } else if (totalPaid > 0) {
        newPayStatus = 'DP';
      }

      // 3. Update order header
      db.prepare(`
        UPDATE orders SET
          paidAmount = ?,
          remainingAmount = ?,
          paymentStatus = ?,
          updatedAt = ?
        WHERE id = ?
      `).run(totalPaid, remaining, newPayStatus, todayStr, orderId);
    });

    deleteTx();
    return this.getOrderById(orderId);
  },

  addOrderFile(id: string, fileObj: any): any {
    const db = getDb();
    const order = this.getOrderById(id);
    if (!order) throw new Error('Pesanan tidak ditemukan');

    const now = new Date().toISOString().split('T')[0];
    const newFile = {
      id: 'file_' + Date.now(),
      orderId: id,
      originalName: fileObj.originalname,
      storedName: fileObj.filename,
      mimeType: fileObj.mimetype,
      size: fileObj.size,
      url: `/uploads/${fileObj.filename}`,
      notes: fileObj.notes || '',
      createdAt: now,
    };

    db.prepare(`
      INSERT INTO order_files (
        id, orderId, originalName, storedName, mimeType, size, url, notes, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newFile.id,
      newFile.orderId,
      newFile.originalName,
      newFile.storedName,
      newFile.mimeType,
      newFile.size,
      newFile.url,
      newFile.notes,
      newFile.createdAt
    );

    return newFile;
  },

  deleteOrderFile(orderId: string, fileId: string): void {
    const db = getDb();
    const fileItem = db.prepare('SELECT * FROM order_files WHERE id = ? AND orderId = ?').get(fileId, orderId) as any;
    if (fileItem && fileItem.storedName) {
      const filePath = path.join(process.cwd(), 'uploads', fileItem.storedName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('File unlink error:', e);
        }
      }
    }
    db.prepare('DELETE FROM order_files WHERE id = ? AND orderId = ?').run(fileId, orderId);
  },

  // ----------------------------------------------------
  // EXPENSES
  // ----------------------------------------------------
  getExpenses(): any[] {
    const db = getDb();
    return db.prepare('SELECT * FROM expenses ORDER BY createdAt DESC, date DESC').all();
  },

  createExpense(data: any): any {
    const db = getDb();
    const amt = Number(data.amount);
    if (!data.description || !data.description.trim()) {
      throw new Error('Deskripsi pengeluaran wajib diisi');
    }
    if (!amt || amt <= 0) {
      throw new Error('Nominal pengeluaran tidak valid');
    }

    const todayStr = data.date || new Date().toISOString().split('T')[0];
    const newExp = {
      id: 'exp_' + Date.now(),
      category: data.category || 'Operasional',
      description: data.description.trim(),
      amount: amt,
      date: todayStr,
      paymentMethod: data.paymentMethod || 'CASH',
      reference: data.reference || '',
      notes: data.notes || '',
      receiptUrl: data.receiptUrl || '',
      createdAt: todayStr,
    };

    const expTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO expenses (
          id, category, description, amount, date, paymentMethod, reference, notes, receiptUrl, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newExp.id,
        newExp.category,
        newExp.description,
        newExp.amount,
        newExp.date,
        newExp.paymentMethod,
        newExp.reference,
        newExp.notes,
        newExp.receiptUrl,
        newExp.createdAt
      );

      db.prepare(`
        INSERT INTO financial_transactions (
          id, date, type, category, description, amount, referenceType, referenceId, paymentMethod, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'fin_' + Date.now(),
        todayStr,
        'EXPENSE',
        newExp.category,
        newExp.description,
        amt,
        'EXPENSE',
        newExp.id,
        newExp.paymentMethod,
        newExp.notes || (newExp.reference ? `Ref: ${newExp.reference}` : ''),
        todayStr
      );
    });

    expTx();
    return newExp;
  },

  deleteExpense(id: string): void {
    const db = getDb();
    const delTx = db.transaction(() => {
      db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
      db.prepare("DELETE FROM financial_transactions WHERE referenceType = 'EXPENSE' AND referenceId = ?").run(id);
    });
    delTx();
  },

  // ----------------------------------------------------
  // FINANCIAL TRANSACTIONS / CASHFLOW
  // ----------------------------------------------------
  getFinancialTransactions(): any[] {
    const db = getDb();
    return db.prepare('SELECT * FROM financial_transactions ORDER BY createdAt DESC, date DESC LIMIT 500').all();
  },

  createFinancialTransaction(data: any): any {
    const db = getDb();
    const amt = Number(data.amount);
    if (!data.description || !data.description.trim()) {
      throw new Error('Deskripsi transaksi keuangan wajib diisi');
    }
    if (!amt || amt <= 0) {
      throw new Error('Nominal tidak valid');
    }

    const todayStr = data.date || new Date().toISOString().split('T')[0];
    const newFin = {
      id: 'fin_' + Date.now(),
      date: todayStr,
      type: data.type || 'INCOME',
      category: data.category || 'Lainnya',
      description: data.description.trim(),
      amount: amt,
      referenceNumber: data.referenceNumber || '',
      referenceType: data.referenceType || 'MANUAL',
      referenceId: data.referenceId || '',
      paymentMethod: data.paymentMethod || 'CASH',
      notes: data.notes || '',
      createdAt: todayStr,
    };

    db.prepare(`
      INSERT INTO financial_transactions (
        id, date, type, category, description, amount, referenceNumber, referenceType, referenceId, paymentMethod, notes, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newFin.id,
      newFin.date,
      newFin.type,
      newFin.category,
      newFin.description,
      newFin.amount,
      newFin.referenceNumber,
      newFin.referenceType,
      newFin.referenceId,
      newFin.paymentMethod,
      newFin.notes,
      newFin.createdAt
    );

    return newFin;
  },

  // ----------------------------------------------------
  // DASHBOARD STATS
  // ----------------------------------------------------
  getStats(): any {
    const db = getDb();
    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthPrefix = todayStr.substring(0, 7);

    // 1. Today revenue from financial_transactions (INCOME)
    const todayRevRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE date = ? AND type = 'INCOME'").get(todayStr) as { total: number };
    const todayRevenue = todayRevRow ? todayRevRow.total : 0;

    // 2. Today expenses
    const todayExpRow = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?').get(todayStr) as { total: number };
    const todayExpense = todayExpRow ? todayExpRow.total : 0;

    // 3. Today POS transactions count & profit
    const todayTrxRows = db.prepare('SELECT profit, totalAmount, totalCost FROM transactions WHERE date = ?').all(todayStr) as any[];
    const todayPosProfit = todayTrxRows.reduce((sum, t) => sum + (t.profit || (t.totalAmount - (t.totalCost || 0))), 0);

    // Count order payments (DP & Pelunasan) for today
    const todayOrderPaymentsRow = db.prepare('SELECT COUNT(*) as count FROM order_payments WHERE date = ?').get(todayStr) as { count: number };
    const todayTransactionsCount = todayTrxRows.length + (todayOrderPaymentsRow ? todayOrderPaymentsRow.count : 0);

    // 4. Today orders count & profit
    const todayOrderRows = db.prepare('SELECT paidAmount, totalAmount, totalCost FROM orders WHERE orderDate = ?').all(todayStr) as any[];
    const todayOrderProfit = todayOrderRows.reduce((sum, o) => {
      const costRatio = o.totalAmount > 0 ? (o.totalCost || 0) / o.totalAmount : 0;
      const estProfit = o.paidAmount * (1 - costRatio);
      return sum + estProfit;
    }, 0);

    const todayProfit = Math.max(0, todayPosProfit + todayOrderProfit - todayExpense);

    // 5. Month stats
    const monthRevRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE date LIKE ? AND type = 'INCOME'").get(`${thisMonthPrefix}%`) as { total: number };
    const thisMonthRevenue = monthRevRow ? monthRevRow.total : 0;

    const monthExpRow = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date LIKE ?').get(`${thisMonthPrefix}%`) as { total: number };
    const thisMonthExpense = monthExpRow ? monthExpRow.total : 0;

    // 6. Active Orders (not SELESAI and not BATAL)
    const activeOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('SELESAI', 'BATAL')").get() as { count: number };
    const activeOrdersCount = activeOrdersRow ? activeOrdersRow.count : 0;

    // 7. Low Stock Materials
    const lowStockMaterials = db.prepare('SELECT * FROM materials WHERE currentStock <= minStock').all() as any[];

    // 8. Total Cash Balance (All Income - All Expense in financial_transactions / expenses)
    const allIncomeRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type = 'INCOME'").get() as { total: number };
    const allExpenseRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type = 'EXPENSE'").get() as { total: number };
    const totalCashBalance = (allIncomeRow ? allIncomeRow.total : 0) - (allExpenseRow ? allExpenseRow.total : 0);

    return {
      todayRevenue,
      todayProfit,
      todayTransactionsCount,
      activeOrdersCount,
      todayExpense,
      thisMonthRevenue,
      thisMonthProfit: Math.max(0, thisMonthRevenue - thisMonthExpense),
      thisMonthExpense,
      totalCashBalance,
      lowStockItemsCount: lowStockMaterials.length,
      lowStockItems: lowStockMaterials,
    };
  },

  // ----------------------------------------------------
  // GLOBAL SEARCH
  // ----------------------------------------------------
  search(query: string): any {
    const db = getDb();
    const q = (query || '').toLowerCase().trim();
    if (!q) return { customers: [], products: [], orders: [], transactions: [] };

    const searchParam = `%${q}%`;
    const customers = db.prepare(`
      SELECT * FROM customers
      WHERE LOWER(name) LIKE ? OR whatsapp LIKE ? OR phone LIKE ?
      LIMIT 5
    `).all(searchParam, searchParam, searchParam);

    const products = db.prepare(`
      SELECT * FROM products
      WHERE LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(category) LIKE ?
      LIMIT 5
    `).all(searchParam, searchParam, searchParam);

    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE LOWER(orderNumber) LIKE ? OR LOWER(customerName) LIKE ? OR LOWER(notes) LIKE ?
      LIMIT 5
    `).all(searchParam, searchParam, searchParam);

    const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE LOWER(receiptNumber) LIKE ? OR LOWER(customerName) LIKE ?
      LIMIT 5
    `).all(searchParam, searchParam);

    return {
      customers,
      products,
      orders,
      transactions,
    };
  },

  // ----------------------------------------------------
  // BACKUP & RESTORE
  // ----------------------------------------------------
  getBackupData(): any {
    return {
      settings: this.getSettings(),
      customers: this.getCustomers(),
      materials: this.getMaterials(),
      inventory_movements: this.getInventoryMovements(),
      products: this.getProducts(),
      orders: this.getOrders(),
      transactions: this.getTransactions(),
      expenses: this.getExpenses(),
      financial_transactions: this.getFinancialTransactions(),
      timestamp: new Date().toISOString(),
      version: 'SQLite-v1',
    };
  },

  restoreDatabase(backupData: any): { success: boolean; message: string } {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Format data backup tidak valid');
    }

    const requiredKeys = ['settings', 'materials', 'products', 'customers', 'orders', 'transactions'];
    for (const key of requiredKeys) {
      if (!(key in backupData)) {
        throw new Error(`File backup tidak memiliki kunci '${key}' yang valid`);
      }
    }

    // Auto backup current database before restore
    const dbPath = getDatabasePath();
    if (fs.existsSync(dbPath)) {
      const safetyBackup = path.join(
        path.dirname(dbPath),
        `sukunaru_pre_restore_backup_${Date.now()}.db`
      );
      try {
        fs.copyFileSync(dbPath, safetyBackup);
        console.log(`[Backup] Pre-restore safety backup saved at: ${safetyBackup}`);
      } catch (err) {
        console.error('Failed to create pre-restore safety backup:', err);
      }
    }

    const db = getDb();
    const restoreTx = db.transaction(() => {
      // Clear tables
      db.prepare('DELETE FROM product_components').run();
      db.prepare('DELETE FROM transaction_items').run();
      db.prepare('DELETE FROM order_items').run();
      db.prepare('DELETE FROM order_payments').run();
      db.prepare('DELETE FROM order_files').run();
      db.prepare('DELETE FROM inventory_movements').run();
      db.prepare('DELETE FROM financial_transactions').run();
      db.prepare('DELETE FROM expenses').run();
      db.prepare('DELETE FROM transactions').run();
      db.prepare('DELETE FROM orders').run();
      db.prepare('DELETE FROM products').run();
      db.prepare('DELETE FROM materials').run();
      db.prepare('DELETE FROM customers').run();
      db.prepare('DELETE FROM settings').run();

      // Restore Settings
      if (backupData.settings) {
        this.updateSettings(backupData.settings);
      }

      // Restore Customers
      if (Array.isArray(backupData.customers)) {
        const stmt = db.prepare(`
          INSERT INTO customers (
            id, name, whatsapp, phone, address, notes, totalOrders, totalSpent, lastTransactionDate, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const c of backupData.customers) {
          stmt.run(
            c.id, c.name, c.whatsapp || '', c.phone || '', c.address || '', c.notes || '',
            Number(c.totalOrders) || 0, Number(c.totalSpent) || 0, c.lastTransactionDate || '',
            c.createdAt || new Date().toISOString().split('T')[0], c.updatedAt || new Date().toISOString().split('T')[0]
          );
        }
      }

      // Restore Materials
      if (Array.isArray(backupData.materials)) {
        const stmt = db.prepare(`
          INSERT INTO materials (
            id, name, sku, category, unit, currentStock, minStock, purchasePrice, unitCost, supplier, supplierContact, notes, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const m of backupData.materials) {
          const cost = Number(m.unitCost ?? m.purchasePrice ?? 0);
          stmt.run(
            m.id, m.name, m.sku || `MAT-${m.id}`, m.category || 'Umum', m.unit || 'pcs',
            Number(m.currentStock) || 0, Number(m.minStock) || 0, Number(m.purchasePrice) || cost,
            cost, m.supplier || '', m.supplierContact || '', m.notes || '',
            m.createdAt || new Date().toISOString().split('T')[0], m.updatedAt || new Date().toISOString().split('T')[0]
          );
        }
      }

      // Restore Products & Components
      if (Array.isArray(backupData.products)) {
        const prodStmt = db.prepare(`
          INSERT INTO products (
            id, name, sku, category, type, sellingPrice, costPrice, profit, profitMargin,
            marginPercent, laborCost, machineCost, otherCost, trackStock, minStock, currentStock,
            unit, description, isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const compStmt = db.prepare(`
          INSERT INTO product_components (
            id, productId, materialId, componentName, quantity, unit, unitCost, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const p of backupData.products) {
          prodStmt.run(
            p.id, p.name, p.sku || `PRD-${p.id}`, p.category || 'Umum', p.type || 'PHYSICAL',
            Number(p.sellingPrice) || 0, Number(p.costPrice) || 0, Number(p.profit) || 0,
            Number(p.profitMargin) || 0, Number(p.marginPercent) || 0, Number(p.laborCost) || 0,
            Number(p.machineCost) || 0, Number(p.otherCost) || 0, p.trackStock ? 1 : 0,
            Number(p.minStock) || 0, Number(p.currentStock) || 0, p.unit || 'pcs',
            p.description || '', p.isActive !== false ? 1 : 0,
            p.createdAt || new Date().toISOString().split('T')[0], p.updatedAt || new Date().toISOString().split('T')[0]
          );

          if (Array.isArray(p.components)) {
            for (const c of p.components) {
              compStmt.run(
                c.id || 'comp_' + Math.random().toString(36).substr(2, 6),
                p.id, c.materialId || null, c.componentName || 'Komponen',
                Number(c.quantity) || 1, c.unit || 'pcs', Number(c.unitCost) || 0, Number(c.subtotal) || 0
              );
            }
          }
        }
      }

      // Restore Orders, Items, Payments, Files
      if (Array.isArray(backupData.orders)) {
        const orderStmt = db.prepare(`
          INSERT INTO orders (
            id, orderNumber, customerId, customerName, customerPhone, orderDate, deadlineDate,
            status, paymentStatus, subtotal, discount, totalAmount, totalCost, paidAmount, remainingAmount,
            notes, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const itemStmt = db.prepare(`
          INSERT INTO order_items (
            id, orderId, productId, productName, quantity, unitPrice, costPrice, subtotal, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const payStmt = db.prepare(`
          INSERT INTO order_payments (
            id, orderId, amount, paymentMethod, date, notes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const fileStmt = db.prepare(`
          INSERT INTO order_files (
            id, orderId, originalName, storedName, mimeType, size, url, notes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const o of backupData.orders) {
          orderStmt.run(
            o.id, o.orderNumber, o.customerId || null, o.customerName, o.customerPhone || '',
            o.orderDate || new Date().toISOString().split('T')[0], o.deadlineDate || '',
            o.status || 'BARU', o.paymentStatus || 'BELUM_BAYAR', Number(o.subtotal) || 0,
            Number(o.discount) || 0, Number(o.totalAmount) || 0, Number(o.totalCost) || 0,
            Number(o.paidAmount) || 0, Number(o.remainingAmount) || 0, o.notes || '',
            o.createdAt || new Date().toISOString().split('T')[0], o.updatedAt || new Date().toISOString().split('T')[0]
          );

          if (Array.isArray(o.items)) {
            for (const item of o.items) {
              itemStmt.run(
                item.id || 'item_' + Math.random().toString(36).substr(2, 6),
                o.id, item.productId || null, item.productName, Number(item.quantity) || 1,
                Number(item.unitPrice) || 0, Number(item.costPrice) || 0, Number(item.subtotal) || 0, item.notes || ''
              );
            }
          }

          if (Array.isArray(o.payments)) {
            for (const pay of o.payments) {
              payStmt.run(
                pay.id || 'pay_' + Math.random().toString(36).substr(2, 6),
                o.id, Number(pay.amount) || 0, pay.paymentMethod || 'CASH',
                pay.date || o.orderDate, pay.notes || '', pay.createdAt || new Date().toISOString().split('T')[0]
              );
            }
          }

          if (Array.isArray(o.files)) {
            for (const f of o.files) {
              fileStmt.run(
                f.id || 'file_' + Math.random().toString(36).substr(2, 6),
                o.id, f.originalName || 'file', f.storedName || '', f.mimeType || 'application/octet-stream',
                Number(f.size) || 0, f.url || '', f.notes || '', f.createdAt || new Date().toISOString().split('T')[0]
              );
            }
          }
        }
      }

      // Restore Transactions & Items
      if (Array.isArray(backupData.transactions)) {
        const trxStmt = db.prepare(`
          INSERT INTO transactions (
            id, receiptNumber, type, orderId, customerId, customerName, customerPhone,
            date, subtotal, discount, totalAmount, totalCost, profit, paidAmount, changeAmount,
            paymentMethod, cashierName, notes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const trxItemStmt = db.prepare(`
          INSERT INTO transaction_items (
            id, transactionId, productId, productName, quantity, unitPrice, costPrice, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const t of backupData.transactions) {
          trxStmt.run(
            t.id, t.receiptNumber, t.type || 'POS', t.orderId || null, t.customerId || null,
            t.customerName || 'Pelanggan Umum', t.customerPhone || '', t.date || new Date().toISOString().split('T')[0],
            Number(t.subtotal) || 0, Number(t.discount) || 0, Number(t.totalAmount) || 0,
            Number(t.totalCost) || 0, Number(t.profit) || 0, Number(t.paidAmount) || 0,
            Number(t.changeAmount) || 0, t.paymentMethod || 'CASH', t.cashierName || 'Owner',
            t.notes || '', t.createdAt || new Date().toISOString().split('T')[0]
          );

          if (Array.isArray(t.items)) {
            for (const item of t.items) {
              trxItemStmt.run(
                item.id || 't_item_' + Math.random().toString(36).substr(2, 6),
                t.id, item.productId || null, item.productName, Number(item.quantity) || 1,
                Number(item.unitPrice) || 0, Number(item.costPrice) || 0, Number(item.subtotal) || 0
              );
            }
          }
        }
      }

      // Restore Expenses
      if (Array.isArray(backupData.expenses)) {
        const stmt = db.prepare(`
          INSERT INTO expenses (
            id, category, description, amount, date, paymentMethod, reference, notes, receiptUrl, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const e of backupData.expenses) {
          stmt.run(
            e.id, e.category || 'Operasional', e.description || '', Number(e.amount) || 0,
            e.date || new Date().toISOString().split('T')[0], e.paymentMethod || 'CASH',
            e.reference || '', e.notes || '', e.receiptUrl || '', e.createdAt || new Date().toISOString().split('T')[0]
          );
        }
      }

      // Restore Financial Transactions
      if (Array.isArray(backupData.financial_transactions)) {
        const stmt = db.prepare(`
          INSERT INTO financial_transactions (
            id, date, type, category, description, amount, referenceNumber, referenceType, referenceId, paymentMethod, notes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const f of backupData.financial_transactions) {
          stmt.run(
            f.id, f.date || new Date().toISOString().split('T')[0], f.type || 'INCOME',
            f.category || 'Umum', f.description || '', Number(f.amount) || 0,
            f.referenceNumber || '', f.referenceType || 'MANUAL', f.referenceId || '',
            f.paymentMethod || 'CASH', f.notes || '', f.createdAt || new Date().toISOString().split('T')[0]
          );
        }
      }

      // Restore Inventory Movements
      if (Array.isArray(backupData.inventory_movements)) {
        const stmt = db.prepare(`
          INSERT INTO inventory_movements (
            id, materialId, materialName, type, quantity, previousStock, newStock, referenceType, referenceId, notes, date, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const mov of backupData.inventory_movements) {
          stmt.run(
            mov.id, mov.materialId, mov.materialName || '', mov.type || 'IN',
            Number(mov.quantity) || 0, mov.previousStock !== undefined ? Number(mov.previousStock) : null,
            mov.newStock !== undefined ? Number(mov.newStock) : null, mov.referenceType || 'MANUAL',
            mov.referenceId || '', mov.notes || '', mov.date || new Date().toISOString().split('T')[0],
            mov.createdAt || new Date().toISOString().split('T')[0]
          );
        }
      }
    });

    restoreTx();
    return { success: true, message: 'Database Sukunaru Studio berhasil dipulihkan dari data backup!' };
  },

  // ----------------------------------------------------
  // RESET SAMPLE DATA (For Development / Testing)
  // ----------------------------------------------------
  resetSampleData(): { success: boolean; message: string } {
    const db = getDb();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    const twoDaysLaterStr = twoDaysLater.toISOString().split('T')[0];

    const sampleMaterials = [
      {
        id: 'mat_01',
        name: 'MDF Board A4 (6mm)',
        sku: 'MAT-MDF-A4',
        category: 'Kayu/MDF',
        unit: 'pcs',
        currentStock: 25,
        minStock: 10,
        purchasePrice: 3000,
        unitCost: 3000,
        supplier: 'CV Mitra Kayuindo',
        notes: 'Ketebalan 6mm presisi pinggiran rapi',
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'mat_02',
        name: 'Photo Paper Glossy A4 (230gsm)',
        sku: 'MAT-PPR-A4',
        category: 'Kertas',
        unit: 'lembar',
        currentStock: 8,
        minStock: 20,
        purchasePrice: 1500,
        unitCost: 1500,
        supplier: 'Toko Kertas Makmur',
        notes: 'Hasil cetak tajam dan glossy',
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'mat_03',
        name: 'HVS Paper A4 70gsm (SiDU)',
        sku: 'MAT-HVS-70',
        category: 'Kertas',
        unit: 'lembar',
        currentStock: 450,
        minStock: 100,
        purchasePrice: 150,
        unitCost: 150,
        supplier: 'Toko Kertas Makmur',
        notes: 'Kertas dokumen umum',
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'mat_04',
        name: 'Sticker Paper Glossy A4',
        sku: 'MAT-STK-GLS',
        category: 'Kertas',
        unit: 'lembar',
        currentStock: 15,
        minStock: 25,
        purchasePrice: 2500,
        unitCost: 2500,
        supplier: 'Grafika Supply',
        notes: 'Daya rekat kuat tahan air jika dilaminasi',
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'mat_05',
        name: 'Laminating Film Glossy A4 (100 micron)',
        sku: 'MAT-LAM-GLS',
        category: 'Plastik/Laminasi',
        unit: 'lembar',
        currentStock: 35,
        minStock: 15,
        purchasePrice: 2000,
        unitCost: 2000,
        supplier: 'Plastindo Surabaya',
        notes: 'Laminasi panas anti gores',
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'mat_06',
        name: 'Laminating Film Doff A4',
        sku: 'MAT-LAM-DOF',
        category: 'Plastik/Laminasi',
        unit: 'lembar',
        currentStock: 18,
        minStock: 15,
        purchasePrice: 2200,
        unitCost: 2200,
        supplier: 'Plastindo Surabaya',
        notes: 'Finishing matte elegan',
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'mat_07',
        name: 'Tinta Epson 003 Black (65ml)',
        sku: 'MAT-INK-BK',
        category: 'Tinta',
        unit: 'botol',
        currentStock: 3,
        minStock: 2,
        purchasePrice: 85000,
        unitCost: 85000,
        supplier: 'Epson Authorized',
        notes: 'Estimasi biaya per lembar B/W ~Rp100',
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'mat_08',
        name: 'Tinta Epson 003 Color Set',
        sku: 'MAT-INK-CLR',
        category: 'Tinta',
        unit: 'botol',
        currentStock: 4,
        minStock: 2,
        purchasePrice: 90000,
        unitCost: 90000,
        supplier: 'Epson Authorized',
        notes: 'Estimasi biaya per lembar warna ~Rp450',
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'mat_09',
        name: 'Double Tape 3M Foam (Roll 5m)',
        sku: 'MAT-TPE-3M',
        category: 'Aksesoris/Packaging',
        unit: 'pcs',
        currentStock: 12,
        minStock: 5,
        purchasePrice: 1000,
        unitCost: 1000,
        supplier: 'Toko ATK Sentosa',
        notes: 'Gantungan MDF dinding',
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
    ];

    const sampleCustomers = [
      {
        id: 'cust_01',
        name: 'Budi Santoso',
        whatsapp: '081234567890',
        phone: '081234567890',
        address: 'Jl. Melati No. 12, Sukun, Malang',
        notes: 'Langganan cetak MDF foto keluarga & pigura.',
        totalOrders: 3,
        totalSpent: 175000,
        lastTransactionDate: todayStr,
        createdAt: '2026-08-01',
        updatedAt: todayStr,
      },
      {
        id: 'cust_02',
        name: 'Siti Rahmawati (UMKM Sambal)',
        whatsapp: '085712345678',
        phone: '085712345678',
        address: 'Ruko Dinoyo Megah Kav. 4, Malang',
        notes: 'Cetak stiker label kemasan botol sambal secara rutin tiap 2 minggu.',
        totalOrders: 5,
        totalSpent: 450000,
        lastTransactionDate: yesterdayStr,
        createdAt: '2026-07-15',
        updatedAt: yesterdayStr,
      },
      {
        id: 'cust_03',
        name: 'Ahmad Fauzi',
        whatsapp: '082198765432',
        phone: '082198765432',
        address: 'Kepanjen, Kab. Malang',
        notes: 'Order desain poster dan banner bazar kampus.',
        totalOrders: 2,
        totalSpent: 150000,
        lastTransactionDate: yesterdayStr,
        createdAt: '2026-08-10',
        updatedAt: yesterdayStr,
      },
      {
        id: 'cust_04',
        name: 'Dewi Lestari',
        whatsapp: '081987654321',
        phone: '081987654321',
        address: 'Blimbing, Kota Malang',
        notes: 'Cetak foto studio wisuda.',
        totalOrders: 1,
        totalSpent: 26000,
        lastTransactionDate: todayStr,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
    ];

    const sampleProducts = [
      {
        id: 'prod_01',
        name: 'Cetak Foto MDF A4 (Standar)',
        sku: 'PRD-MDF-A4',
        category: 'Cetak Kayu & MDF',
        type: 'PHYSICAL',
        sellingPrice: 25000,
        costPrice: 8500,
        profit: 16500,
        profitMargin: 66.0,
        marginPercent: 66.0,
        trackStock: true,
        minStock: 5,
        unit: 'pcs',
        description: 'Cetak foto tajam tahan air ditempel di papan MDF tebal 6mm finishing laminasi doff/glossy.',
        isActive: true,
        components: [
          { id: 'comp_101', materialId: 'mat_01', componentName: 'MDF Board A4 (6mm)', quantity: 1, unit: 'pcs', unitCost: 3000, subtotal: 3000 },
          { id: 'comp_102', materialId: 'mat_02', componentName: 'Photo Paper Glossy A4', quantity: 1, unit: 'lembar', unitCost: 2000, subtotal: 2000 },
          { id: 'comp_103', materialId: 'mat_05', componentName: 'Laminasi Panas Glossy', quantity: 1, unit: 'lembar', unitCost: 2000, subtotal: 2000 },
          { id: 'comp_104', materialId: 'mat_08', componentName: 'Tinta Cetak High Res', quantity: 1, unit: 'porsi', unitCost: 1000, subtotal: 1000 },
          { id: 'comp_105', materialId: 'mat_09', componentName: 'Double Tape Gantungan', quantity: 0.5, unit: 'pcs', unitCost: 500, subtotal: 500 },
        ],
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'prod_04',
        name: 'Cetak Foto A4 Glossy',
        sku: 'PRD-FTO-A4',
        category: 'Dokumen & Cetak',
        type: 'PHYSICAL',
        sellingPrice: 10000,
        costPrice: 3500,
        profit: 6500,
        profitMargin: 65.0,
        marginPercent: 65.0,
        trackStock: true,
        minStock: 0,
        unit: 'lembar',
        description: 'Cetak foto ukuran A4 full page glossy premium tahan luntur.',
        isActive: true,
        components: [
          { id: 'comp_401', materialId: 'mat_02', componentName: 'Photo Paper Glossy A4', quantity: 1, unit: 'lembar', unitCost: 2000, subtotal: 2000 },
          { id: 'comp_402', materialId: 'mat_08', componentName: 'Tinta Color High Quality', quantity: 1, unit: 'porsi', unitCost: 1500, subtotal: 1500 },
        ],
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'prod_07',
        name: 'Sticker Vinyl A4 + Kiss Cut',
        sku: 'PRD-STK-A4',
        category: 'Sticker & Label',
        type: 'PHYSICAL',
        sellingPrice: 12000,
        costPrice: 4500,
        profit: 7500,
        profitMargin: 62.5,
        marginPercent: 62.5,
        trackStock: true,
        minStock: 0,
        unit: 'lembar',
        description: 'Cetak sticker glossy A4 anti air dengan laminasi dingin.',
        isActive: true,
        components: [
          { id: 'comp_701', materialId: 'mat_04', componentName: 'Sticker Paper Glossy A4', quantity: 1, unit: 'lembar', unitCost: 2500, subtotal: 2500 },
          { id: 'comp_702', materialId: 'mat_08', componentName: 'Tinta Color', quantity: 1, unit: 'porsi', unitCost: 1000, subtotal: 1000 },
          { id: 'comp_703', materialId: 'mat_06', componentName: 'Laminasi Doff A4', quantity: 1, unit: 'lembar', unitCost: 1000, subtotal: 1000 },
        ],
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
      {
        id: 'prod_08',
        name: 'Jasa Desain Poster Promosi',
        sku: 'PRD-DSG-POS',
        category: 'Jasa Desain Grafis',
        type: 'SERVICE',
        sellingPrice: 75000,
        costPrice: 0,
        profit: 75000,
        profitMargin: 100.0,
        marginPercent: 100.0,
        trackStock: false,
        minStock: 0,
        unit: 'projek',
        description: 'Jasa pembuatan desain poster kreatif, banner, flyer digital (revisi 3x).',
        isActive: true,
        components: [],
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      },
    ];

    const sampleOrders = [
      {
        id: 'ord_01',
        orderNumber: 'ORD-202608-001',
        customerId: 'cust_01',
        customerName: 'Budi Santoso',
        customerPhone: '081234567890',
        orderDate: todayStr,
        deadlineDate: tomorrowStr,
        status: 'DIPROSES',
        paymentStatus: 'DP',
        items: [
          {
            id: 'item_01',
            productId: 'prod_01',
            productName: 'Cetak Foto MDF A4 (Standar)',
            quantity: 2,
            unitPrice: 25000,
            costPrice: 8500,
            subtotal: 50000,
            notes: 'Foto Wisuda Keluarga, laminasi doff',
          },
        ],
        subtotal: 50000,
        discount: 0,
        totalAmount: 50000,
        totalCost: 17000,
        paidAmount: 25000,
        remainingAmount: 25000,
        notes: 'Tolong di-edit sedikit kontras wajah agar lebih cerah',
        payments: [
          {
            id: 'pay_01',
            orderId: 'ord_01',
            amount: 25000,
            paymentMethod: 'QRIS',
            date: todayStr,
            notes: 'DP 50% Transfer QRIS',
            createdAt: todayStr,
          }
        ],
        files: [],
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'ord_02',
        orderNumber: 'ORD-202608-002',
        customerId: 'cust_02',
        customerName: 'Siti Rahmawati (UMKM Sambal)',
        customerPhone: '085712345678',
        orderDate: yesterdayStr,
        deadlineDate: twoDaysLaterStr,
        status: 'BARU',
        paymentStatus: 'BELUM_BAYAR',
        items: [
          {
            id: 'item_02',
            productId: 'prod_07',
            productName: 'Sticker Vinyl A4 + Kiss Cut',
            quantity: 10,
            unitPrice: 12000,
            costPrice: 4500,
            subtotal: 120000,
            notes: 'Cutting bulat diameter 5cm',
          },
        ],
        subtotal: 120000,
        discount: 10000,
        totalAmount: 110000,
        totalCost: 45000,
        paidAmount: 0,
        remainingAmount: 110000,
        notes: 'Customer menunggu konfirmasi preview cutting',
        payments: [],
        files: [],
        createdAt: yesterdayStr,
        updatedAt: yesterdayStr,
      }
    ];

    const sampleTransactions = [
      {
        id: 'trx_01',
        receiptNumber: 'STR-202608-001',
        type: 'POS',
        customerId: 'cust_04',
        customerName: 'Dewi Lestari',
        customerPhone: '081987654321',
        date: todayStr,
        items: [
          {
            id: 't_item_1',
            productId: 'prod_04',
            productName: 'Cetak Foto A4 Glossy',
            quantity: 2,
            unitPrice: 10000,
            costPrice: 3500,
            subtotal: 20000,
          },
        ],
        subtotal: 20000,
        discount: 0,
        totalAmount: 20000,
        totalCost: 7000,
        profit: 13000,
        paidAmount: 50000,
        changeAmount: 30000,
        paymentMethod: 'CASH',
        cashierName: 'Owner',
        notes: 'Foto wisuda',
        createdAt: todayStr,
      }
    ];

    const sampleExpenses = [
      {
        id: 'exp_01',
        category: 'Tinta',
        description: 'Beli Tinta Epson 003 Black & Color',
        amount: 175000,
        date: yesterdayStr,
        paymentMethod: 'TRANSFER',
        reference: 'INV-EPSON-889',
        notes: 'Restock tinta cadangan toko',
        createdAt: yesterdayStr,
      },
      {
        id: 'exp_02',
        category: 'Listrik',
        description: 'Token Listrik Studio Cetak',
        amount: 100000,
        date: todayStr,
        paymentMethod: 'TRANSFER',
        reference: 'PLN-20260823',
        notes: 'Isi token 100rb daya 2200VA',
        createdAt: todayStr,
      }
    ];

    const sampleFinancials = [
      {
        id: 'fin_01',
        date: todayStr,
        type: 'INCOME',
        category: 'Penjualan Kasir',
        description: 'Transaksi Kasir #STR-202608-001 - Dewi Lestari',
        amount: 20000,
        referenceType: 'POS',
        referenceId: 'trx_01',
        paymentMethod: 'CASH',
        notes: 'Cetak Foto A4 Glossy',
        createdAt: todayStr,
      },
      {
        id: 'fin_02',
        date: todayStr,
        type: 'INCOME',
        category: 'DP Pesanan',
        description: 'DP Pesanan #ORD-202608-001 - Budi Santoso',
        amount: 25000,
        referenceType: 'ORDER',
        referenceId: 'ord_01',
        paymentMethod: 'QRIS',
        notes: 'DP 50% 2x MDF Photo A4',
        createdAt: todayStr,
      },
      {
        id: 'fin_03',
        date: yesterdayStr,
        type: 'EXPENSE',
        category: 'Tinta',
        description: 'Beli Tinta Epson 003 Black & Color',
        amount: 175000,
        referenceType: 'EXPENSE',
        referenceId: 'exp_01',
        paymentMethod: 'TRANSFER',
        notes: 'Restock tinta cadangan toko',
        createdAt: yesterdayStr,
      },
      {
        id: 'fin_04',
        date: todayStr,
        type: 'EXPENSE',
        category: 'Listrik',
        description: 'Token Listrik Studio Cetak',
        amount: 100000,
        referenceType: 'EXPENSE',
        referenceId: 'exp_02',
        paymentMethod: 'TRANSFER',
        notes: 'Isi token 100rb',
        createdAt: todayStr,
      }
    ];

    const sampleMovements = [
      {
        id: 'mov_01',
        materialId: 'mat_01',
        materialName: 'MDF Board A4 (6mm)',
        type: 'OUT',
        quantity: 2,
        previousStock: 27,
        newStock: 25,
        referenceType: 'ORDER',
        referenceId: 'ord_01',
        notes: 'Digunakan untuk Pesanan #ORD-202608-001 (Budi Santoso)',
        date: todayStr,
        createdAt: todayStr,
      }
    ];

    return this.restoreDatabase({
      settings: {
        businessName: 'SUKUNARU STUDIO',
        tagline: 'Home Printing & Desain Grafis',
        address: 'Nyalindung Desa.Rajapolah Kec.Rajapolah Kab.Tasikmalaya 46155',
        whatsapp: '081234567890',
        email: 'sukunarustudio@gmail.com',
        currency: 'IDR',
        invoicePrefix: 'INV-',
        receiptPrefix: 'STR-',
        defaultTaxPercent: 0,
        defaultDiscountPercent: 0,
        footerNotes: 'Terima kasih telah mempercayakan kebutuhan cetak & desain Anda kepada Sukunaru Studio!',
      },
      materials: sampleMaterials,
      customers: sampleCustomers,
      products: sampleProducts,
      orders: sampleOrders,
      transactions: sampleTransactions,
      expenses: sampleExpenses,
      financial_transactions: sampleFinancials,
      inventory_movements: sampleMovements,
    });
  },
};
