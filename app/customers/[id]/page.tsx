'use client';
import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCustomers, getSales, getRecoveries, getOrders, getCustomerBalance, getProducts, getCompanies } from '@/lib/storage';
import type { Customer, Sale, Recovery, Order } from '@/lib/types';
import Link from 'next/link';

function fmt(n: number) { return 'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 }); }

function CustomerDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [recoveries, setRecoveries] = useState<Recovery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [balance, setBalance] = useState(0);
  const [tab, setTab] = useState<'ledger' | 'sales' | 'recovery' | 'orders'>('ledger');

  useEffect(() => {
    const customers = getCustomers();
    const c = customers.find(x => x.id === id);
    if (!c) { router.replace('/customers'); return; }
    setCustomer(c);
    const allSales = getSales().filter(s => s.customerId === id).sort((a, b) => b.date.localeCompare(a.date));
    const allRecoveries = getRecoveries().filter(r => r.customerId === id).sort((a, b) => b.date.localeCompare(a.date));
    const allOrders = getOrders().filter(o => o.customerId === id).sort((a, b) => b.date.localeCompare(a.date));
    setSales(allSales);
    setRecoveries(allRecoveries);
    setOrders(allOrders);
    setBalance(getCustomerBalance(id));
  }, [id, router]);

  const products = getProducts();
  const companies = getCompanies();
  const getProductName = (pid: string) => products.find(p => p.id === pid)?.productName || pid;
  const getCompanyName = (cid: string) => companies.find(c => c.id === cid)?.name || cid;

  if (!customer) return null;

  const lastSale = sales[0];
  const lastRecovery = recoveries[0];
  const pendingOrders = orders.filter(o => o.status === 'pending');

  // Build ledger
  type LedgerEntry = { date: string; type: string; debit: number; credit: number; balance: number; note: string; };
  const ledger: LedgerEntry[] = [];
  let runBalance = customer.openingBalance;
  if (runBalance !== 0) ledger.push({ date: customer.createdAt?.split('T')[0] || '', type: 'Opening Balance', debit: runBalance > 0 ? runBalance : 0, credit: runBalance < 0 ? Math.abs(runBalance) : 0, balance: runBalance, note: '' });

  const allEntries = [
    ...sales.map(s => ({ date: s.date, type: 'Sale' as const, amount: s.paymentType === 'credit' ? s.totalAmount : 0, credit: 0, note: s.invoiceNumber, id: s.id })),
    ...recoveries.map(r => ({ date: r.date, type: 'Recovery' as const, amount: 0, credit: r.recoveryReceived, note: r.method, id: r.id })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  allEntries.forEach(e => {
    if (e.type === 'Sale' && e.amount > 0) {
      runBalance += e.amount;
      ledger.push({ date: e.date, type: 'Sale', debit: e.amount, credit: 0, balance: runBalance, note: e.note });
    } else if (e.type === 'Recovery') {
      runBalance -= e.credit;
      ledger.push({ date: e.date, type: 'Recovery', debit: 0, credit: e.credit, balance: runBalance, note: e.note });
    }
  });

  return (
    <AppLayout title="Customer Detail">
      {/* Back */}
      <div className="mb-4">
        <Link href="/customers" className="text-sm text-blue-600 hover:underline">← Back to Customers</Link>
      </div>

      {/* Customer Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                {customer.shopName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{customer.shopName}</h2>
                <div className="text-sm text-slate-500">{customer.customerId} · {customer.ownerName}</div>
              </div>
              <span className={`ml-auto text-xs px-2 py-1 rounded-full ${customer.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {customer.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Mobile:</span> <span className="font-medium">{customer.mobile}</span></div>
              <div><span className="text-slate-500">Area:</span> <span className="font-medium">{customer.area}</span></div>
              <div><span className="text-slate-500">Address:</span> <span className="font-medium">{customer.address || '-'}</span></div>
              <div><span className="text-slate-500">Salesman:</span> <span className="font-medium">{customer.assignedSalesman || '-'}</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:w-64">
            <div className="bg-slate-50 rounded-lg p-3 col-span-2">
              <div className="text-xs text-slate-500">Current Balance</div>
              <div className={`text-xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(balance)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Last Sale</div>
              <div className="text-sm font-semibold text-blue-700">{lastSale ? fmt(lastSale.totalAmount) : '-'}</div>
              <div className="text-xs text-slate-400">{lastSale?.date || ''}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Last Recovery</div>
              <div className="text-sm font-semibold text-green-700">{lastRecovery ? fmt(lastRecovery.recoveryReceived) : '-'}</div>
              <div className="text-xs text-slate-400">{lastRecovery?.date || ''}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 col-span-2">
              <div className="text-xs text-slate-500">Pending Orders</div>
              <div className="text-sm font-semibold text-yellow-700">{pendingOrders.length} order(s)</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <Link href={`/sales?customer=${id}`} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">💰 New Sale</Link>
          <Link href={`/recovery?customer=${id}`} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">🔄 Recovery</Link>
          <Link href={`/orders?customer=${id}`} className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700">📋 Next Order</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {(['ledger', 'sales', 'recovery', 'orders'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-x-auto">
          {tab === 'ledger' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Type</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Note</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Debit</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Credit</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-600">{e.date}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${e.type === 'Sale' ? 'bg-red-100 text-red-700' : e.type === 'Recovery' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{e.type}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{e.note}</td>
                    <td className="px-3 py-2 text-right text-red-600 font-medium">{e.debit > 0 ? fmt(e.debit) : '-'}</td>
                    <td className="px-3 py-2 text-right text-green-600 font-medium">{e.credit > 0 ? fmt(e.credit) : '-'}</td>
                    <td className={`px-3 py-2 text-right font-bold ${e.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(e.balance)}</td>
                  </tr>
                ))}
                {ledger.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-slate-400">No transactions</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'sales' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Invoice</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Amount</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Profit</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Type</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-600">{s.date}</td>
                    <td className="px-3 py-2 font-medium">{s.invoiceNumber}</td>
                    <td className="px-3 py-2 text-right font-semibold text-green-600">{fmt(s.totalAmount)}</td>
                    <td className="px-3 py-2 text-right text-blue-600">{fmt(s.grossProfit)}</td>
                    <td className="px-3 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded ${s.paymentType === 'credit' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{s.paymentType}</span></td>
                  </tr>
                ))}
                {sales.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">No sales</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'recovery' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Date</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Received</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Remaining</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Method</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {recoveries.map(r => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-600">{r.date}</td>
                    <td className="px-3 py-2 text-right font-semibold text-green-600">{fmt(r.recoveryReceived)}</td>
                    <td className="px-3 py-2 text-right text-orange-600">{fmt(r.remainingBalance)}</td>
                    <td className="px-3 py-2 text-center capitalize text-xs">{r.method}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{r.notes}</td>
                  </tr>
                ))}
                {recoveries.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">No recoveries</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'orders' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Product</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Bundles</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Rate</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-600">{o.date}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{getProductName(o.productId)}</div>
                      <div className="text-xs text-slate-400">{getCompanyName(o.companyId)}</div>
                    </td>
                    <td className="px-3 py-2 text-right">{o.bundles}</td>
                    <td className="px-3 py-2 text-right">{fmt(o.rate)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        o.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">No orders</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function CustomerDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-slate-500">
          Loading customer details...
        </div>
      }
    >
      <CustomerDetailContent />
    </Suspense>
  );
}
