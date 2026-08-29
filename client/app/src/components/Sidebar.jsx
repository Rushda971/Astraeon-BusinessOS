import { motion } from 'framer-motion';

const items = [
  { label: 'Overview', active: true },
  { label: 'Sales' },
  { label: 'Orders' },
  { label: 'Inventory' },
  { label: 'Products' },
  { label: 'Customers' },
  { label: 'Employees' },
  { label: 'Reports' },
  { label: 'Analytics' },
  { label: 'Settings' },
];

export default function Sidebar() {
  return (
    <motion.aside
      className="sidebar"
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="sidebar__brand">
        <div className="brand-mark">A</div>
        <div>
          <div className="brand-mark__label">ASTRAEON</div>
          <small>Hospitality OS</small>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Sidebar navigation">
        {items.map((item) => (
          <button key={item.label} className={`nav-item ${item.active ? 'nav-item--active' : ''}`} type="button">
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span>Live operations</span>
        <strong>98.6%</strong>
      </div>
    </motion.aside>
  );
}
