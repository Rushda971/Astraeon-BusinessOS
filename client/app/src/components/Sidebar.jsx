import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import BrandMark from './BrandMark';

const groups = [
  { label: 'Workspace', items: [['Overview', '/dashboard', 'overview'], ['Sales', '/sales', 'sales'], ['Orders', '/orders', 'orders'], ['Inventory', '/inventory', 'inventory'], ['Menu & products', '/menu', 'menu']] },
  { label: 'Management', items: [['Customers', '/customers', 'customers'], ['Employees', '/employees', 'employees'], ['Reports', '/reports', 'reports'], ['Analytics', '/dashboard', 'analytics']] },
];

groups[0].items.push(['Inventory setup', '/inventory-setup', 'settings']);

const iconPaths = {
  overview: <><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></>,
  sales: <><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 6-7"/><path d="M16 6h5v5"/></>,
  orders: <><path d="M6 3h12l3 4v14H3V7l3-4Z"/><path d="M3 7h18M8 12h8M8 16h5"/></>,
  inventory: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9"/></>,
  menu: <><path d="M4 3v7M8 3v7M4 7h4M6 10v11M15 3v18M15 3c4 2 5 6 0 8"/></>,
  customers: <><circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M16 4a4 4 0 0 1 0 8M18 15a5 5 0 0 1 4 5v1"/></>,
  employees: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2M9 8h.01M15 8h.01"/></>,
  reports: <><path d="M4 19V5M4 19h17"/><path d="M8 15v-4M13 15V7M18 15V9"/></>,
  analytics: <><path d="M12 3v9l7.8 4.5A9 9 0 1 1 12 3Z"/><path d="M15 3.5A9 9 0 0 1 21 9h-6V3.5Z"/></>,
  settings: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/></>,
};

export default function Sidebar() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('astraeon-theme');
    return ['burgundy', 'tomato', 'dark'].includes(saved) ? saved : 'burgundy';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'burgundy' ? 'light' : theme;
    localStorage.setItem('astraeon-theme', theme);
  }, [theme]);

  return (
    <motion.aside
      className="sidebar"
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link className="sidebar__brand" to="/dashboard" aria-label="Astraeon dashboard">
        <BrandMark className="brand-mark" />
        <span><span className="brand-mark__label">Astraeon</span><small>Restaurant ERP</small></span>
      </Link>

      <nav className="sidebar__nav" aria-label="Sidebar navigation">
        {groups.map((group) => <div className="nav-group" key={group.label}>
          <span className="nav-group__label">{group.label}</span>
          {group.items.map(([label, path, icon]) => {
            const active = location.pathname === path && (path !== '/dashboard' || label === 'Overview');
            return <Link key={label} to={path} aria-current={active ? 'page' : undefined} className={`nav-item ${active ? 'nav-item--active' : ''}`}><span className="nav-item__icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">{iconPaths[icon]}</svg></span>{label}</Link>;
          })}
        </div>)}
      </nav>

      <label className="theme-picker"><span>Appearance</span><select aria-label="Choose colour theme" value={theme} onChange={(event) => setTheme(event.target.value)}><option value="burgundy">Burgundy & cream</option><option value="tomato">Tomato & green</option><option value="dark">Dark mode</option></select></label>

      <div className="sidebar__footer">
        <span className="sidebar__footer-label">Service uptime</span>
        <strong><i />98.6%</strong>
        <small>Everything is running smoothly.</small>
      </div>
    </motion.aside>
  );
}
