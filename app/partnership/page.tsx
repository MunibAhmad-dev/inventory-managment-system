'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { getPartnership, savePartnership, getPartnerDrawings, savePartnerDrawing, deletePartnerDrawing, generateId, getCurrentUser, getNetProfit, getGrossProfit, getTotalExpenses } from '@/lib/storage';
import type { Partnership, PartnerDrawing } from '@/lib/types';

function fmt(n: number) { return 'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 }); }

export default function PartnershipPage() {
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [drawings, setDrawings] = useState<PartnerDrawing[]>([]);
  const [showDrawingForm, setShowDrawingForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [drawPartner, setDrawPartner] = useState('');
  const [drawAmount, setDrawAmount] = useState(0);
  const [drawDesc, setDrawDesc] = useState('');

  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [ratio1, setRatio1] = useState(50);
  const [ratio2, setRatio2] = useState(50);

  useEffect(() => {
    const now = new Date().toISOString();
    setFilterMonth(now.slice(0, 7));
    setDrawDate(now.split('T')[0]);
    load();
  }, []);
  const load = () => {
    const p = getPartnership();
    setPartnership(p);
    if (p) { setP1Name(p.partner1Name); setP2Name(p.partner2Name); setRatio1(p.ratio1); setRatio2(p.ratio2); drawPartner || setDrawPartner(p.partner1Name); }
    setDrawings(getPartnerDrawings().sort((a, b) => b.date.localeCompare(a.date)));
  };

  const handleSavePartnership = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratio1 + ratio2 !== 100) { alert('Ratios must sum to 100'); return; }
    const p: Partnership = { id: partnership?.id || generateId(), partner1Name: p1Name, partner2Name: p2Name, ratio1, ratio2 };
    savePartnership(p);
    load();
    setShowPartnerForm(false);
  };

  const handleDrawing = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getCurrentUser();
    const d: PartnerDrawing = {
      id: generateId(), date: drawDate, partnerName: drawPartner, amount: drawAmount,
      description: drawDesc, createdBy: user?.name || 'Unknown', createdAt: new Date().toISOString(),
    };
    savePartnerDrawing(d);
    load();
    setShowDrawingForm(false);
    setDrawAmount(0);
    setDrawDesc('');
  };

  // Financial calculation
  const ms = `${filterMonth}-01`;
  const me = `${filterMonth}-31`;
  const netProfit = getNetProfit(ms, me);
  const grossProfit = getGrossProfit(ms, me);
  const totalExpenses = getTotalExpenses(ms, me);

  const p1Share = partnership ? (netProfit * partnership.ratio1 / 100) : 0;
  const p2Share = partnership ? (netProfit * partnership.ratio2 / 100) : 0;

  const fDrawings = drawings.filter(d => d.date.startsWith(filterMonth));
  const p1Drawings = fDrawings.filter(d => d.partnerName === partnership?.partner1Name).reduce((s, d) => s + d.amount, 0);
  const p2Drawings = fDrawings.filter(d => d.partnerName === partnership?.partner2Name).reduce((s, d) => s + d.amount, 0);

  const p1Remaining = p1Share - p1Drawings;
  const p2Remaining = p2Share - p2Drawings;

  return (
    <AppLayout title="Partnership" allowedRoles={['admin', 'partner']}>
      {/* Month filter */}
      <div className="flex items-center gap-3 mb-6">
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none" />
        <div className="ml-auto flex gap-2">
          <button onClick={() => setShowPartnerForm(true)} className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium">⚙️ Settings</button>
          <button onClick={() => setShowDrawingForm(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium">+ Drawing</button>
        </div>
      </div>

      {!partnership ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🤝</div>
          <p className="text-slate-500 mb-4">Partnership not configured yet</p>
          <button onClick={() => setShowPartnerForm(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700">Configure Partnership</button>
        </div>
      ) : (
        <>
          {/* Profit Overview */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="text-xs text-slate-500">Gross Profit</div>
              <div className="text-2xl font-bold text-green-700">{fmt(grossProfit)}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="text-xs text-slate-500">Expenses</div>
              <div className="text-2xl font-bold text-red-600">{fmt(totalExpenses)}</div>
            </div>
            <div className={`rounded-xl p-4 border ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs text-slate-500">Net Profit</div>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(netProfit)}</div>
            </div>
          </div>

          {/* Partner Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { name: partnership.partner1Name, ratio: partnership.ratio1, share: p1Share, drawings: p1Drawings, remaining: p1Remaining },
              { name: partnership.partner2Name, ratio: partnership.ratio2, share: p2Share, drawings: p2Drawings, remaining: p2Remaining },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${i === 0 ? 'bg-blue-600' : 'bg-purple-600'}`}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{p.name}</div>
                    <div className={`text-sm font-medium ${i === 0 ? 'text-blue-600' : 'text-purple-600'}`}>{p.ratio}% share</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Profit Share</span>
                    <span className="font-semibold text-green-600">{fmt(p.share)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Drawings Taken</span>
                    <span className="font-semibold text-red-500">{fmt(p.drawings)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-semibold text-slate-700">Remaining</span>
                    <span className={`font-bold text-lg ${p.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(p.remaining)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Drawings Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-700">Drawings History</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Partner</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fDrawings.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">No drawings this month</td></tr>
                ) : fDrawings.map(d => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-600">{d.date}</td>
                    <td className="px-4 py-3 font-medium">{d.partnerName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(d.amount)}</td>
                    <td className="px-4 py-3 text-slate-500">{d.description || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { if (confirm('Delete?')) { deletePartnerDrawing(d.id); load(); } }} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Partnership Settings Modal */}
      {showPartnerForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b"><h2 className="text-lg font-bold">Partnership Settings</h2></div>
            <form onSubmit={handleSavePartnership} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Partner 1 Name *</label>
                  <input required value={p1Name} onChange={e => setP1Name(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Partner 1 Share (%) *</label>
                  <input required type="number" min="1" max="99" value={ratio1} onChange={e => { setRatio1(Number(e.target.value)); setRatio2(100 - Number(e.target.value)); }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Partner 2 Name *</label>
                  <input required value={p2Name} onChange={e => setP2Name(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Partner 2 Share (%) *</label>
                  <input required type="number" min="1" max="99" value={ratio2} onChange={e => { setRatio2(Number(e.target.value)); setRatio1(100 - Number(e.target.value)); }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {ratio1 + ratio2 !== 100 && <div className="text-red-500 text-sm">Ratios must sum to 100%</div>}
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Save</button>
                <button type="button" onClick={() => setShowPartnerForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawing Form Modal */}
      {showDrawingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b"><h2 className="text-lg font-bold">Add Drawing</h2></div>
            <form onSubmit={handleDrawing} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input required type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Partner *</label>
                  <select required value={drawPartner} onChange={e => setDrawPartner(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {partnership && <>
                      <option value={partnership.partner1Name}>{partnership.partner1Name}</option>
                      <option value={partnership.partner2Name}>{partnership.partner2Name}</option>
                    </>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.) *</label>
                  <input required type="number" min="1" value={drawAmount || ''} onChange={e => setDrawAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input value={drawDesc} onChange={e => setDrawDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 font-medium">Save</button>
                <button type="button" onClick={() => setShowDrawingForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
