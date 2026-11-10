import { sounds } from '../../lib/sound';

// Chips de filtro reutilizables. options: [{ value, label }]
export default function FilterChips({ options, value, onChange }) {
  return (
    <div className="filter-row" role="tablist">
      {options.map((o) => (
        <span
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          tabIndex={0}
          className={`filter-chip${value === o.value ? ' active' : ''}`}
          onClick={() => { sounds.click(); onChange(o.value); }}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(o.value)}
        >
          {o.label}
        </span>
      ))}
    </div>
  );
}
