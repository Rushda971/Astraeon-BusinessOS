import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { inventoryApi } from '../services/inventoryApi';

const defaultForm = {
  name: '',
  sku: '',
  categoryId: 1,
  supplierId: '',
  unit: 'kg',
  currentStock: 0,
  minimumStock: 0,
  maximumStock: '',
  reorderLevel: '',
  costPerUnit: 0,
};

const statusStyles = {
  IN_STOCK: 'status-pill status-pill--success',
  LOW_STOCK: 'status-pill status-pill--warning',
  OUT_OF_STOCK: 'status-pill status-pill--danger',
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [lowStock, setLowStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, summaryRes, lowStockRes, movementRes] = await Promise.all([
        inventoryApi.getInventory({ page: 1, limit: 20 }),
        inventoryApi.getSummary(),
        inventoryApi.getLowStock(),
        inventoryApi.getMovements({ limit: 10 }),
      ]);

      setItems(inventoryRes.data.items || []);
      setSummary(summaryRes.data.summary || {});
      setLowStock(lowStockRes.data.items || []);
      setMovements(movementRes.data.movements || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Inventory data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => ({
    totalItems: summary.totalItems || items.length,
    totalInventoryValue: summary.totalInventoryValue || 0,
    lowStockCount: summary.lowStockCount || lowStock.length,
    outOfStockCount: summary.outOfStockCount || 0,
  }), [summary, items, lowStock]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = !query || item.name?.toLowerCase().includes(query) || item.sku?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const chartBars = useMemo(() => {
    const source = items.length ? items : [{ currentStock: 0 }, { currentStock: 0 }, { currentStock: 0 }, { currentStock: 0 }];
    const max = Math.max(...source.map((item) => Number(item.currentStock || 0)), 1);
    return source.slice(0, 6).map((item, index) => ({
      id: item.id || index,
      value: Math.max((Number(item.currentStock || 0) / max) * 100, item.currentStock === 0 ? 8 : 18),
      label: item.name ? item.name.slice(0, 3).toUpperCase() : `S${index + 1}`,
    }));
  }, [items]);

  const kpis = useMemo(() => [
    {
      label: 'Total items',
      value: totals.totalItems,
      detail: 'Tracked SKUs',
      accent: 'rose',
      trend: '+12.4%',
      bars: [32, 44, 38, 58, 52, 68],
    },
    {
      label: 'Inventory value',
      value: currency.format(Number(totals.totalInventoryValue)),
      detail: 'Current stock value',
      accent: 'violet',
      trend: '+8.1%',
      bars: [20, 28, 24, 48, 46, 64],
    },
    {
      label: 'Low stock',
      value: totals.lowStockCount,
      detail: 'Need replenishment',
      accent: 'amber',
      trend: '-3.2%',
      bars: [52, 48, 60, 58, 72, 68],
    },
    {
      label: 'Out of stock',
      value: totals.outOfStockCount,
      detail: 'Immediate action',
      accent: 'green',
      trend: '+1.8%',
      bars: [18, 22, 14, 20, 18, 28],
    },
  ], [totals]);

  const inventoryTable = (() => {
    if (loading) {
      return <div className="loading-state">Loading inventory...</div>;
    }

    if (!filteredItems.length) {
      return (
        <div className="empty-state">
          <div className="empty-state__icon">◌</div>
          <h3>No inventory items yet</h3>
          <p>Start by adding your first stocked item to bring your inventory data to life.</p>
          <button className="primary-button" type="button" onClick={() => setDrawerOpen(true)}>Add your first item</button>
        </div>
      );
    }

    return (
      <div className="inventory-table-wrap">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Min</th>
              <th>Status</th>
              <th>Unit</th>
              <th>Value</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="item-name">
                    <span className="item-dot" />
                    <span>{item.name}</span>
                  </div>
                </td>
                <td>{item.sku}</td>
                <td>{item.currentStock}</td>
                <td>{item.minimumStock}</td>
                <td>
                  <span className={statusStyles[item.status] || 'status-pill'}>{item.status}</span>
                </td>
                <td>{item.unit}</td>
                <td>{currency.format(Number(item.currentStock || 0) * Number(item.costPerUnit || 0))}</td>
                <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Today'}</td>
                <td>
                  <button className="row-action" type="button">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  })();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        categoryId: Number(form.categoryId),
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        currentStock: Number(form.currentStock),
        minimumStock: Number(form.minimumStock),
        maximumStock: form.maximumStock === '' ? null : Number(form.maximumStock),
        reorderLevel: form.reorderLevel === '' ? null : Number(form.reorderLevel),
        costPerUnit: Number(form.costPerUnit),
      };

      await inventoryApi.createInventoryItem(payload);
      setSuccess('Inventory item created successfully.');
      setForm(defaultForm);
      setDrawerOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Inventory item could not be created.');
    }
  };

  return (
    <motion.div
      className="inventory-page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="inventory-shell">
        <header className="inventory-header">
          <div className="inventory-header__copy">
            <span className="eyebrow">Inventory</span>
            <h1>Inventory overview</h1>
            <p>Monitor stock health, reorder needs, and operational value across your business.</p>
          </div>

          <div className="inventory-header__meta">
            <div className="timestamp-pill">Updated 2 mins ago</div>
            <div className="header-actions">
              <button className="secondary-button secondary-button--soft" type="button">Export</button>
              <button className="primary-button" type="button" onClick={() => setDrawerOpen(true)}>Add item</button>
            </div>
          </div>
        </header>

        {error && <div className="form-message form-message--error">{error}</div>}
        {success && <div className="form-message form-message--success">{success}</div>}

        <section className="kpi-grid" aria-label="Inventory summary metrics">
          {kpis.map((kpi, index) => (
            <motion.article
              key={kpi.label}
              className={`kpi-card kpi-card--${kpi.accent}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.25 }}
            >
              <div className="kpi-card__top">
                <span>{kpi.label}</span>
                <span className="kpi-badge">{kpi.trend}</span>
              </div>

              <div className="kpi-card__value">{kpi.value}</div>
              <div className="kpi-card__meta">{kpi.detail}</div>

              <div className="sparkline" aria-hidden="true">
                {kpi.bars.map((bar, barIndex) => (
                  <span key={`${kpi.label}-${barIndex}`} style={{ height: `${bar}%` }} />
                ))}
              </div>
            </motion.article>
          ))}
        </section>

        <section className="inventory-layout">
          <article className="panel panel--primary">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Inventory items</p>
                <h2>Stock ledger</h2>
              </div>

              <div className="panel-toolbar">
                <label className="search-box" aria-label="Search inventory">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3a7.5 7.5 0 015.88 12.8l4.4 4.4 1.41-1.42-4.4-4.4A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 104.16 9.35A5.5 5.5 0 0010.5 5z" /></svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search item or SKU"
                  />
                </label>

                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All status</option>
                  <option value="IN_STOCK">In stock</option>
                  <option value="LOW_STOCK">Low stock</option>
                  <option value="OUT_OF_STOCK">Out of stock</option>
                </select>
              </div>
            </div>

            {inventoryTable}
          </article>

          <aside className="panel panel--aside">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Health</p>
                <h2>Stock overview</h2>
              </div>
              <span className="panel-tag">Live</span>
            </div>

            <div className="mini-chart" aria-label="Inventory stock trend">
              {chartBars.map((bar) => (
                <div key={bar.id} className="mini-chart__column">
                  <span style={{ height: `${bar.value}%` }} />
                  <small>{bar.label}</small>
                </div>
              ))}
            </div>

            <div className="status-stack">
              {lowStock.slice(0, 4).map((item) => (
                <div key={item.id} className="status-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.currentStock} {item.unit}</span>
                  </div>
                  <span className={statusStyles[item.status] || 'status-pill'}>{item.status}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="bottom-grid">
          <article className="panel">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Alerts</p>
                <h2>Low stock</h2>
              </div>
              <span className="panel-tag panel-tag--warning">{lowStock.length} items</span>
            </div>

            <ul className="activity-list">
              {lowStock.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <strong>{item.currentStock} {item.unit}</strong>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Activity</p>
                <h2>Recent movements</h2>
              </div>
              <span className="panel-tag">Live feed</span>
            </div>

            <ul className="activity-list">
              {movements.slice(0, 5).map((movement) => (
                <li key={movement.id}>
                  <span>{movement.type} · {movement.item?.name}</span>
                  <strong>{movement.quantity}</strong>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>

      {drawerOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setDrawerOpen(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <motion.aside
            className="drawer"
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer__header">
              <div>
                <p className="panel__eyebrow">Create item</p>
                <h2>Add inventory item</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close add item form">×</button>
            </div>

            <form className="drawer-form" onSubmit={handleSubmit}>
              <div className="field-grid">
                <label>
                  <span>Name</span>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </label>
                <label>
                  <span>SKU</span>
                  <input name="sku" value={form.sku} onChange={handleChange} required />
                </label>
                <label>
                  <span>Unit</span>
                  <input name="unit" value={form.unit} onChange={handleChange} required />
                </label>
                <label>
                  <span>Initial stock</span>
                  <input type="number" name="currentStock" value={form.currentStock} min="0" onChange={handleChange} />
                </label>
                <label>
                  <span>Minimum stock</span>
                  <input type="number" name="minimumStock" value={form.minimumStock} min="0" onChange={handleChange} />
                </label>
                <label>
                  <span>Cost per unit</span>
                  <input type="number" name="costPerUnit" value={form.costPerUnit} min="0" step="0.01" onChange={handleChange} />
                </label>
              </div>

              <div className="drawer__footer">
                <button className="secondary-button" type="button" onClick={() => setDrawerOpen(false)}>Cancel</button>
                <button className="primary-button" type="submit">Add item</button>
              </div>
            </form>
          </motion.aside>
        </div>
      )}
    </motion.div>
  );
}
