import { getBusinessSlotsForDate, isPast } from '../../lib/dates';
import { sounds } from '../../lib/sound';

// Cupos del día: ocupados (citas activas) y pasados quedan deshabilitados.
export default function SlotGrid({ business, date, selected, onSelect, defaultSlots }) {
  const slots = getBusinessSlotsForDate(business, date, defaultSlots);
  const occupied = new Set(business.appointments.filter((a) => a.date === date && a.status !== 'cancelled').map((a) => a.time));

  if (slots.length === 0) return <div className="closed-day-message">El salón descansa este día. Elige otra fecha 🌷</div>;

  return (
    <div className="slots-container">
      {slots.map((slot, i) => {
        const taken = occupied.has(slot);
        const past = isPast(date, slot);
        const disabled = taken || past;
        return (
          <button
            type="button"
            key={`${date}-${slot}`}
            className={`slot-chip${disabled ? ' occupied' : ''}${selected === slot ? ' selected' : ''}`}
            style={{ '--i': i }}
            disabled={disabled}
            title={taken ? 'Ocupado' : past ? 'Horario pasado' : 'Disponible'}
            onClick={() => { sounds.click(); onSelect(slot); }}
          >
            {slot.slice(0, 5)}
          </button>
        );
      })}
    </div>
  );
}
