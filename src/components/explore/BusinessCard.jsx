import { getBusinessConfig } from '../../data/constants';
import { canAfford } from '../../lib/wallet';
import { getDateStr } from '../../lib/dates';
import { DEFAULT_SLOTS } from '../../data/constants';

export default function BusinessCard({ business, selected, index, onSelect }) {
  const cfg = getBusinessConfig(business.type);
  const active = canAfford(business);
  const slots = business.slots || DEFAULT_SLOTS;
  const today = getDateStr(0);
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
      <div className="bc-icon">{cfg.icon}</div>
      <div className="bc-info">
        <div className="bc-name">{business.name}</div>
        <div className="bc-type">{business.type}</div>
        {active && <div className="bc-free"><i /> {free} cupo{free !== 1 ? 's' : ''} hoy</div>}
      </div>
      {!active && <span className="bc-inactive-tag">no disponible</span>}
    </div>
  );
}
