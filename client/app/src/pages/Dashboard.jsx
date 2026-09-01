import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';

const data = [
  { day: '24 May', revenue: 10.1, orders: 5, expenses: 2 }, { day: '25 May', revenue: 10.9, orders: 6.5, expenses: 3.1 },
  { day: '26 May', revenue: 12.8, orders: 7.9, expenses: 2.7 }, { day: '27 May', revenue: 12.1, orders: 7.1, expenses: 3.4 },
  { day: '28 May', revenue: 13.7, orders: 8.3, expenses: 4.8 }, { day: '29 May', revenue: 12.5, orders: 7.7, expenses: 3.2 }, { day: '30 May', revenue: 11.8, orders: 7.3, expenses: 3.7 },
];
const stockAlerts = [['🍗', 'Chicken breast', '2.5 kg left', 'Low'], ['🧀', 'Mozzarella cheese', '1.2 kg left', 'Low'], ['🍅', 'Vine tomatoes', '0.8 kg left', 'Critical'], ['🫒', 'Olive oil', '1.0 L left', 'Low']];
const orders = [['#ORD-7824', 'Arjun Kapoor', '4 items', '₹2,450', 'Completed', '2 min ago'], ['#ORD-7823', 'Neha Sharma', '3 items', '₹1,890', 'Processing', '8 min ago'], ['#ORD-7822', 'Rohit Verma', '5 items', '₹3,250', 'Pending', '15 min ago'], ['#ORD-7821', 'Priya Patel', '2 items', '₹950', 'Completed', '22 min ago']];
const sellers = [['🍛', 'Paneer tikka', '462', '₹1,24,800', 92], ['🍲', 'Chicken biryani', '398', '₹1,03,480', 76], ['🍔', 'Veg burger', '287', '₹57,400', 61], ['🍟', 'French fries', '254', '₹38,100', 54]];

function Icon({ name }) {
  const paths = { search: 'm21 21-4.35-4.35M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z', bell: 'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 22h4', export: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14', plus: 'M12 5v14M5 12h14' };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: employeesPayload, loading } = useApi('/api/employees', { authenticated: true });
  const [range, setRange] = useState('7D');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const employees = Array.isArray(employeesPayload) ? employeesPayload : employeesPayload?.employees || [];
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
          <MetricCard title="Total revenue" value="₹12,84,500" detail="from last week" trend="↑ 12.8%" icon="revenue" tone="tomato" />
          <MetricCard title="Total orders" value="1,824" detail="from last week" trend="↑ 8.6%" icon="orders" tone="green" points="4,23 17,20 30,8 43,13 57,7 70,20 85,4 100,19" />
          <MetricCard title="Inventory value" value="₹4,68,230" detail="from last week" trend="↑ 9.4%" icon="inventory" tone="green" points="4,20 19,10 34,19 47,4 61,11 76,2 90,13 100,8" />
          <MetricCard title="Team on shift" value={`${active}/${employees.length || 24}`} detail="active team members" trend="Live" icon="team" tone="tomato" />
        </section>
        <section className="dashboard-main-grid">
          <article className="dashboard-panel business-overview"><div className="dashboard-panel__header"><div><h2>Business overview</h2><p>Track your business performance in real-time</p></div><div className="period-tabs">{['7D', '30D', '90D', '1Y'].map((item) => <button type="button" className={range === item ? 'is-active' : ''} onClick={() => setRange(item)} key={item}>{item}</button>)}</div></div><div className="chart-legend"><span className="revenue">Revenue</span><span className="orders">Orders</span><span className="expenses">Expenses</span></div><div className="business-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 6, left: -22, bottom: 0 }}><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#df2e22" stopOpacity=".23" /><stop offset="1" stopColor="#df2e22" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(83, 58, 42, .09)" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#8d8177', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#8d8177', fontSize: 11 }} tickFormatter={(value) => `₹${value}L`} /><Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #efe3d7', boxShadow: '0 16px 35px rgba(67,42,25,.14)' }} /><Area type="monotone" dataKey="revenue" stroke="#df2e22" strokeWidth={2.5} fill="url(#revenue-fill)" animationDuration={850} /><Area type="monotone" dataKey="orders" stroke="#2f763c" strokeWidth={2.2} fill="none" animationDuration={1050} /><Area type="monotone" dataKey="expenses" stroke="#dc7a16" strokeWidth={2.2} fill="none" animationDuration={1250} /></AreaChart></ResponsiveContainer></div></article>
          <aside className="operations-column"><article className="dashboard-panel inventory-health"><div className="dashboard-panel__header"><div><h2>Inventory health</h2><p>Live stock status</p></div></div><div className="health-content"><div className="health-donut"><div><strong>86%</strong><span>Healthy</span></div></div><ul><li><i className="healthy" />Healthy <strong>86%</strong></li><li><i className="low" />Low stock <strong>8%</strong></li><li><i className="critical" />Critical <strong>6%</strong></li></ul></div></article><article className="dashboard-panel stock-alerts"><div className="dashboard-panel__header"><div><h2>Low stock alerts</h2><p>Items to replenish</p></div><button type="button" className="text-button">View all</button></div><ul>{stockAlerts.map(([icon, item, detail, state]) => <li key={item}><span className="food-thumb">{icon}</span><span><strong>{item}</strong><small>{detail}</small></span><b className={state === 'Critical' ? 'critical' : ''}>{state}</b></li>)}</ul></article></aside>
        </section>
        <section className="dashboard-bottom-grid"><article className="dashboard-panel data-panel"><div className="dashboard-panel__header"><div><h2>Recent orders</h2><p>Latest activity from your restaurant</p></div><button type="button" className="text-button">View all</button></div><div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Time</th></tr></thead><tbody>{orders.map((order) => <tr key={order[0]}>{order.map((cell, index) => <td key={`${order[0]}-${index}`} className={index === 0 ? 'order-id' : index === 4 ? `order-status status-${cell.toLowerCase()}` : ''}>{cell}</td>)}</tr>)}</tbody></table></div></article><article className="dashboard-panel data-panel best-sellers"><div className="dashboard-panel__header"><div><h2>Top selling items</h2><p>Based on the last seven days</p></div><button type="button" className="text-button">View all</button></div><ul>{sellers.map(([icon, item, units, revenue, percent]) => <li key={item}><span className="food-thumb">{icon}</span><strong>{item}</strong><span className="sales-bar"><i style={{ width: `${percent}%` }} /></span><span>{units}</span><b>{revenue}</b></li>)}</ul></article></section>
      </>}
    </motion.main>
  </div>;
}
