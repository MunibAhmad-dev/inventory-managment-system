import type {
  User, Company, Product, Customer, Purchase, Sale,
  Recovery, Order, StockAdjustment, Expense, Partnership,
  PartnerDrawing, ActivityLog
} from './types';

const KEYS = {
  users: 'skt_users',
  companies: 'skt_companies',
  products: 'skt_products',
  customers: 'skt_customers',
  purchases: 'skt_purchases',
  sales: 'skt_sales',
  recoveries: 'skt_recoveries',
  orders: 'skt_orders',
  stockAdjustments: 'skt_stock_adjustments',
  expenses: 'skt_expenses',
  partnership: 'skt_partnership',
  partnerDrawings: 'skt_partner_drawings',
  activityLogs: 'skt_activity_logs',
  currentUser: 'skt_current_user',
  invoiceCounter: 'skt_invoice_counter',
};

function get<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function set<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getNextInvoiceNumber(): string {
  if (typeof window === 'undefined') return 'INV-0001';
  const current = parseInt(localStorage.getItem(KEYS.invoiceCounter) || '0', 10);
  const next = current + 1;
  localStorage.setItem(KEYS.invoiceCounter, next.toString());
  return `INV-${next.toString().padStart(4, '0')}`;
}

// Auth
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem(KEYS.currentUser);
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem(KEYS.currentUser, JSON.stringify(user));
  else localStorage.removeItem(KEYS.currentUser);
}

export function login(username: string, password: string): User | null {
  const users = get<User>(KEYS.users);
  return users.find(u => u.username === username && u.password === password && u.active) || null;
}

// Users
export function getUsers(): User[] { return get<User>(KEYS.users); }
export function saveUser(user: User): void {
  const users = get<User>(KEYS.users);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user; else users.push(user);
  set(KEYS.users, users);
}
export function deleteUser(id: string): void {
  set(KEYS.users, get<User>(KEYS.users).filter(u => u.id !== id));
}

// Companies
export function getCompanies(): Company[] { return get<Company>(KEYS.companies); }
export function saveCompany(c: Company): void {
  const all = get<Company>(KEYS.companies);
  const idx = all.findIndex(x => x.id === c.id);
  if (idx >= 0) all[idx] = c; else all.push(c);
  set(KEYS.companies, all);
}
export function deleteCompany(id: string): void {
  set(KEYS.companies, get<Company>(KEYS.companies).filter(c => c.id !== id));
}

// Products
export function getProducts(): Product[] { return get<Product>(KEYS.products); }
export function saveProduct(p: Product): void {
  const all = get<Product>(KEYS.products);
  const idx = all.findIndex(x => x.id === p.id);
  if (idx >= 0) all[idx] = p; else all.push(p);
  set(KEYS.products, all);
}
export function deleteProduct(id: string): void {
  set(KEYS.products, get<Product>(KEYS.products).filter(p => p.id !== id));
}

// Customers
export function getCustomers(): Customer[] { return get<Customer>(KEYS.customers); }
export function saveCustomer(c: Customer): void {
  const all = get<Customer>(KEYS.customers);
  const idx = all.findIndex(x => x.id === c.id);
  if (idx >= 0) all[idx] = c; else all.push(c);
  set(KEYS.customers, all);
}
export function deleteCustomer(id: string): void {
  set(KEYS.customers, get<Customer>(KEYS.customers).filter(c => c.id !== id));
}

export function getCustomerBalance(customerId: string): number {
  const customer = getCustomers().find(c => c.id === customerId);
  const openingBalance = customer?.openingBalance || 0;
  const sales = getSales().filter(s => s.customerId === customerId && s.paymentType === 'credit');
  const recoveries = getRecoveries().filter(r => r.customerId === customerId);
  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalRecovery = recoveries.reduce((sum, r) => sum + r.recoveryReceived, 0);
  return openingBalance + totalSales - totalRecovery;
}

// Purchases
export function getPurchases(): Purchase[] { return get<Purchase>(KEYS.purchases); }
export function savePurchase(p: Purchase): void {
  const all = get<Purchase>(KEYS.purchases);
  const idx = all.findIndex(x => x.id === p.id);
  if (idx >= 0) all[idx] = p; else all.push(p);
  set(KEYS.purchases, all);
}
export function deletePurchase(id: string): void {
  set(KEYS.purchases, get<Purchase>(KEYS.purchases).filter(p => p.id !== id));
}

// Sales
export function getSales(): Sale[] { return get<Sale>(KEYS.sales); }
export function saveSale(s: Sale): void {
  const all = get<Sale>(KEYS.sales);
  const idx = all.findIndex(x => x.id === s.id);
  if (idx >= 0) all[idx] = s; else all.push(s);
  set(KEYS.sales, all);
}
export function deleteSale(id: string): void {
  set(KEYS.sales, get<Sale>(KEYS.sales).filter(s => s.id !== id));
}

// Recoveries
export function getRecoveries(): Recovery[] { return get<Recovery>(KEYS.recoveries); }
export function saveRecovery(r: Recovery): void {
  const all = get<Recovery>(KEYS.recoveries);
  const idx = all.findIndex(x => x.id === r.id);
  if (idx >= 0) all[idx] = r; else all.push(r);
  set(KEYS.recoveries, all);
}
export function deleteRecovery(id: string): void {
  set(KEYS.recoveries, get<Recovery>(KEYS.recoveries).filter(r => r.id !== id));
}

