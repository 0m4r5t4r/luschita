import { PRICE_PER_APPOINTMENT } from '../../data/constants';
import { appointmentsLeft } from '../../lib/wallet';
import AnimatedNumber from '../ui/AnimatedNumber';
import { sounds } from '../../lib/sound';

const RING_CAP = 20; // el anillo se llena con 20 citas disponibles
const R = 46;
const C = 2 * Math.PI * R;

export default function WalletCard({ wallet, onRecharge }) {
  const left = appointmentsLeft(wallet.balance);
  const low = wallet.balance < PRICE_PER_APPOINTMENT;
  const pct = Math.min(1, left / RING_CAP);

  return (
    <div className="wallet-card spot" data-tilt>
      <div className="wallet-shine" />
      <div className="wallet-ring" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3b4d6" />
              <stop offset="55%" stopColor="#b9a4ec" />
              <stop offset="100%" stopColor="#9cc7f2" />
            </linearGradient>
          </defs>
          <circle className="ring-track" cx="60" cy="60" r={R} />
          <circle
            className={`ring-value${low ? ' low' : ''}`}
            cx="60" cy="60" r={R}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
          />
        </svg>
        <div className="ring-center">
          <AnimatedNumber value={left} />
          <small>citas</small>
        </div>
      </div>

      <div className="wallet-info">
        <div className="wallet-label">
          Saldo del monedero
          <span className={`wallet-status ${wallet.isTrial ? 'trial' : 'paid'}`}>
            {wallet.isTrial ? 'crédito de prueba' : 'saldo real'}
          </span>
        </div>
        <div className={`wallet-balance${low ? ' warning' : ''}`}>
          $<AnimatedNumber value={wallet.balance} decimals={2} />
        </div>
        <div className="wallet-sub">
          Alcanza para <strong>{left} cita{left !== 1 ? 's' : ''}</strong> · 0.25 USD por cita
        </div>
      </div>

      <div className="wallet-actions">
        <button className="btn-wallet" onClick={() => { sounds.click(); onRecharge(); }}>＋ Recargar monedero</button>
      </div>
    </div>
  );
}
