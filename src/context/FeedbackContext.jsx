import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sounds } from '../lib/sound';

/**
 * Feedback visual unificado:
 *  - toast(): notificaciones de cristal (reemplazan a alert())
 *  - burst(): explosión de burbujas "splash" en un punto de la pantalla
 */
const FeedbackContext = createContext(null);

const ICONS = { success: '✨', error: '⚠️', info: '💧' };
let uid = 0;

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [bursts, setBursts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message, { type = 'info', title, duration = 4200 } = {}) => {
    const id = ++uid;
    if (type === 'error') sounds.error();
    setToasts((t) => [...t.slice(-3), { id, message, type, title }]);
    timers.current.set(id, setTimeout(() => dismiss(id), duration));
    return id;
  }, [dismiss]);

  const burst = useCallback((x, y) => {
    const id = ++uid;
    const cx = x ?? window.innerWidth / 2;
    const cy = y ?? window.innerHeight / 2;
    const particles = Array.from({ length: 14 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      const dist = 60 + Math.random() * 90;
      return {
        i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 30,
        size: 10 + Math.random() * 22,
        hue: [330, 270, 210, 160, 30][i % 5],
      };
    });
    setBursts((b) => [...b, { id, cx, cy, particles }]);
    setTimeout(() => setBursts((b) => b.filter((x2) => x2.id !== id)), 1200);
  }, []);

  const value = useMemo(() => ({ toast, burst }), [toast, burst]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="toast-stack" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              className={`toast toast-${t.type}`}
              initial={{ opacity: 0, x: 60, scale: 0.9, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 60, scale: 0.9, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={() => dismiss(t.id)}
            >
              <span className="toast-icon">{ICONS[t.type]}</span>
              <div className="toast-body">
                {t.title && <strong>{t.title}</strong>}
                <span>{t.message}</span>
              </div>
              <i className="toast-timer" style={{ animationDuration: '4.2s' }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="burst-layer" aria-hidden="true">
        {bursts.map((b) => (
          <div key={b.id} className="burst" style={{ left: b.cx, top: b.cy }}>
            {b.particles.map((p) => (
              <span
                key={p.i}
                className="burst-bubble"
                style={{
                  '--dx': `${p.dx}px`,
                  '--dy': `${p.dy}px`,
                  width: p.size,
                  height: p.size,
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), hsla(${p.hue}, 85%, 82%, 0.55))`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback debe usarse dentro de <FeedbackProvider>');
  return ctx;
}
