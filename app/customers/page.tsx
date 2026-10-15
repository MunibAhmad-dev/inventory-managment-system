'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { getCustomers, saveCustomer, deleteCustomer, getUsers, generateId, getCustomerBalance, getSales, getRecoveries, getOrders } from '@/lib/storage';
import type { Customer } from '@/lib/types';
import Link from 'next/link';

function fmt(n: number) { return 'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 }); }

const emptyForm = (): Partial<Customer> => ({
  shopName: '', ownerName: '', mobile: '', area: '', address: '',
  openingBalance: 0, creditLimit: 0, assignedSalesman: '', active: true,
});

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [salesmen, setSalesmen] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    load();
    setSalesmen(getUsers().filter(u => u.role === 'salesman' || u.role === 'admin').map(u => ({ id: u.id, name: u.name })));
  }, []);

  const load = () => setCustomers(getCustomers());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer: Customer = {
      id: editId || generateId(),
      customerId: `C${Date.now().toString().slice(-5)}`,
      shopName: form.shopName || '',
      ownerName: form.ownerName || '',
      mobile: form.mobile || '',
      area: form.area || '',
      address: form.address || '',
      openingBalance: Number(form.openingBalance) || 0,
      creditLimit: Number(form.creditLimit) || 0,
      assignedSalesman: form.assignedSalesman || '',
      active: form.active !== false,
      createdAt: new Date().toISOString(),
    };
    if (editId) {
      const existing = getCustomers().find(c => c.id === editId);
      if (existing) customer.customerId = existing.customerId;
      customer.createdAt = existing?.createdAt || customer.createdAt;
    }
    saveCustomer(customer);
    load();
    setShowForm(false);
    setForm(emptyForm());
    setEditId(null);
  };

  const handleEdit = (c: Customer) => {
    setForm(c);
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this customer?')) { deleteCustomer(id); load(); }
  };

  const filtered = customers.filter(c =>
    c.shopName.toLowerCase().includes(search.toLowerCase()) ||
    c.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search) ||
    c.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Customer Management">
      {/* Search + Add */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => { setForm(emptyForm()); setEditId(null); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm"
        >
          + Add Customer
        </button>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Shop</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Owner</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Mobile</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Area</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Balance</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No customers found</td></tr>
              ) : filtered.map(c => {
                const balance = getCustomerBalance(c.id);
                return (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${c.id}`} className="font-medium text-blue-600 hover:underline">{c.shopName}</Link>
                      <div className="text-xs text-slate-400">{c.customerId}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.ownerName}</td>
                    <td className="px-4 py-3 text-slate-600">{c.mobile}</td>
                    <td className="px-4 py-3 text-slate-600">{c.area}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {fmt(balance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${c.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/customers/${c.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                        <button onClick={() => handleEdit(c)} className="text-xs text-slate-600 hover:text-slate-800">Edit</button>
                        <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:text-red-700">Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
          {filtered.length} customers
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold">{editId ? 'Edit Customer' : 'Add Customer'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name *</label>
                  <input required value={form.shopName || ''} onChange={e => setForm(p => ({ ...p, shopName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name *</label>
                  <input required value={form.ownerName || ''} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
                  <input required value={form.mobile || ''} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                  <input value={form.area || ''} onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance (Rs.)</label>
                  <input type="number" min="0" value={form.openingBalance || 0} onChange={e => setForm(p => ({ ...p, openingBalance: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit (Rs.)</label>
                  <input type="number" min="0" value={form.creditLimit || 0} onChange={e => setForm(p => ({ ...p, creditLimit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Salesman</label>
                  <select value={form.assignedSalesman || ''} onChange={e => setForm(p => ({ ...p, assignedSalesman: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select...</option>
                    {salesmen.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="active" checked={form.active !== false} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
                  <label htmlFor="active" className="text-sm font-medium text-slate-700">Active</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Save</button>
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm()); setEditId(null); }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
