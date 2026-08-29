import { motion } from 'framer-motion';

export default function BrandPanel({ eyebrow, title, description }) {
  return (
    <motion.aside
      className="brand-panel"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div className="brand-panel__image" />
      <div className="brand-panel__overlay" />
      <div className="brand-panel__content">
        <span className="brand-panel__eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </motion.aside>
  );
}
