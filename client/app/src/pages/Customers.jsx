import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { apiRequest } from '../api/client';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const customerKey = (name, email) => (email || name || '').trim().toLowerCase();

function collectCustomers(orders, sales) {
  const customers = new Map();
  const get = (record) => {
    const name = record.customerName?.trim();
    const email = record.customerEmail?.trim() || '';
    if (!name && !email) return null;
    const key = customerKey(name, email);
    if (!customers.has(key)) customers.set(key, { id: key, name: name || email, email, orders: 0, spend: 0, lastVisit: null });
    const customer = customers.get(key);
    if (!customer.name && name) customer.name = name;
    if (!customer.email && email) customer.email = email;
    return customer;
  };
  for (const order of orders) {
    const customer = get(order);
    if (customer) {
      customer.orders += 1;
      const date = new Date(order.updatedAt || order.createdAt);
      if (!customer.lastVisit || date > customer.lastVisit) customer.lastVisit = date;
    }
  }
  for (const sale of sales) {
    const customer = get(sale);
    if (customer) {
      if (sale.status === 'COMPLETED') customer.spend += Number(sale.totalAmount) || 0;
      const date = new Date(sale.updatedAt || sale.createdAt);
      if (!customer.lastVisit || date > customer.lastVisit) customer.lastVisit = date;
    }
  }
  return [...customers.values()].sort((a, b) => b.orders - a.orders || a.name.localeCompare(b.name));
}

export default function Customers() {
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [orderResult, saleResult] = await Promise.all([
        apiRequest('/api/orders?limit=100', { authenticated: true }),
        apiRequest('/api/sales?limit=100', { authenticated: true }),
      ]);
      setOrders(orderResult.data.orders || []);
      setSales(saleResult.data.sales || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Customer activity could not be loaded.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const customers = useMemo(() => collectCustomers(orders, sales), [orders, sales]);
  const filtered = customers.filter((customer) => `${customer.name} ${customer.email}`.toLowerCase().includes(search.toLowerCase()));
  const totalSpend = customers.reduce((sum, customer) => sum + customer.spend, 0);

  return <div className="dashboard-shell"><Sidebar /><motion.main className="customers-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
    <header className="customers-header"><div><span className="eyebrow">Management</span><h1>Customers</h1><p>Customer list built from your saved orders and sales.</p></div><button className="secondary-button" type="button" onClick={load} disabled={loading}>Refresh</button></header>
    {error && <div className="form-message form-message--error" role="alert">{error}</div>}
    <section className="customers-metrics" aria-label="Customer summary">
      <article><span>Customers</span><strong>{customers.length}</strong></article>
      <article><span>Orders</span><strong>{orders.length}</strong></article>
      <article><span>Recorded sales</span><strong>{money.format(totalSpend)}</strong></article>
    </section>
    <section className="customers-directory"><div className="customers-directory__tools"><div><h2>Customer directory</h2><p>Names and contact details come from order and sale history.</p></div><input type="search" aria-label="Search customers" placeholder="Search customers" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <div className="customers-table-wrap"><table className="customers-table"><thead><tr><th>Customer</th><th>Email</th><th>Orders</th><th>Sales total</th><th>Last activity</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="5">Loading customers…</td></tr> : filtered.length ? filtered.map((customer) => <tr key={customer.id}><td>{customer.name}</td><td>{customer.email || '—'}</td><td>{customer.orders}</td><td>{money.format(customer.spend)}</td><td>{customer.lastVisit ? customer.lastVisit.toLocaleDateString() : '—'}</td></tr>) : <tr><td colSpan="5">{search ? 'No customers match this search.' : 'No customer history yet. Create an order with a customer name to see them here.'}</td></tr>}
      </tbody></table></div>
    </section>
  </motion.main></div>;
}
