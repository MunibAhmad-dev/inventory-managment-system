'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { getSales, getRecoveries, getCustomers, getProducts, getCompanies, getExpenses, getOrders, getPurchases, getStockLevel, getCustomerBalance } from '@/lib/storage';
import type { Sale, Recovery, Customer, Product, Company, Expense, Order, Purchase } from '@/lib/types';

function fmt(n: number) { return 'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 }); }

type ReportType = 'daily-sales' | 'weekly-sales' | 'monthly-sales' | 'daily-recovery' | 'weekly-recovery' |
  'customer-outstanding' | 'customer-ledger' | 'company-sales' | 'product-sales' |
  'stock' | 'purchase' | 'expense' | 'gross-profit' | 'net-profit' | 'next-week-orders' | 'overdue';

export default function ReportsPage() {
  const [report, setReport] = useState<ReportType>('daily-sales');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCustomer, setSelectedCustomer] = useState('');

  const [sales, setSales] = useState<Sale[]>([]);
  const [recoveries, setRecoveries] = useState<Recovery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    setSales(getSales()); setRecoveries(getRecoveries()); setCustomers(getCustomers());
    setProducts(getProducts()); setCompanies(getCompanies()); setExpenses(getExpenses());
    setOrders(getOrders()); setPurchases(getPurchases());
  }, []);

  const fSales = sales.filter(s => s.date >= startDate && s.date <= endDate);
  const fRecoveries = recoveries.filter(r => r.date >= startDate && r.date <= endDate);
  const fExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);
  const fPurchases = purchases.filter(p => p.date >= startDate && p.date <= endDate);

  const totalSales = fSales.reduce((s, x) => s + x.totalAmount, 0);
  const totalRecovery = fRecoveries.reduce((s, x) => s + x.recoveryReceived, 0);
  const totalGrossProfit = fSales.reduce((s, x) => s + x.grossProfit, 0);
  const totalExpenses = fExpenses.reduce((s, x) => s + x.amount, 0);
  const netProfit = totalGrossProfit - totalExpenses;

  const reports: { type: ReportType; label: string }[] = [
    { type: 'daily-sales', label: '1. Daily Sales' },
    { type: 'weekly-sales', label: '2. Weekly Sales' },
    { type: 'monthly-sales', label: '3. Monthly Sales' },
    { type: 'daily-recovery', label: '4. Daily Recovery' },
    { type: 'weekly-recovery', label: '5. Weekly Recovery' },
    { type: 'customer-outstanding', label: '6. Customer Outstanding' },
    { type: 'customer-ledger', label: '7. Customer Ledger' },
    { type: 'company-sales', label: '8. Company-wise Sales' },
    { type: 'product-sales', label: '9. Product-wise Sales' },
    { type: 'stock', label: '10. Stock Report' },
    { type: 'purchase', label: '11. Purchase Report' },
    { type: 'expense', label: '12. Expense Report' },
    { type: 'gross-profit', label: '13. Gross Profit' },
    { type: 'net-profit', label: '14. Net Profit' },
    { type: 'next-week-orders', label: '15. Next Week Orders' },
    { type: 'overdue', label: '16. Overdue Customers' },
  ];

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.shopName || id;
  const getProductName = (id: string) => products.find(p => p.id === id)?.productName || id;
  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || id;

  return (
    <AppLayout title="Reports" allowedRoles={['admin', 'partner']}>
      <div className="flex gap-4 h-[calc(100vh-10rem)]">
        {/* Sidebar */}
        <div className="w-52 bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex-shrink-0">
          <div className="p-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reports</div>
          {reports.map(r => (
            <button key={r.type} onClick={() => setReport(r.type)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${report === r.type ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {report === 'customer-ledger' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer</label>
                <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none">
                  <option value="">All Customers</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.shopName}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <button onClick={() => { const t = new Date().toISOString().split('T')[0]; setStartDate(t); setEndDate(t); }}
                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200">Today</button>
              <button onClick={() => {
                const d = new Date(); d.setDate(d.getDate() - d.getDay());
                setStartDate(d.toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200">This Week</button>
              <button onClick={() => {
                const d = new Date();
                setStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
                setEndDate(new Date().toISOString().split('T')[0]);
              }} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200">This Month</button>
            </div>
          </div>

          {/* Summary Cards */}
          {['daily-sales', 'weekly-sales', 'monthly-sales', 'gross-profit', 'net-profit'].includes(report) && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100"><div className="text-xs text-slate-500">Sales</div><div className="text-lg font-bold text-blue-700">{fmt(totalSales)}</div></div>
              <div className="bg-green-50 rounded-xl p-3 border border-green-100"><div className="text-xs text-slate-500">Recovery</div><div className="text-lg font-bold text-green-700">{fmt(totalRecovery)}</div></div>
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100"><div className="text-xs text-slate-500">Gross Profit</div><div className="text-lg font-bold text-purple-700">{fmt(totalGrossProfit)}</div></div>
              <div className={`rounded-xl p-3 border ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <div className="text-xs text-slate-500">Net Profit</div>
                <div className={`text-lg font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(netProfit)}</div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-auto">
            {/* Sales Reports */}
            {['daily-sales', 'weekly-sales', 'monthly-sales'].includes(report) && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Invoice</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Profit</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {fSales.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-slate-400">No data</td></tr>
                    : fSales.map(s => (
                      <tr key={s.id} className="border-b border-slate-100">
                        <td className="px-4 py-2.5 font-medium">{s.invoiceNumber}</td>
                        <td className="px-4 py-2.5 text-slate-600">{s.date}</td>
                        <td className="px-4 py-2.5">{getCustomerName(s.customerId)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-600">{fmt(s.totalAmount)}</td>
                        <td className="px-4 py-2.5 text-right text-blue-600">{fmt(s.grossProfit)}</td>
                        <td className="px-4 py-2.5 text-center"><span className={`text-xs px-2 py-0.5 rounded ${s.paymentType === 'credit' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{s.paymentType}</span></td>
                      </tr>
                    ))}
                </tbody>
                {fSales.length > 0 && <tfoot className="bg-slate-50 border-t-2">
                  <tr><td colSpan={3} className="px-4 py-3 font-bold">Total ({fSales.length})</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(totalSales)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(totalGrossProfit)}</td><td></td></tr>
                </tfoot>}
              </table>
            )}

            {/* Recovery Reports */}
            {['daily-recovery', 'weekly-recovery'].includes(report) && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Prev Balance</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Received</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Remaining</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {fRecoveries.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-slate-400">No data</td></tr>
                    : fRecoveries.map(r => (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="px-4 py-2.5 text-slate-600">{r.date}</td>
                        <td className="px-4 py-2.5 font-medium">{getCustomerName(r.customerId)}</td>
                        <td className="px-4 py-2.5 text-right text-orange-600">{fmt(r.previousBalance)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-600">{fmt(r.recoveryReceived)}</td>
                        <td className="px-4 py-2.5 text-right text-red-600">{fmt(r.remainingBalance)}</td>
                        <td className="px-4 py-2.5 text-center text-xs capitalize">{r.method}</td>
                      </tr>
                    ))}
                </tbody>
                {fRecoveries.length > 0 && <tfoot className="bg-slate-50 border-t-2">
                  <tr><td colSpan={3} className="px-4 py-3 font-bold">Total ({fRecoveries.length})</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(totalRecovery)}</td><td colSpan={2}></td></tr>
                </tfoot>}
              </table>
            )}

            {/* Customer Outstanding */}
            {report === 'customer-outstanding' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Area</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Mobile</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Balance</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Credit Limit</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.filter(c => c.active).map(c => {
                    const bal = getCustomerBalance(c.id);
                    const overLimit = bal > c.creditLimit;
                    return bal > 0 ? (
                      <tr key={c.id} className="border-b border-slate-100">
                        <td className="px-4 py-2.5 font-medium">{c.shopName}</td>
                        <td className="px-4 py-2.5 text-slate-600">{c.area}</td>
                        <td className="px-4 py-2.5 text-slate-600">{c.mobile}</td>
                        <td className={`px-4 py-2.5 text-right font-bold ${overLimit ? 'text-red-600' : 'text-orange-600'}`}>{fmt(bal)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500">{fmt(c.creditLimit)}</td>
                        <td className="px-4 py-2.5 text-center">
                          {overLimit ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Over Limit</span>
                            : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Outstanding</span>}
                        </td>
                      </tr>
                    ) : null;
                  })}
                </tbody>
              </table>
            )}

            {/* Customer Ledger */}
            {report === 'customer-ledger' && (
              <div className="p-4">
                {customers.filter(c => !selectedCustomer || c.id === selectedCustomer).map(c => {
                  const cSales = fSales.filter(s => s.customerId === c.id && s.paymentType === 'credit');
                  const cRecoveries = fRecoveries.filter(r => r.customerId === c.id);
                  if (cSales.length === 0 && cRecoveries.length === 0) return null;
                  return (
                    <div key={c.id} className="mb-6">
                      <div className="font-bold text-slate-800 mb-2">{c.shopName} <span className="text-sm text-slate-400 font-normal">({c.area})</span></div>
                      <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold">Date</th>
                            <th className="text-left px-3 py-2 font-semibold">Type</th>
                            <th className="text-right px-3 py-2 font-semibold">Debit</th>
                            <th className="text-right px-3 py-2 font-semibold">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cSales.map(s => <tr key={s.id} className="border-t border-slate-100"><td className="px-3 py-1.5">{s.date}</td><td className="px-3 py-1.5">Sale ({s.invoiceNumber})</td><td className="px-3 py-1.5 text-right text-red-600">{fmt(s.totalAmount)}</td><td className="px-3 py-1.5"></td></tr>)}
                          {cRecoveries.map(r => <tr key={r.id} className="border-t border-slate-100"><td className="px-3 py-1.5">{r.date}</td><td className="px-3 py-1.5">Recovery ({r.method})</td><td className="px-3 py-1.5"></td><td className="px-3 py-1.5 text-right text-green-600">{fmt(r.recoveryReceived)}</td></tr>)}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t font-semibold">
                          <tr><td colSpan={2} className="px-3 py-2">Balance</td>
                            <td className="px-3 py-2 text-right text-red-600">{fmt(cSales.reduce((s, x) => s + x.totalAmount, 0))}</td>
                            <td className="px-3 py-2 text-right text-green-600">{fmt(cRecoveries.reduce((s, x) => s + x.recoveryReceived, 0))}</td></tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Company-wise Sales */}
            {report === 'company-sales' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Company</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Invoices</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Bundles Sold</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Sales Amount</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Gross Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(co => {
                    const coItems = fSales.flatMap(s => s.items.filter(i => i.companyId === co.id));
                    if (coItems.length === 0) return null;
                    return (
                      <tr key={co.id} className="border-b border-slate-100">
                        <td className="px-4 py-2.5 font-medium">{co.name}</td>
                        <td className="px-4 py-2.5 text-right">{fSales.filter(s => s.items.some(i => i.companyId === co.id)).length}</td>
                        <td className="px-4 py-2.5 text-right">{coItems.reduce((s, i) => s + i.bundles, 0)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-600">{fmt(coItems.reduce((s, i) => s + i.totalSale, 0))}</td>
                        <td className="px-4 py-2.5 text-right text-blue-600">{fmt(coItems.reduce((s, i) => s + i.grossProfit, 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Product-wise Sales */}
            {report === 'product-sales' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Company</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Bundles</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Sales</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const pItems = fSales.flatMap(s => s.items.filter(i => i.productId === p.id));
                    if (pItems.length === 0) return null;
                    return (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="px-4 py-2.5 font-medium">{p.productName}</td>
                        <td className="px-4 py-2.5 text-slate-600">{getCompanyName(p.companyId)}</td>
                        <td className="px-4 py-2.5 text-right">{pItems.reduce((s, i) => s + i.bundles, 0)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-600">{fmt(pItems.reduce((s, i) => s + i.totalSale, 0))}</td>
                        <td className="px-4 py-2.5 text-right text-blue-600">{fmt(pItems.reduce((s, i) => s + i.grossProfit, 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Stock Report */}
            {report === 'stock' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Company</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock (Bundles)</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Value</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const stock = getStockLevel(p.id);
                    return (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="px-4 py-2.5 font-medium">{p.productName}</td>
                        <td className="px-4 py-2.5">{getCompanyName(p.companyId)}</td>
                        <td className={`px-4 py-2.5 text-right font-bold ${stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>{stock}</td>
                        <td className="px-4 py-2.5 text-right">{fmt(stock * p.purchaseCost)}</td>
                        <td className="px-4 py-2.5 text-center">
                          {stock <= 0 ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Out of Stock</span>
                            : stock <= 5 ? <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Low</span>
                              : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Purchase Report */}
            {report === 'purchase' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Company</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Reference</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Items</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {fPurchases.map(p => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="px-4 py-2.5">{p.date}</td>
                      <td className="px-4 py-2.5 font-medium">{getCompanyName(p.companyId)}</td>
                      <td className="px-4 py-2.5 text-slate-500">{p.reference || '-'}</td>
                      <td className="px-4 py-2.5 text-right">{p.items.length}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-blue-600">{fmt(p.totalCost)}</td>
                    </tr>
                  ))}
                  {fPurchases.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No data</td></tr>}
                </tbody>
                {fPurchases.length > 0 && <tfoot className="bg-slate-50 border-t-2">
                  <tr><td colSpan={4} className="px-4 py-3 font-bold">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(fPurchases.reduce((s, p) => s + p.totalCost, 0))}</td></tr>
                </tfoot>}
              </table>
            )}

            {/* Expense Report */}
            {report === 'expense' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Paid By</th>
                  </tr>
                </thead>
                <tbody>
                  {fExpenses.map(e => (
                    <tr key={e.id} className="border-b border-slate-100">
                      <td className="px-4 py-2.5">{e.date}</td>
                      <td className="px-4 py-2.5"><span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{e.category}</span></td>
                      <td className="px-4 py-2.5 text-slate-500">{e.description}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-red-600">{fmt(e.amount)}</td>
                      <td className="px-4 py-2.5 text-slate-500">{e.paidBy}</td>
                    </tr>
                  ))}
                  {fExpenses.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No data</td></tr>}
                </tbody>
                {fExpenses.length > 0 && <tfoot className="bg-slate-50 border-t-2">
                  <tr><td colSpan={3} className="px-4 py-3 font-bold">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">{fmt(totalExpenses)}</td><td></td></tr>
                </tfoot>}
              </table>
            )}

            {/* Profit Reports */}
            {['gross-profit', 'net-profit'].includes(report) && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="text-sm text-slate-500 mb-1">Total Sales</div>
                    <div className="text-2xl font-bold text-green-700">{fmt(totalSales)}</div>
                    <div className="text-xs text-slate-400">{fSales.length} invoices</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <div className="text-sm text-slate-500 mb-1">Total Cost</div>
                    <div className="text-2xl font-bold text-red-600">{fmt(fSales.reduce((s, x) => s + x.totalCost, 0))}</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="text-sm text-slate-500 mb-1">Gross Profit</div>
                    <div className="text-2xl font-bold text-purple-700">{fmt(totalGrossProfit)}</div>
                    <div className="text-xs text-slate-400">Margin: {totalSales > 0 ? ((totalGrossProfit / totalSales) * 100).toFixed(1) : 0}%</div>
                  </div>
                </div>
                {report === 'net-profit' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                      <div className="text-sm text-slate-500 mb-1">Business Expenses</div>
                      <div className="text-2xl font-bold text-orange-600">{fmt(totalExpenses)}</div>
                    </div>
                    <div></div>
                    <div className={`rounded-xl p-4 border ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="text-sm text-slate-500 mb-1">Net Profit</div>
                      <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(netProfit)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Next Week Orders */}
            {report === 'next-week-orders' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Bundles</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Rate</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Delivery</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => o.status !== 'cancelled').map(o => (
                    <tr key={o.id} className="border-b border-slate-100">
                      <td className="px-4 py-2.5 font-medium">{getCustomerName(o.customerId)}</td>
                      <td className="px-4 py-2.5">{getProductName(o.productId)}</td>
                      <td className="px-4 py-2.5 text-right">{o.bundles}</td>
                      <td className="px-4 py-2.5 text-right">{fmt(o.rate)}</td>
                      <td className="px-4 py-2.5 text-slate-500">{o.expectedDeliveryDate || '-'}</td>
                      <td className="px-4 py-2.5 text-center"><span className={`text-xs px-2 py-0.5 rounded ${o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : o.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{o.status}</span></td>
                    </tr>
                  ))}
                  {orders.filter(o => o.status !== 'cancelled').length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No orders</td></tr>}
                </tbody>
              </table>
            )}

            {/* Overdue Customers */}
            {report === 'overdue' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Area</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Mobile</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Balance</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Credit Limit</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Over By</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.filter(c => {
                    const bal = getCustomerBalance(c.id);
                    return bal > c.creditLimit && c.active;
                  }).map(c => {
                    const bal = getCustomerBalance(c.id);
                    return (
                      <tr key={c.id} className="border-b border-slate-100 bg-red-50">
                        <td className="px-4 py-2.5 font-medium">{c.shopName}</td>
                        <td className="px-4 py-2.5 text-slate-600">{c.area}</td>
                        <td className="px-4 py-2.5">{c.mobile}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-red-600">{fmt(bal)}</td>
                        <td className="px-4 py-2.5 text-right">{fmt(c.creditLimit)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-red-700">{fmt(bal - c.creditLimit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
