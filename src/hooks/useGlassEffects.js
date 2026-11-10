import { useEffect } from 'react';
import { sounds } from '../lib/sound';

/**
 * Efectos globales "liquid glass" (un solo listener para toda la app):
 *  - Parallax del fondo según el mouse (variables --px / --py en :root)
 *  - Brillo especular que sigue el cursor sobre elementos con clase .spot (--mx / --my)
 *  - Inclinación 3D suave en elementos con [data-tilt] (--rx / --ry)
 *  - Ripple líquido al presionar botones
 *  - Sonido "gota" al pasar el mouse por controles
 */
export function useGlassEffects() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    let raf = 0;
    let lastHover = null;

    const onMove = (e) => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (!reduce) {
            root.style.setProperty('--px', ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
            root.style.setProperty('--py', ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
          }
          const spot = e.target.closest?.('.spot');
          if (spot) {
            const r = spot.getBoundingClientRect();
            spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
            spot.style.setProperty('--my', `${e.clientY - r.top}px`);
          }
          const tilt = e.target.closest?.('[data-tilt]');
          if (tilt && !reduce) {
            const r = tilt.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            tilt.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
            tilt.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
          }
        });
      }

      const target = e.target.closest?.('.btn-primary, .btn-secondary, .btn-wallet, .badge, .type-option, .filter-chip, .business-card, .slot-chip, .date-chip, .week-day');
      if (target && target !== lastHover) {
        lastHover = target;
        sounds.hover();
      } else if (!target) {
        lastHover = null;
      }
    };

    const onLeave = (e) => {
      const tilt = e.target.closest?.('[data-tilt]');
      if (tilt) { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg'); }
    };

    const onDown = (e) => {
      const btn = e.target.closest?.('.btn-primary, .btn-secondary, .btn-wallet, .badge, .filter-chip');
      if (!btn || btn.disabled || reduce) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      const span = document.createElement('span');
      span.className = 'ripple';
      span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(span);
      setTimeout(() => span.remove(), 700);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onLeave);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onLeave);
      document.removeEventListener('pointerdown', onDown);
      cancelAnimationFrame(raf);
    };
  }, []);
}
