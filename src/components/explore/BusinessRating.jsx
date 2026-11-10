import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useFeedback } from '../../context/FeedbackContext';

const VISITOR_ID_KEY = 'lushcita_rating_visitor_id';
const savedRatingKey = (businessId) => `lushcita_rating_${businessId}`;

function readSavedRating(businessId) {
  try {
    const value = Number(localStorage.getItem(savedRatingKey(businessId)));
    return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0;
  } catch {
    return 0;
  }
}

export default function BusinessRating({ business }) {
  const { actions } = useApp();
  const { toast } = useFeedback();
  const [savedVote, setSavedVote] = useState(() => readSavedRating(business.id));
  const [rating, setRating] = useState(savedVote);
  const [summary, setSummary] = useState({
    averageRating: business.averageRating || 0,
    ratingCount: business.ratingCount || 0,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSummary({
      averageRating: business.averageRating || 0,
      ratingCount: business.ratingCount || 0,
    });
  }, [business.averageRating, business.ratingCount]);

  const vote = async (event) => {
    event.preventDefault();
    if (!rating) return toast('Selecciona de 1 a 5 estrellas para votar.', { type: 'error' });

    let voterId;
    try {
      voterId = localStorage.getItem(VISITOR_ID_KEY);
      if (!voterId) {
        voterId = crypto.randomUUID();
        localStorage.setItem(VISITOR_ID_KEY, voterId);
      }
    } catch {
      return toast('Tu navegador bloquea el almacenamiento necesario para guardar el voto.', { type: 'error' });
    }

    setBusy(true);
    const { data, error } = await actions.rateBusiness(business.id, rating, voterId);
    setBusy(false);
    if (error) return toast(error, { type: 'error' });

    const result = Array.isArray(data) ? data[0] : data;
    if (!result || !Number.isFinite(Number(result.averageRating)) || !Number.isFinite(Number(result.ratingCount))) {
      return toast('No pudimos confirmar el resultado de tu valoración. Actualiza la página e inténtalo de nuevo.', { type: 'error' });
    }

    setSummary({ averageRating: Number(result.averageRating), ratingCount: Number(result.ratingCount) });
    try {
      localStorage.setItem(savedRatingKey(business.id), String(rating));
    } catch {
      toast('Tu voto se guardó, pero el navegador no pudo recordar tu selección.', { type: 'info' });
      return;
    }
    setSavedVote(rating);
    toast('¡Gracias por valorar este negocio!', { type: 'success' });
  };

  return (
    <section className="rating-panel" aria-labelledby="rating-title">
      <div className="rating-summary">
        <span className="rating-summary-stars" aria-hidden="true">★</span>
        <strong>{summary.ratingCount ? summary.averageRating.toFixed(1) : 'Nuevo'}</strong>
        <span>{summary.ratingCount ? `${summary.ratingCount} ${summary.ratingCount === 1 ? 'valoración' : 'valoraciones'}` : 'Aún sin valoraciones'}</span>
      </div>
      <form className="rating-form" onSubmit={vote}>
        <div>
          <h2 id="rating-title">{savedVote ? 'Actualiza tu valoración' : '¿Has visitado este negocio?'}</h2>
          <p>Tu opinión ayuda a otras personas a elegir.</p>
        </div>
        <div className="rating-actions">
          <div className="rating-stars" role="radiogroup" aria-label="Tu valoración, de 1 a 5 estrellas">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
                className={`rating-star${rating >= value ? ' active' : ''}`}
                disabled={busy}
                onClick={() => setRating(value)}
              >
                ★
              </button>
            ))}
          </div>
          <button type="submit" className="btn-secondary rating-submit" disabled={busy || rating === 0}>
            {busy ? 'Enviando…' : savedVote ? 'Actualizar voto' : 'Votar'}
          </button>
        </div>
      </form>
    </section>
  );
}
