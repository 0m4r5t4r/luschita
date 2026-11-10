import { MONTHS_SHORT, getDateStr } from '../../lib/dates';
import { sounds } from '../../lib/sound';

export default function DateSelector({ value, onChange, days = 7 }) {
  return (
    <div className="slot-date-selector">
      {Array.from({ length: days }, (_, i) => {
        const date = getDateStr(i);
        const dt = new Date(`${date}T12:00:00`);
        return (
          <div
            key={date}
            role="button"
            tabIndex={0}
            className={`date-chip${date === value ? ' active' : ''}`}
            onClick={() => { sounds.click(); onChange(date); }}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(date)}
          >
            <div className="dc-day">{dt.getDate()}</div>
            <div className="dc-month">{MONTHS_SHORT[dt.getMonth()]}</div>
          </div>
        );
      })}
    </div>
  );
}
