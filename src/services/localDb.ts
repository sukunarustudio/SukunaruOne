import {
  Customer,
  Material,
  InventoryMovement,
  Product,
  Order,
  Transaction,
  Expense,
  FinancialTransaction,
  BusinessSettings,
  DashboardStats,
  StockItem,
  StockMovement,
  ItemType,
  ProductType,
  CashierShift,
  ShiftSummary,
} from '../types';

const STORAGE_KEY = 'sukunaru_local_db_v1';

export interface LocalDatabaseSchema {
  settings: BusinessSettings;
  customers: Customer[];

  // === Shifts (Cashier work periods) ===
  shifts: CashierShift[];

  // === Unified Inventory (new) ===
  stock_items: StockItem[];
  stock_movements: StockMovement[];

  // === Legacy (kept for non-destructive migration) ===
  materials: Material[];
  inventory_movements: InventoryMovement[];
  products: Product[];

  orders: Order[];
  transactions: Transaction[];
  expenses: Expense[];
  financial_transactions: FinancialTransaction[];
}

const DEFAULT_INITIAL_DATA: LocalDatabaseSchema = {
  settings: {
    businessName: "",
    tagline: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    receiptHeader: "",
    receiptFooter: "Terima kasih telah berbelanja!",
    bankAccount: "",
    currency: "IDR",
    invoicePrefix: "INV-",
    receiptPrefix: "STR-",
    defaultTaxPercent: 0,
    defaultDiscountPercent: 0,
    footerNotes: "Terima kasih atas kepercayaan Anda!"
  },
  customers: [],
  shifts: [],
  stock_items: [],
  stock_movements: [],
  materials: [],
  inventory_movements: [],
  products: [],
  orders: [],
  transactions: [],
  expenses: [],
  financial_transactions: []
};

// Helper: Convert and compress image File to base64 Data URL for fast sync and invoice rendering
export function fileToDataUrl(file: File, maxDimension = 600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG, read as text data url directly
    if (file.type.includes('svg')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use image/jpeg for photos, image/png if transparent
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// Helper: Convert, center-crop, and compress image to 1:1 square base64 Data URL
export function squareImageToDataUrl(fileOrBlob: Blob | File, targetDimension = 512, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    if (fileOrBlob.type.includes('svg')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(fileOrBlob);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = targetDimension;
        canvas.height = targetDimension;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDimension, targetDimension);

        const format = fileOrBlob.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(fileOrBlob);
  });
}

export function reconcileFinancialTransactions(db: LocalDatabaseSchema): boolean {
  if (!db) return false;
  let changed = false;
  if (!Array.isArray(db.financial_transactions)) {
    db.financial_transactions = [];
    changed = true;
  }

  const existingMap = new Map<string, FinancialTransaction>();
  db.financial_transactions.forEach(f => {
    if (f.id) existingMap.set(f.id, f);
    if (f.referenceId) existingMap.set(`${f.referenceType || 'GENERIC'}_${f.referenceId}_${f.type}`, f);
  });

  // 1. Reconcile from POS Transactions
  if (Array.isArray(db.transactions)) {
    db.transactions.forEach(t => {
      const totAmt = Number(t.totalAmount) || 0;
      if (totAmt <= 0) return;

      const dateStr = t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0];

      // Check for base income entry
      const incomeKey = `POS_${t.id}_INCOME`;
      const hasIncome = existingMap.has(incomeKey) ||
        db.financial_transactions.some(f => (f.referenceId === t.id || f.referenceNumber === t.receiptNumber) && f.type === 'INCOME');

      if (!hasIncome) {
        const newFin: FinancialTransaction = {
          id: `fin_auto_pos_${t.id}`,
          date: dateStr,
          type: 'INCOME',
          category: 'Penjualan Kasir',
          description: `Transaksi Kasir #${t.receiptNumber} - ${t.customerName || 'Pelanggan Umum'}`,
          amount: totAmt,
          referenceNumber: t.receiptNumber,
          referenceType: 'POS',
          referenceId: t.id,
          paymentMethod: t.paymentMethod || 'CASH',
          notes: Array.isArray(t.items) ? `Item: ${t.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}` : '',
          createdAt: dateStr,
        };
        db.financial_transactions.unshift(newFin);
        existingMap.set(incomeKey, newFin);
        changed = true;
      }

      // Check for refund entry if refunded
      if (t.status === 'REFUNDED') {
        const refundKey = `POS_REFUND_${t.id}_EXPENSE`;
        const hasRefund = existingMap.has(refundKey) ||
          db.financial_transactions.some(f => (f.referenceId === t.id || f.referenceNumber === t.receiptNumber) && f.type === 'EXPENSE');

        if (!hasRefund) {
          const refundDate = t.refundedAt ? t.refundedAt.split('T')[0] : dateStr;
          const newRefundFin: FinancialTransaction = {
            id: `fin_auto_ref_${t.id}`,
            date: refundDate,
            type: 'EXPENSE',
            category: 'Refund Penjualan',
            description: `Refund Transaksi Kasir #${t.receiptNumber} - ${t.customerName || 'Pelanggan Umum'}`,
            amount: totAmt,
            referenceNumber: t.receiptNumber,
            referenceType: 'POS_REFUND' as any,
            referenceId: t.id,
            paymentMethod: t.paymentMethod || 'CASH',
            notes: `Alasan: ${t.refundReason || 'Pembatalan transaksi kasir'}`,
            createdAt: refundDate,
          };
          db.financial_transactions.unshift(newRefundFin);
          existingMap.set(refundKey, newRefundFin);
          changed = true;
        }
      }
    });
  }

  // 2. Reconcile from Orders (DP / Pelunasan)
  if (Array.isArray(db.orders)) {
    db.orders.forEach(o => {
      if (o.status === 'BATAL') return;
      const paidAmt = Number(o.paidAmount) || 0;
      if (paidAmt <= 0) return;

      const dateStr = o.orderDate ? o.orderDate.split('T')[0] : new Date().toISOString().split('T')[0];
      const orderKey = `ORDER_${o.id}_INCOME`;
      const hasOrderFin = existingMap.has(orderKey) ||
        db.financial_transactions.some(f => (f.referenceId === o.id || f.referenceNumber === o.orderNumber) && f.type === 'INCOME');

      if (!hasOrderFin) {
        const newFin: FinancialTransaction = {
          id: `fin_auto_ord_${o.id}`,
          date: dateStr,
          type: 'INCOME',
          category: o.paymentStatus === 'LUNAS' ? 'Pelunasan Pesanan' : 'DP Pesanan',
          description: `Pesanan SPK #${o.orderNumber} - ${o.customerName || 'Pelanggan'}`,
          amount: paidAmt,
          referenceNumber: o.orderNumber,
          referenceType: 'ORDER',
          referenceId: o.id,
          paymentMethod: o.payments?.[0]?.paymentMethod || 'CASH',
          notes: `Pesanan SPK`,
          createdAt: dateStr,
        };
        db.financial_transactions.unshift(newFin);
        existingMap.set(orderKey, newFin);
        changed = true;
      }
    });
  }

  // 3. Reconcile from Expenses
  if (Array.isArray(db.expenses)) {
    db.expenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      if (amt <= 0) return;

      const dateStr = e.date ? e.date.split('T')[0] : new Date().toISOString().split('T')[0];
      const expKey = `EXPENSE_${e.id}_EXPENSE`;
      const hasExpFin = existingMap.has(expKey) ||
        db.financial_transactions.some(f => f.referenceId === e.id && f.type === 'EXPENSE');

      if (!hasExpFin) {
        const newFin: FinancialTransaction = {
          id: `fin_auto_exp_${e.id}`,
          date: dateStr,
          type: 'EXPENSE',
          category: e.category || 'Operasional',
          description: e.description || 'Pengeluaran',
          amount: amt,
          referenceType: 'EXPENSE',
          referenceId: e.id,
          paymentMethod: e.paymentMethod || 'CASH',
          notes: e.notes || '',
          createdAt: dateStr,
        };
        db.financial_transactions.unshift(newFin);
        existingMap.set(expKey, newFin);
        changed = true;
      }
    });
  }

  return changed;
}

// === MIGRATION: materials + products → stock_items ===
function mapProductTypeToItemType(pt?: string, hasComponents?: boolean): ItemType {
  if (!pt) return 'GOODS';
  const upper = pt.toUpperCase();
  if (['SERVICE', 'JASA', 'DESAIN', 'DIGITAL'].includes(upper)) return 'SERVICE';
  if (upper === 'CETAK' && hasComponents) return 'PRODUCED';
  return 'GOODS';
}

function migrateToStockItems(db: LocalDatabaseSchema): boolean {
  if (!db) return false;
  if (!Array.isArray(db.stock_items)) db.stock_items = [];
  if (!Array.isArray(db.stock_movements)) db.stock_movements = [];

  // Skip migration if stock_items already has data
  if (db.stock_items.length > 0) return false;

  // Skip if there's nothing to migrate
  const hasMaterials = Array.isArray(db.materials) && db.materials.length > 0;
  const hasProducts = Array.isArray(db.products) && db.products.length > 0;
  if (!hasMaterials && !hasProducts) return false;

  let changed = false;
  const existingIds = new Set(db.stock_items.map(si => si.id));
  const now = new Date().toISOString();

  // 1. Migrate Materials → StockItem (type: RAW_MATERIAL)
  if (hasMaterials) {
    for (const mat of db.materials) {
      if (existingIds.has(mat.id)) continue;

      const stockItem: StockItem = {
        id: mat.id,
        name: mat.name,
        sku: mat.sku || '',
        category: mat.category || 'Bahan Baku',
        itemType: 'RAW_MATERIAL',
        trackStock: true,
        currentStock: mat.currentStock || 0,
        minStock: mat.minStock || 0,
        baseUnit: mat.unit || 'PCS',
        purchasePrice: mat.unitCost || mat.purchasePrice || 0,
        sellingPrice: 0,
        costPrice: mat.unitCost || mat.purchasePrice || 0,
        isActive: true,
        supplier: mat.supplier,
        supplierContact: mat.supplierContact,
        notes: mat.notes,
        createdAt: mat.createdAt || now,
        updatedAt: mat.updatedAt || now,
      };
      db.stock_items.push(stockItem);
      existingIds.add(mat.id);
      changed = true;
    }
  }

  // 2. Migrate Products → StockItem
  if (hasProducts) {
    for (const prod of db.products) {
      if (existingIds.has(prod.id)) continue;

      const hasComps = Array.isArray(prod.components) && prod.components.length > 0;
      const itemType = mapProductTypeToItemType(prod.type, hasComps);

      // Convert ProductComponent[] to ItemComponent[]
      const components = hasComps
        ? prod.components!.map(c => ({
            id: c.id,
            itemId: c.materialId || c.id,
            componentName: c.componentName,
            quantity: c.quantity,
            unit: c.unit,
            unitCost: c.unitCost,
            subtotal: c.subtotal,
          }))
        : undefined;

      const stockItem: StockItem = {
        id: prod.id,
        name: prod.name,
        sku: prod.sku || '',
        category: prod.category || 'Umum',
        itemType,
        trackStock: prod.trackStock ?? (itemType !== 'SERVICE'),
        currentStock: prod.currentStock || 0,
        minStock: prod.minStock || 0,
        baseUnit: prod.unit || 'PCS',
        purchasePrice: prod.costPrice || 0,
        sellingPrice: prod.sellingPrice || 0,
        costPrice: prod.costPrice || 0,
        isActive: prod.isActive !== false,
        barcode: prod.barcode,
        barcodeType: prod.barcodeType,
        description: prod.description,
        imagePath: prod.imagePath,
        thumbnailPath: prod.thumbnailPath,
        productType: prod.type as ProductType,
        components,
        laborCost: prod.laborCost,
        machineCost: prod.machineCost,
        otherCost: prod.otherCost,
        profit: prod.profit,
        profitMargin: prod.profitMargin,
        marginPercent: prod.marginPercent,
        notes: undefined,
        createdAt: prod.createdAt || now,
        updatedAt: prod.updatedAt || now,
      };
      db.stock_items.push(stockItem);
      existingIds.add(prod.id);
      changed = true;
    }
  }

  // 3. Migrate inventory_movements → stock_movements
  if (Array.isArray(db.inventory_movements) && db.inventory_movements.length > 0) {
    const existingMovIds = new Set(db.stock_movements.map(sm => sm.id));
    for (const mov of db.inventory_movements) {
      if (existingMovIds.has(mov.id)) continue;

      const sm: StockMovement = {
        id: mov.id,
        itemId: mov.materialId,
        itemName: mov.materialName,
        type: mov.type as StockMovement['type'],
        quantity: mov.quantity,
        previousStock: mov.previousStock || 0,
        newStock: mov.newStock || 0,
        referenceType: mov.referenceType as StockMovement['referenceType'],
        referenceId: mov.referenceId,
        notes: mov.notes,
        date: mov.date,
        createdAt: mov.createdAt,
      };
      db.stock_movements.push(sm);
      existingMovIds.add(mov.id);
      changed = true;
    }
  }

  if (changed) {
    console.log(`[Migration] Migrated ${db.stock_items.length} stock items, ${db.stock_movements.length} movements`);
  }
  return changed;
}

