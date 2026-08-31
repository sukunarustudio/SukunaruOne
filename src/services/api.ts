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
import { localDb } from './localDb';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('sukunaru_server_api_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  if ((import.meta as any).env?.VITE_API_URL) {
    return ((import.meta as any).env.VITE_API_URL as string).replace(/\/+$/, '');
  }
  return '';
};

export const setApiBaseUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('sukunaru_server_api_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('sukunaru_server_api_url');
    }
  }
};

export const isStandaloneOffline = (): boolean => {
  return !getApiBaseUrl();
};

export const resolveApiUrl = (endpoint: string): string => {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://') || endpoint.startsWith('data:')) {
    return endpoint;
  }
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
};

export async function requestApi<T = any>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = resolveApiUrl(endpoint);
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (netErr: any) {
    throw new Error(
      `Tidak dapat terhubung ke server API (${url || 'localhost'}). Periksa koneksi atau atur Alamat Server di Pengaturan.`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(
      'Koneksi server belum terhubung. Silakan atur URL Server API di menu Pengaturan (misal: http://192.168.1.xxx:3000 atau domain server Anda).'
    );
  }

  if (!res.ok) {
    const errObj = await res.json().catch(() => ({}));
    throw new Error(errObj.error || errObj.message || `Permintaan gagal (${res.status})`);
  }

  return res.json();
}

