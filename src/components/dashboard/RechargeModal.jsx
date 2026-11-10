import { useState } from 'react';
import Modal from '../ui/Modal';
import { RECHARGE_PACKS } from '../../data/constants';
import { sounds } from '../../lib/sound';

export default function RechargeModal({ open, onClose, onPay }) {
  const [amount, setAmount] = useState(10);
  const [busy, setBusy] = useState(false);
  const pay = async () => { setBusy(true); await onPay(amount); setBusy(false); };

  return (
    <Modal open={open} onClose={onClose} labelledBy="recharge-title">
      <h3 id="recharge-title">💳 Recargar monedero</h3>
      <p>
        Cada cita cuesta <strong>0.25 USD</strong>. Elige un paquete de recarga. En producción, aquí se conectaría con
        Stripe / MercadoPago / PayPal.
      </p>
      <div className="pack-grid" role="radiogroup" aria-label="Paquete de recarga">
        {RECHARGE_PACKS.map((p) => (
          <button
            type="button"
            key={p.amount}
            role="radio"
            aria-checked={amount === p.amount}
            className={`pack${amount === p.amount ? ' selected' : ''}`}
            onClick={() => { sounds.click(); setAmount(p.amount); }}
          >
            <strong>${p.amount}</strong>
            <span>{p.amount / 0.25} citas</span>
          </button>
        ))}
      </div>
      <div className="modal-note">Serás redirigido a la pasarela de pago (simulada en esta demo).</div>
      <div className="modal-actions">
        <button className="btn-secondary" disabled={busy} onClick={() => { sounds.click(); onClose(); }}>Cancelar</button>
        <button className="btn-primary btn-compact" disabled={busy} onClick={pay}>{busy ? 'Procesando…' : `Pagar $${amount} y recargar`}</button>
      </div>
    </Modal>
  );
}
