'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { getSales, getRecoveries, getCustomers, getProducts, getOrders, getExpenses, getGrossProfit, getNetProfit, getStockLevel, getPurchases } from '@/lib/storage';
import type { Sale, Recovery, Order } from '@/lib/types';
import Link from 'next/link';

function fmt(n: number) { return 'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 }); }

function today() { return new Date().toISOString().split('T')[0]; }
function thisWeekStart() {
  const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0];
}
function thisMonthStart() {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

interface KPI { label: string; value: string; sub?: string; color: string; icon: string; href?: string; }

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [recentRecoveries, setRecentRecoveries] = useState<Recovery[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const t = today();
    const ws = thisWeekStart();
    const ms = thisMonthStart();

    const sales = getSales();
    const recoveries = getRecoveries();
    const customers = getCustomers();
    const products = getProducts().filter(p => p.active);
    const orders = getOrders();

    const todaySales = sales.filter(s => s.date === t).reduce((sum, s) => sum + s.totalAmount, 0);
    const weekSales = sales.filter(s => s.date >= ws).reduce((sum, s) => sum + s.totalAmount, 0);
    const monthSales = sales.filter(s => s.date >= ms).reduce((sum, s) => sum + s.totalAmount, 0);

    const todayRecovery = recoveries.filter(r => r.date === t).reduce((sum, r) => sum + r.recoveryReceived, 0);
    const weekRecovery = recoveries.filter(r => r.date >= ws).reduce((sum, r) => sum + r.recoveryReceived, 0);

    const totalOutstanding = customers.reduce((sum, c) => {
      const bal = c.openingBalance +
        sales.filter(s => s.customerId === c.id && s.paymentType === 'credit').reduce((s2, s) => s2 + s.totalAmount, 0) -
        recoveries.filter(r => r.customerId === c.id).reduce((s2, r) => s2 + r.recoveryReceived, 0);
      return sum + Math.max(0, bal);
    }, 0);

    const grossProfit = getGrossProfit(ms);
    const netProfit = getNetProfit(ms);

    const lowStock = products.filter(p => getStockLevel(p.id) <= 5).length;
    setLowStockCount(lowStock);

    setKpis([
      { label: "Today's Sales", value: fmt(todaySales), sub: `Week: ${fmt(weekSales)}`, color: 'bg-blue-500', icon: '💰', href: '/sales' },
      { label: "Today's Recovery", value: fmt(todayRecovery), sub: `Week: ${fmt(weekRecovery)}`, color: 'bg-green-500', icon: '🔄', href: '/recovery' },
      { label: 'Total Outstanding', value: fmt(totalOutstanding), sub: `${customers.length} customers`, color: 'bg-orange-500', icon: '⚠️', href: '/reports' },
      { label: 'Month Sales', value: fmt(monthSales), sub: `Gross Profit: ${fmt(grossProfit)}`, color: 'bg-purple-500', icon: '📊', href: '/reports' },
      { label: 'Net Profit (Month)', value: fmt(netProfit), sub: netProfit >= 0 ? 'Profitable' : 'Loss', color: netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500', icon: '📈', href: '/reports' },
      { label: 'Low Stock Items', value: lowStock.toString(), sub: `${products.length} total products`, color: lowStock > 0 ? 'bg-red-500' : 'bg-slate-500', icon: '🏭', href: '/stock' },
    ]);

    setPendingOrders(orders.filter(o => o.status === 'pending').slice(0, 5));
    setRecentSales(sales.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5));
    setRecentRecoveries(recoveries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5));
  }, []);

  const customers = getCustomers();
  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.shopName || id;

  return (
    <AppLayout title="Dashboard">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kpis.map((k, i) => (
          <Link key={i} href={k.href || '#'} className="block">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{k.icon}</span>
                <span className={`w-3 h-3 rounded-full ${k.color}`}></span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{k.value}</div>
              <div className="text-sm font-medium text-slate-600 mt-1">{k.label}</div>
              {k.sub && <div className="text-xs text-slate-400 mt-0.5">{k.sub}</div>}
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700">Pending Orders</h3>
            <Link href="/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {pendingOrders.length === 0 ? (
            <p className="text-sm text-slate-400">No pending orders</p>
          ) : (
            <div className="space-y-2">
              {pendingOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{getCustomerName(o.customerId)}</div>
                    <div className="text-xs text-slate-400">{o.date} · {o.bundles} bundles</div>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700">Recent Sales</h3>
            <Link href="/sales" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-sm text-slate-400">No sales yet</p>
          ) : (
            <div className="space-y-2">
              {recentSales.map(s => (
                <div key={s.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{getCustomerName(s.customerId)}</div>
                    <div className="text-xs text-slate-400">{s.date} · {s.invoiceNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">{fmt(s.totalAmount)}</div>
                    <div className="text-xs text-slate-400 capitalize">{s.paymentType}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Recoveries */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700">Recent Recoveries</h3>
            <Link href="/recovery" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recentRecoveries.length === 0 ? (
            <p className="text-sm text-slate-400">No recoveries yet</p>
          ) : (
            <div className="space-y-2">
              {recentRecoveries.map(r => (
                <div key={r.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{getCustomerName(r.customerId)}</div>
                    <div className="text-xs text-slate-400">{r.date} · {r.method}</div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">{fmt(r.recoveryReceived)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