export const api = {
  // Connection Tester
  async checkConnection(testUrl?: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const base = testUrl ? testUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
      if (!base) {
        return { success: true, message: 'Mode Offline HP Aktif: Database internal lokal berjalan lancar 100%!' };
      }
      const endpoint = `${base}/api/health`;
      const res = await fetch(endpoint);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return { success: false, message: 'Server merespons halaman web HTML, bukan API Sukunaru Studio.' };
      }
      if (!res.ok) {
        return { success: false, message: `Server merespons error status: ${res.status}` };
      }
      const json = await res.json();
      return { success: true, message: 'Berhasil terhubung ke server Sukunaru Studio!', data: json };
    } catch (err: any) {
      return { success: false, message: `Gagal terhubung: ${err.message || 'Koneksi ditolak'}` };
    }
  },

  // Settings
  async getSettings(): Promise<BusinessSettings> {
    if (isStandaloneOffline()) return localDb.getSettings();
    return requestApi<BusinessSettings>('/api/settings').catch(() => localDb.getSettings());
  },

  async updateSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    if (isStandaloneOffline()) return localDb.updateSettings(data);
    try {
      const res = await requestApi<BusinessSettings>('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.updateSettings(data);
      return res;
    } catch {
      return localDb.updateSettings(data);
    }
  },

  async uploadBusinessLogo(file: File): Promise<{ success: boolean; logoUrl: string; settings: BusinessSettings }> {
    if (isStandaloneOffline()) return localDb.uploadBusinessLogo(file);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await requestApi('/api/settings/logo', {
        method: 'POST',
        body: formData,
      });
      await localDb.uploadBusinessLogo(file);
      return res;
    } catch {
      return localDb.uploadBusinessLogo(file);
    }
  },

  async deleteBusinessLogo(): Promise<{ success: boolean; settings: BusinessSettings }> {
    if (isStandaloneOffline()) return localDb.deleteBusinessLogo();
    try {
      const res = await requestApi('/api/settings/logo', { method: 'DELETE' });
      await localDb.deleteBusinessLogo();
      return res;
    } catch {
      return localDb.deleteBusinessLogo();
    }
  },

  async resetSampleData(): Promise<{ success: boolean; message: string }> {
    if (isStandaloneOffline()) return localDb.resetSampleData();
    try {
      const res = await requestApi('/api/reset-sample-data', { method: 'POST' });
      await localDb.resetSampleData();
      return res;
    } catch {
      return localDb.resetSampleData();
    }
  },

  // Stats
  async getStats(): Promise<DashboardStats & { lowStockItems: Material[] }> {
    if (isStandaloneOffline()) return localDb.getStats();
    return requestApi<DashboardStats & { lowStockItems: Material[] }>('/api/stats').catch(() => localDb.getStats());
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    if (isStandaloneOffline()) return localDb.getCustomers();
    return requestApi<Customer[]>('/api/customers').catch(() => localDb.getCustomers());
  },

  async createCustomer(data: { name: string; whatsapp?: string; address?: string; notes?: string }): Promise<Customer> {
    if (isStandaloneOffline()) return localDb.createCustomer(data);
    try {
      const res = await requestApi<Customer>('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.createCustomer(data);
      return res;
    } catch {
      return localDb.createCustomer(data);
    }
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    if (isStandaloneOffline()) return localDb.updateCustomer(id, data);
    try {
      const res = await requestApi<Customer>(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.updateCustomer(id, data);
      return res;
    } catch {
      return localDb.updateCustomer(id, data);
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    if (isStandaloneOffline()) return localDb.deleteCustomer(id);
    try {
      await requestApi<void>(`/api/customers/${id}`, { method: 'DELETE' });
    } catch {}
    return localDb.deleteCustomer(id);
  },

  // Materials & Inventory
  async getMaterials(): Promise<Material[]> {
    if (isStandaloneOffline()) return localDb.getMaterials();
    try {
      const mats = await requestApi<any[]>('/api/materials');
      return mats.map((m: any) => ({
        ...m,
        unitCost: m.unitCost ?? m.purchasePrice ?? 0,
        supplierContact: m.supplierContact ?? m.supplierPhone ?? '',
      }));
    } catch {
      return localDb.getMaterials();
    }
  },

  async createMaterial(data: Partial<Material>): Promise<Material> {
    if (isStandaloneOffline()) return localDb.createMaterial(data);
    try {
      const payload = {
        ...data,
        purchasePrice: data.unitCost ?? data.purchasePrice ?? 0,
      };
      const created = await requestApi<any>('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await localDb.createMaterial(data);
      return {
        ...created,
        unitCost: created.unitCost ?? created.purchasePrice ?? 0,
      };
    } catch {
      return localDb.createMaterial(data);
    }
  },

  async updateMaterial(id: string, data: Partial<Material>): Promise<Material> {
    if (isStandaloneOffline()) return localDb.updateMaterial(id, data);
    try {
      const payload = {
        ...data,
        purchasePrice: data.unitCost ?? data.purchasePrice,
      };
      const updated = await requestApi<any>(`/api/materials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await localDb.updateMaterial(id, data);
      return {
        ...updated,
        unitCost: updated.unitCost ?? updated.purchasePrice ?? 0,
      };
    } catch {
      return localDb.updateMaterial(id, data);
    }
  },

  async addStockMovement(
    materialId: string,
    data: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; referenceType?: string; notes?: string }
  ): Promise<{ material: Material; movement: InventoryMovement }> {
    if (isStandaloneOffline()) return localDb.addStockMovement(materialId, data);
    try {
      const res = await requestApi<{ material: Material; movement: InventoryMovement }>(
        `/api/materials/${materialId}/movement`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      await localDb.addStockMovement(materialId, data);
      return res;
    } catch {
      return localDb.addStockMovement(materialId, data);
    }
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
    if (isStandaloneOffline()) return localDb.deleteMaterial(id);
    try {
      await requestApi<void>(`/api/materials/${id}`, { method: 'DELETE' });
    } catch {}
    return localDb.deleteMaterial(id);
  },

  async getInventoryMovements(): Promise<InventoryMovement[]> {
    if (isStandaloneOffline()) return localDb.getInventoryMovements();
    return requestApi<InventoryMovement[]>('/api/inventory/movements').catch(() => localDb.getInventoryMovements());
  },

  async getMovements(): Promise<InventoryMovement[]> {
    return this.getInventoryMovements();
  },

  // Products
  async getProducts(): Promise<Product[]> {
    if (isStandaloneOffline()) return localDb.getProducts();
    return requestApi<Product[]>('/api/products').catch(() => localDb.getProducts());
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    if (isStandaloneOffline()) return localDb.createProduct(data);
    try {
      const res = await requestApi<Product>('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.createProduct(data);
      return res;
    } catch {
      return localDb.createProduct(data);
    }
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    if (isStandaloneOffline()) return localDb.updateProduct(id, data);
    try {
      const res = await requestApi<Product>(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.updateProduct(id, data);
      return res;
    } catch {
      return localDb.updateProduct(id, data);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (isStandaloneOffline()) return localDb.deleteProduct(id);
    try {
      await requestApi<void>(`/api/products/${id}`, { method: 'DELETE' });
    } catch {}
    return localDb.deleteProduct(id);
  },

  async uploadProductImage(productId: string, file: File): Promise<{
    imagePath: string;
    thumbnailPath: string;
    imageUrl: string;
    thumbnailUrl: string;
    product: Product;
  }> {
    if (isStandaloneOffline()) return localDb.uploadProductImage(productId, file);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await requestApi(`/api/products/${productId}/image`, {
        method: 'POST',
        body: formData,
      });
      await localDb.uploadProductImage(productId, file);
      return res;
    } catch {
      return localDb.uploadProductImage(productId, file);
    }
  },

  async deleteProductImage(productId: string): Promise<Product> {
    if (isStandaloneOffline()) return localDb.deleteProductImage(productId);
    try {
      const data = await requestApi<{ product: Product }>(`/api/products/${productId}/image`, { method: 'DELETE' });
      await localDb.deleteProductImage(productId);
      return data.product;
    } catch {
      return localDb.deleteProductImage(productId);
    }
  },

  // Transactions (POS)
  async getTransactions(): Promise<Transaction[]> {
    if (isStandaloneOffline()) return localDb.getTransactions();
    return requestApi<Transaction[]>('/api/transactions').catch(() => localDb.getTransactions());
  },

  async createTransaction(data: any): Promise<Transaction> {
    if (isStandaloneOffline()) return localDb.createTransaction(data);
    try {
      const res = await requestApi<Transaction>('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.createTransaction(data);
      return res;
    } catch {
      return localDb.createTransaction(data);
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    if (isStandaloneOffline()) return localDb.deleteTransaction(id);
    try {
      await requestApi<void>(`/api/transactions/${id}`, { method: 'DELETE' });
    } catch {}
    return localDb.deleteTransaction(id);
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
    if (isStandaloneOffline()) return localDb.clearAllTransactions(options);
    try {
      const res = await requestApi('/api/transactions/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      await localDb.clearAllTransactions(options);
      return res;
    } catch {
      return localDb.clearAllTransactions(options);
    }
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    if (isStandaloneOffline()) return localDb.getOrders();
    return requestApi<Order[]>('/api/orders').catch(() => localDb.getOrders());
  },

  async getOrder(id: string): Promise<Order> {
    if (isStandaloneOffline()) return localDb.getOrder(id);
    return requestApi<Order>(`/api/orders/${id}`).catch(() => localDb.getOrder(id));
  },

  async createOrder(data: any): Promise<Order> {
    if (isStandaloneOffline()) return localDb.createOrder(data);
    try {
      const res = await requestApi<Order>('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.createOrder(data);
      return res;
    } catch {
      return localDb.createOrder(data);
    }
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    if (isStandaloneOffline()) return localDb.updateOrderStatus(id, status);
    try {
      const res = await requestApi<Order>(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await localDb.updateOrderStatus(id, status);
      return res;
    } catch {
      return localDb.updateOrderStatus(id, status);
    }
  },

  async addOrderPayment(
    id: string,
    data: { amount: number; paymentMethod: string; date?: string; notes?: string }
  ): Promise<Order> {
    if (isStandaloneOffline()) return localDb.addOrderPayment(id, data);
    try {
      const res = await requestApi<Order>(`/api/orders/${id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.addOrderPayment(id, data);
      return res;
    } catch {
      return localDb.addOrderPayment(id, data);
    }
  },

  async updateOrderPayment(
    orderId: string,
    paymentId: string,
    data: { amount?: number; paymentMethod?: string; date?: string; notes?: string }
  ): Promise<Order> {
    if (isStandaloneOffline()) return localDb.updateOrderPayment(orderId, paymentId, data);
    try {
      const res = await requestApi<Order>(`/api/orders/${orderId}/payment/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.updateOrderPayment(orderId, paymentId, data);
      return res;
    } catch {
      return localDb.updateOrderPayment(orderId, paymentId, data);
    }
  },

  async deleteOrderPayment(orderId: string, paymentId: string): Promise<Order> {
    if (isStandaloneOffline()) return localDb.deleteOrderPayment(orderId, paymentId);
    try {
      const res = await requestApi<Order>(`/api/orders/${orderId}/payment/${paymentId}`, {
        method: 'DELETE',
      });
      await localDb.deleteOrderPayment(orderId, paymentId);
      return res;
    } catch {
      return localDb.deleteOrderPayment(orderId, paymentId);
    }
  },

  async uploadOrderFile(orderId: string, file: File, notes?: string): Promise<any> {
    if (isStandaloneOffline()) return localDb.uploadOrderFile(orderId, file, notes);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (notes) formData.append('notes', notes);
      const res = await requestApi(`/api/orders/${orderId}/files`, {
        method: 'POST',
        body: formData,
      });
      await localDb.uploadOrderFile(orderId, file, notes);
      return res;
    } catch {
      return localDb.uploadOrderFile(orderId, file, notes);
    }
  },

  async deleteOrderFile(orderId: string, fileId: string): Promise<void> {
    if (isStandaloneOffline()) return localDb.deleteOrderFile(orderId, fileId);
    try {
      await requestApi<void>(`/api/orders/${orderId}/files/${fileId}`, { method: 'DELETE' });
    } catch {}
    return localDb.deleteOrderFile(orderId, fileId);
  },

  async deleteOrder(id: string): Promise<void> {
    if (isStandaloneOffline()) return localDb.deleteOrder(id);
    try {
      await requestApi<void>(`/api/orders/${id}`, { method: 'DELETE' });
    } catch {}
    return localDb.deleteOrder(id);
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    if (isStandaloneOffline()) return localDb.getExpenses();
    return requestApi<Expense[]>('/api/expenses').catch(() => localDb.getExpenses());
  },

  async createExpense(data: Partial<Expense>): Promise<Expense> {
    if (isStandaloneOffline()) return localDb.createExpense(data);
    try {
      const res = await requestApi<Expense>('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.createExpense(data);
      return res;
    } catch {
      return localDb.createExpense(data);
    }
  },

  async deleteExpense(id: string): Promise<void> {
    if (isStandaloneOffline()) return localDb.deleteExpense(id);
    try {
      await requestApi<void>(`/api/expenses/${id}`, { method: 'DELETE' });
    } catch {}
    return localDb.deleteExpense(id);
  },

  // Finance / Cash Flow
  async getFinance(): Promise<FinancialTransaction[]> {
    if (isStandaloneOffline()) return localDb.getFinance();
    return requestApi<FinancialTransaction[]>('/api/finance').catch(() => localDb.getFinance());
  },

  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    return this.getFinance();
  },

  async createFinanceEntry(data: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    if (isStandaloneOffline()) return localDb.createFinanceEntry(data);
    try {
      const res = await requestApi<FinancialTransaction>('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await localDb.createFinanceEntry(data);
      return res;
    } catch {
      return localDb.createFinanceEntry(data);
    }
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
    if (isStandaloneOffline()) return localDb.search(query);
    try {
      return await requestApi(`/api/search?q=${encodeURIComponent(query)}`);
    } catch {
      return localDb.search(query);
    }
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
    if (isStandaloneOffline()) return localDb.restockMaterial(id, data);
    try {
      const res = await requestApi<{ success: boolean; material: Material; movement: InventoryMovement }>(
        `/api/materials/${id}/restock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      await localDb.restockMaterial(id, data);
      return res;
    } catch {
      return localDb.restockMaterial(id, data);
    }
  },

  // v3-v4: Full Database Backup & Restore
  async getBackupData(): Promise<any> {
    if (isStandaloneOffline()) return localDb.getBackupData();
    return requestApi<any>('/api/backup').catch(() => localDb.getBackupData());
  },

  async restoreDatabase(backupData: any): Promise<{ success: boolean; message: string }> {
    if (isStandaloneOffline()) return localDb.restoreDatabase(backupData);
    try {
      const res = await requestApi<{ success: boolean; message: string }>('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      });
      await localDb.restoreDatabase(backupData);
      return res;
    } catch {
      return localDb.restoreDatabase(backupData);
    }
  },
};
