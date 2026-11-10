import { BUSINESS_TYPES } from '../../data/constants';
import { sounds } from '../../lib/sound';

export default function TypeGrid({ value, onChange }) {
  return (
    <div className="business-type-grid" role="radiogroup" aria-label="Tipo de negocio">
      {Object.entries(BUSINESS_TYPES).map(([type, cfg]) => (
        <div
          key={type}
          role="radio"
          aria-checked={value === type}
          tabIndex={0}
          className={`type-option${value === type ? ' selected' : ''}`}
          style={{ '--hue': cfg.hue }}
          onClick={() => { sounds.click(); onChange(type); }}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(type)}
        >
          <span className="type-icon">{cfg.icon}</span>
          {cfg.short}
        </div>
      ))}
    </div>
  );
}
