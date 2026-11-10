import { useMemo } from 'react';
import { getTodayStr } from '../../lib/dates';
import AnimatedNumber from '../ui/AnimatedNumber';

export default function StatsRow({ appointments }) {
  const stats = useMemo(() => {
    const today = getTodayStr();
    return [
      { label: 'Citas hoy', icon: '☀️', value: appointments.filter((a) => a.date === today && a.status !== 'cancelled').length },
      { label: 'Pendientes de aceptar', icon: '⏳', value: appointments.filter((a) => a.status === 'pending').length },
      { label: 'Confirmadas', icon: '✅', value: appointments.filter((a) => a.status === 'confirmed').length },
    ];
  }, [appointments]);

  return (
    <div className="stats-row">
      {stats.map((s, i) => (
        <div key={s.label} className="stat-card spot" style={{ '--i': i }}>
          <span className="stat-icon">{s.icon}</span>
          <div className="stat-label">{s.label}</div>
          <AnimatedNumber className="stat-value" value={s.value} />
        </div>
      ))}
    </div>
  );
}
