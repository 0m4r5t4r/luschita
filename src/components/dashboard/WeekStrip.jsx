import { useMemo } from 'react';
import { WEEKDAYS_SHORT, getDateStr } from '../../lib/dates';
import { sounds } from '../../lib/sound';

// Agenda de la semana: 7 días con puntos por cita. Clic para filtrar la lista por ese día.
export default function WeekStrip({ appointments, selected, onSelect }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = getDateStr(i);
    const d = new Date(`${date}T12:00:00`);
    const list = appointments.filter((a) => a.date === date && a.status !== 'cancelled');
    return { date, num: d.getDate(), wd: i === 0 ? 'hoy' : WEEKDAYS_SHORT[d.getDay()], confirmed: list.filter((a) => a.status === 'confirmed').length, pending: list.filter((a) => a.status === 'pending').length };
  }), [appointments]);

  return (
    <div className="week-strip">
      {days.map((d) => (
        <button
          type="button"
          key={d.date}
          className={`week-day${selected === d.date ? ' active' : ''}`}
          onClick={() => { sounds.click(); onSelect(selected === d.date ? null : d.date); }}
          aria-pressed={selected === d.date}
        >
          <span className="wd-name">{d.wd}</span>
          <span className="wd-num">{d.num}</span>
          <span className="wd-dots">
            {Array.from({ length: Math.min(d.confirmed, 3) }, (_, i) => <i key={`c${i}`} className="dot-confirmed" />)}
            {Array.from({ length: Math.min(d.pending, 3) }, (_, i) => <i key={`p${i}`} className="dot-pending" />)}
            {d.confirmed + d.pending === 0 && <i className="dot-empty" />}
          </span>
        </button>
      ))}
    </div>
  );
}
