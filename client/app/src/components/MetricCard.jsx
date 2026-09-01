import { motion } from 'framer-motion';

const iconPaths = {
  revenue: 'M12 3v18m4-14.5a4 4 0 0 0-4-1.5 4 4 0 0 0-4 7c0 2.2 1.8 4 4 4a4 4 0 0 1-4 4 4 4 0 0 1-4-1.5',
  orders: 'M6 8h12l-1 11H7L6 8Zm2 0a4 4 0 0 1 8 0M9 13h.01M15 13h.01',
  inventory: 'M4 19c7.5-1.2 12.5-6.3 16-15-8.7.6-13.8 5.6-16 15Zm0 0c2.2-2.4 4.8-4.2 8-5.4',
  team: 'M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20m13-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm2 3.7a4 4 0 0 1 3 3.8V20',
};

export default function MetricCard({ title, value, detail, trend, tone = 'tomato', icon = 'revenue', points = '4,24 18,18 31,22 45,7 59,19 72,13 87,3 100,14' }) {
  return (
    <motion.article
      className={`metric-card metric-card--${tone}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
    >
      <div className="metric-card__header">
        <span className="metric-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={iconPaths[icon]} /></svg></span>
        <span className="metric-card__label">{title}</span>
      </div>
      <div className="metric-card__value-row">
        <h3>{value}</h3>
        <svg className="metric-card__spark" viewBox="0 0 104 28" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} /></svg>
      </div>
      <p><strong>{trend}</strong> {detail}</p>
    </motion.article>
  );
}
