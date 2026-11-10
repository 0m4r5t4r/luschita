import { useState } from 'react';
import { canAfford } from '../../lib/wallet';
import { getTodayStr, isPast } from '../../lib/dates';
import { useFeedback } from '../../context/FeedbackContext';
import { sounds } from '../../lib/sound';
import Field from '../ui/Field';

const blank = () => ({ name: '', phone: '', service: '', date: getTodayStr(), time: '10:00' });

export default function ManualBookingForm({ business, onBook }) {
  const [f, setF] = useState(blank);
  const { toast, burst } = useFeedback();
  const noBalance = !canAfford(business);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (noBalance) return toast('No tienes saldo suficiente. Recarga tu monedero para agendar más citas.', { type: 'error' });
    if (isPast(f.date, f.time)) return toast('La fecha y hora ya pasaron.', { type: 'error' });
    const rect = e.nativeEvent.submitter?.getBoundingClientRect();
    setBusy(true);
    const error = await onBook({ name: f.name.trim(), phone: f.phone.trim(), service: f.service.trim(), date: f.date, time: f.time });
    setBusy(false);
    if (error) return toast(error, { type: 'error' });
    sounds.splash();
    burst(rect ? rect.left + rect.width / 2 : undefined, rect ? rect.top : undefined);
    toast(`Cita agendada para ${f.name.trim()}.`, { type: 'success' });
    setF(blank());
  };

  return (
    <form className="booking-form" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Nombre del cliente">{(id) => <input id={id} className="glass-input" placeholder="Ej. Ana Martínez" required value={f.name} onChange={set('name')} />}</Field>
        <Field label="Teléfono">{(id) => <input id={id} type="tel" className="glass-input" placeholder="+503 7000 0000" required value={f.phone} onChange={set('phone')} />}</Field>
        <Field label="Servicio">
          {(id) => (
            <>
              <input id={id} className="glass-input" list="svc-list" placeholder="Ej. Corte y peinado" required value={f.service} onChange={set('service')} />
              <datalist id="svc-list">{business.services.map((s) => <option key={s} value={s} />)}</datalist>
            </>
          )}
        </Field>
        <Field label="Fecha">{(id) => <input id={id} type="date" className="glass-input" min={getTodayStr()} required value={f.date} onChange={set('date')} />}</Field>
        <Field label="Hora">{(id) => <input id={id} type="time" className="glass-input" required value={f.time} onChange={set('time')} />}</Field>
      </div>
      <button type="submit" className="btn-primary" disabled={noBalance || busy}>{busy ? 'Agendando…' : 'Agendar cita'}</button>
      {noBalance && (
        <div className="wallet-alert" style={{ marginTop: '0.6rem' }}>
          <span className="wa-icon">⚠️</span>
          <span>Sin saldo. Recarga tu monedero para agendar más citas.</span>
        </div>
      )}
    </form>
  );
}
