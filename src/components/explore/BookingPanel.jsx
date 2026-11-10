import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DEFAULT_SLOTS, getBusinessConfig } from '../../data/constants';
import { canAfford } from '../../lib/wallet';
import { firstAvailableDate, formatDateLong, isPast, normalizePhone } from '../../lib/dates';
import { useApp } from '../../context/AppContext';
import { useFeedback } from '../../context/FeedbackContext';
import { sounds } from '../../lib/sound';
import Field from '../ui/Field';
import DateSelector from './DateSelector';
import SlotGrid from './SlotGrid';

export default function BookingPanel({ business, onBack }) {
  const { actions } = useApp();
  const { toast, burst } = useFeedback();
  const cfg = getBusinessConfig(business.type);
  const panelRef = useRef(null);

  const [date, setDate] = useState(() => firstAvailableDate(business, DEFAULT_SLOTS));
  const [slot, setSlot] = useState(null);
  const [service, setService] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const available = canAfford(business);
  const servicePrice = service ? business.servicePrices?.[service] : null;

  // Al abrir un negocio nuevo: reinicia el formulario y desplaza la vista.
  useEffect(() => {
    setDate(firstAvailableDate(business, DEFAULT_SLOTS)); setSlot(null); setService(''); setPhone(''); setName('');
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [business.id]);

  const book = async (e) => {
    if (!available) return toast('Este negocio no tiene saldo disponible.', { type: 'error' });
    if (!slot) return toast('Selecciona un cupo disponible.', { type: 'error' });
    if (!service) return toast('Selecciona un servicio.', { type: 'error' });
    if (normalizePhone(phone).length < 8) return toast('Ingresa un teléfono válido.', { type: 'error' });
    if (!name.trim()) return toast('Ingresa tu nombre.', { type: 'error' });
    if (isPast(date, slot)) return toast('Ese cupo ya pasó. Elige otro.', { type: 'error' });

    // La cita queda pendiente; el negocio la cobra al aceptarla.
    const r = e.currentTarget.getBoundingClientRect();
    setBusy(true);
    const { error } = await actions.bookGuest(business.id, { name: name.trim(), phone: phone.trim(), service, date, time: slot });
    setBusy(false);
    if (error) { setSlot(null); return toast(error, { type: 'error' }); }
    sounds.splash();
    burst(r.left + r.width / 2, r.top);
    toast(`Reserva enviada a ${business.name} para el ${formatDateLong(date)} a las ${slot.slice(0, 5)}. El negocio te contactará al ${phone.trim()} para confirmar.`, { type: 'success', title: '¡Reserva enviada!', duration: 6000 });
    setSlot(null); setService(''); setPhone(''); setName('');
  };

  return (
    <motion.div
      ref={panelRef}
      className="booking-panel spot"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="business-public-header" style={{ '--hue': cfg.hue }}>
        <div className="public-icon">{business.imageUrl ? <img src={business.imageUrl} alt="" /> : cfg.icon}</div>
        <h1 style={{ fontSize: '1.6rem' }}>{business.name}</h1>
        <span className="public-type">{cfg.icon} {business.type}</span>
        {business.type === 'Salón de belleza' && <span className="salon-caption">Belleza y cuidado personal</span>}
      </div>

      <div className="booking-steps">
        <Field label="① Servicio" style={{ marginBottom: '1rem' }}>
          {(id) => (
            <select id={id} className="glass-input" value={service} onChange={(e) => setService(e.target.value)}>
              <option value="" disabled>Selecciona un servicio</option>
              {business.services.map((s) => {
                const price = business.servicePrices?.[s];
                return <option key={s} value={s}>{s}{price == null ? '' : ` · $${Number(price).toFixed(2)}`}</option>;
              })}
            </select>
          )}
        </Field>
        {service && (
          <div className="booking-service-price">
            <span>Precio del servicio</span>
            <strong>{servicePrice == null ? 'Consultar con el salón' : `$${Number(servicePrice).toFixed(2)} USD`}</strong>
          </div>
        )}

        <div className="input-group" style={{ marginBottom: '0.8rem' }}>
          <label>② Elige un día</label>
          <DateSelector value={date} business={business} onChange={(d) => { setDate(d); setSlot(null); }} />
        </div>

        <div className="input-group" style={{ marginBottom: '1.2rem' }}>
          <label>③ Cupos disponibles</label>
          <SlotGrid business={business} date={date} selected={slot} onSelect={setSlot} defaultSlots={DEFAULT_SLOTS} />
        </div>

        <Field label="④ Tu teléfono (para contactarte y confirmar)" style={{ marginBottom: '1.2rem' }}>
          {(id) => <input id={id} type="tel" className="glass-input" placeholder="+503 7000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />}
        </Field>
        <Field label="Tu nombre" style={{ marginBottom: '1.2rem' }}>
          {(id) => <input id={id} className="glass-input" placeholder="Ej. Ana Martínez" value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
      </div>

      <button className="btn-primary" onClick={book} disabled={!available || busy}>{busy ? 'Enviando reserva…' : 'Reservar este cupo'}</button>
      {!available && (
        <div className="wallet-alert" style={{ marginTop: '0.6rem' }}>
          <span className="wa-icon">⚠️</span>
          <span>Este negocio no tiene saldo disponible para recibir nuevas reservas.</span>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: '0.8rem' }}>
        <a className="back-link" role="button" tabIndex={0} onClick={onBack} onKeyDown={(e) => e.key === 'Enter' && onBack()}>← Volver a la lista de negocios</a>
      </div>
    </motion.div>
  );
}
