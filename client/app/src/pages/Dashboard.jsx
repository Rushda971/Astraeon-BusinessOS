import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const rangeDays = { '7D': 7, '30D': 30, '90D': 90, '1Y': 365 };
const makeTrend = (sales, orders, range) => {
  const days = rangeDays[range] || 7;
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  const bucketSize = days / 7;
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + Math.floor(index * bucketSize));
    return { day: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: 0, orders: 0 };
  });
  const bucketIndex = (date) => Math.min(6, Math.max(0, Math.floor((date - start) / 86400000 / bucketSize)));
  for (const order of orders) {
    const date = new Date(order.createdAt);
    if (date >= start && date <= now) buckets[bucketIndex(date)].orders += 1;
  }
  for (const sale of sales) {
    const date = new Date(sale.createdAt);
    if (sale.status === 'COMPLETED' && date >= start && date <= now) buckets[bucketIndex(date)].revenue += Number(sale.totalAmount) || 0;
  }
  return buckets;
};

function Icon({ name }) {
  const paths = { search: 'm21 21-4.35-4.35M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z', bell: 'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 22h4', export: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14', plus: 'M12 5v14M5 12h14' };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: employeesPayload, loading: employeesLoading } = useApi('/api/employees', { authenticated: true });
  const { data: salesPayload, loading: salesLoading } = useApi('/api/sales?limit=100', { authenticated: true });
  const { data: salesSummaryPayload, loading: salesSummaryLoading } = useApi('/api/sales/summary', { authenticated: true });
  const { data: ordersPayload, loading: ordersLoading } = useApi('/api/orders?limit=100', { authenticated: true });
  const { data: inventorySummaryPayload, loading: inventoryLoading } = useApi('/api/inventory/summary', { authenticated: true });
  const { data: lowStockPayload } = useApi('/api/inventory/low-stock', { authenticated: true });
  const [range, setRange] = useState('7D');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const employees = Array.isArray(employeesPayload) ? employeesPayload : employeesPayload?.employees || [];
  const sales = salesPayload?.sales || [];
  const orderRecords = ordersPayload?.orders || [];
  const inventorySummary = inventorySummaryPayload?.summary || {};
  const salesSummary = salesSummaryPayload?.summary || {};
  const stockAlerts = (lowStockPayload?.items || []).slice(0, 4).map((item) => ['📦', item.name, `${item.currentStock} ${item.unit} left`, item.currentStock === 0 ? 'Critical' : 'Low']);
  const loading = employeesLoading || salesLoading || salesSummaryLoading || ordersLoading || inventoryLoading;
  const trend = useMemo(() => makeTrend(sales, orderRecords, range), [sales, orderRecords, range]);
  const orders = orderRecords.slice(0, 4).map((order) => {
    const itemCount = order.items?.length || 0;
    return [
      order.orderNumber, order.customerName || 'Walk-in customer', `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`, currency.format(Number(order.totalAmount) || 0),
      order.status.charAt(0) + order.status.slice(1).toLowerCase(), new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
    ];
  });
  const sellerTotals = new Map();
  for (const sale of sales) if (sale.status === 'COMPLETED') for (const item of sale.items || []) {
    const name = item.inventoryItem?.name || 'Product';
    const current = sellerTotals.get(name) || { quantity: 0, revenue: 0 };
    current.quantity += Number(item.quantity) || 0;
    current.revenue += Number(item.totalPrice) || 0;
    sellerTotals.set(name, current);
  }
  const sellers = [...sellerTotals.entries()].sort((a, b) => b[1].quantity - a[1].quantity).slice(0, 4).map(([name, value], index, list) => [
    ['🍽️', '🥣', '🍲', '🥗'][index], name, value.quantity, currency.format(value.revenue), list.length ? Math.round(value.quantity / list[0][1].quantity * 100) : 0,
  ]);
  const totalStock = Number(inventorySummary.healthyStockCount || 0) + Number(inventorySummary.lowStockCount || 0) + Number(inventorySummary.outOfStockCount || 0);
  const healthyPercent = totalStock ? Math.round(Number(inventorySummary.healthyStockCount || 0) / totalStock * 100) : 0;
  const lowPercent = totalStock ? Math.round(Number(inventorySummary.lowStockCount || 0) / totalStock * 100) : 0;
  const criticalPercent = totalStock ? 100 - healthyPercent - lowPercent : 0;
  const active = employees.filter((employee) => employee.status === 'ACTIVE').length;
  const name = user?.fullName || user?.name || 'Rushda';
  const greeting = useMemo(() => name.split(' ')[0], [name]);
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const signOut = () => { logout(); navigate('/login'); };

  return <div className="dashboard-shell">
    <Sidebar />
    <motion.main className="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <header className="dashboard-header">
        <div className="dashboard-header__intro"><span className="eyebrow eyebrow--muted">Good morning, {greeting} <span aria-hidden="true">✦</span></span><h1>Here&apos;s what&apos;s happening<br /><em>in your restaurant today.</em></h1><p>Track sales, manage inventory and grow your business with clarity.</p></div>
        <div className="dashboard-header__tools">
          <label className="dashboard-search"><Icon name="search" /><input type="search" placeholder="Search anything..." aria-label="Search" /><kbd>Ctrl K</kbd></label>
          <button className="header-icon-button" type="button" aria-label="Notifications"><Icon name="bell" /><b>8</b></button>
          <div className="profile-wrap"><button className="profile-button" type="button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><span className="profile-avatar">{initials}<i /></span><span><strong>{name}</strong><small>Administrator</small></span><span className="profile-chevron">⌄</span></button>{profileOpen && <div className="profile-menu"><button type="button" onClick={signOut}>Sign out</button></div>}</div>
        </div>
      </header>
      <div className="dashboard-actions"><button className="secondary-button" type="button" onClick={() => setNotice('Your report export is being prepared.')}><Icon name="export" />Export report</button><button className="primary-button" type="button" onClick={() => setNotice('Create actions will appear here as modules are added.')}><Icon name="plus" />Add new</button></div>
      {notice && <div className="dashboard-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')}>×</button></div>}
      {loading ? <p className="loading-state">Loading business overview...</p> : <>
        <section className="metrics-grid" aria-label="Business metrics">
          <MetricCard title="Total revenue" value={currency.format(Number(salesSummary.totalRevenue) || 0)} detail="from completed sales" trend="Live" icon="revenue" tone="tomato" />
          <MetricCard title="Total orders" value={ordersPayload?.pagination?.total ?? orders.length} detail="recorded orders" trend="Live" icon="orders" tone="green" points="4,23 17,20 30,8 43,13 57,7 70,20 85,4 100,19" />
          <MetricCard title="Inventory value" value={currency.format(Number(inventorySummary.totalInventoryValue) || 0)} detail="current stock value" trend="Live" icon="inventory" tone="green" points="4,20 19,10 34,19 47,4 61,11 76,2 90,13 100,8" />
          <MetricCard title="Team on shift" value={`${active}/${employees.length}`} detail="active employees" trend="Live" icon="team" tone="tomato" />
        </section>
        <section className="dashboard-main-grid">
          <article className="dashboard-panel business-overview"><div className="dashboard-panel__header"><div><h2>Business overview</h2><p>Revenue and order history from your records</p></div><div className="period-tabs">{['7D', '30D', '90D', '1Y'].map((item) => <button type="button" className={range === item ? 'is-active' : ''} onClick={() => setRange(item)} key={item}>{item}</button>)}</div></div><div className="chart-legend"><span className="revenue">Revenue</span><span className="orders">Orders</span></div><div className="business-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 12, right: 6, left: -22, bottom: 0 }}><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#df2e22" stopOpacity=".23" /><stop offset="1" stopColor="#df2e22" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(83, 58, 42, .09)" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#8d8177', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#8d8177', fontSize: 11 }} tickFormatter={(value) => currency.format(value)} /><Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #efe3d7', boxShadow: '0 16px 35px rgba(67,42,25,.14)' }} /><Area type="monotone" dataKey="revenue" stroke="#df2e22" strokeWidth={2.5} fill="url(#revenue-fill)" animationDuration={850} /><Area type="monotone" dataKey="orders" stroke="#2f763c" strokeWidth={2.2} fill="none" animationDuration={1050} /></AreaChart></ResponsiveContainer></div></article>
          <aside className="operations-column"><article className="dashboard-panel inventory-health"><div className="dashboard-panel__header"><div><h2>Inventory health</h2><p>Live stock status</p></div></div><div className="health-content"><div className="health-donut" style={{ background: `conic-gradient(#37783d 0 ${healthyPercent}%, #e79728 ${healthyPercent}% ${healthyPercent + lowPercent}%, #e04736 ${healthyPercent + lowPercent}% 100%)` }}><div><strong>{healthyPercent}%</strong><span>Healthy</span></div></div><ul><li><i className="healthy" />Healthy <strong>{healthyPercent}%</strong></li><li><i className="low" />Low stock <strong>{lowPercent}%</strong></li><li><i className="critical" />Out of stock <strong>{criticalPercent}%</strong></li></ul></div></article><article className="dashboard-panel stock-alerts"><div className="dashboard-panel__header"><div><h2>Low stock alerts</h2><p>Items to replenish</p></div><button className="text-button" type="button" onClick={() => navigate('/inventory')}>View all</button></div><ul>{stockAlerts.length ? stockAlerts.map(([icon, item, detail, state]) => <li key={item}><span className="food-thumb">{icon}</span><span><strong>{item}</strong><small>{detail}</small></span><b className={state === 'Critical' ? 'critical' : ''}>{state}</b></li>) : <li>No low stock alerts.</li>}</ul></article></aside>
        </section>
        <section className="dashboard-bottom-grid"><article className="dashboard-panel data-panel"><div className="dashboard-panel__header"><div><h2>Recent orders</h2><p>Latest activity from your restaurant</p></div><button type="button" className="text-button">View all</button></div><div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Time</th></tr></thead><tbody>{orders.map((order) => <tr key={order[0]}>{order.map((cell, index) => <td key={`${order[0]}-${index}`} className={index === 0 ? 'order-id' : index === 4 ? `order-status status-${cell.toLowerCase()}` : ''}>{cell}</td>)}</tr>)}</tbody></table></div></article><article className="dashboard-panel data-panel best-sellers"><div className="dashboard-panel__header"><div><h2>Top selling items</h2><p>Based on the last seven days</p></div><button type="button" className="text-button">View all</button></div><ul>{sellers.map(([icon, item, units, revenue, percent]) => <li key={item}><span className="food-thumb">{icon}</span><strong>{item}</strong><span className="sales-bar"><i style={{ width: `${percent}%` }} /></span><span>{units}</span><b>{revenue}</b></li>)}</ul></article></section>
      </>}
    </motion.main>
  </div>;
}
