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

export const api = {
  // Settings
  async getSettings(): Promise<BusinessSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Gagal memuat pengaturan');
    return res.json();
  },

  async updateSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal memperbarui pengaturan');
    return res.json();
  },

  async uploadBusinessLogo(file: File): Promise<{ success: boolean; logoUrl: string; settings: BusinessSettings }> {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch('/api/settings/logo', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mengunggah foto profil bisnis');
    }
    return res.json();
  },

  async deleteBusinessLogo(): Promise<{ success: boolean; settings: BusinessSettings }> {
    const res = await fetch('/api/settings/logo', {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menghapus foto profil bisnis');
    }
    return res.json();
  },

  async resetSampleData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/reset-sample-data', { method: 'POST' });
    if (!res.ok) throw new Error('Gagal mereset data sample');
    return res.json();
  },

  // Stats
  async getStats(): Promise<DashboardStats & { lowStockItems: Material[] }> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Gagal memuat statistik');
    return res.json();
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch('/api/customers');
    if (!res.ok) throw new Error('Gagal memuat pelanggan');
    return res.json();
  },

  async createCustomer(data: { name: string; whatsapp?: string; address?: string; notes?: string }): Promise<Customer> {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menambah pelanggan');
    }
    return res.json();
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal memperbarui pelanggan');
    return res.json();
  },

  async deleteCustomer(id: string): Promise<void> {
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus pelanggan');
  },

  // Materials & Inventory
  async getMaterials(): Promise<Material[]> {
    const res = await fetch('/api/materials');
    if (!res.ok) throw new Error('Gagal memuat bahan baku');
    const mats = await res.json();
    return mats.map((m: any) => ({
      ...m,
      unitCost: m.unitCost ?? m.purchasePrice ?? 0,
      supplierContact: m.supplierContact ?? m.supplierPhone ?? '',
    }));
  },

  async createMaterial(data: Partial<Material>): Promise<Material> {
    const payload = {
      ...data,
      purchasePrice: data.unitCost ?? data.purchasePrice ?? 0,
    };
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menambah material');
    }
    const created = await res.json();
    return {
      ...created,
      unitCost: created.unitCost ?? created.purchasePrice ?? 0,
    };
  },

  async updateMaterial(id: string, data: Partial<Material>): Promise<Material> {
    const payload = {
      ...data,
      purchasePrice: data.unitCost ?? data.purchasePrice,
    };
    const res = await fetch(`/api/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Gagal memperbarui material');
    const updated = await res.json();
    return {
      ...updated,
      unitCost: updated.unitCost ?? updated.purchasePrice ?? 0,
    };
  },

  async addStockMovement(
    materialId: string,
    data: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; referenceType?: string; notes?: string }
  ): Promise<{ material: Material; movement: InventoryMovement }> {
    const res = await fetch(`/api/materials/${materialId}/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mencatat mutasi stok');
    }
    return res.json();
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
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus material');
  },

  async getInventoryMovements(): Promise<InventoryMovement[]> {
    const res = await fetch('/api/inventory/movements');
    if (!res.ok) throw new Error('Gagal memuat riwayat mutasi');
    return res.json();
  },

  async getMovements(): Promise<InventoryMovement[]> {
    return this.getInventoryMovements();
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Gagal memuat produk');
    return res.json();
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal membuat produk');
    }
    return res.json();
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal memperbarui produk');
    return res.json();
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus produk');
  },

  async uploadProductImage(productId: string, file: File): Promise<{
    imagePath: string;
    thumbnailPath: string;
    imageUrl: string;
    thumbnailUrl: string;
    product: Product;
  }> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`/api/products/${productId}/image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mengunggah gambar produk.');
    }
    return res.json();
  },

  async deleteProductImage(productId: string): Promise<Product> {
    const res = await fetch(`/api/products/${productId}/image`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menghapus gambar produk.');
    }
    const data = await res.json();
    return data.product;
  },

  // Transactions (POS)
  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch('/api/transactions');
    if (!res.ok) throw new Error('Gagal memuat transaksi');
    return res.json();
  },

  async createTransaction(data: any): Promise<Transaction> {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memproses transaksi kasir');
    }
    return res.json();
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menghapus transaksi');
    }
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
    const res = await fetch('/api/transactions/clear-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mereset semua transaksi');
    }
    return res.json();
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Gagal memuat pesanan');
    return res.json();
  },

  async getOrder(id: string): Promise<Order> {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) throw new Error('Gagal memuat detail pesanan');
    return res.json();
  },

  async createOrder(data: any): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal membuat pesanan');
    }
    return res.json();
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Gagal memperbarui status pesanan');
    return res.json();
  },

  async addOrderPayment(
    id: string,
    data: { amount: number; paymentMethod: string; date?: string; notes?: string }
  ): Promise<Order> {
    const res = await fetch(`/api/orders/${id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mencatat pembayaran');
    }
    return res.json();
  },

  async updateOrderPayment(
    orderId: string,
    paymentId: string,
    data: { amount?: number; paymentMethod?: string; date?: string; notes?: string }
  ): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/payment/${paymentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memperbarui pembayaran');
    }
    return res.json();
  },

  async deleteOrderPayment(orderId: string, paymentId: string): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/payment/${paymentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menghapus pembayaran');
    }
    return res.json();
  },

  async uploadOrderFile(orderId: string, file: File, notes?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) formData.append('notes', notes);

    const res = await fetch(`/api/orders/${orderId}/files`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Gagal mengunggah file');
    return res.json();
  },

  async deleteOrderFile(orderId: string, fileId: string): Promise<void> {
    const res = await fetch(`/api/orders/${orderId}/files/${fileId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus file');
  },

  async deleteOrder(id: string): Promise<void> {
    const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus pesanan');
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    const res = await fetch('/api/expenses');
    if (!res.ok) throw new Error('Gagal memuat pengeluaran');
    return res.json();
  },

  async createExpense(data: Partial<Expense>): Promise<Expense> {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mencatat pengeluaran');
    }
    return res.json();
  },

  async deleteExpense(id: string): Promise<void> {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus pengeluaran');
  },

  // Finance / Cash Flow
  async getFinance(): Promise<FinancialTransaction[]> {
    const res = await fetch('/api/finance');
    if (!res.ok) throw new Error('Gagal memuat data keuangan');
    return res.json();
  },

  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    return this.getFinance();
  },

  async createFinanceEntry(data: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal mencatat mutasi kas');
    return res.json();
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
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return { customers: [], products: [], orders: [], transactions: [] };
    return res.json();
  },

  // v3-v4: Restock Material with Auto Expense & Finance
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
    const res = await fetch(`/api/materials/${id}/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal merestock bahan');
    }
    return res.json();
  },

  // v3-v4: Full Database Backup & Restore
  async getBackupData(): Promise<any> {
    const res = await fetch('/api/backup');
    if (!res.ok) throw new Error('Gagal mengunduh backup database');
    return res.json();
  },

  async restoreDatabase(backupData: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memulihkan database');
    }
    return res.json();
  },
};
