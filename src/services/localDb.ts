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
    businessName: "Nama Bisnis Anda",
    tagline: "Tagline / Slogan Bisnis Anda",
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
  customers: [
    {
      id: "cust_01",
      name: "Budi Santoso",
      whatsapp: "081234567890",
      phone: "081234567890",
      address: "Jl. Mawar No. 12, Jakarta",
      notes: "Pelanggan reguler produk kustom.",
      totalOrders: 3,
      totalSpent: 185000,
      lastTransactionDate: "2026-08-28",
      createdAt: "2026-08-10",
      updatedAt: "2026-08-28"
    },
    {
      id: "cust_02",
      name: "Dewi Lestari",
      whatsapp: "087812903456",
      phone: "087812903456",
      address: "Perum Permata Indah Blok B2, Bandung",
      notes: "Langganan paket bingkisan & hampers.",
      totalOrders: 2,
      totalSpent: 150000,
      lastTransactionDate: "2026-08-27",
      createdAt: "2026-08-12",
      updatedAt: "2026-08-27"
    },
    {
      id: "cust_03",
      name: "Ahmad Fauzi",
      whatsapp: "082198765432",
      phone: "082198765432",
      address: "Jl. Pahlawan No. 45, Surabaya",
      notes: "Klien proyek pesanan massal & merchandise.",
      totalOrders: 4,
      totalSpent: 320000,
      lastTransactionDate: "2026-08-29",
      createdAt: "2026-08-10",
      updatedAt: "2026-08-29"
    },
    {
      id: "cust_04",
      name: "Siti Rahmawati",
      whatsapp: "085712349876",
      phone: "085712349876",
      address: "Jl. Kenanga No. 8, Yogyakarta",
      notes: "Pemesanan rutin produk retail & hampers.",
      totalOrders: 1,
      totalSpent: 75000,
      lastTransactionDate: "2026-08-30",
      createdAt: "2026-08-15",
      updatedAt: "2026-08-30"
    },
    {
      id: "cust_05",
      name: "Rian Pratama",
      whatsapp: "089654321098",
      phone: "089654321098",
      address: "Komp. Graha Asri Blok C-10, Semarang",
      notes: "Klien jasa kreatif & merchandise usaha.",
      totalOrders: 2,
      totalSpent: 115000,
      lastTransactionDate: "2026-08-31",
      createdAt: "2026-08-18",
      updatedAt: "2026-08-31"
    }
  ],
  materials: [
    {
      id: "mat_01",
      name: "Bahan Kayu / Papan Solid (Grade A)",
      sku: "MAT-KYU-01",
      category: "Kayu & Papan",
      unit: "pcs",
      currentStock: 50,
      minStock: 10,
      purchasePrice: 10000,
      unitCost: 10000,
      supplier: "Mitra Kayu Sejahtera",
      supplierContact: "081122334455",
      notes: "Bahan dasar kayu presisi halus dan kokoh",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_02",
      name: "Kain Katun Premium (Combed 30s)",
      sku: "MAT-KTN-01",
      category: "Kain & Tekstil",
      unit: "meter",
      currentStock: 40,
      minStock: 10,
      purchasePrice: 25000,
      unitCost: 25000,
      supplier: "Sentra Tekstil Utama",
      supplierContact: "082233445566",
      notes: "Katun combed 30s adem dan lembut",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_03",
      name: "Bahan Kertas Karton Tebal (Hardboard)",
      sku: "MAT-KRT-01",
      category: "Kertas & Karton",
      unit: "lembar",
      currentStock: 60,
      minStock: 15,
      purchasePrice: 4000,
      unitCost: 4000,
      supplier: "Karton Prima Makmur",
      supplierContact: "083344556677",
      notes: "Karton tebal kaku untuk box dan struktur label",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_04",
      name: "Bahan Penolong / Tambahan Produksi",
      sku: "MAT-PNL-01",
      category: "Bahan Penolong",
      unit: "unit",
      currentStock: 100,
      minStock: 20,
      purchasePrice: 2000,
      unitCost: 2000,
      supplier: "Multi Supply Universal",
      supplierContact: "084455667788",
      notes: "Perekat, finishing, aksesoris pengikat",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-24"
    },
    {
      id: "mat_05",
      name: "Box Kemasan & Packaging Eksklusif",
      sku: "MAT-BOX-01",
      category: "Kemasan & Box",
      unit: "pcs",
      currentStock: 80,
      minStock: 15,
      purchasePrice: 5000,
      unitCost: 5000,
      supplier: "Packaging Nusantara",
      supplierContact: "085566778899",
      notes: "Box kardus eksklusif siap pajang & kirim",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-24"
    }
  ],
  inventory_movements: [],
  products: [
    {
      id: "prod_01",
      name: "Paket Gift Box / Hampers Eksklusif",
      sku: "PRD-HMP-01",
      category: "Paket Hadiah",
      type: "PHYSICAL",
      sellingPrice: 75000,
      costPrice: 28000,
      profit: 47000,
      profitMargin: 62.7,
      marginPercent: 62.7,
      trackStock: true,
      minStock: 5,
      unit: "box",
      barcode: "8991001000018",
      barcodeType: "EAN13",
      description: "Paket hampers eksklusif lengkap dengan hardbox premium, hiasan pita, dan kemasan rapi.",
      isActive: true,
      laborCost: 5000,
      machineCost: 3000,
      otherCost: 5000,
      components: [
        {
          id: "comp_01_1",
          materialId: "mat_03",
          componentName: "Karton Tebal Hardboard",
          quantity: 2,
          unit: "lembar",
          unitCost: 4000,
          subtotal: 8000
        },
        {
          id: "comp_01_2",
          materialId: "mat_04",
          componentName: "Bahan Penolong & Aksesoris",
          quantity: 1,
          unit: "unit",
          unitCost: 2000,
          subtotal: 2000
        },
        {
          id: "comp_01_3",
          materialId: "mat_05",
          componentName: "Box Kemasan Eksklusif",
          quantity: 1,
          unit: "pcs",
          unitCost: 5000,
          subtotal: 5000
        }
      ],
      createdAt: "2026-08-20",
      updatedAt: "2026-08-24"
    },
    {
      id: "prod_02",
      name: "Kaos Kustom Polos Premium (Combed 30s)",
      sku: "PRD-KOS-01",
      category: "Pakaian & Tekstil",
      type: "PHYSICAL",
      sellingPrice: 65000,
      costPrice: 32000,
      profit: 33000,
      profitMargin: 50.8,
      marginPercent: 50.8,
      trackStock: true,
      minStock: 5,
      unit: "pcs",
      barcode: "SKN-KAOS-01",
      barcodeType: "CODE128",
      description: "Kaos berbahan 100% katun combed 30s premium yang adem, nyaman, dan awet.",
      isActive: true,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
      components: [
        {
          id: "comp_02_1",
          materialId: "mat_02",
          componentName: "Kain Katun Premium",
          quantity: 1,
          unit: "meter",
          unitCost: 25000,
          subtotal: 25000
        },
        {
          id: "comp_02_2",
          materialId: "mat_04",
          componentName: "Bahan Penolong Produksi",
          quantity: 1,
          unit: "unit",
          unitCost: 2000,
          subtotal: 2000
        },
        {
          id: "comp_02_3",
          materialId: "mat_05",
          componentName: "Kemasan Packaging",
          quantity: 1,
          unit: "pcs",
          unitCost: 5000,
          subtotal: 5000
        }
      ],
      createdAt: "2026-08-20",
      updatedAt: "2026-08-24"
    },
    {
      id: "prod_03",
      name: "Plakat / Souvenir Kayu Kustom",
      sku: "PRD-PLK-01",
      category: "Kerajinan & Souvenir",
      type: "PHYSICAL",
      sellingPrice: 50000,
      costPrice: 19000,
      profit: 31000,
      profitMargin: 62.0,
      marginPercent: 62.0,
      trackStock: true,
      minStock: 5,
      unit: "pcs",
      barcode: "8991001000032",
      barcodeType: "EAN13",
      description: "Plakat souvenir dari kayu solid berkualitas tinggi dengan finishing halus dan tahan lama.",
      isActive: true,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
      components: [
        {
          id: "comp_03_1",
          materialId: "mat_01",
          componentName: "Bahan Kayu Solid",
          quantity: 1,
          unit: "pcs",
          unitCost: 10000,
          subtotal: 10000
        },
        {
          id: "comp_03_2",
          materialId: "mat_04",
          componentName: "Finishing & Lem Penolong",
          quantity: 2,
          unit: "unit",
          unitCost: 2000,
          subtotal: 4000
        },
        {
          id: "comp_03_3",
          materialId: "mat_05",
          componentName: "Box Kemasan",
          quantity: 1,
          unit: "pcs",
          unitCost: 5000,
          subtotal: 5000
        }
      ],
      createdAt: "2026-08-20",
      updatedAt: "2026-08-24"
    },
    {
      id: "prod_04",
      name: "Stiker Label Kemasan Produk (A3+)",
      sku: "PRD-STK-01",
      category: "Kemasan & Label",
      type: "PHYSICAL",
      sellingPrice: 15000,
      costPrice: 5000,
      profit: 10000,
      profitMargin: 66.7,
      marginPercent: 66.7,
      trackStock: true,
      minStock: 10,
      unit: "lembar",
      barcode: "SKN-STK-01",
      barcodeType: "CODE128",
      description: "Stiker label kemasan tahan air dengan daya rekat tinggi siap tempel untuk berbagai produk UMKM.",
      isActive: true,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
      components: [
        {
          id: "comp_04_1",
          materialId: "mat_03",
          componentName: "Kertas Karton & Stiker",
          quantity: 1,
          unit: "lembar",
          unitCost: 4000,
          subtotal: 4000
        },
        {
          id: "comp_04_2",
          materialId: "mat_04",
          componentName: "Bahan Penolong",
          quantity: 0.5,
          unit: "unit",
          unitCost: 2000,
          subtotal: 1000
        }
      ],
      createdAt: "2026-08-20",
      updatedAt: "2026-08-24"
    },
    {
      id: "prod_05",
      name: "Jasa Desain & Kustomisasi Produk",
      sku: "PRD-JSA-01",
      category: "Jasa Kreatif",
      type: "SERVICE",
      sellingPrice: 50000,
      costPrice: 0,
      profit: 50000,
      profitMargin: 100.0,
      marginPercent: 100.0,
      trackStock: false,
      minStock: 0,
      unit: "sesi",
      barcode: "SKN-DSN-01",
      barcodeType: "CODE128",
      description: "Layanan jasa desain kreatif, layout branding, dan kustomisasi visual produk dengan revisi fleksibel.",
      isActive: true,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
      components: [],
      createdAt: "2026-08-20",
      updatedAt: "2026-08-24"
    }
  ],
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