// Orders
export function getOrders(): Order[] { return get<Order>(KEYS.orders); }
export function saveOrder(o: Order): void {
  const all = get<Order>(KEYS.orders);
  const idx = all.findIndex(x => x.id === o.id);
  if (idx >= 0) all[idx] = o; else all.push(o);
  set(KEYS.orders, all);
}
export function deleteOrder(id: string): void {
  set(KEYS.orders, get<Order>(KEYS.orders).filter(o => o.id !== id));
}

// Stock Adjustments
export function getStockAdjustments(): StockAdjustment[] { return get<StockAdjustment>(KEYS.stockAdjustments); }
export function saveStockAdjustment(a: StockAdjustment): void {
  const all = get<StockAdjustment>(KEYS.stockAdjustments);
  all.push(a);
  set(KEYS.stockAdjustments, all);
}

export function getStockLevel(productId: string): number {
  const purchases = getPurchases();
  const sales = getSales();
  const adjustments = getStockAdjustments();

  const purchased = purchases.reduce((sum, p) => {
    const item = p.items.find(i => i.productId === productId);
    return sum + (item ? item.bundles : 0);
  }, 0);

  const sold = sales.reduce((sum, s) => {
    const item = s.items.find(i => i.productId === productId);
    return sum + (item ? item.bundles : 0);
  }, 0);

  const adjusted = adjustments
    .filter(a => a.productId === productId)
    .reduce((sum, a) => sum + (a.type === 'increase' ? a.quantity : -a.quantity), 0);

  return purchased - sold + adjusted;
}

// Expenses
export function getExpenses(): Expense[] { return get<Expense>(KEYS.expenses); }
export function saveExpense(e: Expense): void {
  const all = get<Expense>(KEYS.expenses);
  const idx = all.findIndex(x => x.id === e.id);
  if (idx >= 0) all[idx] = e; else all.push(e);
  set(KEYS.expenses, all);
}
export function deleteExpense(id: string): void {
  set(KEYS.expenses, get<Expense>(KEYS.expenses).filter(e => e.id !== id));
}

// Partnership
export function getPartnership(): Partnership | null {
  if (typeof window === 'undefined') return null;
  try {
    const p = localStorage.getItem(KEYS.partnership);
    return p ? JSON.parse(p) : null;
  } catch { return null; }
}
export function savePartnership(p: Partnership): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.partnership, JSON.stringify(p));
}

export function getPartnerDrawings(): PartnerDrawing[] { return get<PartnerDrawing>(KEYS.partnerDrawings); }
export function savePartnerDrawing(d: PartnerDrawing): void {
  const all = get<PartnerDrawing>(KEYS.partnerDrawings);
  all.push(d);
  set(KEYS.partnerDrawings, all);
}
export function deletePartnerDrawing(id: string): void {
  set(KEYS.partnerDrawings, get<PartnerDrawing>(KEYS.partnerDrawings).filter(d => d.id !== id));
}

// Activity Logs
export function getActivityLogs(): ActivityLog[] { return get<ActivityLog>(KEYS.activityLogs); }
export function logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
  const all = get<ActivityLog>(KEYS.activityLogs);
  all.unshift({ ...log, id: generateId(), timestamp: new Date().toISOString() });
  if (all.length > 500) all.splice(500);
  set(KEYS.activityLogs, all);
}

// Profit calculations
export function getGrossProfit(startDate?: string, endDate?: string): number {
  let sales = getSales();
  if (startDate) sales = sales.filter(s => s.date >= startDate);
  if (endDate) sales = sales.filter(s => s.date <= endDate);
  return sales.reduce((sum, s) => sum + s.grossProfit, 0);
}

export function getTotalExpenses(startDate?: string, endDate?: string): number {
  let expenses = getExpenses();
  if (startDate) expenses = expenses.filter(e => e.date >= startDate);
  if (endDate) expenses = expenses.filter(e => e.date <= endDate);
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getNetProfit(startDate?: string, endDate?: string): number {
  return getGrossProfit(startDate, endDate) - getTotalExpenses(startDate, endDate);
}

// Seed initial data
export function seedInitialData(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('skt_seeded')) return;

  const adminUser: User = {
    id: generateId(), name: 'Admin', username: 'admin',
    password: 'admin123', role: 'admin', active: true,
    createdAt: new Date().toISOString()
  };
  const partnerUser: User = {
    id: generateId(), name: 'Partner 1', username: 'partner1',
    password: 'partner123', role: 'partner', active: true,
    createdAt: new Date().toISOString()
  };
  const salesmanUser: User = {
    id: generateId(), name: 'Salesman 1', username: 'salesman1',
    password: 'sales123', role: 'salesman', active: true,
    createdAt: new Date().toISOString()
  };
  set(KEYS.users, [adminUser, partnerUser, salesmanUser]);

  const companies: Company[] = [
    { id: generateId(), name: 'HB Foods', active: true },
    { id: generateId(), name: 'H&S Foods', active: true },
    { id: generateId(), name: 'Dubai Foods', active: true },
    { id: generateId(), name: 'Qadir Foods', active: true },
    { id: generateId(), name: 'Irfan Foods', active: true },
  ];
  set(KEYS.companies, companies);

  const partnership: Partnership = {
    id: generateId(), partner1Name: 'Partner 1',
    partner2Name: 'Partner 2', ratio1: 50, ratio2: 50
  };
  localStorage.setItem(KEYS.partnership, JSON.stringify(partnership));

  localStorage.setItem('skt_seeded', 'true');
}
