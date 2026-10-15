'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { getUsers, saveUser, deleteUser, generateId, getCurrentUser } from '@/lib/storage';
import type { User, UserRole } from '@/lib/types';

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  partner: 'bg-blue-100 text-blue-700',
  salesman: 'bg-green-100 text-green-700',
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  partner: 'Partner',
  salesman: 'Salesman',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('salesman');
  const [active, setActive] = useState(true);

  useEffect(() => { load(); setCurrentUser(getCurrentUser()); }, []);

  const load = () => setUsers(getUsers().sort((a, b) => a.name.localeCompare(b.name)));

  const openAdd = () => {
    setEditing(null);
    setName(''); setUsername(''); setPassword(''); setRole('salesman'); setActive(true);
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setName(u.name); setUsername(u.username); setPassword(''); setRole(u.role); setActive(u.active);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Check username uniqueness
    const existing = users.find(u => u.username === username && u.id !== editing?.id);
    if (existing) { alert('Username already taken'); return; }
    if (!editing && !password) { alert('Password required for new user'); return; }

    const user: User = {
      id: editing?.id || generateId(),
      name, username,
      password: password || editing?.password || '',
      role, active,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    saveUser(user);
    load();
    setShowForm(false);
  };

  const handleDelete = (u: User) => {
    if (u.id === currentUser?.id) { alert("You cannot delete your own account"); return; }
    if (!confirm(`Delete user "${u.name}"?`)) return;
    deleteUser(u.id);
    load();
  };

  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    partner: users.filter(u => u.role === 'partner').length,
    salesman: users.filter(u => u.role === 'salesman').length,
  };

  return (
    <AppLayout title="User Management" allowedRoles={['admin']}>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-xs text-slate-500">Total Users</div>
          <div className="text-2xl font-bold text-slate-800">{users.length}</div>
        </div>
        {(['admin', 'partner', 'salesman'] as UserRole[]).map(r => (
          <div key={r} className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="text-xs text-slate-500">{roleLabels[r]}s</div>
            <div className="text-2xl font-bold text-slate-800">{roleStats[r]}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm">+ Add User</button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Username</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Role</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className={`border-b border-slate-100 hover:bg-slate-50 ${u.id === currentUser?.id ? 'bg-blue-50/50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${u.role === 'admin' ? 'bg-red-500' : u.role === 'partner' ? 'bg-blue-500' : 'bg-green-500'}`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{u.name}</div>
                      {u.id === currentUser?.id && <div className="text-xs text-blue-500">You</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[u.role]}`}>{roleLabels[u.role]}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {u.active
                    ? <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                    : <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">Inactive</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(u)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(u)} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Permissions Guide */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm">Role Permissions</h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          {[
            { role: 'admin', color: 'text-red-600', permissions: ['Full system access', 'User management', 'All reports', 'Partnership settings', 'Stock management', 'Expenses'] },
            { role: 'partner', color: 'text-blue-600', permissions: ['Sales & recovery', 'Reports access', 'Partnership view', 'Stock management', 'Expenses', 'Purchases'] },
            { role: 'salesman', color: 'text-green-600', permissions: ['Customers', 'Sales entry', 'Recovery entry', 'Orders only', 'No financial reports', 'No stock/expenses'] },
          ].map(({ role, color, permissions }) => (
            <div key={role} className="border border-slate-200 rounded-lg p-3">
              <div className={`font-bold mb-2 capitalize ${color}`}>{role}</div>
              <ul className="space-y-1 text-slate-500">
                {permissions.map(p => <li key={p} className="flex items-center gap-1.5"><span className="text-green-400">✓</span>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Ahmad Raza" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                <input required value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 border border-slate-300 font-mono rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. ahmad123" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <select required value={role} onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="admin">Admin</option>
                  <option value="partner">Partner</option>
                  <option value="salesman">Salesman</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="active" className="text-sm text-slate-700">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">
                  {editing ? 'Update User' : 'Add User'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