export const DATA_MUTATION_EVENT = 'sukunaru:data_mutation';

export function emitDataMutation(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DATA_MUTATION_EVENT));
}

function setLocalData(data: LocalDatabaseSchema): void {
  if (typeof window === 'undefined') return;
  try {
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

    const todayPos = (db.transactions || []).filter(t => (t.date ? t.date.split('T')[0] : '') === today);
    const todayOrders = (db.orders || []).filter(o => (o.orderDate ? o.orderDate.split('T')[0] : '') === today);
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

    const monthPos = (db.transactions || []).filter(t => (t.date ? t.date.split('T')[0] : '').startsWith(thisMonth));
    const monthOrders = (db.orders || []).filter(o => (o.orderDate ? o.orderDate.split('T')[0] : '').startsWith(thisMonth));
    const monthPosSales = monthPos.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
    const monthOrderPaid = monthOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);

    const thisMonthRevenue = monthIncomeTotal > 0 ? monthIncomeTotal : (monthPosSales + monthOrderPaid);
    const thisMonthExpense = monthExpenseTotal;

    const monthPosCost = monthPos.reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0);
    const monthOrderCost = monthOrders.reduce((sum, o) => sum + (Number(o.totalCost) || 0), 0);
    const thisMonthProfit = Math.max(0, thisMonthRevenue - monthPosCost - monthOrderCost - thisMonthExpense);

    const lowStockItems = (db.materials || []).filter(m => m.currentStock <= m.minStock);
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

  // ── Realtime Single-Record Event Handlers (High Performance) ──
  applyRemoteUpsert(tableName: string, record: any): boolean {
    const db = getLocalData();
    let updated = false;

    if (tableName === 'products') {
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

    if (tableName === 'products') {
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