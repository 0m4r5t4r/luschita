import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { BUSINESS_TYPES } from '../data/constants';
import { canAfford } from '../lib/wallet';
import { sounds } from '../lib/sound';
import PageTransition from '../components/ui/PageTransition';
import FilterChips from '../components/ui/FilterChips';
import EmptyState from '../components/ui/EmptyState';
import BusinessCard from '../components/explore/BusinessCard';
import BookingPanel from '../components/explore/BookingPanel';

const FILTERS = [
  { value: 'all', label: 'Todos' },
  ...Object.entries(BUSINESS_TYPES).filter(([t]) => t !== 'Otro negocio').map(([value, c]) => ({ value, label: c.short })),
];

export default function Explore() {
  const { businesses, publicLoading, publicError, getBusinessById, actions } = useApp();
  const { toast } = useFeedback();
  const { bizId } = useParams(); // /explorar/:bizId
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  // Carga los negocios al entrar y los mantiene frescos (cupos nuevos de otros clientes).
  useEffect(() => {
    actions.refreshPublic();
    const t = setInterval(actions.refreshPublic, 30000);
    return () => clearInterval(t);
  }, [actions.refreshPublic]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((b) => (filter === 'all' || b.type === filter) && (!q || b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)));
  }, [businesses, filter, query]);

  const selected = bizId ? getBusinessById(bizId) : null;

  const select = (biz) => {
    if (!canAfford(biz)) return toast('Este negocio no tiene saldo disponible para recibir nuevas reservas. Intenta con otro.', { type: 'error' });
    sounds.click();
    navigate(`/explorar/${biz.id}`);
  };

  return (
    <PageTransition>
      <div className="hero-title">
        <h1>Explora negocios</h1>
        <p>Elige un negocio, mira los cupos disponibles y reserva sin crear cuenta.</p>
      </div>

      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input className="glass-input search-input" placeholder="Buscar por nombre o categoría…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar negocios" />
      </div>

      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      <div className="business-list">
        {filtered.map((b, i) => (
          <BusinessCard key={b.id} business={b} index={i} selected={b.id === bizId} onSelect={select} />
        ))}
        {filtered.length === 0 && (
          <EmptyState icon={publicLoading && businesses.length === 0 ? '💧' : '🌸'}>
            {publicLoading && businesses.length === 0
              ? 'Cargando negocios…'
              : publicError
                ? `No pudimos cargar los negocios: ${publicError}`
                : businesses.length === 0
                  ? 'Aún no hay negocios registrados. ¡Registra el tuyo!'
                  : 'No hay negocios que coincidan con tu búsqueda.'}
          </EmptyState>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selected && <BookingPanel key={selected.id} business={selected} onBack={() => { sounds.click(); navigate('/explorar'); }} />}
      </AnimatePresence>
    </PageTransition>
  );
}
