export type ProductType = 'SERVICE' | 'PHYSICAL' | 'CETAK' | 'DESAIN' | 'JASA' | 'DIGITAL' | 'MERCHANDISE';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS' | 'OTHER';

export type OrderStatus = 'BARU' | 'DIPROSES' | 'SIAP DIAMBIL' | 'SELESAI' | 'BATAL';

export type PaymentStatus = 'BELUM_BAYAR' | 'DP' | 'LUNAS';

export type InventoryMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type MovementType = InventoryMovementType;

export type InventoryRefType = 'POS' | 'ORDER' | 'RESTOCK' | 'MANUAL' | 'WASTE';

export type FinancialType = 'INCOME' | 'EXPENSE';
export type TransactionType = FinancialType;

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

export interface Customer {
  id: string;
  name: string;
  whatsapp?: string;
  phone?: string;
  address?: string;
  notes?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastTransactionDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Material {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  purchasePrice?: number;
  unitCost: number; // Harga beli per satuan
  supplier?: string;
  supplierContact?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryMovement {
  id: string;
  materialId: string;
  materialName: string;
  type: InventoryMovementType;
  quantity: number;
  previousStock?: number;
  newStock?: number;
  referenceType?: InventoryRefType | string;
  referenceId?: string;
  notes?: string;
  date?: string;
  createdAt?: string;
}

export interface ProductComponent {
  id: string;
  materialId?: string;
  componentName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  subtotal: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  type: ProductType;
  sellingPrice: number;
  costPrice: number; // HPP (sum of components or base cost)
  profit?: number;
  profitMargin?: number; // percentage
  marginPercent?: number; // percentage alias
  laborCost?: number;
  machineCost?: number;
  otherCost?: number;
  trackStock?: boolean;
  minStock?: number;
  currentStock?: number;
  unit?: string;
  description?: string;
  isActive?: boolean;
  imagePath?: string;
  thumbnailPath?: string;
  components?: ProductComponent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number; // HPP per unit
  subtotal: number;
  imagePath?: string;
  thumbnailPath?: string;
  notes?: string;
}

export interface OrderFile {
  id: string;
  orderId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  url: string;
  notes?: string;
  createdAt: string;
}

export interface OrderPaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  deadlineDate: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  totalCost: number; // Total HPP
  paidAmount: number;
  remainingAmount: number;
  notes: string;
  payments: OrderPaymentRecord[];
  files: OrderFile[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
  imagePath?: string;
  thumbnailPath?: string;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  type: 'POS' | 'ORDER_PAYMENT';
  orderId?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  totalCost: number;
  profit: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: FinancialType;
  category: string;
  description: string;
  amount: number;
  referenceNumber?: string;
  referenceType?: 'POS' | 'ORDER' | 'EXPENSE' | 'MANUAL';
  referenceId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt?: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayProfit: number;
  todayTransactionsCount: number;
  activeOrdersCount: number;
  todayExpense: number;
  thisMonthRevenue: number;
  thisMonthProfit: number;
  thisMonthExpense: number;
  totalCashBalance?: number;
  lowStockItemsCount: number;
}

export type ViewType =
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'customers'
  | 'products'
  | 'hpp'
  | 'inventory'
  | 'finance'
  | 'expenses'
  | 'invoices'
  | 'sales-report'
  | 'profit-report'
  | 'stock-report'
  | 'settings'
  | 'app-info'
  | 'menu'
  | 'guide'
  | 'contact'
  | 'support'
  | 'profile'
  | 'business-profile'
  | 'activation'
  | 'backup';
