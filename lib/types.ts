export type UserRole = 'admin' | 'partner' | 'salesman';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  active: boolean;
}

export interface Product {
  id: string;
  companyId: string;
  productName: string;
  category: string;
  bundleUnit: number;
  purchaseCost: number;
  active: boolean;
}

export interface Customer {
  id: string;
  customerId: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  area: string;
  address: string;
  openingBalance: number;
  creditLimit: number;
  assignedSalesman: string;
  active: boolean;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  bundles: number;
  purchaseRate: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  date: string;
  companyId: string;
  reference: string;
  items: PurchaseItem[];
  totalCost: number;
  createdBy: string;
  createdAt: string;
}

export interface SaleItem {
  companyId: string;
  productId: string;
  bundles: number;
  customerRate: number;
  purchaseCost: number;
  totalSale: number;
  totalCost: number;
  grossProfit: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  paymentType: 'cash' | 'credit';
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface Recovery {
  id: string;
  date: string;
  customerId: string;
  previousBalance: number;
  recoveryReceived: number;
  remainingBalance: number;
  method: 'cash' | 'bank' | 'easypaisa' | 'other';
  notes: string;
  createdBy: string;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  date: string;
  customerId: string;
  companyId: string;
  productId: string;
  bundles: number;
  expectedDeliveryDate: string;
  rate: number;
  remarks: string;
  status: OrderStatus;
  createdBy: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  type: 'increase' | 'decrease';
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  paidBy: string;
  createdBy: string;
  createdAt: string;
}

export interface Partnership {
  id: string;
  partner1Name: string;
  partner2Name: string;
  ratio1: number;
  ratio2: number;
}

export interface PartnerDrawing {
  id: string;
  date: string;
  partnerName: string;
  amount: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface StockLevel {
  productId: string;
  productName: string;
  companyId: string;
  companyName: string;
  currentStock: number;
}
