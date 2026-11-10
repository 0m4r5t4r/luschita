import { getBusinessConfig } from '../../data/constants';
import { canAfford } from '../../lib/wallet';
import { getBusinessSlotsForDate, getDateStr } from '../../lib/dates';
import { DEFAULT_SLOTS } from '../../data/constants';

export default function BusinessCard({ business, selected, index, onSelect }) {
  const cfg = getBusinessConfig(business.type);
  const active = canAfford(business);
  const today = getDateStr(0);
  const slots = getBusinessSlotsForDate(business, today, DEFAULT_SLOTS);
  const taken = business.appointments.filter((a) => a.date === today && a.status !== 'cancelled').length;
  const free = Math.max(0, slots.length - taken);

  return (
    <div
      className={`business-card spot${selected ? ' selected' : ''}${!active ? ' inactive' : ''}`}
      style={{ '--hue': cfg.hue, '--i': index }}
      data-tilt
      role="button"
      tabIndex={0}
      aria-disabled={!active}
      onClick={() => onSelect(business)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(business)}
    >
      <div className="bc-icon">{business.imageUrl ? <img src={business.imageUrl} alt="" /> : cfg.icon}</div>
      <div className="bc-info">
        <div className="bc-name">{business.name}</div>
        <div className="bc-type">{business.type}</div>
        {active && <div className={`bc-free${slots.length === 0 ? ' closed' : ''}`}><i /> {slots.length === 0 ? 'Cerrado hoy' : `${free} cupo${free !== 1 ? 's' : ''} hoy`}</div>}
      </div>
      {!active && <span className="bc-inactive-tag">no disponible</span>}
    </div>
  );
}
