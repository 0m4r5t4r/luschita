import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { STATUS } from '../../data/constants';
import { formatDateShort, getInitials } from '../../lib/dates';

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const AppointmentItem = forwardRef(function AppointmentItem({ appointment: a, index, onConfirm, onCancel }, ref) {
  const st = STATUS[a.status];
  return (
    <motion.div
      ref={ref}
      layout
      className={`appointment-item spot status-${a.status}`}
      initial={{ opacity: 0, x: -24, scale: 0.97, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 40, scale: 0.95, filter: 'blur(6px)' }}
      transition={{ type: 'spring', stiffness: 380, damping: 34, delay: Math.min(index, 8) * 0.04 }}
    >
      <div className="appointment-avatar" aria-hidden="true">{getInitials(a.name)}</div>
      <div className="appointment-info">
        <span className="client-name">{a.name}</span>
        <span className="service-tag">{a.service}</span>
        <span className="datetime"><ClockIcon /> {formatDateShort(a.date)} · {a.time.slice(0, 5)}</span>
        {a.phone && <span className="phone-tag">📞 {a.phone}</span>}
      </div>
      <div className="appointment-actions">
        <span className={`status-badge ${st.className}`}>{st.label}</span>
        {a.status === 'pending' && (
          <>
            <button className="btn-secondary btn-small btn-success" onClick={() => onConfirm(a)}>Aceptar</button>
            <button className="btn-secondary btn-small btn-danger" onClick={() => onCancel(a)}>Rechazar</button>
          </>
        )}
        {a.status === 'confirmed' && (
          <button className="btn-secondary btn-small btn-danger" onClick={() => onCancel(a)}>Cancelar</button>
        )}
      </div>
    </motion.div>
  );
});

export default AppointmentItem;
