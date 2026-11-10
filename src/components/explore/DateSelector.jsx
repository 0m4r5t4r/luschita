import { getBusinessSlotsForDate, MONTHS_SHORT, getDateStr } from '../../lib/dates';
import { sounds } from '../../lib/sound';

export default function DateSelector({ value, onChange, days = 7, business }) {
  return (
    <div className="slot-date-selector">
      {Array.from({ length: days }, (_, i) => {
        const date = getDateStr(i);
        const dt = new Date(`${date}T12:00:00`);
        const closed = business && getBusinessSlotsForDate(business, date).length === 0;
        return (
          <div
            key={date}
            role="button"
            tabIndex={closed ? -1 : 0}
            aria-disabled={!!closed}
            className={`date-chip${date === value ? ' active' : ''}${closed ? ' closed' : ''}`}
            onClick={() => { if (!closed) { sounds.click(); onChange(date); } }}
            onKeyDown={(e) => !closed && (e.key === 'Enter' || e.key === ' ') && onChange(date)}
          >
            <div className="dc-day">{dt.getDate()}</div>
            <div className="dc-month">{MONTHS_SHORT[dt.getMonth()]}</div>
            {business && <span className="dc-status">{closed ? 'Cerrado' : 'Abierto'}</span>}
          </div>
        );
      })}
    </div>
  );
}
