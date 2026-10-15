'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getRecoveries, saveRecovery, deleteRecovery, getCustomers, generateId, getCurrentUser, getCustomerBalance } from '@/lib/storage';
import type { Recovery, Customer } from '@/lib/types';

function fmt(n: number) { return 'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 }); }

export default function RecoveryPage() {
  const searchParams = useSearchParams();
  const preCustomer = searchParams.get('customer') || '';

  const [recoveries, setRecoveries] = useState<Recovery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState(preCustomer);
  const [recoveryReceived, setRecoveryReceived] = useState(0);
  const [method, setMethod] = useState<'cash' | 'bank' | 'easypaisa' | 'other'>('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => { load(); if (preCustomer) setShowForm(true); }, [preCustomer]);
  const load = () => { setRecoveries(getRecoveries().sort((a, b) => b.date.localeCompare(a.date))); setCustomers(getCustomers()); };

  const currentBalance = customerId ? getCustomerBalance(customerId) : 0;
  const remainingBalance = currentBalance - recoveryReceived;
  const selectedCustomer = customers.find(c => c.id === customerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { alert('Select a customer'); return; }
    if (recoveryReceived <= 0) { alert('Enter recovery amount'); return; }
    const user = getCurrentUser();
    const recovery: Recovery = {
      id: generateId(), date, customerId,
      previousBalance: currentBalance,
      recoveryReceived, remainingBalance,
      method, notes,
      createdBy: user?.name || 'Unknown', createdAt: new Date().toISOString(),
    };
    saveRecovery(recovery);
    load();
    setShowForm(false);
    setCustomerId('');
    setRecoveryReceived(0);
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const filtered = recoveries.filter(r => {
    const c = customers.find(x => x.id === r.customerId);
    return !search || c?.shopName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AppLayout title="Weekly Recovery">
      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Search by customer..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => { setShowForm(true); if (preCustomer) setCustomerId(preCustomer); }}
          className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium text-sm">+ New Recovery</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Prev Balance</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Received</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Remaining</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Method</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No recoveries found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{r.date}</td>
                  <td className="px-4 py-3 font-medium">{customers.find(c => c.id === r.customerId)?.shopName || '-'}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{fmt(r.previousBalance)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{fmt(r.recoveryReceived)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{fmt(r.remainingBalance)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">{r.method}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { if (confirm('Delete recovery?')) { deleteRecovery(r.id); load(); } }} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-xs text-slate-400 border-t">{filtered.length} recoveries</div>
      </div>

      {/* Recovery Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold">New Recovery</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {selectedCustomer && (
                <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-amber-800">{selectedCustomer.shopName}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-2">
                      <div className="text-xs text-slate-500">Previous Balance</div>
                      <div className="font-bold text-orange-600">{fmt(currentBalance)}</div>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <div className="text-xs text-slate-500">After Recovery</div>
                      <div className={`font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(Math.max(0, remainingBalance))}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recovery Received (Rs.) *</label>
                  <input required type="number" min="1" value={recoveryReceived || ''}
                    onChange={e => setRecoveryReceived(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method *</label>
                  <select value={method} onChange={e => setMethod(e.target.value as typeof method)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="easypaisa">Easypaisa/JazzCash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold">Save Recovery</button>
                <button type="button" onClick={() => { setShowForm(false); setCustomerId(''); setRecoveryReceived(0); }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
