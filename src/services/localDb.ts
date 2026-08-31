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
} from '../types';

const STORAGE_KEY = 'sukunaru_local_db_v1';

export interface LocalDatabaseSchema {
  settings: BusinessSettings;
  customers: Customer[];
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
    businessName: "Sukunaru Studio",
    tagline: "Home Printing & Desain Grafis",
    address: "Nyalindung Desa.Rajapolah Kec.Rajapolah Kab.Tasikmalaya 46155",
    phone: "081234567890",
    whatsapp: "081234567890",
    email: "sukunarustudio@gmail.com",
    receiptHeader: "SUKUNARU STUDIO - Cetak Stiker, MDF, Undangan & Desain",
    receiptFooter: "Terima kasih telah mempercayakan kebutuhan cetak & desain Anda kepada Sukunaru Studio!",
    bankAccount: "BCA: 123-456-7890 a.n Sukunaru Studio\nMandiri: 987-654-3210 a.n Sukunaru Studio",
    currency: "IDR",
    invoicePrefix: "INV-",
    receiptPrefix: "STR-",
    defaultTaxPercent: 0,
    defaultDiscountPercent: 0,
    footerNotes: "Terima kasih telah mempercayakan kebutuhan cetak & desain Anda kepada Sukunaru Studio!"
  },
  customers: [
    {
      id: "cust_01",
      name: "Budi Santoso",
      whatsapp: "081234567890",
      phone: "081234567890",
      address: "Jl. Merdeka No. 45, Rajapolah",
      notes: "Pelanggan langganan cetak dokumen & foto MDF.",
      totalOrders: 3,
      totalSpent: 125000,
      lastTransactionDate: "2026-08-24",
      createdAt: "2026-08-10",
      updatedAt: "2026-08-24"
    },
    {
      id: "cust_02",
      name: "Dewi Lestari",
      whatsapp: "087812903456",
      phone: "087812903456",
      address: "Perum Permata Indah Blok B2",
      notes: "Order cetak foto album keluarga dan laminasi.",
      totalOrders: 1,
      totalSpent: 26000,
      lastTransactionDate: "2026-08-24",
      createdAt: "2026-08-15",
      updatedAt: "2026-08-24"
    },
    {
      id: "cust_03",
      name: "Ahmad Fauzi",
      whatsapp: "082198765432",
      phone: "082198765432",
      address: "Kepanjen, Kab. Tasikmalaya",
      notes: "Order desain poster dan banner bazar kampus.",
      totalOrders: 2,
      totalSpent: 150000,
      lastTransactionDate: "2026-08-23",
      createdAt: "2026-08-10",
      updatedAt: "2026-08-23"
    }
  ],
  materials: [
    {
      id: "mat_01",
      name: "MDF Board A4 (6mm)",
      sku: "MAT-MDF-A4",
      category: "Kayu/MDF",
      unit: "pcs",
      currentStock: 25,
      minStock: 10,
      purchasePrice: 3000,
      unitCost: 3000,
      supplier: "Juragan Kayu",
      supplierContact: "",
      notes: "Ketebalan 6mm presisi pinggiran rapi",
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_02",
      name: "Photo Paper Glossy A4 (230gsm)",
      sku: "MAT-PPR-A4",
      category: "Kertas",
      unit: "lembar",
      currentStock: 45,
      minStock: 20,
      purchasePrice: 1500,
      unitCost: 1500,
      supplier: "Toko Kertas Makmur",
      supplierContact: "",
      notes: "Hasil cetak tajam dan glossy",
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_03",
      name: "HVS Paper A4 75gsm",
      sku: "MAT-HVS-70",
      category: "Kertas",
      unit: "lembar",
      currentStock: 480,
      minStock: 100,
      purchasePrice: 100,
      unitCost: 100,
      supplier: "Toko Kertas Makmur",
      supplierContact: "",
      notes: "Kertas dokumen umum",
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_04",
      name: "Sticker Paper Glossy A4",
      sku: "MAT-STK-GLS",
      category: "Kertas",
      unit: "lembar",
      currentStock: 50,
      minStock: 25,
      purchasePrice: 1600,
      unitCost: 1600,
      supplier: "Grafika Supply",
      supplierContact: "",
      notes: "Daya rekat kuat tahan air jika dilaminasi",
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_05",
      name: "Laminating Film Glossy A4 (100 micron)",
      sku: "MAT-LAM-GLS",
      category: "Plastik/Laminasi",
      unit: "lembar",
      currentStock: 30,
      minStock: 10,
      purchasePrice: 1500,
      unitCost: 1500,
      supplier: "Plastindo",
      supplierContact: "",
      notes: "Laminasi panas anti gores",
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_06",
      name: "Laminating Dingin Doff A4",
      sku: "MAT-LAM-DOF",
      category: "Plastik/Laminasi",
      unit: "lembar",
      currentStock: 25,
      minStock: 15,
      purchasePrice: 1000,
      unitCost: 1000,
      supplier: "Plastindo",
      supplierContact: "",
      notes: "Finishing matte elegan",
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_07",
      name: "Tinta Canon Black (135ml)",
      sku: "MAT-INK-BK",
      category: "Tinta",
      unit: "botol",
      currentStock: 2,
      minStock: 1,
      purchasePrice: 50000,
      unitCost: 50000,
      supplier: "FixPrint",
      supplierContact: "",
      notes: "Estimasi biaya per lembar B/W ~Rp100",
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_08",
      name: "Tinta Canon Color Set",
      sku: "MAT-INK-CLR",
      category: "Tinta",
      unit: "botol",
      currentStock: 3,
      minStock: 1,
      purchasePrice: 25000,
      unitCost: 25000,
      supplier: "Epson Authorized",
      supplierContact: "",
      notes: "Estimasi biaya per lembar warna ~Rp450",
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_10",
      name: "Plastik OPP Packaging A4 + Seal",
      sku: "MAT-PKG-OPP",
      category: "Aksesoris/Packaging",
      unit: "pcs",
      currentStock: 100,
      minStock: 10,
      purchasePrice: 200,
      unitCost: 200,
      supplier: "Plastindo",
      supplierContact: "",
      notes: "Packaging rapi siap serah terima",
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    }
  ],
  inventory_movements: [],
  products: [
    {
      id: "prod_01",
      name: "MDF Photo A4",
      sku: "PRD-MDF-A4",
      category: "Foto & Wall Decor",
      type: "PHYSICAL",
      sellingPrice: 25000,
      costPrice: 8700,
      profit: 16300,
      profitMargin: 65.2,
      marginPercent: 65.2,
      trackStock: true,
      minStock: 5,
      unit: "pcs",
      description: "Foto cetak high quality ditempel pada papan MDF 6mm dengan laminasi doff/glossy dan gantungan dinding.",
      isActive: true,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
      components: [
        {
          id: "comp_1",
          materialId: "mat_01",
          componentName: "MDF Board A4",
          quantity: 1,
          unit: "pcs",
          unitCost: 3000,
          subtotal: 3000
        },
        {
          id: "comp_2",
          materialId: "mat_02",
          componentName: "Photo Paper Glossy A4",
          quantity: 1,
          unit: "lembar",
          unitCost: 1500,
          subtotal: 1500
        },
        {
          id: "comp_4",
          materialId: "mat_05",
          componentName: "Laminasi A4",
          quantity: 1,
          unit: "lembar",
          unitCost: 1500,
          subtotal: 1500
        },
        {
          id: "comp_6",
          materialId: "mat_10",
          componentName: "Packaging OPP Seal",
          quantity: 1,
          unit: "pcs",
          unitCost: 200,
          subtotal: 200
        }
      ],
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    },
    {
      id: "prod_02",
      name: "Foto A4 Glossy",
      sku: "PRD-PHT-A4",
      category: "Foto & Wall Decor",
      type: "PHYSICAL",
      sellingPrice: 10000,
      costPrice: 2500,
      profit: 7500,
      profitMargin: 75,
      marginPercent: 75,
      trackStock: true,
      minStock: 0,
      unit: "lembar",
      description: "Cetak foto ukuran A4 full page glossy premium tahan luntur.",
      isActive: true,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
      components: [
        {
          id: "comp_401",
          materialId: "mat_02",
          componentName: "Photo Paper Glossy A4",
          quantity: 1,
          unit: "lembar",
          unitCost: 1500,
          subtotal: 1500
        },
        {
          id: "comp_402",
          materialId: "mat_08",
          componentName: "Tinta Color High Quality",
          quantity: 1,
          unit: "porsi",
          unitCost: 1000,
          subtotal: 1000
        }
      ],
      createdAt: "2026-08-23",
      updatedAt: "2026-08-23"
    },
    {
      id: "prod_03",
      name: "Print Color A4 (HVS)",
      sku: "PRD-PRN-CLR",
      category: "Dokumen & Cetak",
      type: "SERVICE",
      sellingPrice: 2000,
      costPrice: 550,
      profit: 1450,
      profitMargin: 72.5,
      marginPercent: 72.5,
      trackStock: true,
      minStock: 0,
      unit: "lembar",
      description: "Cetak dokumen warna kertas HVS 75gsm.",
      isActive: true,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
      components: [
        {
          id: "comp_201",
          materialId: "mat_03",
          componentName: "HVS A4 75gsm",
          quantity: 1,
          unit: "lembar",
          unitCost: 100,
          subtotal: 100
        },
        {
          id: "comp_202",
          materialId: "mat_08",
          componentName: "Tinta Canon Color Set",
          quantity: 1,
          unit: "porsi",
          unitCost: 450,
          subtotal: 450
        }
      ],
      createdAt: "2026-08-23",
      updatedAt: "2026-08-24"
    },
    {
      id: "prod_04",
      name: "Cetak Stiker Vinyl A3+ Kiss Cut",
      sku: "PRD-STK-VNL",
      category: "Stiker & Label",
      type: "PHYSICAL",
      sellingPrice: 15000,
      costPrice: 4500,
      profit: 10500,
      profitMargin: 70,
      marginPercent: 70,
      trackStock: true,
      minStock: 0,
      unit: "lembar",
      description: "Cetak stiker vinyl A3+ anti air dengan cutting pola kiss cut rapi.",
      isActive: true,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
      components: [
        {
          id: "comp_301",
          materialId: "mat_04",
          componentName: "Sticker Paper Glossy A4",
          quantity: 2,
          unit: "lembar",
          unitCost: 1600,
          subtotal: 3200
        }
      ],
      createdAt: "2026-08-23",
      updatedAt: "2026-08-23"
    },
    {
      id: "prod_05",
      name: "Jasa Desain Grafis & Logo",
      sku: "PRD-DSN-LGO",
      category: "Jasa Desain",
      type: "SERVICE",
      sellingPrice: 50000,
      costPrice: 0,
      profit: 50000,
      profitMargin: 100,
      marginPercent: 100,
      trackStock: false,
      minStock: 0,
      unit: "desain",
      description: "Jasa pembuatan desain logo, banner, spanduk, atau feed medsos revisi 3x.",
      isActive: true,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
      components: [],
      createdAt: "2026-08-23",
      updatedAt: "2026-08-23"
    }
  ],
  orders: [],
  transactions: [],
  expenses: [],
  financial_transactions: []
};

