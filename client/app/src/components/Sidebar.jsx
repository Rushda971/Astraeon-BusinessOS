import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const groups = [
  { label: 'Workspace', items: [['Overview', '/dashboard', '⌂'], ['Sales', '/sales', '↗'], ['Orders', '/orders', '▣'], ['Inventory', '/inventory', '◇'], ['Menu & products', '/menu', '◒']] },
  { label: 'Management', items: [['Customers', '/customers', '◎'], ['Employees', '/employees', '♙'], ['Reports', '/reports', '▤'], ['Analytics', '/dashboard', '◔']] },
];

groups[0].items.push(['Inventory setup', '/inventory-setup', '⚙']);

export default function Sidebar() {
  const location = useLocation();

  return (
    <motion.aside
      className="sidebar"
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link className="sidebar__brand" to="/dashboard" aria-label="Astraeon dashboard">
        <span className="brand-mark">✦</span>
        <span><span className="brand-mark__label">Astraeon</span><small>Restaurant ERP</small></span>
      </Link>

      <nav className="sidebar__nav" aria-label="Sidebar navigation">
        {groups.map((group) => <div className="nav-group" key={group.label}>
          <span className="nav-group__label">{group.label}</span>
          {group.items.map(([label, path, icon]) => {
            const active = location.pathname === path && (path !== '/dashboard' || label === 'Overview');
            return <Link key={label} to={path} aria-current={active ? 'page' : undefined} className={`nav-item ${active ? 'nav-item--active' : ''}`}><span className="nav-item__icon" aria-hidden="true">{icon}</span>{label}</Link>;
          })}
        </div>)}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__footer-label">Service uptime</span>
        <strong><i />98.6%</strong>
        <small>Everything is running smoothly.</small>
      </div>
    </motion.aside>
  );
}
