'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { getPurchases, savePurchase, deletePurchase, getCompanies, getProducts, generateId, getCurrentUser } from '@/lib/storage';
import type { Purchase, PurchaseItem, Company, Product } from '@/lib/types';

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fmt(n: number) { return 'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 }); }

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [reference, setReference] = useState('');
  const [items, setItems] = useState<(PurchaseItem & { tempId: string })[]>([]);

  useEffect(() => {
    load();
    setDate(getLocalDateString());
  }, []);
  const load = () => { setPurchases(getPurchases().sort((a, b) => b.date.localeCompare(a.date))); setCompanies(getCompanies()); setProducts(getProducts()); };

  const addItem = () => setItems(prev => [...prev, { tempId: generateId(), productId: '', bundles: 1, purchaseRate: 0, totalCost: 0 }]);

  const updateItem = (tempId: string, field: string, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.tempId !== tempId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'bundles' || field === 'purchaseRate') {
        updated.totalCost = updated.bundles * updated.purchaseRate;
      }
      if (field === 'productId') {
        const p = products.find(x => x.id === value);
        if (p) { updated.purchaseRate = p.purchaseCost; updated.totalCost = updated.bundles * p.purchaseCost; }
      }
      return updated;
    }));
  };

  const removeItem = (tempId: string) => setItems(prev => prev.filter(i => i.tempId !== tempId));

  const totalCost = items.reduce((s, i) => s + i.totalCost, 0);
  const companyProducts = products.filter(p => p.companyId === companyId && p.active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { alert('Add at least one item'); return; }
    if (items.some(i => !i.productId)) { alert('Select product for all items'); return; }
    const user = getCurrentUser();
    const purchase: Purchase = {
      id: generateId(), date, companyId, reference,
      items: items.map(i => ({ productId: i.productId, bundles: i.bundles, purchaseRate: i.purchaseRate, totalCost: i.totalCost })),
      totalCost, createdBy: user?.name || 'Unknown', createdAt: new Date().toISOString(),
    };
    savePurchase(purchase);
    load();
    setShowForm(false);
    setItems([]);
    setCompanyId('');
    setReference('');
    setDate(getLocalDateString());
  };

  return (
    <AppLayout title="Purchase Management" allowedRoles={['admin', 'partner']}>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm">+ New Purchase</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Company</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Reference</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Items</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Total Cost</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No purchases yet</td></tr>
              ) : purchases.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{p.date}</td>
                  <td className="px-4 py-3 font-medium">{companies.find(c => c.id === p.companyId)?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.reference || '-'}</td>
                  <td className="px-4 py-3 text-right">{p.items.length}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-600">{fmt(p.totalCost)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { if (confirm('Delete purchase? Stock will be affected.')) { deletePurchase(p.id); load(); } }}
                      className="text-xs text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold">New Purchase</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                  <select required value={companyId} onChange={e => { setCompanyId(e.target.value); setItems([]); }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Invoice/Reference</label>
                  <input value={reference} onChange={e => setReference(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Products</label>
                  <button type="button" onClick={addItem} disabled={!companyId}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 disabled:opacity-50">+ Add Item</button>
                </div>
                {items.length === 0 && <div className="text-sm text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-lg">Select a company then add items</div>}
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.tempId} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-lg">
                      <div className="col-span-5">
                        <select required value={item.productId} onChange={e => updateItem(item.tempId, 'productId', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Select Product</option>
                          {companyProducts.map(p => <option key={p.id} value={p.id}>{p.productName}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="1" placeholder="Bundles" value={item.bundles}
                          onChange={e => updateItem(item.tempId, 'bundles', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="0" placeholder="Rate" value={item.purchaseRate}
                          onChange={e => updateItem(item.tempId, 'purchaseRate', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold text-slate-700">
                        {fmt(item.totalCost)}
                      </div>
                      <div className="col-span-1 text-right">
                        <button type="button" onClick={() => removeItem(item.tempId)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {items.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 text-right">
                  <span className="text-sm text-slate-600">Total Cost: </span>
                  <span className="text-xl font-bold text-blue-700">{fmt(totalCost)}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Save Purchase</button>
                <button type="button" onClick={() => { setShowForm(false); setItems([]); setCompanyId(''); setReference(''); }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