// Helper: Convert File to base64 Data URL for persistent offline storage
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
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
    return {
      settings: data.settings || DEFAULT_INITIAL_DATA.settings,
      customers: Array.isArray(data.customers) ? data.customers : DEFAULT_INITIAL_DATA.customers,
      materials: Array.isArray(data.materials) ? data.materials : DEFAULT_INITIAL_DATA.materials,
      inventory_movements: Array.isArray(data.inventory_movements) ? data.inventory_movements : [],
      products: Array.isArray(data.products) ? data.products : DEFAULT_INITIAL_DATA.products,
      orders: Array.isArray(data.orders) ? data.orders : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      financial_transactions: Array.isArray(data.financial_transactions) ? data.financial_transactions : [],
    };
  } catch (err) {
    console.error('Failed to parse local DB from localStorage:', err);
    return JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
  }
}

function setLocalData(data: LocalDatabaseSchema): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
    const dataUrl = await fileToDataUrl(file);
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

  // Stats
  async getStats(): Promise<DashboardStats & { lowStockItems: Material[] }> {
    const db = getLocalData();
    const today = new Date().toISOString().split('T')[0];

    const todayPos = db.transactions.filter(t => t.date === today);
    const todayOrders = db.orders.filter(o => o.orderDate === today);
    const todayPosSales = todayPos.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const todayOrderSales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const totalPosSales = db.transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const totalOrderSales = db.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalRevenue = totalPosSales + totalOrderSales;

    const totalExpenses = db.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPosCost = db.transactions.reduce((sum, t) => sum + (t.totalCost || 0), 0);
    const totalOrderCost = db.orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    const totalProfit = totalRevenue - totalPosCost - totalOrderCost - totalExpenses;

    const lowStockItems = db.materials.filter(m => m.currentStock <= m.minStock);
    const activeOrders = db.orders.filter(o => o.status !== 'SELESAI' && o.status !== 'BATAL');

    return {
      todayRevenue: todayPosSales + todayOrderSales,
      todayProfit: totalProfit,
      todayTransactionsCount: todayOrders.length + todayPos.length,
      activeOrdersCount: activeOrders.length,
      todayExpense: totalExpenses,
      thisMonthRevenue: totalRevenue,
      thisMonthProfit: totalProfit,
      thisMonthExpense: totalExpenses,
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

  async createProduct(data: Partial<Product>): Promise<Product> {
    const db = getLocalData();
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
    db.products[idx] = {
      ...db.products[idx],
      ...data,
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

  // Transactions (POS)
  async getTransactions(): Promise<Transaction[]> {
    const db = getLocalData();
    return db.transactions;
  },

  async createTransaction(data: any): Promise<Transaction> {
    const db = getLocalData();
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const receiptNum = data.receiptNumber || `STR-${Date.now().toString().slice(-6)}`;

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
      cashierName: data.cashierName || 'Owner',
      notes: data.notes || '',
      createdAt: dateStr,
    };

    db.transactions.unshift(newTrx);

    // Auto deduct material stock based on items
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        const prod = db.products.find(p => p.id === item.productId);
        if (prod && Array.isArray(prod.components)) {
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

    // Auto create Financial Cashflow entry
    const finEntry: FinancialTransaction = {
      id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: dateStr,
      type: 'INCOME',
      category: 'Penjualan Kasir',
      description: `Transaksi Kasir #${receiptNum} - ${newTrx.customerName}`,
      amount: newTrx.totalAmount,
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
    const expCount = options.resetExpenses ? db.expenses.length : 0;
    const finCount = db.financial_transactions.length;

    db.transactions = [];
    db.orders = [];
    db.financial_transactions = [];
    if (options.resetExpenses) db.expenses = [];
    if (options.resetMovements) db.inventory_movements = [];

    setLocalData(db);
    return {
      success: true,
      message: 'Semua transaksi berhasil direset.',
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

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const db = getLocalData();
    const order = db.orders.find(o => o.id === id);
    if (!order) throw new Error('Pesanan tidak ditemukan');
    order.status = status as any;
    order.updatedAt = new Date().toISOString().split('T')[0];
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

  // Backup & Restore
  async getBackupData(): Promise<any> {
    return getLocalData();
  },

  async restoreDatabase(backupData: any): Promise<{ success: boolean; message: string }> {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Format file backup tidak valid.');
    }
    const clean: LocalDatabaseSchema = {
      settings: backupData.settings || DEFAULT_INITIAL_DATA.settings,
      customers: Array.isArray(backupData.customers) ? backupData.customers : [],
      materials: Array.isArray(backupData.materials) ? backupData.materials : [],
      inventory_movements: Array.isArray(backupData.inventory_movements) ? backupData.inventory_movements : [],
      products: Array.isArray(backupData.products) ? backupData.products : [],
      orders: Array.isArray(backupData.orders) ? backupData.orders : [],
      transactions: Array.isArray(backupData.transactions) ? backupData.transactions : [],
      expenses: Array.isArray(backupData.expenses) ? backupData.expenses : [],
      financial_transactions: Array.isArray(backupData.financial_transactions) ? backupData.financial_transactions : [],
    };
    setLocalData(clean);
    return { success: true, message: 'Database berhasil dipulihkan dari cadangan.' };
  },
};