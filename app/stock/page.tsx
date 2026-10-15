'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { getProducts, getCompanies, getStockLevel, saveStockAdjustment, getStockAdjustments, generateId, getCurrentUser, getPurchases, getSales } from '@/lib/storage';
import type { Product, Company, StockAdjustment } from '@/lib/types';

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [filterCompany, setFilterCompany] = useState('');
  const [showAdjForm, setShowAdjForm] = useState(false);
  const [adjProductId, setAdjProductId] = useState('');
  const [adjType, setAdjType] = useState<'increase' | 'decrease'>('increase');
  const [adjQty, setAdjQty] = useState(1);
  const [adjReason, setAdjReason] = useState('');
  const [adjDate, setAdjDate] = useState('');
  const [tab, setTab] = useState<'stock' | 'adjustments'>('stock');

  useEffect(() => {
    load();
    setAdjDate(getLocalDateString());
  }, []);
  const load = () => { setProducts(getProducts()); setCompanies(getCompanies()); setAdjustments(getStockAdjustments().sort((a, b) => b.date.localeCompare(a.date))); };

  const handleAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getCurrentUser();
    const adj: StockAdjustment = {
      id: generateId(), date: adjDate, productId: adjProductId, quantity: adjQty,
      type: adjType, reason: adjReason, createdBy: user?.name || 'Unknown', createdAt: new Date().toISOString(),
    };
    saveStockAdjustment(adj);
    load();
    setShowAdjForm(false);
    setAdjProductId(''); setAdjQty(1); setAdjReason('');
  };

  const filtered = products.filter(p => !filterCompany || p.companyId === filterCompany);
  const lowStockCount = filtered.filter(p => getStockLevel(p.id) <= 5).length;

  return (
    <AppLayout title="Stock Management" allowedRoles={['admin', 'partner']}>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('stock')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'stock' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Stock Levels</button>
        <button onClick={() => setTab('adjustments')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'adjustments' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Adjustments</button>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-semibold text-red-700">Low Stock Alert</div>
            <div className="text-sm text-red-600">{lowStockCount} product(s) have 5 or fewer bundles in stock</div>
          </div>
        </div>
      )}

      {tab === 'stock' && (
        <>
          <div className="flex gap-3 mb-4">
            <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
              className="px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none">
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setShowAdjForm(true)}
              className="ml-auto bg-orange-500 text-white px-4 py-2.5 rounded-lg hover:bg-orange-600 font-medium text-sm">Stock Adjustment</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Company</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Purchased</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Sold</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Adjusted</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Current Stock</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">No products found</td></tr>
                ) : filtered.map(p => {
                  const purchases = getPurchases();
                  const sales = getSales();
                  const adjList = getStockAdjustments().filter(a => a.productId === p.id);

                  const purchased = purchases.reduce((sum, pur) => {
                    const item = pur.items.find(i => i.productId === p.id);
                    return sum + (item ? item.bundles : 0);
                  }, 0);

                  const sold = sales.reduce((sum, s) => {
                    const item = s.items.find(i => i.productId === p.id);
                    return sum + (item ? item.bundles : 0);
                  }, 0);

                  const adjusted = adjList.reduce((sum, a) => sum + (a.type === 'increase' ? a.quantity : -a.quantity), 0);
                  const current = purchased - sold + adjusted;

                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{p.productName}</td>
                      <td className="px-4 py-3 text-slate-600">{companies.find(c => c.id === p.companyId)?.name || '-'}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{purchased}</td>
                      <td className="px-4 py-3 text-right text-red-600">{sold}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{adjusted >= 0 ? '+' : ''}{adjusted}</td>
                      <td className={`px-4 py-3 text-right text-lg font-bold ${current <= 5 ? 'text-red-600' : current <= 20 ? 'text-orange-600' : 'text-green-600'}`}>{current}</td>
                      <td className="px-4 py-3 text-center">
                        {current <= 0 ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Out of Stock</span>
                        ) : current <= 5 ? (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Low Stock</span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">In Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'adjustments' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAdjForm(true)} className="bg-orange-500 text-white px-4 py-2.5 rounded-lg hover:bg-orange-600 font-medium text-sm">+ New Adjustment</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Quantity</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Reason</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">By</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">No adjustments</td></tr>
                ) : adjustments.map(a => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-600">{a.date}</td>
                    <td className="px-4 py-3">{products.find(p => p.id === a.productId)?.productName || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${a.type === 'increase' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.type}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{a.type === 'increase' ? '+' : '-'}{a.quantity}</td>
                    <td className="px-4 py-3 text-slate-500">{a.reason}</td>
                    <td className="px-4 py-3 text-slate-500">{a.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Adjustment Form */}
      {showAdjForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold">Stock Adjustment</h2>
            </div>
            <form onSubmit={handleAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input required type="date" value={adjDate} onChange={e => setAdjDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product *</label>
                <select required value={adjProductId} onChange={e => setAdjProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.productName} ({companies.find(c => c.id === p.companyId)?.name})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                  <select value={adjType} onChange={e => setAdjType(e.target.value as 'increase' | 'decrease')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                  <input required type="number" min="1" value={adjQty} onChange={e => setAdjQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
                <input required value={adjReason} onChange={e => setAdjReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Damaged, Return, etc." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 font-medium">Save</button>
                <button type="button" onClick={() => setShowAdjForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
