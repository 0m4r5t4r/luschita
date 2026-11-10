import { AnimatePresence } from 'framer-motion';
import AppointmentItem from './AppointmentItem';
import EmptyState from '../ui/EmptyState';
import { byDateTime } from '../../lib/dates';

export default function AppointmentList({ appointments, emptyText, onConfirm, onCancel }) {
  const sorted = [...appointments].sort(byDateTime);
  return (
    <div className="appointment-list">
      {sorted.length === 0 && <EmptyState>{emptyText}</EmptyState>}
      <AnimatePresence mode="popLayout" initial>
        {sorted.map((a, i) => (
          <AppointmentItem key={a.id} appointment={a} index={i} onConfirm={onConfirm} onCancel={onCancel} />
        ))}
      </AnimatePresence>
    </div>
  );
}