function getLocalData(): LocalDatabaseSchema {
  if (typeof window === 'undefined') {
    return JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_DATA));
      return JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
    }
    const data = JSON.parse(raw);
    const clean: LocalDatabaseSchema = {
      settings: data.settings || DEFAULT_INITIAL_DATA.settings,
      customers: Array.isArray(data.customers) ? data.customers : DEFAULT_INITIAL_DATA.customers,
      shifts: Array.isArray(data.shifts) ? data.shifts : [],
      stock_items: Array.isArray(data.stock_items) ? data.stock_items : [],
      stock_movements: Array.isArray(data.stock_movements) ? data.stock_movements : [],
      materials: Array.isArray(data.materials) ? data.materials : DEFAULT_INITIAL_DATA.materials,
      inventory_movements: Array.isArray(data.inventory_movements) ? data.inventory_movements : [],
      products: Array.isArray(data.products) ? data.products : DEFAULT_INITIAL_DATA.products,
      orders: Array.isArray(data.orders) ? data.orders : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      financial_transactions: Array.isArray(data.financial_transactions) ? data.financial_transactions : [],
    };

    // Auto-migrate materials+products → stock_items if not yet done
    if (migrateToStockItems(clean)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      } catch {}
    }

    if (reconcileFinancialTransactions(clean)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      } catch {}
    }
    return clean;
  } catch (err) {
    console.error('Failed to parse local DB from localStorage:', err);
    return JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
  }
}

export const DATA_MUTATION_EVENT = 'sukunaru:data_mutation';

export function emitDataMutation(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DATA_MUTATION_EVENT));
}

