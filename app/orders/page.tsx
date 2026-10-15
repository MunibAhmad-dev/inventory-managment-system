'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getOrders, saveOrder, deleteOrder, getCustomers, getCompanies, getProducts, generateId, getCurrentUser, saveSale, getNextInvoiceNumber } from '@/lib/storage';
import type { Order, Customer, Company, Product, OrderStatus } from '@/lib/types';

function fmt(n: number) { return 'Rs. ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 }); }

function todayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const preCustomer = searchParams.get('customer') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState('');

  const [date, setDate] = useState('');
  const [customerId, setCustomerId] = useState(preCustomer);
  const [companyId, setCompanyId] = useState('');
  const [productId, setProductId] = useState('');
  const [bundles, setBundles] = useState(1);
  const [rate, setRate] = useState(0);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    load();
    if (preCustomer) {
      setCustomerId(preCustomer);
      setShowForm(true);
    }
  }, [preCustomer]);

  // Initialize the date in the browser after mount, not during prerendering.
  useEffect(() => {
    setDate(todayLocalDate());
  }, []);
  const load = () => { setOrders(getOrders().sort((a, b) => b.date.localeCompare(a.date))); setCustomers(getCustomers()); setCompanies(getCompanies()); setProducts(getProducts()); };

  const companyProducts = products.filter(p => p.companyId === companyId && p.active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !productId) { alert('Fill all required fields'); return; }
    const user = getCurrentUser();
    const order: Order = {
      id: generateId(), date, customerId, companyId, productId,
      bundles, expectedDeliveryDate, rate, remarks,
      status: 'pending', createdBy: user?.name || 'Unknown', createdAt: new Date().toISOString(),
    };
    saveOrder(order);
    load();
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerId(preCustomer); setCompanyId(''); setProductId(''); setBundles(1); setRate(0); setExpectedDeliveryDate(''); setRemarks('');
    setDate(todayLocalDate());
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    saveOrder({ ...o, status });
    load();
  };

  const convertToSale = (order: Order) => {
    const product = products.find(p => p.id === order.productId);
    if (!product) { alert('Product not found'); return; }
    const user = getCurrentUser();
    const sale = {
      id: generateId(), invoiceNumber: getNextInvoiceNumber(), date: todayLocalDate(),
      customerId: order.customerId,
      items: [{
        companyId: order.companyId, productId: order.productId, bundles: order.bundles,
        customerRate: order.rate, purchaseCost: product.purchaseCost,
        totalSale: order.bundles * order.rate,
        totalCost: order.bundles * product.purchaseCost,
        grossProfit: order.bundles * (order.rate - product.purchaseCost),
      }],
      totalAmount: order.bundles * order.rate,
      totalCost: order.bundles * product.purchaseCost,
      grossProfit: order.bundles * (order.rate - product.purchaseCost),
      paymentType: 'credit' as const, notes: `Converted from order`,
      createdBy: user?.name || 'Unknown', createdAt: new Date().toISOString(),
    };
    saveSale(sale);
    saveOrder({ ...order, status: 'delivered' });
    load();
    alert(`Converted to invoice ${sale.invoiceNumber}`);
  };

  const filtered = orders.filter(o => {
    const c = customers.find(x => x.id === o.customerId);
    return (!search || c?.shopName.toLowerCase().includes(search.toLowerCase())) &&
      (!filterStatus || o.status === filterStatus);
  });

  return (
    <AppLayout title="Next Week Orders">
      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Search by customer..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => { setShowForm(true); }}
          className="bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 font-medium text-sm">+ New Order</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Bundles</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Rate</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Delivery</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">No orders found</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{o.date}</td>
                  <td className="px-4 py-3 font-medium">{customers.find(c => c.id === o.customerId)?.shopName || '-'}</td>
                  <td className="px-4 py-3">
                    <div>{products.find(p => p.id === o.productId)?.productName || '-'}</div>
                    <div className="text-xs text-slate-400">{companies.find(c => c.id === o.companyId)?.name}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{o.bundles}</td>
                  <td className="px-4 py-3 text-right">{fmt(o.rate)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{o.expectedDeliveryDate || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value as OrderStatus)}
                      className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${statusColors[o.status]}`}>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {o.status === 'pending' && (
                        <button onClick={() => { if (confirm('Convert to sale?')) convertToSale(o); }}
                          className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100">→ Sale</button>
                      )}
                      <button onClick={() => { if (confirm('Delete?')) { deleteOrder(o.id); load(); } }} className="text-xs text-red-500 hover:text-red-700">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-xs text-slate-400 border-t">{filtered.length} orders</div>
      </div>

      {/* Order Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold">New Order</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                  <select required value={companyId} onChange={e => { setCompanyId(e.target.value); setProductId(''); }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product *</label>
                  <select required value={productId} onChange={e => {
                    setProductId(e.target.value);
                    const p = products.find(x => x.id === e.target.value);
                    if (p) setRate(p.purchaseCost);
                  }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Product</option>
                    {companyProducts.map(p => <option key={p.id} value={p.id}>{p.productName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bundles *</label>
                  <input required type="number" min="1" value={bundles} onChange={e => setBundles(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rate (Rs.) *</label>
                  <input required type="number" min="0" value={rate || ''}  onChange={e => setRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery Date</label>
                  <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                  <input value={remarks} onChange={e => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {bundles > 0 && rate > 0 && (
                <div className="bg-purple-50 rounded-lg p-3 text-right text-sm">
                  <span className="text-slate-500">Order Value: </span>
                  <span className="font-bold text-purple-700">{fmt(bundles * rate)}</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold">Save Order</button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-slate-500">
          Loading orders...
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
