'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { getExpenses, saveExpense, deleteExpense, generateId, getCurrentUser } from '@/lib/storage';
import type { Expense } from '@/lib/types';

function fmt(n: number) { return 'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 }); }

const CATEGORIES = ['Diesel', 'Loading/Unloading', 'Salary', 'Rent', 'Electricity', 'Transport', 'Mobile', 'Maintenance', 'Other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [filterCategory, setFilterCategory] = useState('');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('');

  useEffect(() => { load(); }, []);
  const load = () => setExpenses(getExpenses().sort((a, b) => b.date.localeCompare(a.date)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getCurrentUser();
    const expense: Expense = {
      id: generateId(), date, category, amount: Number(amount), description, paidBy,
      createdBy: user?.name || 'Unknown', createdAt: new Date().toISOString(),
    };
    saveExpense(expense);
    load();
    setShowForm(false);
    setDate(new Date().toISOString().split('T')[0]);
    setCategory(CATEGORIES[0]);
    setAmount(0);
    setDescription('');
    setPaidBy('');
  };

  const filtered = expenses.filter(e =>
    (!filterMonth || e.date.startsWith(filterMonth)) &&
    (!filterCategory || e.category === filterCategory)
  );

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: filtered.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter(x => x.total > 0);

  return (
    <AppLayout title="Expenses" allowedRoles={['admin', 'partner']}>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none" />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowForm(true)} className="ml-auto bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 font-medium text-sm">+ Add Expense</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-1 bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="text-xs text-slate-500">Total Expenses</div>
          <div className="text-2xl font-bold text-red-600">{fmt(totalFiltered)}</div>
          <div className="text-xs text-slate-400">{filtered.length} entries</div>
        </div>
        {byCategory.slice(0, 3).map(({ cat, total }) => (
          <div key={cat} className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="text-xs text-slate-500">{cat}</div>
            <div className="text-xl font-bold text-slate-700">{fmt(total)}</div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {byCategory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">Category Breakdown</h3>
          <div className="space-y-2">
            {byCategory.map(({ cat, total }) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-28 text-sm text-slate-600">{cat}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="bg-red-400 h-2 rounded-full" style={{ width: `${(total / totalFiltered * 100).toFixed(0)}%` }} />
                </div>
                <div className="w-24 text-right text-sm font-medium">{fmt(total)}</div>
                <div className="w-12 text-right text-xs text-slate-400">{(total / totalFiltered * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Paid By</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">No expenses found</td></tr>
            ) : filtered.map(e => (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{e.date}</td>
                <td className="px-4 py-3"><span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{e.category}</span></td>
                <td className="px-4 py-3 text-slate-600">{e.description || '-'}</td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(e.amount)}</td>
                <td className="px-4 py-3 text-slate-500">{e.paidBy || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => { if (confirm('Delete?')) { deleteExpense(e.id); load(); } }} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-semibold text-slate-700">Total</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(totalFiltered)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Expense Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold">Add Expense</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select required value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.) *</label>
                  <input required type="number" min="1" value={amount || ''} onChange={e => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paid By</label>
                  <input value={paidBy} onChange={e => setPaidBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 font-medium">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
