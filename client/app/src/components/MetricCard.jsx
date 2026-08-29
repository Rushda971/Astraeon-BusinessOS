import { motion } from 'framer-motion';

export default function MetricCard({ title, value, detail, trend, tone = 'tomato' }) {
  return (
    <motion.article
      className={`metric-card metric-card--${tone}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.01 }}
    >
      <div className="metric-card__header">
        <span>{title}</span>
        <span className="metric-card__trend">{trend}</span>
      </div>
      <h3>{value}</h3>
      <p>{detail}</p>
    </motion.article>
  );
}
