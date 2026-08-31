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
      const endpoint = base ? `${base}/api/health` : '/api/health';
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
    return requestApi<BusinessSettings>('/api/settings');
  },

  async updateSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    return requestApi<BusinessSettings>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async uploadBusinessLogo(file: File): Promise<{ success: boolean; logoUrl: string; settings: BusinessSettings }> {
    const formData = new FormData();
    formData.append('logo', file);
    return requestApi('/api/settings/logo', {
      method: 'POST',
      body: formData,
    });
  },

  async deleteBusinessLogo(): Promise<{ success: boolean; settings: BusinessSettings }> {
    return requestApi('/api/settings/logo', {
      method: 'DELETE',
    });
  },

  async resetSampleData(): Promise<{ success: boolean; message: string }> {
    return requestApi('/api/reset-sample-data', { method: 'POST' });
  },

  // Stats
  async getStats(): Promise<DashboardStats & { lowStockItems: Material[] }> {
    return requestApi<DashboardStats & { lowStockItems: Material[] }>('/api/stats');
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return requestApi<Customer[]>('/api/customers');
  },

  async createCustomer(data: { name: string; whatsapp?: string; address?: string; notes?: string }): Promise<Customer> {
    return requestApi<Customer>('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    return requestApi<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteCustomer(id: string): Promise<void> {
    return requestApi<void>(`/api/customers/${id}`, { method: 'DELETE' });
  },

  // Materials & Inventory
  async getMaterials(): Promise<Material[]> {
    const mats = await requestApi<any[]>('/api/materials');
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
    const created = await requestApi<any>('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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
    const updated = await requestApi<any>(`/api/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return {
      ...updated,
      unitCost: updated.unitCost ?? updated.purchasePrice ?? 0,
    };
  },

  async addStockMovement(
    materialId: string,
    data: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; referenceType?: string; notes?: string }
  ): Promise<{ material: Material; movement: InventoryMovement }> {
    return requestApi<{ material: Material; movement: InventoryMovement }>(`/api/materials/${materialId}/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
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
    return requestApi<void>(`/api/materials/${id}`, { method: 'DELETE' });
  },

  async getInventoryMovements(): Promise<InventoryMovement[]> {
    return requestApi<InventoryMovement[]>('/api/inventory/movements');
  },

  async getMovements(): Promise<InventoryMovement[]> {
    return this.getInventoryMovements();
  },

  // Products
  async getProducts(): Promise<Product[]> {
    return requestApi<Product[]>('/api/products');
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    return requestApi<Product>('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return requestApi<Product>(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(id: string): Promise<void> {
    return requestApi<void>(`/api/products/${id}`, { method: 'DELETE' });
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
    return requestApi(`/api/products/${productId}/image`, {
      method: 'POST',
      body: formData,
    });
  },

  async deleteProductImage(productId: string): Promise<Product> {
    const data = await requestApi<{ product: Product }>(`/api/products/${productId}/image`, { method: 'DELETE' });
    return data.product;
  },

  // Transactions (POS)
  async getTransactions(): Promise<Transaction[]> {
    return requestApi<Transaction[]>('/api/transactions');
  },

  async createTransaction(data: any): Promise<Transaction> {
    return requestApi<Transaction>('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteTransaction(id: string): Promise<void> {
    return requestApi<void>(`/api/transactions/${id}`, { method: 'DELETE' });
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
    return requestApi('/api/transactions/clear-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    return requestApi<Order[]>('/api/orders');
  },

  async getOrder(id: string): Promise<Order> {
    return requestApi<Order>(`/api/orders/${id}`);
  },

  async createOrder(data: any): Promise<Order> {
    return requestApi<Order>('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return requestApi<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  },

  async addOrderPayment(
    id: string,
    data: { amount: number; paymentMethod: string; date?: string; notes?: string }
  ): Promise<Order> {
    return requestApi<Order>(`/api/orders/${id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateOrderPayment(
    orderId: string,
    paymentId: string,
    data: { amount?: number; paymentMethod?: string; date?: string; notes?: string }
  ): Promise<Order> {
    return requestApi<Order>(`/api/orders/${orderId}/payment/${paymentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteOrderPayment(orderId: string, paymentId: string): Promise<Order> {
    return requestApi<Order>(`/api/orders/${orderId}/payment/${paymentId}`, {
      method: 'DELETE',
    });
  },

  async uploadOrderFile(orderId: string, file: File, notes?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) formData.append('notes', notes);
    return requestApi(`/api/orders/${orderId}/files`, {
      method: 'POST',
      body: formData,
    });
  },

  async deleteOrderFile(orderId: string, fileId: string): Promise<void> {
    return requestApi<void>(`/api/orders/${orderId}/files/${fileId}`, { method: 'DELETE' });
  },

  async deleteOrder(id: string): Promise<void> {
    return requestApi<void>(`/api/orders/${id}`, { method: 'DELETE' });
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return requestApi<Expense[]>('/api/expenses');
  },

  async createExpense(data: Partial<Expense>): Promise<Expense> {
    return requestApi<Expense>('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteExpense(id: string): Promise<void> {
    return requestApi<void>(`/api/expenses/${id}`, { method: 'DELETE' });
  },

  // Finance / Cash Flow
  async getFinance(): Promise<FinancialTransaction[]> {
    return requestApi<FinancialTransaction[]>('/api/finance');
  },

  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    return this.getFinance();
  },

  async createFinanceEntry(data: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    return requestApi<FinancialTransaction>('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
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
    try {
      return await requestApi(`/api/search?q=${encodeURIComponent(query)}`);
    } catch {
      return { customers: [], products: [], orders: [], transactions: [] };
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
    return requestApi<{ success: boolean; material: Material; movement: InventoryMovement }>(
      `/api/materials/${id}/restock`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },

  // v3-v4: Full Database Backup & Restore
  async getBackupData(): Promise<any> {
    return requestApi<any>('/api/backup');
  },

  async restoreDatabase(backupData: any): Promise<{ success: boolean; message: string }> {
    return requestApi<{ success: boolean; message: string }>('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData),
    });
  },
};
