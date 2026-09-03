import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { localDb } from './localDb';
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
} from '../types';

export function getActiveLicenseKey(): string {
  if (typeof window === 'undefined') return 'SKNR-DEFAULT-OFFLINE';
  try {
    const saved = localStorage.getItem('sukunaru_license_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.licenseKey && typeof parsed.licenseKey === 'string') {
        return parsed.licenseKey.trim().toUpperCase();
      }
    }
  } catch {}
  return 'SKNR-DEFAULT-OFFLINE';
}

// ── Model Transformers with Multi-Tenant License Key ───────────

function customerToSupabase(c: Customer, licenseKey: string) {
  return {
    id: c.id,
    license_key: licenseKey,
    name: c.name,
    whatsapp: c.whatsapp || null,
    phone: c.phone || null,
    address: c.address || null,
    notes: c.notes || null,
    total_orders: c.totalOrders || 0,
    total_spent: c.totalSpent || 0,
    last_transaction_date: c.lastTransactionDate || null,
    created_at: c.createdAt || new Date().toISOString(),
    updated_at: c.updatedAt || new Date().toISOString(),
  };
}

function customerFromSupabase(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp || '',
    phone: row.phone || '',
    address: row.address || '',
    notes: row.notes || '',
    totalOrders: Number(row.total_orders) || 0,
    totalSpent: Number(row.total_spent) || 0,
    lastTransactionDate: row.last_transaction_date || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function materialToSupabase(m: Material, licenseKey: string) {
  return {
    id: m.id,
    license_key: licenseKey,
    name: m.name,
    sku: m.sku,
    category: m.category || null,
    unit: m.unit || 'pcs',
    current_stock: m.currentStock || 0,
    min_stock: m.minStock || 0,
    purchase_price: m.purchasePrice || 0,
    unit_cost: m.unitCost || 0,
    supplier: m.supplier || null,
    supplier_contact: m.supplierContact || null,
    notes: m.notes || null,
    created_at: m.createdAt || new Date().toISOString(),
    updated_at: m.updatedAt || new Date().toISOString(),
  };
}

function materialFromSupabase(row: any): Material {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category || '',
    unit: row.unit || 'pcs',
    currentStock: Number(row.current_stock) || 0,
    minStock: Number(row.min_stock) || 0,
    purchasePrice: Number(row.purchase_price) || 0,
    unitCost: Number(row.unit_cost) || 0,
    supplier: row.supplier || '',
    supplierContact: row.supplier_contact || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function productToSupabase(p: Product, licenseKey: string) {
  return {
    id: p.id,
    license_key: licenseKey,
    name: p.name,
    sku: p.sku,
    category: p.category || null,
    type: p.type || 'PHYSICAL',
    selling_price: p.sellingPrice || 0,
    cost_price: p.costPrice || 0,
    profit: p.profit || 0,
    profit_margin: p.profitMargin || 0,
    margin_percent: p.marginPercent || 0,
    labor_cost: p.laborCost || 0,
    machine_cost: p.machineCost || 0,
    other_cost: p.otherCost || 0,
    track_stock: Boolean(p.trackStock),
    min_stock: p.minStock || 0,
    current_stock: p.currentStock || 0,
    unit: p.unit || 'pcs',
    description: p.description || null,
    is_active: p.isActive !== false,
    image_path: p.imagePath || null,
    thumbnail_path: p.thumbnailPath || null,
    barcode: p.barcode || null,
    barcode_type: p.barcodeType || null,
    bom_components: p.components || [],
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
  };
}

function productFromSupabase(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category || '',
    type: row.type || 'PHYSICAL',
    sellingPrice: Number(row.selling_price) || 0,
    costPrice: Number(row.cost_price) || 0,
    profit: Number(row.profit) || 0,
    profitMargin: Number(row.profit_margin) || 0,
    marginPercent: Number(row.margin_percent) || 0,
    laborCost: Number(row.labor_cost) || 0,
    machineCost: Number(row.machine_cost) || 0,
    otherCost: Number(row.other_cost) || 0,
    trackStock: Boolean(row.track_stock),
    minStock: Number(row.min_stock) || 0,
    currentStock: Number(row.current_stock) || 0,
    unit: row.unit || 'pcs',
    description: row.description || '',
    isActive: Boolean(row.is_active),
    imagePath: row.image_path || undefined,
    thumbnailPath: row.thumbnail_path || undefined,
    barcode: row.barcode || undefined,
    barcodeType: row.barcode_type || undefined,
    components: Array.isArray(row.bom_components) ? row.bom_components : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function orderToSupabase(o: Order, licenseKey: string) {
  return {
    id: o.id,
    license_key: licenseKey,
    order_number: o.orderNumber,
    customer_id: o.customerId || null,
    customer_name: o.customerName,
    customer_phone: o.customerPhone || null,
    order_date: o.orderDate,
    deadline_date: o.deadlineDate || null,
    status: o.status || 'BARU',
    payment_status: o.paymentStatus || 'BELUM_BAYAR',
    subtotal: o.subtotal || 0,
    discount: o.discount || 0,
    total_amount: o.totalAmount || 0,
    total_cost: o.totalCost || 0,
    paid_amount: o.paidAmount || 0,
    remaining_amount: o.remainingAmount || 0,
    notes: o.notes || null,
    items: o.items || [],
    payments: o.payments || [],
    files: o.files || [],
    created_at: o.createdAt || new Date().toISOString(),
    updated_at: o.updatedAt || new Date().toISOString(),
  };
}

function orderFromSupabase(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || undefined,
    orderDate: row.order_date,
    deadlineDate: row.deadline_date || undefined,
    status: row.status,
    paymentStatus: row.payment_status,
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    totalCost: Number(row.total_cost) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    remainingAmount: Number(row.remaining_amount) || 0,
    notes: row.notes || undefined,
    items: Array.isArray(row.items) ? row.items : [],
    payments: Array.isArray(row.payments) ? row.payments : [],
    files: Array.isArray(row.files) ? row.files : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transactionToSupabase(t: Transaction, licenseKey: string) {
  return {
    id: t.id,
    license_key: licenseKey,
    receipt_number: t.receiptNumber,
    type: t.type || 'POS',
    order_id: t.orderId || null,
    customer_id: t.customerId || null,
    customer_name: t.customerName,
    customer_phone: t.customerPhone || null,
    date: t.date,
    subtotal: t.subtotal || 0,
    discount: t.discount || 0,
    total_amount: t.totalAmount || 0,
    total_cost: t.totalCost || 0,
    profit: t.profit || 0,
    paid_amount: t.paidAmount || 0,
    change_amount: t.changeAmount || 0,
    payment_method: t.paymentMethod || 'CASH',
    cashier_name: t.cashierName || 'Owner',
    notes: t.notes || null,
    items: t.items || [],
    created_at: t.createdAt || new Date().toISOString(),
    updated_at: t.updatedAt || new Date().toISOString(),
  };
}

function transactionFromSupabase(row: any): Transaction {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    type: row.type || 'POS',
    orderId: row.order_id || undefined,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || undefined,
    date: row.date,
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    totalCost: Number(row.total_cost) || 0,
    profit: Number(row.profit) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    changeAmount: Number(row.change_amount) || 0,
    paymentMethod: row.payment_method,
    cashierName: row.cashier_name || 'Owner',
    notes: row.notes || undefined,
    items: Array.isArray(row.items) ? row.items : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function expenseToSupabase(e: Expense, licenseKey: string) {
  return {
    id: e.id,
    license_key: licenseKey,
    category: e.category,
    description: e.description,
    amount: e.amount || 0,
    date: e.date,
    payment_method: e.paymentMethod || 'CASH',
    reference: e.reference || null,
    notes: e.notes || null,
    receipt_url: e.receiptUrl || null,
    created_at: e.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function expenseFromSupabase(row: any): Expense {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    amount: Number(row.amount) || 0,
    date: row.date,
    paymentMethod: row.payment_method,
    reference: row.reference || undefined,
    notes: row.notes || undefined,
    receiptUrl: row.receipt_url || undefined,
    createdAt: row.created_at,
  };
}

function finTransactionToSupabase(f: FinancialTransaction, licenseKey: string) {
  return {
    id: f.id,
    license_key: licenseKey,
    date: f.date,
    type: f.type,
    category: f.category,
    description: f.description,
    amount: f.amount || 0,
    reference_number: f.referenceNumber || null,
    reference_type: f.referenceType || null,
    reference_id: f.referenceId || null,
    payment_method: f.paymentMethod || 'CASH',
    notes: f.notes || null,
    created_at: f.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function finTransactionFromSupabase(row: any): FinancialTransaction {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    category: row.category,
    description: row.description,
    amount: Number(row.amount) || 0,
    referenceNumber: row.reference_number || undefined,
    referenceType: row.reference_type || undefined,
    referenceId: row.reference_id || undefined,
    paymentMethod: row.payment_method,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

function settingsToSupabase(s: BusinessSettings, licenseKey: string) {
  return {
    id: licenseKey,
    license_key: licenseKey,
    business_name: s.businessName || 'BisnisUrang Studio',
    tagline: s.tagline || null,
    phone: s.phone || null,
    whatsapp: s.whatsapp || null,
    email: s.email || null,
    address: s.address || null,
    receipt_header: s.receiptHeader || null,
    receipt_footer: s.receiptFooter || null,
    bank_account: s.bankAccount || null,
    logo_url: s.logoUrl || null,
    currency: s.currency || 'IDR',
    invoice_prefix: s.invoicePrefix || 'INV-',
    receipt_prefix: s.receiptPrefix || 'STR-',
    default_tax_percent: s.defaultTaxPercent || 0,
    default_discount_percent: s.defaultDiscountPercent || 0,
    footer_notes: s.footerNotes || null,
    history_cleared_at: s.historyClearedAt || null,
    updated_at: new Date().toISOString(),
  };
}

function settingsFromSupabase(row: any): BusinessSettings {
  return {
    businessName: row.business_name || 'BisnisUrang Studio',
    tagline: row.tagline || '',
    phone: row.phone || '',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    address: row.address || '',
    receiptHeader: row.receipt_header || '',
    receiptFooter: row.receipt_footer || '',
    bankAccount: row.bank_account || '',
    logoUrl: row.logo_url || undefined,
    currency: row.currency || 'IDR',
    invoicePrefix: row.invoice_prefix || 'INV-',
    receiptPrefix: row.receipt_prefix || 'STR-',
    defaultTaxPercent: Number(row.default_tax_percent) || 0,
    defaultDiscountPercent: Number(row.default_discount_percent) || 0,
    footerNotes: row.footer_notes || '',
    historyClearedAt: row.history_cleared_at || undefined,
  };
}

// ── SYNC STATUS & STATE MACHINE ─────────────────────────────
export type SyncConnectionStatus = 'CONNECTED' | 'SYNCING' | 'OFFLINE' | 'RECONNECTING' | 'ERROR';

export interface SyncState {
  status: SyncConnectionStatus;
  lastSyncAt: string | null;
  pendingCount: number;
  errorMessage?: string;
  isOnline: boolean;
  activeLicenseKey: string;
}

const LAST_SYNC_KEY = 'sukunaru_last_supabase_sync';
const SYNC_QUEUE_KEY = 'sukunaru_sync_queue_v1';

// ── SYNC QUEUE ITEM STRUCTURE ────────────────────────────────
export interface SyncQueueItem {
  id: string;
  table: string;
  action: 'UPSERT' | 'DELETE';
  recordId: string;
  payload?: any;
  timestamp: string;
}

function getSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSyncQueue(queue: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    currentSyncState.pendingCount = queue.length;
    notifyListeners();
  } catch {}
}

export function clearSyncQueueForHistory(): void {
  const queue = getSyncQueue();
  const historyTables = new Set(['transactions', 'orders', 'expenses', 'financial_transactions', 'inventory_movements']);
  const filtered = queue.filter(item => !historyTables.has(item.table));
  saveSyncQueue(filtered);
}

export function enqueueSyncMutation(table: string, action: 'UPSERT' | 'DELETE', recordId: string, payload?: any): void {
  const queue = getSyncQueue();
  // Filter out any older pending action for this specific record in this table
  const filtered = queue.filter(item => !(item.table === table && item.recordId === recordId));
  filtered.push({
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    table,
    action,
    recordId,
    payload,
    timestamp: new Date().toISOString(),
  });
  saveSyncQueue(filtered);
  scheduleQueueFlush(200);
}

// ── LISTENERS & STATE ────────────────────────────────────────
let syncListeners: Array<(state: SyncState) => void> = [];

let currentSyncState: SyncState = {
  status: typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'CONNECTED',
  lastSyncAt: typeof window !== 'undefined' ? localStorage.getItem(LAST_SYNC_KEY) : null,
  pendingCount: getSyncQueue().length,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  activeLicenseKey: getActiveLicenseKey(),
};

function notifyListeners() {
  currentSyncState.activeLicenseKey = getActiveLicenseKey();
  syncListeners.forEach(listener => listener({ ...currentSyncState }));
}

export function getSyncState(): SyncState {
  currentSyncState.activeLicenseKey = getActiveLicenseKey();
  return { ...currentSyncState };
}

export function subscribeSyncState(listener: (state: SyncState) => void): () => void {
  syncListeners.push(listener);
  currentSyncState.activeLicenseKey = getActiveLicenseKey();
  listener({ ...currentSyncState });
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
}

// ── AUTO EVENT BROADCAST ─────────────────────────────────────
export const SYNC_COMPLETED_EVENT = 'sukunaru:sync_completed';

export function emitSyncCompleted(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SYNC_COMPLETED_EVENT));
}

// ── TRANSFORMERS TO / FROM SUPABASE ──────────────────────────

function toSupabasePayload(table: string, item: any, licenseKey: string): any {
  switch (table) {
    case 'products': return productToSupabase(item, licenseKey);
    case 'customers': return customerToSupabase(item, licenseKey);
    case 'materials': return materialToSupabase(item, licenseKey);
    case 'orders': return orderToSupabase(item, licenseKey);
    case 'transactions': return transactionToSupabase(item, licenseKey);
    case 'expenses': return expenseToSupabase(item, licenseKey);
    case 'financial_transactions': return finTransactionToSupabase(item, licenseKey);
    case 'business_settings': return settingsToSupabase(item, licenseKey);
    default: return item;
  }
}

function fromSupabasePayload(table: string, row: any): any {
  switch (table) {
    case 'products': return productFromSupabase(row);
    case 'customers': return customerFromSupabase(row);
    case 'materials': return materialFromSupabase(row);
    case 'orders': return orderFromSupabase(row);
    case 'transactions': return transactionFromSupabase(row);
    case 'expenses': return expenseFromSupabase(row);
    case 'financial_transactions': return finTransactionFromSupabase(row);
    case 'business_settings': return settingsFromSupabase(row);
    default: return row;
  }
}

// ── PROCESS SYNC QUEUE (OUTBOUND MUTATIONS) ──────────────────
let isFlushingQueue = false;
let flushTimeout: any = null;

export function scheduleQueueFlush(delayMs = 300): void {
  if (typeof window === 'undefined') return;
  if (!isSupabaseConfigured() || !navigator.onLine) {
    currentSyncState.status = 'OFFLINE';
    notifyListeners();
    return;
  }

  if (flushTimeout) clearTimeout(flushTimeout);
  flushTimeout = setTimeout(() => {
    flushSyncQueue();
  }, delayMs);
}

export async function flushSyncQueue(): Promise<void> {
  if (isFlushingQueue) return;
  if (!isSupabaseConfigured() || !navigator.onLine) {
    currentSyncState.status = 'OFFLINE';
    notifyListeners();
    return;
  }

  const queue = getSyncQueue();
  if (queue.length === 0) {
    if (currentSyncState.status === 'SYNCING') {
      currentSyncState.status = 'CONNECTED';
      notifyListeners();
    }
    return;
  }

  isFlushingQueue = true;
  currentSyncState.status = 'SYNCING';
  notifyListeners();

  const licenseKey = getActiveLicenseKey();
  const client = getSupabaseClient();

  if (!client) {
    isFlushingQueue = false;
    currentSyncState.status = 'ERROR';
    notifyListeners();
    return;
  }

  const remainingQueue: SyncQueueItem[] = [];

  for (const item of queue) {
    try {
      if (item.action === 'UPSERT') {
        const payload = toSupabasePayload(item.table, item.payload, licenseKey);
        const { error } = await client.from(item.table).upsert(payload);
        if (error) {
          console.warn(`[Queue Upsert ${item.table} Error]:`, error);
          // If fatal error (e.g. column mismatch or not critical), don't trap the queue forever
          if (!error.message.includes('network') && !error.message.includes('fetch') && !error.message.includes('Failed')) {
            // Non-network error: Log and discard to prevent permanent queue freeze
            console.error(`[Queue Discarding Invalid Item]:`, item);
          } else {
            remainingQueue.push(item);
          }
        }
      } else if (item.action === 'DELETE') {
        if (item.table === 'transactions' || item.table === 'orders' || item.table === 'expenses') {
          try {
            await client.from('financial_transactions').delete().eq('reference_id', item.recordId).eq('license_key', licenseKey);
          } catch (_) {}
        }
        const { error } = await client.from(item.table).delete().eq('id', item.recordId).eq('license_key', licenseKey);
        if (error) {
          console.warn(`[Queue Delete ${item.table} Error]:`, error);
          if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed')) {
            remainingQueue.push(item);
          }
        }
      }
    } catch (err) {
      console.warn(`[Queue Process Exception on ${item.table}]:`, err);
      remainingQueue.push(item);
    }
  }

  saveSyncQueue(remainingQueue);
  isFlushingQueue = false;

  currentSyncState.lastSyncAt = new Date().toISOString();
  localStorage.setItem(LAST_SYNC_KEY, currentSyncState.lastSyncAt);

  if (remainingQueue.length === 0) {
    currentSyncState.status = 'CONNECTED';
  } else {
    // If still have remaining items, attempt once more in background after 3s
    scheduleQueueFlush(3000);
  }
  notifyListeners();
}

// ── INITIAL CLOUD SYNC (called on first login with existing license) ────────
// Only PULLS data from cloud. Never pushes. Used when a fresh/reset device
// logs in with an existing license key that may already have cloud data.

export async function performInitialCloudSync(): Promise<{
  hasCloudData: boolean;
  pulled: number;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return { hasCloudData: false, pulled: 0, message: 'Supabase belum dikonfigurasi.' };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { hasCloudData: false, pulled: 0, message: 'Perangkat offline.' };
  }

  const licenseKey = getActiveLicenseKey();
  if (!licenseKey || licenseKey === 'SKNR-DEFAULT-OFFLINE') {
    return { hasCloudData: false, pulled: 0, message: 'License Key tidak aktif.' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { hasCloudData: false, pulled: 0, message: 'Gagal koneksi Supabase.' };
  }

  let pulled = 0;

  try {
    console.log('[INITIAL_SYNC] Checking cloud for existing data with license:', licenseKey);

    // 1. Check business settings first (fastest check)
    const { data: remoteSettings } = await client
      .from('business_settings')
      .select('*')
      .eq('license_key', licenseKey)
      .limit(1);

    const hasSettings = remoteSettings && remoteSettings.length > 0;

    // 2. Check products count as additional signal
    const { count: productCount } = await client
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('license_key', licenseKey);

    const hasCloudData = hasSettings || (productCount !== null && productCount > 0);

    console.log(`[INITIAL_SYNC] hasCloudData: ${hasCloudData}, settings: ${hasSettings}, products: ${productCount}`);

    if (!hasCloudData) {
      return { hasCloudData: false, pulled: 0, message: 'Tidak ada data cloud untuk license ini. Memulai database baru.' };
    }

    // 3. Pull all data from cloud → local (PULL ONLY, no push)
    if (hasSettings) {
      await localDb.updateSettings(settingsFromSupabase(remoteSettings![0]));
      pulled++;
    }

    const { data: remoteCustomers } = await client
      .from('customers').select('*').eq('license_key', licenseKey).order('updated_at', { ascending: false });
    if (remoteCustomers && remoteCustomers.length > 0) {
      localDb.mergeCustomers(remoteCustomers.map(customerFromSupabase));
      pulled += remoteCustomers.length;
    }

    const { data: remoteMaterials } = await client
      .from('materials').select('*').eq('license_key', licenseKey).order('updated_at', { ascending: false });
    if (remoteMaterials && remoteMaterials.length > 0) {
      localDb.mergeMaterials(remoteMaterials.map(materialFromSupabase));
      pulled += remoteMaterials.length;
    }

    const { data: remoteProducts } = await client
      .from('products').select('*').eq('license_key', licenseKey).order('updated_at', { ascending: false });
    if (remoteProducts && remoteProducts.length > 0) {
      localDb.mergeProducts(remoteProducts.map(productFromSupabase));
      pulled += remoteProducts.length;
    }

    const { data: remoteOrders } = await client
      .from('orders').select('*').eq('license_key', licenseKey).order('updated_at', { ascending: false });
    if (remoteOrders && remoteOrders.length > 0) {
      localDb.mergeOrders(remoteOrders.map(orderFromSupabase));
      pulled += remoteOrders.length;
    }

    const { data: remoteTransactions } = await client
      .from('transactions').select('*').eq('license_key', licenseKey).order('updated_at', { ascending: false });
    if (remoteTransactions && remoteTransactions.length > 0) {
      localDb.mergeTransactions(remoteTransactions.map(transactionFromSupabase));
      pulled += remoteTransactions.length;
    }

    const { data: remoteExpenses } = await client
      .from('expenses').select('*').eq('license_key', licenseKey).order('created_at', { ascending: false });
    if (remoteExpenses && remoteExpenses.length > 0) {
      localDb.mergeExpenses(remoteExpenses.map(expenseFromSupabase));
      pulled += remoteExpenses.length;
    }

    const { data: remoteFinTrx } = await client
      .from('financial_transactions').select('*').eq('license_key', licenseKey).order('created_at', { ascending: false });
    if (remoteFinTrx && remoteFinTrx.length > 0) {
      localDb.mergeFinancialTransactions(remoteFinTrx.map(finTransactionFromSupabase));
      pulled += remoteFinTrx.length;
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_KEY, nowIso);
    currentSyncState.lastSyncAt = nowIso;
    currentSyncState.status = 'CONNECTED';
    notifyListeners();

    console.log(`[INITIAL_SYNC] Complete. Pulled ${pulled} records.`);
    return { hasCloudData: true, pulled, message: `${pulled} data berhasil dipulihkan dari cloud.` };

  } catch (err: any) {
    console.error('[INITIAL_SYNC] Error:', err);
    return { hasCloudData: false, pulled, message: `Gagal initial sync: ${err.message}` };
  }
}

// ── FULL SYNC ENGINE (ON STARTUP & MANUAL REFRESH) ───────────

export async function syncWithSupabase(): Promise<{
  success: boolean;
  message: string;
  pushedCount: number;
  pulledCount: number;
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase URL dan Anon Key belum dikonfigurasi.',
      pushedCount: 0,
      pulledCount: 0,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentSyncState.isOnline = false;
    currentSyncState.status = 'OFFLINE';
    notifyListeners();
    return {
      success: false,
      message: 'Perangkat sedang offline (tidak ada koneksi internet).',
      pushedCount: 0,
      pulledCount: 0,
    };
  }

  const licenseKey = getActiveLicenseKey();
  const client = getSupabaseClient();

  if (!client) {
    currentSyncState.status = 'ERROR';
    notifyListeners();
    return {
      success: false,
      message: 'Gagal membuat koneksi Supabase.',
      pushedCount: 0,
      pulledCount: 0,
    };
  }

  currentSyncState.status = 'SYNCING';
  currentSyncState.errorMessage = undefined;
  notifyListeners();

  let pushed = 0;
  let pulled = 0;

  try {
    // 1. Flush any pending queue items first
    await flushSyncQueue();

    const rawLocal = localDb.getRawData();

    // ── SAFETY CHECK: detect if local is empty/default ──────────────────────
    // If local has no business data (products, customers, materials all empty)
    // AND cloud has data → pull only, don't push empty default data to cloud.
    const localIsEmpty = rawLocal.products.length === 0
      && rawLocal.customers.length === 0
      && rawLocal.materials.length === 0;

    if (localIsEmpty) {
      // Check if cloud has existing data
      const { data: cloudSettings } = await client
        .from('business_settings')
        .select('id')
        .eq('license_key', licenseKey)
        .limit(1);
      const cloudHasData = cloudSettings && cloudSettings.length > 0;

      if (cloudHasData) {
        // Pull-only mode: don't push empty local data to cloud
        console.log('[SYNC] Local is empty, cloud has data → pull-only mode');
        const initResult = await performInitialCloudSync();
        currentSyncState.status = 'CONNECTED';
        currentSyncState.lastSyncAt = new Date().toISOString();
        notifyListeners();
        return {
          success: true,
          message: `Pull-only sync: ${initResult.pulled} item diperbarui dari Cloud.`,
          pushedCount: 0,
          pulledCount: initResult.pulled,
        };
      }
    }

    // ── 1. SYNC SETTINGS ──────────────────────────────────────
    // Only push settings if businessName has been customized (not default)
    const isDefaultSettings = rawLocal.settings.businessName === 'Nama Bisnis Anda';
    if (rawLocal.settings && !isDefaultSettings) {
      const setPayload = settingsToSupabase(rawLocal.settings, licenseKey);
      await client.from('business_settings').upsert(setPayload);
      pushed++;
    }

    const { data: remoteSettings } = await client
      .from('business_settings')
      .select('*')
      .eq('license_key', licenseKey)
      .limit(1);

    if (remoteSettings && remoteSettings.length > 0) {
      const rSet = remoteSettings[0];
      const remoteClearedAt = rSet.history_cleared_at ? new Date(rSet.history_cleared_at).getTime() : 0;
      const localClearedAt = rawLocal.settings?.historyClearedAt ? new Date(rawLocal.settings.historyClearedAt).getTime() : 0;

      if (remoteClearedAt > localClearedAt) {
        console.log(`[SYNC] Remote history was cleared at ${rSet.history_cleared_at}. Clearing local history...`);
        await localDb.clearAllTransactions({ resetExpenses: true, resetMovements: true });
        clearSyncQueueForHistory();
        emitDataMutation();
        emitSyncCompleted();

        // Refresh rawLocal in memory so subsequent push logic in this function doesn't push deleted transactions!
        rawLocal.transactions = [];
        rawLocal.orders = [];
        rawLocal.financial_transactions = [];
        rawLocal.expenses = [];
        rawLocal.inventory_movements = [];
      }

      await localDb.updateSettings(settingsFromSupabase(rSet));
      pulled++;
    }

    // ── 2. SYNC CUSTOMERS ────────────────────────────────────
    if (rawLocal.customers.length > 0) {
      const payload = rawLocal.customers.map(c => customerToSupabase(c, licenseKey));
      await client.from('customers').upsert(payload);
      pushed += rawLocal.customers.length;
    }

    const { data: remoteCustomers } = await client
      .from('customers')
      .select('*')
      .eq('license_key', licenseKey)
      .order('updated_at', { ascending: false });

    if (remoteCustomers && remoteCustomers.length > 0) {
      localDb.mergeCustomers(remoteCustomers.map(customerFromSupabase));
      pulled += remoteCustomers.length;
    }

    // ── 3. SYNC MATERIALS ────────────────────────────────────
    if (rawLocal.materials.length > 0) {
      const payload = rawLocal.materials.map(m => materialToSupabase(m, licenseKey));
      await client.from('materials').upsert(payload);
      pushed += rawLocal.materials.length;
    }

    const { data: remoteMaterials } = await client
      .from('materials')
      .select('*')
      .eq('license_key', licenseKey)
      .order('updated_at', { ascending: false });

    if (remoteMaterials && remoteMaterials.length > 0) {
      localDb.mergeMaterials(remoteMaterials.map(materialFromSupabase));
      pulled += remoteMaterials.length;
    }

    // ── 4. SYNC PRODUCTS ─────────────────────────────────────
    if (rawLocal.products.length > 0) {
      const payload = rawLocal.products.map(p => productToSupabase(p, licenseKey));
      await client.from('products').upsert(payload);
      pushed += rawLocal.products.length;
    }

    const { data: remoteProducts } = await client
      .from('products')
      .select('*')
      .eq('license_key', licenseKey)
      .order('updated_at', { ascending: false });

    if (remoteProducts && remoteProducts.length > 0) {
      localDb.mergeProducts(remoteProducts.map(productFromSupabase));
      pulled += remoteProducts.length;
    }

    // ── 5. SYNC ORDERS ───────────────────────────────────────
    if (rawLocal.orders.length > 0) {
      const payload = rawLocal.orders.map(o => orderToSupabase(o, licenseKey));
      await client.from('orders').upsert(payload);
      pushed += rawLocal.orders.length;
    }

    const { data: remoteOrders } = await client
      .from('orders')
      .select('*')
      .eq('license_key', licenseKey)
      .order('updated_at', { ascending: false });

    if (remoteOrders) {
      localDb.mergeOrders(remoteOrders.map(orderFromSupabase));
      pulled += remoteOrders.length;
    }

    // ── 6. SYNC TRANSACTIONS ─────────────────────────────────
    if (rawLocal.transactions.length > 0) {
      const payload = rawLocal.transactions.map(t => transactionToSupabase(t, licenseKey));
      await client.from('transactions').upsert(payload);
      pushed += rawLocal.transactions.length;
    }

    const { data: remoteTransactions } = await client
      .from('transactions')
      .select('*')
      .eq('license_key', licenseKey)
      .order('updated_at', { ascending: false });

    if (remoteTransactions) {
      localDb.mergeTransactions(remoteTransactions.map(transactionFromSupabase));
      pulled += remoteTransactions.length;
    }

    // ── 7. SYNC EXPENSES ─────────────────────────────────────
    if (rawLocal.expenses.length > 0) {
      const payload = rawLocal.expenses.map(e => expenseToSupabase(e, licenseKey));
      await client.from('expenses').upsert(payload);
      pushed += rawLocal.expenses.length;
    }

    const { data: remoteExpenses } = await client
      .from('expenses')
      .select('*')
      .eq('license_key', licenseKey)
      .order('created_at', { ascending: false });

    if (remoteExpenses) {
      localDb.mergeExpenses(remoteExpenses.map(expenseFromSupabase));
      pulled += remoteExpenses.length;
    }

    // ── 8. SYNC FINANCIAL TRANSACTIONS ───────────────────────
    if (rawLocal.financial_transactions.length > 0) {
      const payload = rawLocal.financial_transactions.map(f => finTransactionToSupabase(f, licenseKey));
      await client.from('financial_transactions').upsert(payload);
      pushed += rawLocal.financial_transactions.length;
    }

    const { data: remoteFinTrx } = await client
      .from('financial_transactions')
      .select('*')
      .eq('license_key', licenseKey)
      .order('created_at', { ascending: false });

    if (remoteFinTrx) {
      localDb.mergeFinancialTransactions(remoteFinTrx.map(finTransactionFromSupabase));
      pulled += remoteFinTrx.length;
    }

    // Update timestamp & state
    const nowIso = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_KEY, nowIso);
    currentSyncState.lastSyncAt = nowIso;
    currentSyncState.status = 'CONNECTED';
    notifyListeners();

    return {
      success: true,
      message: `Sinkronisasi sukses untuk lisensi ${licenseKey}! (${pushed} item diunggah, ${pulled} item diperbarui dari Cloud).`,
      pushedCount: pushed,
      pulledCount: pulled,
    };
  } catch (err: any) {
    console.error('[Sync Manager Error]:', err);
    currentSyncState.status = 'ERROR';
    currentSyncState.errorMessage = err.message || 'Terjadi kesalahan sinkronisasi.';
    notifyListeners();

    return {
      success: false,
      message: `Gagal sinkronisasi: ${err.message || 'Terjadi kesalahan jaringan.'}`,
      pushedCount: pushed,
      pulledCount: pulled,
    };
  }
}

// ── REALTIME SUBSCRIPTION MANAGER (SINGLETON & RECONNECT-SAFE) ───
let activeRealtimeChannel: any = null;
let activeSubscriptionSchema = '';
let isSubscribing = false;
let autoSyncDebounceTimer: any = null;

// ── Realtime Pause Guard ────────────────────────────────────────────────────
// Used to temporarily suspend processing of incoming realtime events during
// bulk operations like clearAllTransactions so that master data (customers,
// materials, products) is not accidentally wiped by cascading DELETE events.
let realtimePaused = false;

export function pauseRealtime(): void {
  realtimePaused = true;
}

export function resumeRealtime(resyncDelay = 1500): void {
  realtimePaused = false;
  // After resuming, do a delayed re-sync to catch up with any missed events
  if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
    scheduleAutoSync(resyncDelay);
  }
}

export function scheduleAutoSync(delayMs = 2000): void {
  if (typeof window === 'undefined') return;
  if (!isSupabaseConfigured() || !navigator.onLine) return;

  if (autoSyncDebounceTimer) clearTimeout(autoSyncDebounceTimer);
  autoSyncDebounceTimer = setTimeout(() => {
    if (currentSyncState.status !== 'SYNCING') {
      syncWithSupabase().then(res => {
        if (res.success) emitSyncCompleted();
      }).catch(() => {});
    }
  }, delayMs);
}

function handleIncomingRealtimeChange(payload: any) {
  // If a bulk operation (e.g. clearAllTransactions) is in progress, ignore incoming events
  if (realtimePaused) return;

  try {
    const table = payload.table;
    const eventType = payload.eventType; // 'INSERT' | 'UPDATE' | 'DELETE'
    const activeLicenseKey = getActiveLicenseKey();

    // Verify tenant license_key matches active license
    const recordLicenseKey = (payload.new?.license_key || payload.old?.license_key || '').trim().toUpperCase();
    if (recordLicenseKey && recordLicenseKey !== activeLicenseKey) {
      // Event belongs to another tenant license, ignore
      return;
    }

    const recordId = payload.new?.id || payload.old?.id || payload.new?.license_key || payload.old?.license_key || 'unknown';

    console.log(`[REALTIME] EVENT RECEIVED\ntable: ${table}\nevent: ${eventType}\nrecord_id: ${recordId}`);
    console.log(`[SYNC] PROCESSING EVENT`);

    // Tables that affect Dashboard Hero Card — always force a UI refresh on event
    const DASHBOARD_TABLES = new Set(['transactions', 'orders', 'expenses', 'financial_transactions', 'business_settings']);

    if (eventType === 'DELETE') {
      const oldRecordId = payload.old?.id || payload.old?.license_key;
      if (oldRecordId) {
        console.log(`[SQLITE] APPLYING CHANGE`);
        const deleted = localDb.applyRemoteDelete(table, oldRecordId);
        if (deleted || DASHBOARD_TABLES.has(table)) {
          console.log(`[SQLITE] CHANGE SUCCESS`);
          console.log(`[UI] REFRESH`);
          emitSyncCompleted();
        }
      }
    } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const newRecord = payload.new;
      if (newRecord) {
        const mapped = fromSupabasePayload(table, newRecord);
        console.log(`[SQLITE] APPLYING CHANGE`);
        const updated = localDb.applyRemoteUpsert(table, mapped);
        if (updated || DASHBOARD_TABLES.has(table)) {
          console.log(`[SQLITE] CHANGE SUCCESS`);
          console.log(`[UI] REFRESH`);
          emitSyncCompleted();
        }
      }
    }
  } catch (err) {
    console.warn('[Realtime Process Warning]:', err);
    scheduleAutoSync(1000);
  }
}

export function subscribeToRealtimeChanges(force = false): void {
  if (typeof window === 'undefined') return;
  if (!isSupabaseConfigured()) return;
  if (isSubscribing && !force) return;

  const licenseKey = getActiveLicenseKey();
  if (!licenseKey) return;

  // If already subscribed to the same license and channel is alive, avoid duplicates
  if (!force && activeRealtimeChannel && activeSubscriptionSchema === licenseKey) {
    return;
  }

  console.log('[REALTIME] INITIALIZING');
  isSubscribing = true;
  const client = getSupabaseClient();
  if (!client) {
    isSubscribing = false;
    console.log('[REALTIME] STATUS: CHANNEL_ERROR');
    return;
  }

  // Safely clean up old channel before subscribing anew
  if (activeRealtimeChannel) {
    try {
      client.removeChannel(activeRealtimeChannel);
    } catch {}
    activeRealtimeChannel = null;
  }

  try {
    const channelName = `bisnisurang-sync-${licenseKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    activeSubscriptionSchema = licenseKey;

    console.log(`[REALTIME] CHANNEL CREATED`);
    console.log(`[REALTIME] SUBSCRIBING`);

    activeRealtimeChannel = client
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
        handleIncomingRealtimeChange(payload);
      })
      .on('broadcast', { event: 'clear_history' }, () => {
        console.log('[REALTIME] BROADCAST: clear_history received');
        localDb.clearAllTransactions({ resetExpenses: true, resetMovements: true });
        clearSyncQueueForHistory();
        emitDataMutation();
        emitSyncCompleted();
      })
      .subscribe((status, err) => {
        isSubscribing = false;
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] STATUS: SUBSCRIBED');
          currentSyncState.status = 'CONNECTED';
          currentSyncState.isOnline = true;
          notifyListeners();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log(`[REALTIME] STATUS: ${status}`);
          if (err) console.warn('[REALTIME] Details:', err);
          // Auto retry connection once after short delay if not intentionally closed
          if (status !== 'CLOSED') {
            setTimeout(() => {
              if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured()) {
                subscribeToRealtimeChanges(true);
              }
            }, 3000);
          } else {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
              currentSyncState.status = 'OFFLINE';
              notifyListeners();
            }
          }
        } else {
          console.log(`[REALTIME] STATUS: ${status}`);
        }
      });
  } catch (err) {
    isSubscribing = false;
    console.error('[REALTIME] STATUS: CHANNEL_ERROR', err);
  }
}

export function unsubscribeRealtime(): void {
  if (activeRealtimeChannel) {
    try {
      const client = getSupabaseClient();
      client?.removeChannel(activeRealtimeChannel);
    } catch {}
    activeRealtimeChannel = null;
    activeSubscriptionSchema = '';
  }
}

export async function broadcastClearHistory(): Promise<void> {
  if (activeRealtimeChannel) {
    try {
      await activeRealtimeChannel.send({
        type: 'broadcast',
        event: 'clear_history',
        payload: { timestamp: new Date().toISOString() },
      });
      console.log('[REALTIME] Broadcast clear_history sent');
    } catch (err) {
      console.warn('[REALTIME] Failed to send broadcast clear_history:', err);
    }
  }
}

// ── APP LIFECYCLE & NETWORK RECONNECT HANDLERS ────────────────
let systemInitialized = false;

export function initSyncSystem(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (systemInitialized) return () => {};
  systemInitialized = true;

  // 1. Initial Connection & Queue Flush
  if (navigator.onLine && isSupabaseConfigured()) {
    currentSyncState.isOnline = true;
    currentSyncState.status = 'CONNECTED';
    notifyListeners();

    setTimeout(() => {
      subscribeToRealtimeChanges();
      flushSyncQueue();
      syncWithSupabase().then(res => {
        if (res.success) emitSyncCompleted();
      }).catch(() => {});
    }, 1000);
  } else {
    currentSyncState.isOnline = false;
    currentSyncState.status = 'OFFLINE';
    notifyListeners();
  }

  // 2. Network Online Event Handler
  const handleOnline = () => {
    currentSyncState.isOnline = true;
    currentSyncState.status = 'RECONNECTING';
    notifyListeners();

    setTimeout(() => {
      subscribeToRealtimeChanges(true);
      flushSyncQueue();
      syncWithSupabase().then(res => {
        if (res.success) emitSyncCompleted();
      }).catch(() => {});
    }, 500);
  };

  // 3. Network Offline Event Handler
  const handleOffline = () => {
    currentSyncState.isOnline = false;
    currentSyncState.status = 'OFFLINE';
    notifyListeners();
  };

  // 4. Android / Browser Visibility Change (Foreground / Resume / Screen On)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      if (navigator.onLine && isSupabaseConfigured()) {
        currentSyncState.isOnline = true;
        notifyListeners();
        // Check / Re-subscribe channel safely
        subscribeToRealtimeChanges(true);
        flushSyncQueue();
        scheduleAutoSync(500);
      }
    }
  };

  // 5. Window Focus (WebView / Screen active)
  const handleWindowFocus = () => {
    if (navigator.onLine && isSupabaseConfigured()) {
      subscribeToRealtimeChanges(false);
      scheduleQueueFlush(300);
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleWindowFocus);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
    unsubscribeRealtime();
    systemInitialized = false;
  };
}
