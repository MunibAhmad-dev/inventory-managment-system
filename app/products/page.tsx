'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { getProducts, saveProduct, deleteProduct, getCompanies, saveCompany, generateId, getStockLevel } from '@/lib/storage';
import type { Product, Company } from '@/lib/types';

const emptyProduct = (): Partial<Product> => ({
  companyId: '', productName: '', category: '', bundleUnit: 1, purchaseCost: 0, active: true,
});

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Product>>(emptyProduct());
  const [editId, setEditId] = useState<string | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [tab, setTab] = useState<'products' | 'companies'>('products');

  useEffect(() => { load(); }, []);
  const load = () => { setProducts(getProducts()); setCompanies(getCompanies()); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p: Product = {
      id: editId || generateId(),
      companyId: form.companyId || '',
      productName: form.productName || '',
      category: form.category || '',
      bundleUnit: Number(form.bundleUnit) || 1,
      purchaseCost: Number(form.purchaseCost) || 0,
      active: form.active !== false,
    };
    saveProduct(p); load(); setShowForm(false); setForm(emptyProduct()); setEditId(null);
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim()) return;
    saveCompany({ id: generateId(), name: newCompany.trim(), active: true });
    load(); setNewCompany(''); setShowCompanyForm(false);
  };

  const filtered = products.filter(p =>
    (p.productName.toLowerCase().includes(search.toLowerCase()) ||
     companies.find(c => c.id === p.companyId)?.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCompany || p.companyId === filterCompany)
  );

  return (
    <AppLayout title="Products & Companies" allowedRoles={['admin', 'partner']}>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('products')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'products' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Products</button>
        <button onClick={() => setTab('companies')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'companies' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Companies</button>
      </div>

      {tab === 'products' && (
        <>
          <div className="flex gap-3 mb-4">
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
              className="px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none">
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => { setForm(emptyProduct()); setEditId(null); setShowForm(true); }}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm">+ Add Product</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Company</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Cost/Bundle</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">No products found</td></tr>
                ) : filtered.map(p => {
                  const stock = getStockLevel(p.id);
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{p.productName}</td>
                      <td className="px-4 py-3 text-slate-600">{companies.find(c => c.id === p.companyId)?.name || '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{p.category || '-'}</td>
                      <td className="px-4 py-3 text-right">Rs. {p.purchaseCost.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                        {stock} {stock <= 5 && <span className="text-xs">⚠️</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {p.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setForm(p); setEditId(p.id); setShowForm(true); }} className="text-xs text-slate-600 hover:text-slate-800">Edit</button>
                          <button onClick={() => { if (confirm('Delete?')) { deleteProduct(p.id); load(); } }} className="text-xs text-red-500 hover:text-red-700">Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">{filtered.length} products</div>
          </div>
        </>
      )}

      {tab === 'companies' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowCompanyForm(true)} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm">+ Add Company</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Company Name</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Products</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{products.filter(p => p.companyId === c.id).length}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${c.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{c.active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { const updated = { ...c, active: !c.active }; saveCompany(updated); load(); }} className="text-xs text-slate-600 hover:text-slate-800">Toggle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold">{editId ? 'Edit Product' : 'Add Product'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                <select required value={form.companyId || ''} onChange={e => setForm(p => ({ ...p, companyId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <input required value={form.productName || ''} onChange={e => setForm(p => ({ ...p, productName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bundle Unit</label>
                  <input type="number" min="1" value={form.bundleUnit || 1} onChange={e => setForm(p => ({ ...p, bundleUnit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Cost (Rs.) *</label>
                  <input required type="number" min="0" value={form.purchaseCost || 0} onChange={e => setForm(p => ({ ...p, purchaseCost: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="pactive" checked={form.active !== false} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
                  <label htmlFor="pactive" className="text-sm font-medium text-slate-700">Active</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Save</button>
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyProduct()); setEditId(null); }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Form Modal */}
      {showCompanyForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">Add Company</h2>
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                <input required value={newCompany} onChange={e => setNewCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Add</button>
                <button type="button" onClick={() => { setShowCompanyForm(false); setNewCompany(''); }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
