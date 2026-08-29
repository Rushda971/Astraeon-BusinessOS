import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: employeesPayload, loading } = useApi('/api/employees', { authenticated: true });

  const employees = Array.isArray(employeesPayload)
    ? employeesPayload
    : Array.isArray(employeesPayload?.employees)
      ? employeesPayload.employees
      : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const active = employees.filter((employee) => employee.status === 'ACTIVE').length;
  const total = employees.length;

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <motion.main className="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
        <header className="topbar">
          <div>
            <span className="eyebrow eyebrow--muted">Good morning</span>
            <h1>{user?.fullName || user?.name || 'Rushda'}.</h1>
          </div>

          <div className="topbar__actions">
            <button className="secondary-button">Export</button>
            <button className="primary-button" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <section className="hero-panel">
          <div className="hero-panel__copy">
            <span className="eyebrow">Today at Astraeon</span>
            <h2>Here&apos;s what&apos;s happening across your business today.</h2>
            <p>Orders are trending above last week, kitchen operations are streamlined, and inventory is healthy across key categories.</p>
            <div className="hero-panel__stats">
              <div>
                <strong>₹12.4L</strong>
                <span>Revenue</span>
              </div>
              <div>
                <strong>182</strong>
                <span>Orders</span>
              </div>
            </div>
          </div>

          <div className="hero-panel__image" aria-label="Premium restaurant ambiance" />
        </section>

        {loading ? (
          <p className="loading-state">Loading business overview...</p>
        ) : (
          <>
            <section className="metrics-grid">
              <MetricCard title="Revenue" value="₹12.4L" detail="Up 12.8% from last week" trend="+12.8%" tone="tomato" />
              <MetricCard title="Orders" value="1,824" detail="92% fulfilled on time" trend="+8.6%" tone="green" />
              <MetricCard title="Inventory" value="86%" detail="Fresh stock health" trend="Healthy" tone="green" />
              <MetricCard title="Employees" value={String(total)} detail={`${active} active team members`} trend="Active" tone="tomato" />
            </section>

            <section className="content-grid">
              <article className="panel panel--large">
                <div className="panel__header">
                  <h3>Business analytics</h3>
                  <span className="panel__chip">This month</span>
                </div>
                <div className="chart-spacer" />
              </article>

              <article className="panel">
                <div className="panel__header">
                  <h3>Inventory alerts</h3>
                  <span className="panel__chip panel__chip--green">Low stock</span>
                </div>
                <ul className="list">
                  <li><strong>Tomatoes</strong><span>4 crates left</span></li>
                  <li><strong>Fresh basil</strong><span>Restock today</span></li>
                  <li><strong>Paneer</strong><span>11% below target</span></li>
                </ul>
              </article>
            </section>

            <section className="content-grid content-grid--bottom">
              <article className="panel">
                <div className="panel__header">
                  <h3>Recent activity</h3>
                </div>
                <ul className="activity-list">
                  <li><span>New reservation</span><strong>12 mins ago</strong></li>
                  <li><span>Inventory audit</span><strong>1 hour ago</strong></li>
                  <li><span>Order dispatched</span><strong>2 hours ago</strong></li>
                </ul>
              </article>

              <article className="panel">
                <div className="panel__header">
                  <h3>Customer snapshot</h3>
                </div>
                <div className="mini-summary">
                  <div>
                    <strong>4.8/5</strong>
                    <span>Guest rating</span>
                  </div>
                  <div>
                    <strong>1.2k</strong>
                    <span>Returning guests</span>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </motion.main>
    </div>
  );
}
