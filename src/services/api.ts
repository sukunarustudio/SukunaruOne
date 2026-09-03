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
import { localDb, emitDataMutation } from './localDb';
import { uploadTenantFile, deleteTenantFile, isSupabaseConfigured, getSupabaseClient } from './supabaseClient';
import {
  getActiveLicenseKey,
  enqueueSyncMutation,
  pauseRealtime,
  resumeRealtime,
  clearSyncQueueForHistory,
  broadcastClearHistory,
  emitSyncCompleted,
} from './syncManager';

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
    const updated = await localDb.updateSettings(data);
    enqueueSyncMutation('business_settings', 'UPSERT', 'settings', updated);
    if (!isStandaloneOffline()) {
      requestApi<BusinessSettings>('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return updated;
  },

  async uploadBusinessLogo(file: File): Promise<{ success: boolean; logoUrl: string; settings: BusinessSettings }> {
    // 1. Always save compressed copy locally for instant offline usage
    const localRes = await localDb.uploadBusinessLogo(file);
    enqueueSyncMutation('business_settings', 'UPSERT', 'settings', localRes.settings);

    // 2. If Supabase configured and online, upload to license-specific cloud storage folder
    if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const licenseKey = getActiveLicenseKey();
        const cloudUpload = await uploadTenantFile(licenseKey, 'logos', file, file.name);
        if (cloudUpload.success && cloudUpload.publicUrl) {
          const updatedSettings = await localDb.updateSettings({ logoUrl: cloudUpload.publicUrl });
          enqueueSyncMutation('business_settings', 'UPSERT', 'settings', updatedSettings);
          return { success: true, logoUrl: cloudUpload.publicUrl, settings: updatedSettings };
        }
      } catch (cloudErr) {
        console.warn('[Tenant Logo Cloud Upload Warning]:', cloudErr);
      }
    }

    return localRes;
  },

  async deleteBusinessLogo(): Promise<{ success: boolean; settings: BusinessSettings }> {
    const currentSettings = await localDb.getSettings();
    if (currentSettings.logoUrl && isSupabaseConfigured()) {
      const licenseKey = getActiveLicenseKey();
      deleteTenantFile(licenseKey, currentSettings.logoUrl).catch(() => {});
    }
    const res = await localDb.deleteBusinessLogo();
    enqueueSyncMutation('business_settings', 'UPSERT', 'settings', res.settings);
    return res;
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
    const created = await localDb.createCustomer(data);
    enqueueSyncMutation('customers', 'UPSERT', created.id, created);
    if (!isStandaloneOffline()) {
      requestApi<Customer>('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return created;
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const updated = await localDb.updateCustomer(id, data);
    enqueueSyncMutation('customers', 'UPSERT', updated.id, updated);
    if (!isStandaloneOffline()) {
      requestApi<Customer>(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return updated;
  },

  async deleteCustomer(id: string): Promise<void> {
    enqueueSyncMutation('customers', 'DELETE', id);
    if (!isStandaloneOffline()) {
      requestApi<void>(`/api/customers/${id}`, { method: 'DELETE' }).catch(() => {});
    }
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
    const created = await localDb.createMaterial(data);
    enqueueSyncMutation('materials', 'UPSERT', created.id, created);
    if (!isStandaloneOffline()) {
      const payload = {
        ...data,
        purchasePrice: data.unitCost ?? data.purchasePrice ?? 0,
      };
      requestApi<any>('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
    return created;
  },

  async updateMaterial(id: string, data: Partial<Material>): Promise<Material> {
    const updated = await localDb.updateMaterial(id, data);
    enqueueSyncMutation('materials', 'UPSERT', updated.id, updated);
    if (!isStandaloneOffline()) {
      const payload = {
        ...data,
        purchasePrice: data.unitCost ?? data.purchasePrice,
      };
      requestApi<any>(`/api/materials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
    return updated;
  },

  async addStockMovement(
    materialId: string,
    data: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; referenceType?: string; notes?: string }
  ): Promise<{ material: Material; movement: InventoryMovement }> {
    const res = await localDb.addStockMovement(materialId, data);
    enqueueSyncMutation('materials', 'UPSERT', res.material.id, res.material);
    if (!isStandaloneOffline()) {
      requestApi<{ material: Material; movement: InventoryMovement }>(
        `/api/materials/${materialId}/movement`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      ).catch(() => {});
    }
    return res;
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
    enqueueSyncMutation('materials', 'DELETE', id);
    if (!isStandaloneOffline()) {
      requestApi<void>(`/api/materials/${id}`, { method: 'DELETE' }).catch(() => {});
    }
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

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    return localDb.getProductByBarcode(barcode);
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const created = await localDb.createProduct(data);
    enqueueSyncMutation('products', 'UPSERT', created.id, created);
    if (!isStandaloneOffline()) {
      requestApi<Product>('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return created;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const updated = await localDb.updateProduct(id, data);
    enqueueSyncMutation('products', 'UPSERT', updated.id, updated);
    if (!isStandaloneOffline()) {
      requestApi<Product>(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    enqueueSyncMutation('products', 'DELETE', id);
    if (!isStandaloneOffline()) {
      requestApi<void>(`/api/products/${id}`, { method: 'DELETE' }).catch(() => {});
    }
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
    const created = await localDb.createTransaction(data);
    enqueueSyncMutation('transactions', 'UPSERT', created.id, created);
    if (!isStandaloneOffline()) {
      requestApi<Transaction>('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return created;
  },

  async deleteTransaction(id: string): Promise<void> {
    enqueueSyncMutation('transactions', 'DELETE', id);
    if (!isStandaloneOffline()) {
      requestApi<void>(`/api/transactions/${id}`, { method: 'DELETE' }).catch(() => {});
    }
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
    const licenseKey = getActiveLicenseKey();
    const nowIso = new Date().toISOString();

    // 1. Clear in Supabase Cloud schema if configured and online
    if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const client = getSupabaseClient();
        if (client) {
          pauseRealtime();
          try {
            await client.from('transactions').delete().eq('license_key', licenseKey);
            await client.from('orders').delete().eq('license_key', licenseKey);
            await client.from('financial_transactions').delete().eq('license_key', licenseKey);
            if (options.resetExpenses) {
              await client.from('expenses').delete().eq('license_key', licenseKey);
            }

            // Record history_cleared_at in business_settings in Supabase
            await client.from('business_settings').update({
              history_cleared_at: nowIso,
              updated_at: nowIso,
            }).eq('license_key', licenseKey);

            // Broadcast clear event to other connected devices
            await broadcastClearHistory();
          } finally {
            setTimeout(() => resumeRealtime(500), 2000);
          }
        }
      } catch (err) {
        resumeRealtime(0);
        console.warn('[Clear All Trx Cloud Error]:', err);
      }
    }

    // 2. Clear any pending transactions/orders from sync queue
    clearSyncQueueForHistory();

    // 3. Clear local DB
    const res = await localDb.clearAllTransactions(options);

    // Update local settings with historyClearedAt
    await localDb.updateSettings({ historyClearedAt: nowIso });

    if (!isStandaloneOffline()) {
      requestApi('/api/transactions/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      }).catch(() => {});
    }

    // 4. Trigger UI refresh across all views
    emitDataMutation();
    emitSyncCompleted();

    return res;
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
    const created = await localDb.createOrder(data);
    enqueueSyncMutation('orders', 'UPSERT', created.id, created);
    if (!isStandaloneOffline()) {
      requestApi<Order>('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return created;
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const updated = await localDb.updateOrderStatus(id, status);
    enqueueSyncMutation('orders', 'UPSERT', updated.id, updated);
    if (!isStandaloneOffline()) {
      requestApi<Order>(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    }
    return updated;
  },

  async addOrderPayment(
    id: string,
    data: { amount: number; paymentMethod: string; date?: string; notes?: string }
  ): Promise<Order> {
    const updated = await localDb.addOrderPayment(id, data);
    enqueueSyncMutation('orders', 'UPSERT', updated.id, updated);
    if (!isStandaloneOffline()) {
      requestApi<Order>(`/api/orders/${id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return updated;
  },

  async updateOrderPayment(
    orderId: string,
    paymentId: string,
    data: { amount?: number; paymentMethod?: string; date?: string; notes?: string }
  ): Promise<Order> {
    const updated = await localDb.updateOrderPayment(orderId, paymentId, data);
    enqueueSyncMutation('orders', 'UPSERT', updated.id, updated);
    if (!isStandaloneOffline()) {
      requestApi<Order>(`/api/orders/${orderId}/payment/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return updated;
  },

  async deleteOrderPayment(orderId: string, paymentId: string): Promise<Order> {
    const updated = await localDb.deleteOrderPayment(orderId, paymentId);
    enqueueSyncMutation('orders', 'UPSERT', updated.id, updated);
    if (!isStandaloneOffline()) {
      requestApi<Order>(`/api/orders/${orderId}/payment/${paymentId}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
    return updated;
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
    enqueueSyncMutation('orders', 'DELETE', id);
    if (!isStandaloneOffline()) {
      requestApi<void>(`/api/orders/${id}`, { method: 'DELETE' }).catch(() => {});
    }
    return localDb.deleteOrder(id);
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    if (isStandaloneOffline()) return localDb.getExpenses();
    return requestApi<Expense[]>('/api/expenses').catch(() => localDb.getExpenses());
  },

  async createExpense(data: Partial<Expense>): Promise<Expense> {
    const created = await localDb.createExpense(data);
    enqueueSyncMutation('expenses', 'UPSERT', created.id, created);
    if (!isStandaloneOffline()) {
      requestApi<Expense>('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return created;
  },

  async deleteExpense(id: string): Promise<void> {
    enqueueSyncMutation('expenses', 'DELETE', id);
    if (!isStandaloneOffline()) {
      requestApi<void>(`/api/expenses/${id}`, { method: 'DELETE' }).catch(() => {});
    }
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
    const created = await localDb.createFinanceEntry(data);
    enqueueSyncMutation('financial_transactions', 'UPSERT', created.id, created);
    if (!isStandaloneOffline()) {
      requestApi<FinancialTransaction>('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return created;
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
    const res = await localDb.restockMaterial(id, data);
    enqueueSyncMutation('materials', 'UPSERT', res.material.id, res.material);
    if (!isStandaloneOffline()) {
      requestApi<{ success: boolean; material: Material; movement: InventoryMovement }>(
        `/api/materials/${id}/restock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      ).catch(() => {});
    }
    return res;
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