function setLocalData(data: LocalDatabaseSchema): void {
  if (typeof window === 'undefined') return;
  try {
    reconcileFinancialTransactions(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    emitDataMutation();
  } catch (err) {
    console.error('Failed to save to local DB:', err);
  }
}

export const localDb = {
  // Settings
  async getSettings(): Promise<BusinessSettings> {
    const db = getLocalData();
    return db.settings;
  },

  async updateSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const db = getLocalData();
    db.settings = { ...db.settings, ...data };
    setLocalData(db);
    return db.settings;
  },

  async uploadBusinessLogo(file: File): Promise<{ success: boolean; logoUrl: string; settings: BusinessSettings }> {
    const dataUrl = await squareImageToDataUrl(file, 512, 0.88);
    const db = getLocalData();
    db.settings.logoUrl = dataUrl;
    setLocalData(db);
    return { success: true, logoUrl: dataUrl, settings: db.settings };
  },

  async deleteBusinessLogo(): Promise<{ success: boolean; settings: BusinessSettings }> {
    const db = getLocalData();
    db.settings.logoUrl = undefined;
    setLocalData(db);
    return { success: true, settings: db.settings };
  },

  async resetSampleData(): Promise<{ success: boolean; message: string }> {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
    setLocalData(fresh);
    return { success: true, message: 'Data sampel berhasil diatur ulang.' };
  },

  async resetToCleanNewUserState(userEmail?: string, displayName?: string): Promise<{ success: boolean; settings: BusinessSettings }> {
    const cleanSettings: BusinessSettings = {
      businessName: displayName?.trim() || '',
      tagline: '',
      address: '',
      phone: '',
      whatsapp: '',
      email: userEmail?.trim() || '',
      receiptHeader: '',
      receiptFooter: 'Terima kasih telah berbelanja!',
      bankAccount: '',
      currency: 'IDR',
      invoicePrefix: 'INV-',
      receiptPrefix: 'STR-',
      defaultTaxPercent: 0,
      defaultDiscountPercent: 0,
      footerNotes: 'Terima kasih atas kepercayaan Anda!',
    };

    const cleanDb: LocalDatabaseSchema = {
      settings: cleanSettings,
      customers: [],
      materials: [],
      inventory_movements: [],
      products: [],
      orders: [],
      transactions: [],
      expenses: [],
      financial_transactions: [],
    };

    setLocalData(cleanDb);

    // Clean any lingering sync queues or sync timestamps from previous sessions
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sukunaru_sync_queue_v1');
        localStorage.removeItem('sukunaru_last_supabase_sync');
        localStorage.removeItem('sukunaru_pre_recovery_local_backup');
      } catch {}
    }

    emitDataMutation();
    return { success: true, settings: cleanSettings };
  },

  async resetToCleanLoggedOutState(): Promise<{ success: boolean }> {
    const cleanSettings: BusinessSettings = {
      businessName: '',
      tagline: '',
      address: '',
      phone: '',
      whatsapp: '',
      email: '',
      receiptHeader: '',
      receiptFooter: 'Terima kasih telah berbelanja!',
      bankAccount: '',
      currency: 'IDR',
      invoicePrefix: 'INV-',
      receiptPrefix: 'STR-',
      defaultTaxPercent: 0,
      defaultDiscountPercent: 0,
      footerNotes: 'Terima kasih atas kepercayaan Anda!',
    };

    const cleanDb: LocalDatabaseSchema = {
      settings: cleanSettings,
      customers: [],
      materials: [],
      inventory_movements: [],
      products: [],
      orders: [],
      transactions: [],
      expenses: [],
      financial_transactions: [],
    };

    setLocalData(cleanDb);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sukunaru_sync_queue_v1');
        localStorage.removeItem('sukunaru_last_supabase_sync');
        localStorage.removeItem('sukunaru_pre_recovery_local_backup');
        localStorage.removeItem('sukunaru_license_info');
        localStorage.removeItem('sukunaru_last_acknowledged_plan');
        localStorage.removeItem('sukunaru_new_signup_welcome');
      } catch {}
    }

    emitDataMutation();
    return { success: true };
  },

  // Stats
  async getStats(): Promise<DashboardStats & { lowStockItems: Material[] }> {
    const db = getLocalData();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    // 1. Total Saldo Kas Keseluruhan (All-Time Cumulative Cash Balance)
    const allIncome = (db.financial_transactions || [])
      .filter(f => f.type === 'INCOME')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const allExpense = (db.financial_transactions || [])
      .filter(f => f.type === 'EXPENSE')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const totalCashBalance = allIncome - allExpense;

    // 2. Hari Ini (Today)
    const todayFinIncomes = (db.financial_transactions || [])
      .filter(f => (f.date ? f.date.split('T')[0] : '') === today && f.type === 'INCOME');
    const todayFinExpenses = (db.financial_transactions || [])
      .filter(f => (f.date ? f.date.split('T')[0] : '') === today && f.type === 'EXPENSE');

    const todayIncomeTotal = todayFinIncomes.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const todayExpenseTotal = todayFinExpenses.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const todayPos = (db.transactions || []).filter(t => (t.date ? t.date.split('T')[0] : '') === today && t.status !== 'REFUNDED' && t.status !== 'CANCELLED');
    const todayOrders = (db.orders || []).filter(o => (o.orderDate ? o.orderDate.split('T')[0] : '') === today && o.status !== 'BATAL');
    const todayPosSales = todayPos.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
    const todayOrderPaid = todayOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);
    const todayRevenue = todayIncomeTotal > 0 ? todayIncomeTotal : (todayPosSales + todayOrderPaid);
    const todayExpense = todayExpenseTotal;

    const todayPosCost = todayPos.reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0);
    const todayOrderCost = todayOrders.reduce((sum, o) => sum + (Number(o.totalCost) || 0), 0);
    const todayProfit = Math.max(0, todayRevenue - todayPosCost - todayOrderCost - todayExpense);

    // 3. Bulan Ini (This Month)
    const monthFinIncomes = (db.financial_transactions || [])
      .filter(f => (f.date ? f.date.split('T')[0] : '').startsWith(thisMonth) && f.type === 'INCOME');
    const monthFinExpenses = (db.financial_transactions || [])
      .filter(f => (f.date ? f.date.split('T')[0] : '').startsWith(thisMonth) && f.type === 'EXPENSE');

    const monthIncomeTotal = monthFinIncomes.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const monthExpenseTotal = monthFinExpenses.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const monthPos = (db.transactions || []).filter(t => (t.date ? t.date.split('T')[0] : '').startsWith(thisMonth) && t.status !== 'REFUNDED' && t.status !== 'CANCELLED');
    const monthOrders = (db.orders || []).filter(o => (o.orderDate ? o.orderDate.split('T')[0] : '').startsWith(thisMonth) && o.status !== 'BATAL');
    const monthPosSales = monthPos.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
    const monthOrderPaid = monthOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);

    const thisMonthRevenue = monthIncomeTotal > 0 ? monthIncomeTotal : (monthPosSales + monthOrderPaid);
    const thisMonthExpense = monthExpenseTotal;

    const monthPosCost = monthPos.reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0);
    const monthOrderCost = monthOrders.reduce((sum, o) => sum + (Number(o.totalCost) || 0), 0);
    const thisMonthProfit = Math.max(0, thisMonthRevenue - monthPosCost - monthOrderCost - thisMonthExpense);

    const stockList = Array.isArray(db.stock_items) && db.stock_items.length > 0
      ? db.stock_items
      : (db.materials || []);
    const lowStockItems = stockList.filter((m: any) => {
      const track = m.trackStock !== undefined ? m.trackStock : true;
      return track && Number(m.currentStock || 0) <= Number(m.minStock || 0);
    });
    const activeOrders = (db.orders || []).filter(o => o.status !== 'SELESAI' && o.status !== 'BATAL');

    return {
      todayRevenue,
      todayProfit,
      todayTransactionsCount: todayOrders.length + todayPos.length,
      activeOrdersCount: activeOrders.length,
      todayExpense,
      thisMonthRevenue,
      thisMonthProfit,
      thisMonthExpense,
      totalCashBalance,
      lowStockItemsCount: lowStockItems.length,
      lowStockItems,
    };
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const db = getLocalData();
    return db.customers;
  },

  async createCustomer(data: { name: string; whatsapp?: string; address?: string; notes?: string }): Promise<Customer> {
    const db = getLocalData();
    const newCust: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      whatsapp: data.whatsapp || '',
      phone: data.whatsapp || '',
      address: data.address || '',
      notes: data.notes || '',
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    db.customers.unshift(newCust);
    setLocalData(db);
    return newCust;
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const db = getLocalData();
    const idx = db.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Pelanggan tidak ditemukan');
    db.customers[idx] = { ...db.customers[idx], ...data, updatedAt: new Date().toISOString().split('T')[0] };
    setLocalData(db);
    return db.customers[idx];
  },

  async deleteCustomer(id: string): Promise<void> {
    const db = getLocalData();
    db.customers = db.customers.filter(c => c.id !== id);
    setLocalData(db);
  },

  // Materials
  async getMaterials(): Promise<Material[]> {
    const db = getLocalData();
    return db.materials;
  },

  async createMaterial(data: Partial<Material>): Promise<Material> {
    const db = getLocalData();
    const newMat: Material = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name || 'Bahan Baru',
      sku: data.sku || `MAT-${Date.now().toString().slice(-4)}`,
      category: data.category || 'Umum',
      unit: data.unit || 'pcs',
      currentStock: data.currentStock || 0,
      minStock: data.minStock || 0,
      purchasePrice: data.unitCost ?? data.purchasePrice ?? 0,
      unitCost: data.unitCost ?? data.purchasePrice ?? 0,
      supplier: data.supplier || '',
      supplierContact: data.supplierContact || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    db.materials.unshift(newMat);
    setLocalData(db);
    return newMat;
  },

  async updateMaterial(id: string, data: Partial<Material>): Promise<Material> {
    const db = getLocalData();
    const idx = db.materials.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Material tidak ditemukan');
    db.materials[idx] = {
      ...db.materials[idx],
      ...data,
      unitCost: data.unitCost ?? data.purchasePrice ?? db.materials[idx].unitCost,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setLocalData(db);
    return db.materials[idx];
  },

  async addStockMovement(
    materialId: string,
    data: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; referenceType?: string; notes?: string }
  ): Promise<{ material: Material; movement: InventoryMovement }> {
    const db = getLocalData();
    const mat = db.materials.find(m => m.id === materialId);
    if (!mat) throw new Error('Material tidak ditemukan');

    const prevStock = mat.currentStock;
    let newStock = prevStock;
    if (data.type === 'IN') {
      newStock += data.quantity;
    } else if (data.type === 'OUT') {
      newStock = Math.max(0, newStock - data.quantity);
    } else if (data.type === 'ADJUSTMENT') {
      newStock = data.quantity;
    }
    mat.currentStock = newStock;
    mat.updatedAt = new Date().toISOString().split('T')[0];

    const movement: InventoryMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      materialId,
      materialName: mat.name,
      type: data.type,
      quantity: data.quantity,
      previousStock: prevStock,
      newStock,
      referenceType: data.referenceType as any,
      notes: data.notes,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };
    db.inventory_movements.unshift(movement);
    setLocalData(db);
    return { material: mat, movement };
  },

  async recordMovement(data: {
    materialId: string;
    materialName?: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    notes?: string;
  }): Promise<{ material: Material; movement: InventoryMovement }> {
    return this.addStockMovement(data.materialId, {
      type: data.type,
      quantity: data.quantity,
      notes: data.notes,
      referenceType: 'MANUAL',
    });
  },

  async deleteMaterial(id: string): Promise<void> {
    const db = getLocalData();
    db.materials = db.materials.filter(m => m.id !== id);
    setLocalData(db);
  },

  async getInventoryMovements(): Promise<InventoryMovement[]> {
    const db = getLocalData();
    return db.inventory_movements;
  },

  async getMovements(): Promise<InventoryMovement[]> {
    return this.getInventoryMovements();
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const db = getLocalData();
    return db.products;
  },

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const db = getLocalData();
    const clean = barcode.trim();
    if (!clean) return null;
    const cleanLower = clean.toLowerCase();

    // 1. Exact match on barcode (case-insensitive)
    let found = db.products.find(p => p.barcode && p.barcode.trim().toLowerCase() === cleanLower);

    // 2. Match on SKU (case-insensitive)
    if (!found) {
      found = db.products.find(p => p.sku && p.sku.trim().toLowerCase() === cleanLower);
    }

    // 3. Match on ID
    if (!found) {
      found = db.products.find(p => p.id && p.id.trim().toLowerCase() === cleanLower);
    }

    // 4. Numeric barcode comparison (e.g. EAN-13 / EAN-8 with/without leading zero)
    if (!found && /^\d+$/.test(clean)) {
      const cleanNum = clean.replace(/^0+/, '');
      found = db.products.find(p => {
        if (!p.barcode || !/^\d+$/.test(p.barcode.trim())) return false;
        return p.barcode.trim().replace(/^0+/, '') === cleanNum;
      });
    }

    return found || null;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const db = getLocalData();

    // Validate unique barcode if provided
    if (data.barcode && data.barcode.trim()) {
      const duplicate = db.products.find(p => p.barcode && p.barcode.trim() === data.barcode!.trim());
      if (duplicate) {
        throw new Error(`Barcode "${data.barcode}" sudah digunakan oleh produk "${duplicate.name}".`);
      }
    }

    const newProd: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name || 'Produk Baru',
      sku: data.sku || `PRD-${Date.now().toString().slice(-4)}`,
      category: data.category || 'Umum',
      type: data.type || 'PHYSICAL',
      sellingPrice: data.sellingPrice || 0,
      costPrice: data.costPrice || 0,
      profit: (data.sellingPrice || 0) - (data.costPrice || 0),
      profitMargin: data.profitMargin || 0,
      marginPercent: data.marginPercent || 0,
      laborCost: data.laborCost || 0,
      machineCost: data.machineCost || 0,
      otherCost: data.otherCost || 0,
      trackStock: data.trackStock ?? true,
      minStock: data.minStock || 0,
      currentStock: data.currentStock || 0,
      unit: data.unit || 'pcs',
      description: data.description || '',
      isActive: data.isActive ?? true,
      imagePath: data.imagePath,
      thumbnailPath: data.thumbnailPath,
      barcode: data.barcode?.trim() || undefined,
      barcodeType: data.barcodeType || undefined,
      components: data.components || [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    db.products.unshift(newProd);
    setLocalData(db);
    return newProd;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const db = getLocalData();
    const idx = db.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Produk tidak ditemukan');

    // Validate unique barcode if changed
    if (data.barcode && data.barcode.trim()) {
      const duplicate = db.products.find(p => p.id !== id && p.barcode && p.barcode.trim() === data.barcode!.trim());
      if (duplicate) {
        throw new Error(`Barcode "${data.barcode}" sudah digunakan oleh produk "${duplicate.name}".`);
      }
    }

    db.products[idx] = {
      ...db.products[idx],
      ...data,
      barcode: data.barcode !== undefined ? (data.barcode?.trim() || undefined) : db.products[idx].barcode,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setLocalData(db);
    return db.products[idx];
  },

  async deleteProduct(id: string): Promise<void> {
    const db = getLocalData();
    db.products = db.products.filter(p => p.id !== id);
    setLocalData(db);
  },

  async uploadProductImage(productId: string, file: File): Promise<{
    imagePath: string;
    thumbnailPath: string;
    imageUrl: string;
    thumbnailUrl: string;
    product: Product;
  }> {
    const dataUrl = await fileToDataUrl(file);
    const db = getLocalData();
    const prod = db.products.find(p => p.id === productId);
    if (!prod) throw new Error('Produk tidak ditemukan');
    prod.imagePath = dataUrl;
    prod.thumbnailPath = dataUrl;
    setLocalData(db);
    return {
      imagePath: dataUrl,
      thumbnailPath: dataUrl,
      imageUrl: dataUrl,
      thumbnailUrl: dataUrl,
      product: prod,
    };
  },

  async deleteProductImage(productId: string): Promise<Product> {
    const db = getLocalData();
    const prod = db.products.find(p => p.id === productId);
    if (!prod) throw new Error('Produk tidak ditemukan');
    prod.imagePath = undefined;
    prod.thumbnailPath = undefined;
    setLocalData(db);
    return prod;
  },

  // =========================================================================
  // STOK BARANG (Unified Master Inventory) Methods
  // =========================================================================

  async getStockItems(): Promise<StockItem[]> {
    const db = getLocalData();
    return db.stock_items || [];
  },

  async getStockItemById(id: string): Promise<StockItem | null> {
    const db = getLocalData();
    return (db.stock_items || []).find(item => item.id === id) || null;
  },

  async getStockItemByBarcode(barcode: string): Promise<StockItem | null> {
    const db = getLocalData();
    const clean = barcode.trim();
    if (!clean) return null;
    const cleanLower = clean.toLowerCase();
    const items = db.stock_items || [];

    // 1. Exact match on barcode (case-insensitive)
    let found = items.find(p => p.barcode && p.barcode.trim().toLowerCase() === cleanLower);

    // 2. Match on SKU (case-insensitive)
    if (!found) {
      found = items.find(p => p.sku && p.sku.trim().toLowerCase() === cleanLower);
    }

    // 3. Match on ID
    if (!found) {
      found = items.find(p => p.id && p.id.trim().toLowerCase() === cleanLower);
    }

    // 4. Numeric barcode comparison (e.g. EAN-13 / EAN-8 with/without leading zero)
    if (!found && /^\d+$/.test(clean)) {
      const cleanNum = clean.replace(/^0+/, '');
      found = items.find(p => {
        if (!p.barcode || !/^\d+$/.test(p.barcode.trim())) return false;
        return p.barcode.trim().replace(/^0+/, '') === cleanNum;
      });
    }

    return found || null;
  },

  async createStockItem(data: Partial<StockItem>): Promise<StockItem> {
    const db = getLocalData();
    if (!Array.isArray(db.stock_items)) db.stock_items = [];

    // Validate unique barcode if provided
    if (data.barcode && data.barcode.trim()) {
      const duplicate = db.stock_items.find(p => p.barcode && p.barcode.trim() === data.barcode!.trim());
      if (duplicate) {
        throw new Error(`Barcode "${data.barcode}" sudah digunakan oleh barang "${duplicate.name}".`);
      }
    }

    const itemType: ItemType = data.itemType || 'GOODS';
    const sellingPrice = Number(data.sellingPrice) || 0;
    const costPrice = Number(data.costPrice) || Number(data.purchasePrice) || 0;
    const profit = sellingPrice - costPrice;
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const now = new Date().toISOString();

    const newItem: StockItem = {
      id: data.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name || 'Barang Baru',
      sku: data.sku || `SKU-${Date.now().toString().slice(-5)}`,
      category: data.category || 'Umum',
      itemType,
      trackStock: data.trackStock ?? (itemType !== 'SERVICE'),
      currentStock: Number(data.currentStock) || 0,
      minStock: Number(data.minStock) || 0,
      baseUnit: data.baseUnit || 'PCS',
      purchasePrice: Number(data.purchasePrice) || costPrice,
      sellingPrice,
      costPrice,
      priceTiers: data.priceTiers || [],
      unitConversions: data.unitConversions || [],
      components: data.components || [],
      laborCost: Number(data.laborCost) || 0,
      machineCost: Number(data.machineCost) || 0,
      otherCost: Number(data.otherCost) || 0,
      profit,
      profitMargin,
      marginPercent: profitMargin,
      barcode: data.barcode?.trim() || undefined,
      barcodeType: data.barcodeType || undefined,
      description: data.description || '',
      imagePath: data.imagePath,
      thumbnailPath: data.thumbnailPath,
      isActive: data.isActive ?? true,
      supplier: data.supplier,
      supplierContact: data.supplierContact,
      productType: data.productType,
      hasVariants: data.hasVariants || false,
      variants: data.variants || [],
      notes: data.notes,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };

    db.stock_items.unshift(newItem);

    // Initial stock movement record if currentStock > 0
    if (newItem.trackStock && newItem.currentStock > 0) {
      const initialMov: StockMovement = {
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemId: newItem.id,
        itemName: newItem.name,
        type: 'IN',
        quantity: newItem.currentStock,
        previousStock: 0,
        newStock: newItem.currentStock,
        referenceType: 'MANUAL',
        notes: 'Stok awal barang baru',
        date: now.split('T')[0],
        createdAt: now,
      };
      if (!Array.isArray(db.stock_movements)) db.stock_movements = [];
      db.stock_movements.unshift(initialMov);
    }

    setLocalData(db);
    return newItem;
  },

  async updateStockItem(id: string, data: Partial<StockItem>): Promise<StockItem> {
    const db = getLocalData();
    if (!Array.isArray(db.stock_items)) db.stock_items = [];
    const idx = db.stock_items.findIndex(item => item.id === id);
    if (idx === -1) throw new Error('Barang tidak ditemukan');

    // Validate unique barcode if changed
    if (data.barcode && data.barcode.trim()) {
      const duplicate = db.stock_items.find(p => p.id !== id && p.barcode && p.barcode.trim() === data.barcode!.trim());
      if (duplicate) {
        throw new Error(`Barcode "${data.barcode}" sudah digunakan oleh barang "${duplicate.name}".`);
      }
    }

    const current = db.stock_items[idx];
    const sellingPrice = data.sellingPrice !== undefined ? Number(data.sellingPrice) : current.sellingPrice;
    const costPrice = data.costPrice !== undefined ? Number(data.costPrice) : current.costPrice;
    const profit = sellingPrice - costPrice;
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const now = new Date().toISOString();

    db.stock_items[idx] = {
      ...current,
      ...data,
      sellingPrice,
      costPrice,
      profit,
      profitMargin,
      marginPercent: profitMargin,
      barcode: data.barcode !== undefined ? (data.barcode?.trim() || undefined) : current.barcode,
      updatedAt: now,
    };

    setLocalData(db);
    return db.stock_items[idx];
  },

  async deleteStockItem(id: string): Promise<void> {
    const db = getLocalData();
    if (Array.isArray(db.stock_items)) {
      db.stock_items = db.stock_items.filter(item => item.id !== id);
    }
    // Also remove from legacy tables if present
    if (Array.isArray(db.products)) {
      db.products = db.products.filter(p => p.id !== id);
    }
    if (Array.isArray(db.materials)) {
      db.materials = db.materials.filter(m => m.id !== id);
    }
    setLocalData(db);
  },

  async uploadStockItemImage(itemId: string, file: File): Promise<{
    imagePath: string;
    thumbnailPath: string;
    imageUrl: string;
    thumbnailUrl: string;
    item: StockItem;
  }> {
    const dataUrl = await squareImageToDataUrl(file, 512, 0.88);
    const db = getLocalData();
    const item = (db.stock_items || []).find(p => p.id === itemId);
    if (!item) throw new Error('Barang tidak ditemukan');
    item.imagePath = dataUrl;
    item.thumbnailPath = dataUrl;
    item.updatedAt = new Date().toISOString();
    setLocalData(db);
    return {
      imagePath: dataUrl,
      thumbnailPath: dataUrl,
      imageUrl: dataUrl,
      thumbnailUrl: dataUrl,
      item,
    };
  },

  async deleteStockItemImage(itemId: string): Promise<StockItem> {
    const db = getLocalData();
    const item = (db.stock_items || []).find(p => p.id === itemId);
    if (!item) throw new Error('Barang tidak ditemukan');
    item.imagePath = undefined;
    item.thumbnailPath = undefined;
    item.updatedAt = new Date().toISOString();
    setLocalData(db);
    return item;
  },

  // Stock Movements & Adjustments
  async getStockMovements(itemId?: string): Promise<StockMovement[]> {
    const db = getLocalData();
    const movs = db.stock_movements || [];
    if (!itemId) return movs;
    return movs.filter(m => m.itemId === itemId);
  },

  async addStockItemMovement(
    itemId: string,
    data: {
      type: StockMovementType;
      quantity: number;
      referenceType?: StockRefType | string;
      referenceId?: string;
      notes?: string;
      variantId?: string;
      date?: string;
    }
  ): Promise<{ item: StockItem; movement: StockMovement }> {
    const db = getLocalData();
    const item = (db.stock_items || []).find(i => i.id === itemId);
    if (!item) throw new Error('Barang tidak ditemukan');

    const prevStock = Number(item.currentStock) || 0;
    let newStock = prevStock;
    const qty = Number(data.quantity) || 0;

    if (data.type === 'IN') {
      newStock += qty;
    } else if (data.type === 'OUT') {
      newStock = Math.max(0, newStock - qty);
    } else if (data.type === 'ADJUSTMENT' || data.type === 'OPNAME') {
      newStock = qty;
    }

    item.currentStock = newStock;
    item.updatedAt = new Date().toISOString();

    const now = new Date().toISOString();
    const movement: StockMovement = {
      id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemId,
      itemName: item.name,
      variantId: data.variantId,
      type: data.type,
      quantity: qty,
      previousStock: prevStock,
      newStock,
      referenceType: (data.referenceType as any) || 'MANUAL',
      referenceId: data.referenceId,
      notes: data.notes,
      date: data.date || now.split('T')[0],
      createdAt: now,
    };

    if (!Array.isArray(db.stock_movements)) db.stock_movements = [];
    db.stock_movements.unshift(movement);

    setLocalData(db);
    return { item, movement };
  },

  async restockStockItem(
    itemId: string,
    data: {
      quantity: number;
      purchasePrice?: number;
      unitCost?: number;
      supplier?: string;
      notes?: string;
      recordExpense?: boolean;
      paymentMethod?: PaymentMethod;
      date?: string;
    }
  ): Promise<{ item: StockItem; movement: StockMovement }> {
    const db = getLocalData();
    const item = (db.stock_items || []).find(i => i.id === itemId);
    if (!item) throw new Error('Barang tidak ditemukan');

    const qty = Number(data.quantity) || 0;
    const pricePerUnit = data.unitCost !== undefined ? Number(data.unitCost) : (data.purchasePrice !== undefined ? Number(data.purchasePrice) : item.purchasePrice);
    const prevStock = Number(item.currentStock) || 0;
    const newStock = prevStock + qty;

    item.currentStock = newStock;
    if (pricePerUnit > 0) {
      item.purchasePrice = pricePerUnit;
      // If item is raw material or has no BOM components, costPrice equals purchasePrice
      if (!item.components || item.components.length === 0) {
        item.costPrice = pricePerUnit;
        if (item.sellingPrice > 0) {
          item.profit = item.sellingPrice - item.costPrice;
          item.profitMargin = (item.profit / item.sellingPrice) * 100;
          item.marginPercent = item.profitMargin;
        }
      }
    }
    if (data.supplier) item.supplier = data.supplier;
    item.updatedAt = new Date().toISOString();

    const now = new Date().toISOString();
    const dateStr = data.date || now.split('T')[0];

    const movement: StockMovement = {
      id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemId,
      itemName: item.name,
      type: 'IN',
      quantity: qty,
      previousStock: prevStock,
      newStock,
      referenceType: 'RESTOCK',
      notes: data.notes || `Restock ${qty} ${item.baseUnit} dari ${data.supplier || item.supplier || 'Supplier'}`,
      date: dateStr,
      createdAt: now,
    };

    if (!Array.isArray(db.stock_movements)) db.stock_movements = [];
    db.stock_movements.unshift(movement);

    // Auto-record operational expense & financial transaction if requested
    if (data.recordExpense) {
      const totalCost = qty * pricePerUnit;
      if (totalCost > 0) {
        const expId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const expense: Expense = {
          id: expId,
          category: item.itemType === 'RAW_MATERIAL' ? 'Bahan Baku' : 'Pembelian Stok Barang',
          description: `Restock: ${item.name} (${qty} ${item.baseUnit})`,
          amount: totalCost,
          date: dateStr,
          paymentMethod: data.paymentMethod || 'CASH',
          reference: movement.id,
          notes: data.notes || '',
          createdAt: now,
        };
        if (!Array.isArray(db.expenses)) db.expenses = [];
        db.expenses.unshift(expense);

        const finTx: FinancialTransaction = {
          id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          date: dateStr,
          type: 'EXPENSE',
          category: expense.category,
          description: expense.description,
          amount: totalCost,
          referenceType: 'EXPENSE',
          referenceId: expId,
          referenceNumber: movement.id,
          paymentMethod: data.paymentMethod || 'CASH',
          notes: `Restock barang: ${item.name}`,
          createdAt: now,
        };
        if (!Array.isArray(db.financial_transactions)) db.financial_transactions = [];
        db.financial_transactions.unshift(finTx);
      }
    }

    setLocalData(db);
    return { item, movement };
  },

  async adjustStockItem(
    itemId: string,
    data: {
      newStock: number;
      type?: 'ADJUSTMENT' | 'OPNAME';
      notes?: string;
      date?: string;
    }
  ): Promise<{ item: StockItem; movement: StockMovement }> {
    const db = getLocalData();
    const item = (db.stock_items || []).find(i => i.id === itemId);
    if (!item) throw new Error('Barang tidak ditemukan');

    const prevStock = Number(item.currentStock) || 0;
    const newStock = Math.max(0, Number(data.newStock) || 0);
    const diff = Math.abs(newStock - prevStock);

    item.currentStock = newStock;
    item.updatedAt = new Date().toISOString();

    const now = new Date().toISOString();
    const movType = data.type || 'ADJUSTMENT';

    const movement: StockMovement = {
      id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemId,
      itemName: item.name,
      type: movType,
      quantity: diff,
      previousStock: prevStock,
      newStock,
      referenceType: movType === 'OPNAME' ? 'OPNAME' : 'ADJUSTMENT',
      notes: data.notes || `Penyesuaian stok (${movType}) dari ${prevStock} menjadi ${newStock}`,
      date: data.date || now.split('T')[0],
      createdAt: now,
    };

    if (!Array.isArray(db.stock_movements)) db.stock_movements = [];
    db.stock_movements.unshift(movement);

    setLocalData(db);
    return { item, movement };
  },

  // Auto Stock Deduction for POS/Orders (supports direct items and BOM components)
  async deductStockForTransaction(
    items: { productId?: string; itemId?: string; quantity: number }[],
    refType: StockRefType,
    refId: string,
    notes?: string
  ): Promise<void> {
    const db = getLocalData();
    if (!Array.isArray(db.stock_items) || db.stock_items.length === 0) return;
    if (!Array.isArray(db.stock_movements)) db.stock_movements = [];

    const now = new Date().toISOString();
    const today = now.split('T')[0];

    for (const line of items) {
      const targetId = line.itemId || line.productId;
      if (!targetId) continue;
      const qtySold = Number(line.quantity) || 0;
      if (qtySold <= 0) continue;

      const item = db.stock_items.find(i => i.id === targetId);
      if (!item) continue;

      // 1. If the item directly tracks stock
      if (item.trackStock) {
        const prev = Number(item.currentStock) || 0;
        const next = Math.max(0, prev - qtySold);
        item.currentStock = next;
        item.updatedAt = now;

        const sm: StockMovement = {
          id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          itemId: item.id,
          itemName: item.name,
          type: 'OUT',
          quantity: qtySold,
          previousStock: prev,
          newStock: next,
          referenceType: refType,
          referenceId: refId,
          notes: notes || `Penjualan ${refType} #${refId}`,
          date: today,
          createdAt: now,
        };
        db.stock_movements.unshift(sm);
      }

      // 2. If the item has BOM components (PRODUCED item / Cetak), deduct component stocks!
      if (Array.isArray(item.components) && item.components.length > 0) {
        for (const comp of item.components) {
          const compItemId = comp.itemId;
          if (!compItemId) continue;
          const compItem = db.stock_items.find(i => i.id === compItemId);
          if (!compItem || !compItem.trackStock) continue;

          const compQtyNeeded = (Number(comp.quantity) || 1) * qtySold;
          const compPrev = Number(compItem.currentStock) || 0;
          const compNext = Math.max(0, compPrev - compQtyNeeded);
          compItem.currentStock = compNext;
          compItem.updatedAt = now;

          const compSm: StockMovement = {
            id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemId: compItem.id,
            itemName: compItem.name,
            type: 'OUT',
            quantity: compQtyNeeded,
            previousStock: compPrev,
            newStock: compNext,
            referenceType: 'PRODUCTION',
            referenceId: refId,
            notes: `Pemakaian bahan untuk ${item.name} (${qtySold} ${item.baseUnit}) di ${refType} #${refId}`,
            date: today,
            createdAt: now,
          };
          db.stock_movements.unshift(compSm);
        }
      }
    }

    setLocalData(db);
  },

  // Transactions (POS)
  async getTransactions(): Promise<Transaction[]> {
    const db = getLocalData();
    return db.transactions;
  },

  async createTransaction(data: any): Promise<Transaction> {
    const db = getLocalData();
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const receiptNum = data.receiptNumber || `STR-${Date.now().toString().slice(-6)}`;

    // Check for currently active open shift
    const activeShift = Array.isArray(db.shifts) ? db.shifts.find(s => s.status === 'OPEN') : undefined;
    const shiftId = data.shiftId || (activeShift ? activeShift.id : undefined);

    const newTrx: Transaction = {
      id: `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      receiptNumber: receiptNum,
      type: 'POS',
      customerId: data.customerId,
      customerName: data.customerName || 'Pelanggan Umum',
      customerPhone: data.customerPhone || '',
      date: dateStr,
      items: data.items || [],
      subtotal: data.subtotal || 0,
      discount: data.discount || 0,
      totalAmount: data.totalAmount || 0,
      totalCost: data.totalCost || 0,
      profit: (data.totalAmount || 0) - (data.totalCost || 0),
      paidAmount: data.paidAmount || data.totalAmount || 0,
      changeAmount: data.changeAmount || 0,
      paymentMethod: data.paymentMethod || 'CASH',
      cashierName: data.cashierName || (activeShift ? activeShift.cashierName : 'Owner'),
      shiftId: shiftId,
      notes: data.notes || '',
      status: 'COMPLETED',
      createdAt: data.createdAt || nowIso,
      updatedAt: data.updatedAt || nowIso,
    };

    db.transactions.unshift(newTrx);

    // Auto deduct material stock based on items
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        const prod = db.products.find(p => p.id === item.productId);
        if (prod) {
          if (prod.trackStock) {
            prod.currentStock = Math.max(0, (Number(prod.currentStock) || 0) - (Number(item.quantity) || 1));
          }
          if (Array.isArray(prod.components)) {
            for (const comp of prod.components) {
              if (comp.materialId) {
                const mat = db.materials.find(m => m.id === comp.materialId);
                if (mat) {
                  const qtyUsed = comp.quantity * item.quantity;
                  const prev = mat.currentStock;
                  mat.currentStock = Math.max(0, mat.currentStock - qtyUsed);
                  db.inventory_movements.unshift({
                    id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                    materialId: mat.id,
                    materialName: mat.name,
                    type: 'OUT',
                    quantity: qtyUsed,
                    previousStock: prev,
                    newStock: mat.currentStock,
                    referenceType: 'POS',
                    referenceId: receiptNum,
                    notes: `Digunakan untuk ${prod.name} × ${item.quantity} (POS #${receiptNum})`,
                    date: dateStr,
                    createdAt: dateStr,
                  });
                }
              }
            }
          }
        }
      }
    }

    // Auto create Financial Cashflow entry
    const finEntry: FinancialTransaction = {
      id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: dateStr,
      type: 'INCOME',
      category: 'Penjualan Kasir',
      description: `Transaksi Kasir #${receiptNum} - ${newTrx.customerName}`,
      amount: newTrx.totalAmount,
      referenceNumber: receiptNum,
      referenceType: 'POS',
      referenceId: newTrx.id,
      paymentMethod: newTrx.paymentMethod,
      notes: `Item: ${newTrx.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}`,
      createdAt: dateStr,
    };
    db.financial_transactions.unshift(finEntry);

    setLocalData(db);
    return newTrx;
  },

  async refundTransaction(id: string, reason?: string, refundedBy?: string): Promise<{ success: boolean; message: string; transaction: Transaction }> {
    const db = getLocalData();
    const trx = db.transactions.find(t => t.id === id);
    if (!trx) throw new Error('Transaksi tidak ditemukan');
    if (trx.status === 'REFUNDED' || trx.status === 'CANCELLED') {
      throw new Error('Transaksi ini sudah dibatalkan sebelumnya.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const refundReason = reason?.trim() || 'Pembatalan transaksi kasir';
    const cashier = refundedBy || 'Owner';

    // 1. Update transaction
    trx.status = 'REFUNDED';
    trx.refundedAt = nowIso;
    trx.refundReason = refundReason;
    trx.refundedBy = cashier;
    trx.updatedAt = todayStr;

    // 2. Return product stock & raw materials
    if (Array.isArray(trx.items)) {
      for (const item of trx.items) {
        const qty = Number(item.quantity) || 1;
        const prod = db.products.find(p => p.id === item.productId);
        if (prod) {
          if (prod.trackStock) {
            prod.currentStock = (Number(prod.currentStock) || 0) + qty;
          }
          if (Array.isArray(prod.components) && prod.components.length > 0) {
            for (const comp of prod.components) {
              if (comp.materialId) {
                const mat = db.materials.find(m => m.id === comp.materialId);
                if (mat) {
                  const returnQty = (Number(comp.quantity) || 1) * qty;
                  const prev = mat.currentStock;
                  mat.currentStock = prev + returnQty;
                  db.inventory_movements.unshift({
                    id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                    materialId: mat.id,
                    materialName: mat.name,
                    type: 'IN',
                    quantity: returnQty,
                    previousStock: prev,
                    newStock: mat.currentStock,
                    referenceType: 'POS_REFUND',
                    referenceId: trx.receiptNumber,
                    notes: `Pengembalian stok dari refund #${trx.receiptNumber} (${prod.name} × ${qty})`,
                    date: todayStr,
                    createdAt: todayStr,
                  });
                }
              }
            }
          }
        }
      }
    }

    // 3. Insert Reversal Entry in financial_transactions
    const refundAmount = Number(trx.totalAmount) || 0;
    if (refundAmount > 0) {
      db.financial_transactions.unshift({
        id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: todayStr,
        type: 'EXPENSE',
        category: 'Refund Penjualan',
        description: `Refund Transaksi Kasir #${trx.receiptNumber} - ${trx.customerName}`,
        amount: refundAmount,
        referenceNumber: trx.receiptNumber,
        referenceType: 'POS_REFUND' as any,
        referenceId: trx.id,
        paymentMethod: trx.paymentMethod,
        notes: `Alasan: ${refundReason}`,
        createdAt: todayStr,
      });
    }

    // 4. Update Customer stats
    if (trx.customerId) {
      const cust = db.customers.find(c => c.id === trx.customerId);
      if (cust) {
        cust.totalOrders = Math.max(0, (cust.totalOrders || 0) - 1);
        cust.totalSpent = Math.max(0, (cust.totalSpent || 0) - refundAmount);
      }
    }

    setLocalData(db);

    return {
      success: true,
      message: `Transaksi #${trx.receiptNumber} berhasil dibatalkan dan seluruh stok serta laporan dikembalikan.`,
      transaction: { ...trx },
    };
  },

  async deleteTransaction(id: string): Promise<void> {
    const db = getLocalData();
    db.transactions = db.transactions.filter(t => t.id !== id);
    db.financial_transactions = db.financial_transactions.filter(f => f.referenceId !== id);
    setLocalData(db);
  },

  async clearAllTransactions(options: { resetExpenses?: boolean; resetMovements?: boolean } = {}): Promise<{
    success: boolean;
    message: string;
    deletedCounts: {
      transactions: number;
      orders: number;
      expenses: number;
      financialTransactions: number;
    };
  }> {
    const db = getLocalData();
    const trxCount = db.transactions.length;
    const ordCount = db.orders.length;
    const expCount = options.resetExpenses !== false ? db.expenses.length : 0;
    const finCount = db.financial_transactions.length;

    db.transactions = [];
    db.orders = [];
    db.products = [];
    db.materials = [];
    db.financial_transactions = [];
    db.inventory_movements = [];
    if (options.resetExpenses !== false) db.expenses = [];

    // Reset customer transaction statistics
    if (Array.isArray(db.customers)) {
      db.customers.forEach(c => {
        c.totalOrders = 0;
        c.totalSpent = 0;
        c.lastTransactionDate = undefined;
      });
    }

    if (db.settings) {
      db.settings.historyClearedAt = new Date().toISOString();
    }

    setLocalData(db);
    return {
      success: true,
      message: 'Semua riwayat transaksi, pesanan, produk, dan bahan baku berhasil dihapus.',
      deletedCounts: {
        transactions: trxCount,
        orders: ordCount,
        expenses: expCount,
        financialTransactions: finCount,
      },
    };
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const db = getLocalData();
    return db.orders;
  },

  async getOrder(id: string): Promise<Order> {
    const db = getLocalData();
    const order = db.orders.find(o => o.id === id);
    if (!order) throw new Error('Pesanan tidak ditemukan');
    return order;
  },

  async createOrder(data: any): Promise<Order> {
    const db = getLocalData();
    const dateStr = data.orderDate || new Date().toISOString().split('T')[0];
    const orderNum = data.orderNumber || `ORD-${Date.now().toString().slice(-6)}`;

    const totalAmt = data.totalAmount || 0;
    const paidAmt = data.paidAmount || (data.dpAmount || 0);
    const remainAmt = Math.max(0, totalAmt - paidAmt);

    let payStatus: 'BELUM_BAYAR' | 'DP' | 'LUNAS' = 'BELUM_BAYAR';
    if (paidAmt >= totalAmt && totalAmt > 0) {
      payStatus = 'LUNAS';
    } else if (paidAmt > 0) {
      payStatus = 'DP';
    }

    const payments: any[] = [];
    if (paidAmt > 0) {
      payments.push({
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        orderId: '',
        amount: paidAmt,
        paymentMethod: data.paymentMethod || 'CASH',
        date: dateStr,
        notes: payStatus === 'DP' ? 'Uang Muka (DP)' : 'Pelunasan Pesanan',
        createdAt: dateStr,
      });
    }

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderNumber: orderNum,
      customerId: data.customerId,
      customerName: data.customerName || 'Pelanggan SPK',
      customerPhone: data.customerPhone || '',
      orderDate: dateStr,
      deadlineDate: data.deadlineDate || dateStr,
      status: 'BARU',
      paymentStatus: payStatus,
      subtotal: data.subtotal || totalAmt,
      discount: data.discount || 0,
      totalAmount: totalAmt,
      totalCost: data.totalCost || 0,
      paidAmount: paidAmt,
      remainingAmount: remainAmt,
      notes: data.notes || '',
      items: data.items || [],
      payments,
      files: data.files || [],
      createdAt: dateStr,
      updatedAt: dateStr,
    };

    newOrder.payments?.forEach(p => (p.orderId = newOrder.id));
    db.orders.unshift(newOrder);

    // If DP/Payment made, add financial transaction
    if (paidAmt > 0) {
      db.financial_transactions.unshift({
        id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: dateStr,
        type: 'INCOME',
        category: payStatus === 'DP' ? 'DP Pesanan' : 'Pelunasan Pesanan',
        description: `Pembayaran Pesanan #${orderNum} - ${newOrder.customerName}`,
        amount: paidAmt,
        referenceType: 'ORDER',
        referenceId: newOrder.id,
        paymentMethod: data.paymentMethod || 'CASH',
        notes: `Uang Muka / Pembayaran awal SPK #${orderNum}`,
        createdAt: dateStr,
      });
    }

    setLocalData(db);
    return newOrder;
  },

  async updateOrderStatus(id: string, status: string, reason?: string): Promise<Order> {
    const db = getLocalData();
    const order = db.orders.find(o => o.id === id);
    if (!order) throw new Error('Pesanan tidak ditemukan');

    const normalizedNew = status.toUpperCase().trim();
    const normalizedPrev = (order.status || '').toUpperCase().trim();

    if (normalizedNew === normalizedPrev) {
      return order;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // CASE 1: Transitioning TO 'BATAL' / 'DIBATALKAN' from an active status
    if (
      (normalizedNew === 'BATAL' || normalizedNew === 'DIBATALKAN') &&
      (normalizedPrev !== 'BATAL' && normalizedPrev !== 'DIBATALKAN')
    ) {
      const paidAmount = Number(order.paidAmount) || 0;

      // 1. Cash Reversal: If any payment (DP/Lunas) was made, create EXPENSE entry
      if (paidAmount > 0) {
        db.financial_transactions.unshift({
          id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          date: todayStr,
          type: 'EXPENSE',
          category: 'Refund Pembatalan Pesanan',
          description: `Refund Pembatalan Pesanan #${order.orderNumber} - ${order.customerName}`,
          amount: paidAmount,
          referenceNumber: order.orderNumber,
          referenceType: 'ORDER_REFUND' as any,
          referenceId: order.id,
          paymentMethod: order.payments?.[0]?.paymentMethod || 'CASH',
          notes: `Alasan: ${reason || 'Pembatalan pesanan'} (Pengembalian pembayaran Rp${paidAmount.toLocaleString('id-ID')})`,
          createdAt: todayStr,
        });
      }

      // 2. Product Stock & BOM Reversal
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const qty = Number(item.quantity) || 1;
          if (item.productId) {
            const prod = db.products.find(p => p.id === item.productId);
            if (prod) {
              if (prod.trackStock) {
                prod.currentStock = (Number(prod.currentStock) || 0) + qty;
              }
              if (Array.isArray(prod.components) && prod.components.length > 0) {
                for (const comp of prod.components) {
                  if (comp.materialId) {
                    const mat = db.materials.find(m => m.id === comp.materialId);
                    if (mat) {
                      const returnQty = (Number(comp.quantity) || 1) * qty;
                      const prevStock = mat.currentStock;
                      mat.currentStock = prevStock + returnQty;

                      db.inventory_movements.unshift({
                        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                        materialId: mat.id,
                        materialName: mat.name,
                        type: 'IN',
                        quantity: returnQty,
                        previousStock: prevStock,
                        newStock: mat.currentStock,
                        referenceType: 'ORDER_REFUND',
                        referenceId: order.orderNumber,
                        notes: `Pengembalian bahan dari pembatalan pesanan #${order.orderNumber} (${prod.name} × ${qty})`,
                        date: todayStr,
                        createdAt: todayStr,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      // 3. Customer Stats Reversal
      if (order.customerId) {
        const cust = db.customers.find(c => c.id === order.customerId);
        if (cust) {
          cust.totalOrders = Math.max(0, (cust.totalOrders || 0) - 1);
          cust.totalSpent = Math.max(0, (cust.totalSpent || 0) - (order.totalAmount || 0));
        }
      }
    }

    // CASE 2: Reactivation from BATAL / DIBATALKAN to active status
    else if (
      (normalizedPrev === 'BATAL' || normalizedPrev === 'DIBATALKAN') &&
      (normalizedNew !== 'BATAL' && normalizedNew !== 'DIBATALKAN')
    ) {
      const paidAmount = Number(order.paidAmount) || 0;

      // Re-deduct product stock and materials
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const qty = Number(item.quantity) || 1;
          if (item.productId) {
            const prod = db.products.find(p => p.id === item.productId);
            if (prod) {
              if (prod.trackStock) {
                prod.currentStock = Math.max(0, (Number(prod.currentStock) || 0) - qty);
              }
              if (Array.isArray(prod.components) && prod.components.length > 0) {
                for (const comp of prod.components) {
                  if (comp.materialId) {
                    const mat = db.materials.find(m => m.id === comp.materialId);
                    if (mat) {
                      const deductQty = (Number(comp.quantity) || 1) * qty;
                      const prevStock = mat.currentStock;
                      mat.currentStock = Math.max(0, prevStock - deductQty);

                      db.inventory_movements.unshift({
                        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                        materialId: mat.id,
                        materialName: mat.name,
                        type: 'OUT',
                        quantity: deductQty,
                        previousStock: prevStock,
                        newStock: mat.currentStock,
                        referenceType: 'ORDER',
                        referenceId: order.orderNumber,
                        notes: `Reaktivasi pesanan #${order.orderNumber} (${prod.name} × ${qty})`,
                        date: todayStr,
                        createdAt: todayStr,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Re-insert income entry if paidAmount > 0
      if (paidAmount > 0) {
        db.financial_transactions.unshift({
          id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          date: todayStr,
          type: 'INCOME',
          category: order.paymentStatus === 'LUNAS' ? 'Pelunasan Pesanan' : 'DP Pesanan',
          description: `Reaktivasi Pesanan #${order.orderNumber} - ${order.customerName}`,
          amount: paidAmount,
          referenceNumber: order.orderNumber,
          referenceType: 'ORDER' as any,
          referenceId: order.id,
          paymentMethod: order.payments?.[0]?.paymentMethod || 'CASH',
          notes: `Reaktivasi pesanan dari status batal`,
          createdAt: todayStr,
        });
      }

      // Re-add Customer stats
      if (order.customerId) {
        const cust = db.customers.find(c => c.id === order.customerId);
        if (cust) {
          cust.totalOrders = (cust.totalOrders || 0) + 1;
          cust.totalSpent = (cust.totalSpent || 0) + (order.totalAmount || 0);
        }
      }
    }

    order.status = normalizedNew as any;
    order.updatedAt = todayStr;
    setLocalData(db);
    return order;
  },

  async addOrderPayment(
    id: string,
    data: { amount: number; paymentMethod: string; date?: string; notes?: string }
  ): Promise<Order> {
    const db = getLocalData();
    const order = db.orders.find(o => o.id === id);
    if (!order) throw new Error('Pesanan tidak ditemukan');

    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const newPay = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      orderId: id,
      amount: data.amount,
      paymentMethod: (data.paymentMethod as any) || 'CASH',
      date: dateStr,
      notes: data.notes || 'Pembayaran cicilan / pelunasan',
      createdAt: dateStr,
    };

    if (!order.payments) order.payments = [];
    order.payments.push(newPay);

    const totalPaid = order.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    order.paidAmount = totalPaid;
    order.remainingAmount = Math.max(0, order.totalAmount - totalPaid);
    if (totalPaid >= order.totalAmount) {
      order.paymentStatus = 'LUNAS';
    } else if (totalPaid > 0) {
      order.paymentStatus = 'DP';
    }
    order.updatedAt = dateStr;

    db.financial_transactions.unshift({
      id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: dateStr,
      type: 'INCOME',
      category: order.paymentStatus === 'LUNAS' ? 'Pelunasan Pesanan' : 'DP Pesanan',
      description: `Pembayaran Pesanan #${order.orderNumber} - ${order.customerName}`,
      amount: data.amount,
      referenceType: 'ORDER',
      referenceId: order.id,
      paymentMethod: data.paymentMethod as any,
      notes: data.notes,
      createdAt: dateStr,
    });

    setLocalData(db);
    return order;
  },

  async updateOrderPayment(
    orderId: string,
    paymentId: string,
    data: { amount?: number; paymentMethod?: string; date?: string; notes?: string }
  ): Promise<Order> {
    const db = getLocalData();
    const order = db.orders.find(o => o.id === orderId);
    if (!order || !order.payments) throw new Error('Pesanan tidak ditemukan');

    const pay = order.payments.find(p => p.id === paymentId);
    if (!pay) throw new Error('Pembayaran tidak ditemukan');

    Object.assign(pay, data);
    const totalPaid = order.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    order.paidAmount = totalPaid;
    order.remainingAmount = Math.max(0, order.totalAmount - totalPaid);
    order.paymentStatus = totalPaid >= order.totalAmount ? 'LUNAS' : totalPaid > 0 ? 'DP' : 'BELUM_BAYAR';

    setLocalData(db);
    return order;
  },

  async deleteOrderPayment(orderId: string, paymentId: string): Promise<Order> {
    const db = getLocalData();
    const order = db.orders.find(o => o.id === orderId);
    if (!order || !order.payments) throw new Error('Pesanan tidak ditemukan');

    order.payments = order.payments.filter(p => p.id !== paymentId);
    const totalPaid = order.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    order.paidAmount = totalPaid;
    order.remainingAmount = Math.max(0, order.totalAmount - totalPaid);
    order.paymentStatus = totalPaid >= order.totalAmount ? 'LUNAS' : totalPaid > 0 ? 'DP' : 'BELUM_BAYAR';

    setLocalData(db);
    return order;
  },

  async uploadOrderFile(orderId: string, file: File, notes?: string): Promise<any> {
    const dataUrl = await fileToDataUrl(file);
    const db = getLocalData();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan');

    const newFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      orderId,
      originalName: file.name,
      storedName: file.name,
      mimeType: file.type,
      size: file.size,
      url: dataUrl,
      notes: notes || '',
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (!order.files) order.files = [];
    order.files.push(newFile);
    setLocalData(db);
    return newFile;
  },

  async deleteOrderFile(orderId: string, fileId: string): Promise<void> {
    const db = getLocalData();
    const order = db.orders.find(o => o.id === orderId);
    if (!order || !order.files) return;
    order.files = order.files.filter(f => f.id !== fileId);
    setLocalData(db);
  },

  async deleteOrder(id: string): Promise<void> {
    const db = getLocalData();
    db.orders = db.orders.filter(o => o.id !== id);
    db.financial_transactions = db.financial_transactions.filter(f => f.referenceId !== id);
    setLocalData(db);
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    const db = getLocalData();
    return db.expenses;
  },

  async createExpense(data: Partial<Expense>): Promise<Expense> {
    const db = getLocalData();
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const newExp: Expense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: data.category || 'Operasional',
      description: data.description || 'Pengeluaran',
      amount: data.amount || 0,
      date: dateStr,
      paymentMethod: data.paymentMethod || 'CASH',
      reference: data.reference || '',
      notes: data.notes || '',
      receiptUrl: data.receiptUrl,
      createdAt: dateStr,
    };
    db.expenses.unshift(newExp);

    db.financial_transactions.unshift({
      id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: dateStr,
      type: 'EXPENSE',
      category: newExp.category,
      description: newExp.description,
      amount: newExp.amount,
      referenceType: 'EXPENSE',
      referenceId: newExp.id,
      paymentMethod: newExp.paymentMethod,
      notes: newExp.notes,
      createdAt: dateStr,
    });

    setLocalData(db);
    return newExp;
  },

  async deleteExpense(id: string): Promise<void> {
    const db = getLocalData();
    db.expenses = db.expenses.filter(e => e.id !== id);
    db.financial_transactions = db.financial_transactions.filter(f => f.referenceId !== id);
    setLocalData(db);
  },

  // Finance / Cashflow
  async getFinance(): Promise<FinancialTransaction[]> {
    const db = getLocalData();
    return db.financial_transactions;
  },

  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    return this.getFinance();
  },

  async createFinanceEntry(data: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    const db = getLocalData();
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const newFin: FinancialTransaction = {
      id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: dateStr,
      type: data.type || 'INCOME',
      category: data.category || 'Lain-lain',
      description: data.description || 'Mutasi Kas',
      amount: data.amount || 0,
      referenceType: data.referenceType as any,
      referenceId: data.referenceId,
      paymentMethod: data.paymentMethod || 'CASH',
      notes: data.notes || '',
      createdAt: dateStr,
    };
    db.financial_transactions.unshift(newFin);
    setLocalData(db);
    return newFin;
  },

  async createFinancialTransaction(data: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    return this.createFinanceEntry(data);
  },

  // Global Search
  async search(query: string): Promise<{
    customers: Customer[];
    products: Product[];
    orders: Order[];
    transactions: Transaction[];
  }> {
    const db = getLocalData();
    const q = query.toLowerCase().trim();
    if (!q) return { customers: [], products: [], orders: [], transactions: [] };

    return {
      customers: db.customers.filter(c => c.name.toLowerCase().includes(q) || (c.whatsapp && c.whatsapp.includes(q))),
      products: db.products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
      orders: db.orders.filter(o => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)),
      transactions: db.transactions.filter(t => t.receiptNumber.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q)),
    };
  },

  // Restock Material
  async restockMaterial(
    id: string,
    data: {
      quantity: number;
      unitPrice?: number;
      paymentMethod?: string;
      supplier?: string;
      recordExpense?: boolean;
      notes?: string;
    }
  ): Promise<{ success: boolean; material: Material; movement: InventoryMovement }> {
    const db = getLocalData();
    const mat = db.materials.find(m => m.id === id);
    if (!mat) throw new Error('Material tidak ditemukan');

    const dateStr = new Date().toISOString().split('T')[0];
    const prev = mat.currentStock;
    mat.currentStock += data.quantity;
    if (data.unitPrice && data.unitPrice > 0) {
      mat.unitCost = data.unitPrice;
      mat.purchasePrice = data.unitPrice;
    }
    if (data.supplier) {
      mat.supplier = data.supplier;
    }
    mat.updatedAt = dateStr;

    const mov: InventoryMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      materialId: mat.id,
      materialName: mat.name,
      type: 'IN',
      quantity: data.quantity,
      previousStock: prev,
      newStock: mat.currentStock,
      referenceType: 'RESTOCK',
      notes: data.notes || `Restock ${data.quantity} ${mat.unit}`,
      date: dateStr,
      createdAt: dateStr,
    };
    db.inventory_movements.unshift(mov);

    if (data.recordExpense && data.unitPrice) {
      const totalCost = data.quantity * data.unitPrice;
      const exp: Expense = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        category: 'Bahan Baku',
        description: `Restock ${mat.name} (${data.quantity} ${mat.unit})`,
        amount: totalCost,
        date: dateStr,
        paymentMethod: (data.paymentMethod as any) || 'CASH',
        notes: data.notes || '',
        createdAt: dateStr,
      };
      db.expenses.unshift(exp);

      db.financial_transactions.unshift({
        id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: dateStr,
        type: 'EXPENSE',
        category: 'Bahan Baku',
        description: `Restock ${mat.name} (${data.quantity} ${mat.unit})`,
        amount: totalCost,
        referenceType: 'EXPENSE',
        referenceId: exp.id,
        paymentMethod: (data.paymentMethod as any) || 'CASH',
        notes: data.notes,
        createdAt: dateStr,
      });
    }

    setLocalData(db);
    return { success: true, material: mat, movement: mov };
  },

  // Raw Data Access for Sync
  getRawData(): LocalDatabaseSchema {
    return getLocalData();
  },

  mergeCustomers(remoteList: Customer[]): void {
    const db = getLocalData();
    const map = new Map<string, Customer>();
    db.customers.forEach(c => map.set(c.id, c));
    remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    db.customers = Array.from(map.values());
    setLocalData(db);
  },

  mergeMaterials(remoteList: Material[]): void {
    const db = getLocalData();
    const map = new Map<string, Material>();
    db.materials.forEach(m => map.set(m.id, m));
    remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    db.materials = Array.from(map.values());
    setLocalData(db);
  },

  mergeProducts(remoteList: Product[]): void {
    const db = getLocalData();
    const map = new Map<string, Product>();
    db.products.forEach(p => map.set(p.id, p));
    remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    db.products = Array.from(map.values());
    setLocalData(db);
  },

  mergeOrders(remoteList: Order[]): void {
    const db = getLocalData();
    const map = new Map<string, Order>();
    db.orders.forEach(o => map.set(o.id, o));
    remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    db.orders = Array.from(map.values());
    setLocalData(db);
  },

  mergeTransactions(remoteList: Transaction[]): void {
    const db = getLocalData();
    const map = new Map<string, Transaction>();
    db.transactions.forEach(t => map.set(t.id, t));
    remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    db.transactions = Array.from(map.values());
    setLocalData(db);
  },

  mergeExpenses(remoteList: Expense[]): void {
    const db = getLocalData();
    const map = new Map<string, Expense>();
    db.expenses.forEach(e => map.set(e.id, e));
    remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    db.expenses = Array.from(map.values());
    setLocalData(db);
  },

  mergeFinancialTransactions(remoteList: FinancialTransaction[]): void {
    const db = getLocalData();
    const map = new Map<string, FinancialTransaction>();
    db.financial_transactions.forEach(f => map.set(f.id, f));
    remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    db.financial_transactions = Array.from(map.values());
    setLocalData(db);
  },

  mergeShifts(remoteList: CashierShift[]): void {
    const db = getLocalData();
    if (!Array.isArray(db.shifts)) db.shifts = [];
    const map = new Map<string, CashierShift>();
    db.shifts.forEach(s => map.set(s.id, s));
    remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    db.shifts = Array.from(map.values());
    setLocalData(db);
  },

  // ── Cashier Shift Management ──
  async getCurrentShift(): Promise<CashierShift | null> {
    const db = getLocalData();
    if (!Array.isArray(db.shifts)) return null;
    return db.shifts.find(s => s.status === 'OPEN') || null;
  },

  async startShift(cashierName = 'Kasir', userId?: string, businessId?: string): Promise<CashierShift> {
    const db = getLocalData();
    if (!Array.isArray(db.shifts)) db.shifts = [];

    // If an open shift already exists, return it
    const existingOpen = db.shifts.find(s => s.status === 'OPEN');
    if (existingOpen) {
      return existingOpen;
    }

    const nowIso = new Date().toISOString();
    const newShift: CashierShift = {
      id: `shift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      userId,
      cashierName: cashierName.trim() || 'Kasir',
      startedAt: nowIso,
      status: 'OPEN',
      totalTransactions: 0,
      totalAmount: 0,
      cashAmount: 0,
      transferAmount: 0,
      qrisAmount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.shifts.unshift(newShift);
    setLocalData(db);
    return newShift;
  },

  async stopShift(shiftId: string, notes?: string): Promise<ShiftSummary> {
    const db = getLocalData();
    if (!Array.isArray(db.shifts)) db.shifts = [];

    const shift = db.shifts.find(s => s.id === shiftId);
    if (!shift) {
      throw new Error('Shift tidak ditemukan');
    }

    const nowIso = new Date().toISOString();
    const startTime = new Date(shift.startedAt).getTime();
    const endTime = new Date(nowIso).getTime();

    // Find all valid transactions that occurred during this shift
    const shiftTransactions = db.transactions.filter(t => {
      if (t.status === 'REFUNDED' || t.status === 'CANCELLED') return false;
      if (t.shiftId === shift.id) return true;
      const tTime = new Date(t.createdAt || t.date).getTime();
      return tTime >= startTime && tTime <= endTime;
    });

    let totalAmount = 0;
    let cashAmount = 0;
    let transferAmount = 0;
    let qrisAmount = 0;

    shiftTransactions.forEach(t => {
      const amt = Number(t.totalAmount) || 0;
      totalAmount += amt;
      const pm = (t.paymentMethod || 'CASH').toUpperCase();
      if (pm === 'CASH' || pm === 'TUNAI') cashAmount += amt;
      else if (pm === 'TRANSFER' || pm === 'BANK') transferAmount += amt;
      else if (pm === 'QRIS') qrisAmount += amt;
      else cashAmount += amt;

      // Link transaction directly to this shift
      t.shiftId = shift.id;
    });

    shift.endedAt = nowIso;
    shift.status = 'CLOSED';
    shift.totalTransactions = shiftTransactions.length;
    shift.totalAmount = totalAmount;
    shift.cashAmount = cashAmount;
    shift.transferAmount = transferAmount;
    shift.qrisAmount = qrisAmount;
    if (notes !== undefined) shift.notes = notes;
    shift.updatedAt = nowIso;

    setLocalData(db);

    return {
      shift,
      transactions: shiftTransactions,
      totalTransactions: shiftTransactions.length,
      totalAmount,
      cashAmount,
      transferAmount,
      qrisAmount,
    };
  },

  async getShifts(): Promise<CashierShift[]> {
    const db = getLocalData();
    if (!Array.isArray(db.shifts)) return [];
    return [...db.shifts].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  },

  async getShiftSummary(shiftId: string): Promise<ShiftSummary> {
    const db = getLocalData();
    if (!Array.isArray(db.shifts)) db.shifts = [];

    const shift = db.shifts.find(s => s.id === shiftId);
    if (!shift) throw new Error('Shift tidak ditemukan');

    const startTime = new Date(shift.startedAt).getTime();
    const endTime = shift.endedAt ? new Date(shift.endedAt).getTime() : Date.now();

    const shiftTransactions = db.transactions.filter(t => {
      if (t.status === 'REFUNDED' || t.status === 'CANCELLED') return false;
      if (t.shiftId === shift.id) return true;
      const tTime = new Date(t.createdAt || t.date).getTime();
      return tTime >= startTime && tTime <= endTime;
    });

    let totalAmount = 0;
    let cashAmount = 0;
    let transferAmount = 0;
    let qrisAmount = 0;

    shiftTransactions.forEach(t => {
      const amt = Number(t.totalAmount) || 0;
      totalAmount += amt;
      const pm = (t.paymentMethod || 'CASH').toUpperCase();
      if (pm === 'CASH' || pm === 'TUNAI') cashAmount += amt;
      else if (pm === 'TRANSFER' || pm === 'BANK') transferAmount += amt;
      else if (pm === 'QRIS') qrisAmount += amt;
      else cashAmount += amt;
    });

    return {
      shift,
      transactions: shiftTransactions,
      totalTransactions: shiftTransactions.length,
      totalAmount,
      cashAmount,
      transferAmount,
      qrisAmount,
    };
  },

  mergeStockItems(remoteList: StockItem[]): void {
    const db = getLocalData();
    const map = new Map<string, StockItem>();
    (db.stock_items || []).forEach(s => map.set(s.id, s));
    remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    db.stock_items = Array.from(map.values());
    setLocalData(db);
  },

  mergeStockMovements(remoteList: StockMovement[]): void {
    const db = getLocalData();
    const map = new Map<string, StockMovement>();
    (db.stock_movements || []).forEach(m => map.set(m.id, m));
    remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    db.stock_movements = Array.from(map.values());
    setLocalData(db);
  },

  // ── Realtime Single-Record Event Handlers (High Performance) ──
  applyRemoteUpsert(tableName: string, record: any): boolean {
    const db = getLocalData();
    let updated = false;

    if (tableName === 'cashier_shifts' || tableName === 'shifts') {
      if (!Array.isArray(db.shifts)) db.shifts = [];
      const idx = db.shifts.findIndex(s => s.id === record.id);
      if (idx >= 0) {
        db.shifts[idx] = { ...db.shifts[idx], ...record };
      } else {
        db.shifts.unshift(record);
      }
      updated = true;
    } else if (tableName === 'stock_items') {
      if (!Array.isArray(db.stock_items)) db.stock_items = [];
      const idx = db.stock_items.findIndex(s => s.id === record.id);
      if (idx >= 0) {
        db.stock_items[idx] = { ...db.stock_items[idx], ...record };
      } else {
        db.stock_items.unshift(record);
      }
      updated = true;
    } else if (tableName === 'stock_movements') {
      if (!Array.isArray(db.stock_movements)) db.stock_movements = [];
      const idx = db.stock_movements.findIndex(m => m.id === record.id);
      if (idx >= 0) {
        db.stock_movements[idx] = { ...db.stock_movements[idx], ...record };
      } else {
        db.stock_movements.unshift(record);
      }
      updated = true;
    } else if (tableName === 'products') {
      const idx = db.products.findIndex(p => p.id === record.id);
      if (idx >= 0) {
        db.products[idx] = { ...db.products[idx], ...record };
      } else {
        db.products.unshift(record);
      }
      updated = true;
    } else if (tableName === 'customers') {
      const idx = db.customers.findIndex(c => c.id === record.id);
      if (idx >= 0) {
        db.customers[idx] = { ...db.customers[idx], ...record };
      } else {
        db.customers.unshift(record);
      }
      updated = true;
    } else if (tableName === 'materials') {
      const idx = db.materials.findIndex(m => m.id === record.id);
      if (idx >= 0) {
        db.materials[idx] = { ...db.materials[idx], ...record };
      } else {
        db.materials.unshift(record);
      }
      updated = true;
    } else if (tableName === 'orders') {
      const idx = db.orders.findIndex(o => o.id === record.id);
      if (idx >= 0) {
        db.orders[idx] = { ...db.orders[idx], ...record };
      } else {
        db.orders.unshift(record);
      }
      updated = true;
    } else if (tableName === 'transactions') {
      const idx = db.transactions.findIndex(t => t.id === record.id);
      if (idx >= 0) {
        db.transactions[idx] = { ...db.transactions[idx], ...record };
      } else {
        db.transactions.unshift(record);
      }
      updated = true;
    } else if (tableName === 'expenses') {
      const idx = db.expenses.findIndex(e => e.id === record.id);
      if (idx >= 0) {
        db.expenses[idx] = { ...db.expenses[idx], ...record };
      } else {
        db.expenses.unshift(record);
      }
      updated = true;
    } else if (tableName === 'financial_transactions') {
      const idx = db.financial_transactions.findIndex(f => f.id === record.id);
      if (idx >= 0) {
        db.financial_transactions[idx] = { ...db.financial_transactions[idx], ...record };
      } else {
        db.financial_transactions.unshift(record);
      }
      updated = true;
    } else if (tableName === 'business_settings') {
      db.settings = { ...db.settings, ...record };
      updated = true;
    }

    if (updated) {
      setLocalData(db);
    }
    return updated;
  },

  applyRemoteDelete(tableName: string, recordId: string): boolean {
    const db = getLocalData();
    let updated = false;

    if (tableName === 'cashier_shifts' || tableName === 'shifts') {
      if (Array.isArray(db.shifts)) {
        const lenBefore = db.shifts.length;
        db.shifts = db.shifts.filter(s => s.id !== recordId);
        updated = db.shifts.length !== lenBefore;
      }
    } else if (tableName === 'stock_items') {
      if (Array.isArray(db.stock_items)) {
        const lenBefore = db.stock_items.length;
        db.stock_items = db.stock_items.filter(s => s.id !== recordId);
        updated = db.stock_items.length !== lenBefore;
      }
    } else if (tableName === 'stock_movements') {
      if (Array.isArray(db.stock_movements)) {
        const lenBefore = db.stock_movements.length;
        db.stock_movements = db.stock_movements.filter(m => m.id !== recordId);
        updated = db.stock_movements.length !== lenBefore;
      }
    } else if (tableName === 'products') {
      const lenBefore = db.products.length;
      db.products = db.products.filter(p => p.id !== recordId);
      updated = db.products.length !== lenBefore;
    } else if (tableName === 'customers') {
      const lenBefore = db.customers.length;
      db.customers = db.customers.filter(c => c.id !== recordId);
      updated = db.customers.length !== lenBefore;
    } else if (tableName === 'materials') {
      const lenBefore = db.materials.length;
      db.materials = db.materials.filter(m => m.id !== recordId);
      updated = db.materials.length !== lenBefore;
    } else if (tableName === 'orders') {
      const lenBefore = db.orders.length;
      db.orders = db.orders.filter(o => o.id !== recordId);
      updated = db.orders.length !== lenBefore;
    } else if (tableName === 'transactions') {
      const lenBefore = db.transactions.length;
      db.transactions = db.transactions.filter(t => t.id !== recordId);
      updated = db.transactions.length !== lenBefore;
    } else if (tableName === 'expenses') {
      const lenBefore = db.expenses.length;
      db.expenses = db.expenses.filter(e => e.id !== recordId);
      updated = db.expenses.length !== lenBefore;
    } else if (tableName === 'financial_transactions') {
      const lenBefore = db.financial_transactions.length;
      db.financial_transactions = db.financial_transactions.filter(f => f.id !== recordId);
      updated = db.financial_transactions.length !== lenBefore;
    }

    if (updated) {
      setLocalData(db);
    }
    return updated;
  },

  // Backup & Restore
  async getBackupData(): Promise<any> {
    return getLocalData();
  },

  reconcileFinancialTransactions(): boolean {
    const db = getLocalData();
    const changed = reconcileFinancialTransactions(db);
    if (changed) {
      setLocalData(db);
    }
    return changed;
  },

  async restoreDatabase(backupData: any): Promise<{ success: boolean; message: string }> {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Format file backup tidak valid.');
    }
    const clean: LocalDatabaseSchema = {
      settings: backupData.settings || DEFAULT_INITIAL_DATA.settings,
      customers: Array.isArray(backupData.customers) ? backupData.customers : [],
      shifts: Array.isArray(backupData.shifts) ? backupData.shifts : [],
      stock_items: Array.isArray(backupData.stock_items) ? backupData.stock_items : [],
      stock_movements: Array.isArray(backupData.stock_movements) ? backupData.stock_movements : [],
      materials: Array.isArray(backupData.materials) ? backupData.materials : [],
      inventory_movements: Array.isArray(backupData.inventory_movements) ? backupData.inventory_movements : [],
      products: Array.isArray(backupData.products) ? backupData.products : [],
      orders: Array.isArray(backupData.orders) ? backupData.orders : [],
      transactions: Array.isArray(backupData.transactions) ? backupData.transactions : [],
      expenses: Array.isArray(backupData.expenses) ? backupData.expenses : [],
      financial_transactions: Array.isArray(backupData.financial_transactions) ? backupData.financial_transactions : [],
    };
    // Auto migrate if backup was from older schema version without stock_items
    migrateToStockItems(clean);
    setLocalData(clean);
    return { success: true, message: 'Database berhasil dipulihkan dari cadangan.' };
  },
};