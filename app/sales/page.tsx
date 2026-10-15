'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getSales, saveSale, deleteSale, getCustomers, getCompanies, getProducts, generateId, getNextInvoiceNumber, getCurrentUser, getCustomerBalance } from '@/lib/storage';
import type { Sale, SaleItem, Customer, Company, Product } from '@/lib/types';

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fmt(n: number) { return 'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 }); }

function SalesContent() {
  const searchParams = useSearchParams();
  const preCustomer = searchParams.get('customer') || '';

  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  // Form state
  const [date, setDate] = useState('');
  const [customerId, setCustomerId] = useState(preCustomer);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('credit');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<(SaleItem & { tempId: string })[]>([]);

  useEffect(() => {
    load();
    setDate(getLocalDateString());
    if (preCustomer) {
      setCustomerId(preCustomer);
      setShowForm(true);
    }
  }, [preCustomer]);
  const load = () => { setSales(getSales().sort((a, b) => b.date.localeCompare(a.date))); setCustomers(getCustomers()); setCompanies(getCompanies()); setProducts(getProducts()); };

  const addItem = () => setItems(prev => [...prev, {
    tempId: generateId(), companyId: '', productId: '', bundles: 1, customerRate: 0, purchaseCost: 0, totalSale: 0, totalCost: 0, grossProfit: 0
  }]);

  const updateItem = (tempId: string, field: string, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.tempId !== tempId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'productId') {
        const p = products.find(x => x.id === value);
        if (p) { updated.purchaseCost = p.purchaseCost; updated.companyId = p.companyId; }
      }
      if (field === 'companyId') { updated.productId = ''; updated.customerRate = 0; }
      const bundles = field === 'bundles' ? Number(value) : updated.bundles;
      const rate = field === 'customerRate' ? Number(value) : updated.customerRate;
      updated.totalSale = bundles * rate;
      updated.totalCost = bundles * updated.purchaseCost;
      updated.grossProfit = updated.totalSale - updated.totalCost;
      return updated;
    }));
  };

  const removeItem = (tempId: string) => setItems(prev => prev.filter(i => i.tempId !== tempId));

  const totalAmount = items.reduce((s, i) => s + i.totalSale, 0);
  const totalCost = items.reduce((s, i) => s + i.totalCost, 0);
  const grossProfit = items.reduce((s, i) => s + i.grossProfit, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { alert('Select a customer'); return; }
    if (items.length === 0) { alert('Add at least one item'); return; }
    if (items.some(i => !i.productId || i.customerRate <= 0)) { alert('Fill all item details'); return; }
    const user = getCurrentUser();
    const sale: Sale = {
      id: generateId(), invoiceNumber: getNextInvoiceNumber(), date, customerId,
      items: items.map(i => ({ companyId: i.companyId, productId: i.productId, bundles: i.bundles, customerRate: i.customerRate, purchaseCost: i.purchaseCost, totalSale: i.totalSale, totalCost: i.totalCost, grossProfit: i.grossProfit })),
      totalAmount, totalCost, grossProfit, paymentType, notes,
      createdBy: user?.name || 'Unknown', createdAt: new Date().toISOString(),
    };
    saveSale(sale);
    load();
    setShowForm(false);
    setItems([]);
    setCustomerId('');
    setNotes('');
    setPaymentType('credit');
    setDate(getLocalDateString());
  };

  const filteredSales = sales.filter(s => {
    const c = customers.find(x => x.id === s.customerId);
    return !search || c?.shopName.toLowerCase().includes(search.toLowerCase()) || s.invoiceNumber.toLowerCase().includes(search.toLowerCase());
  });

  const currentBalance = customerId ? getCustomerBalance(customerId) : 0;
  const selectedCustomer = customers.find(c => c.id === customerId);

  return (
    <AppLayout title="Sales">
      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Search by customer or invoice..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => { setShowForm(true); if (preCustomer) setCustomerId(preCustomer); }}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm">+ New Sale</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Invoice</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Profit</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No sales found</td></tr>
              ) : filteredSales.map(s => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{s.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{s.date}</td>
                  <td className="px-4 py-3">{customers.find(c => c.id === s.customerId)?.shopName || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{fmt(s.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{fmt(s.grossProfit)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${s.paymentType === 'credit' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{s.paymentType}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { if (confirm('Delete sale?')) { deleteSale(s.id); load(); } }} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-xs text-slate-400 border-t">{filteredSales.length} sales</div>
      </div>

      {/* Sale Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold">New Sale Invoice</h2>
              <button onClick={() => { setShowForm(false); setItems([]); }} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
                  <select required value={customerId} onChange={e => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Customer</option>
                    {customers.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.shopName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type</label>
                  <select value={paymentType} onChange={e => setPaymentType(e.target.value as 'cash' | 'credit')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="credit">Credit</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>

              {selectedCustomer && (
                <div className="bg-blue-50 rounded-lg p-3 flex gap-4 text-sm">
                  <div><span className="text-slate-500">Customer:</span> <strong>{selectedCustomer.shopName}</strong></div>
                  <div><span className="text-slate-500">Current Balance:</span> <strong className={currentBalance > 0 ? 'text-red-600' : 'text-green-600'}>{fmt(currentBalance)}</strong></div>
                  <div><span className="text-slate-500">Credit Limit:</span> <strong>{fmt(selectedCustomer.creditLimit)}</strong></div>
                </div>
              )}

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Sale Items (multiple companies/products allowed)</label>
                  <button type="button" onClick={addItem} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100">+ Add Item</button>
                </div>

                {items.length === 0 && <div className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">Add items to the invoice</div>}

                <div className="space-y-2">
                  {items.map(item => {
                    const compProducts = products.filter(p => p.companyId === item.companyId && p.active);
                    return (
                      <div key={item.tempId} className="bg-slate-50 p-3 rounded-lg">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-3">
                            <select value={item.companyId} onChange={e => updateItem(item.tempId, 'companyId', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none">
                              <option value="">Company</option>
                              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div className="col-span-3">
                            <select required value={item.productId} onChange={e => updateItem(item.tempId, 'productId', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none">
                              <option value="">Product</option>
                              {compProducts.map(p => <option key={p.id} value={p.id}>{p.productName}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="1" placeholder="Bundles" value={item.bundles}
                              onChange={e => updateItem(item.tempId, 'bundles', Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="0" placeholder="Customer Rate" value={item.customerRate || ''}
                              onChange={e => updateItem(item.tempId, 'customerRate', Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                          </div>
                          <div className="col-span-1 text-xs text-right">
                            <div className="text-green-600 font-medium">{fmt(item.totalSale)}</div>
                            <div className="text-blue-500">+{fmt(item.grossProfit)}</div>
                          </div>
                          <div className="col-span-1 text-right">
                            <button type="button" onClick={() => removeItem(item.tempId)} className="text-red-400 hover:text-red-600 text-xl">×</button>
                          </div>
                        </div>
                        {item.purchaseCost > 0 && (
                          <div className="mt-1 text-xs text-slate-400">Cost: Rs. {item.purchaseCost}/bundle · Total cost: {fmt(item.totalCost)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {items.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><div className="text-xs text-slate-500 mb-1">Total Amount</div><div className="text-xl font-bold text-blue-700">{fmt(totalAmount)}</div></div>
                    <div><div className="text-xs text-slate-500 mb-1">Total Cost</div><div className="text-xl font-bold text-slate-600">{fmt(totalCost)}</div></div>
                    <div><div className="text-xs text-slate-500 mb-1">Gross Profit</div><div className="text-xl font-bold text-green-600">{fmt(grossProfit)}</div></div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold">Save Invoice</button>
                <button type="button" onClick={() => { setShowForm(false); setItems([]); setCustomerId(''); }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading sales...</div>}>
      <SalesContent />
    </Suspense>
  );
}
