import { AnimatePresence, motion } from 'framer-motion';
import { getTodayStr } from '../../lib/dates';

export default function ReminderBox({ appointments }) {
  const today = getTodayStr();
  const todayCount = appointments.filter((a) => a.date === today && a.status === 'confirmed').length;
  const pending = appointments.filter((a) => a.status === 'pending').length;
  const show = todayCount > 0 || pending > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="reminder-box"
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          style={{ overflow: 'hidden' }}
        >
          <div className="reminder-icon">🔔</div>
          <div className="reminder-text">
            {todayCount > 0 && (
              <>Tienes <strong>{todayCount}</strong> cita{todayCount > 1 ? 's' : ''} confirmada{todayCount > 1 ? 's' : ''} para hoy. </>
            )}
            {pending > 0 && (
              <>Hay <strong>{pending}</strong> cita{pending > 1 ? 's' : ''} pendiente{pending > 1 ? 's' : ''} por revisar.</>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
