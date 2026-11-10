import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { getBusinessConfig, STATUS } from '../data/constants';
import { canAfford } from '../lib/wallet';
import { formatDateShort, pluralCitas } from '../lib/dates';
import { sounds } from '../lib/sound';
import PageTransition from '../components/ui/PageTransition';
import FilterChips from '../components/ui/FilterChips';
import WalletCard from '../components/dashboard/WalletCard';
import StatsRow from '../components/dashboard/StatsRow';
import ReminderBox from '../components/dashboard/ReminderBox';
import WeekStrip from '../components/dashboard/WeekStrip';
import AppointmentList from '../components/dashboard/AppointmentList';
import ManualBookingForm from '../components/dashboard/ManualBookingForm';
import RechargeModal from '../components/dashboard/RechargeModal';

const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

export default function Dashboard() {
  const { currentBusiness: biz, businessLoading, actions } = useApp();
  const { toast, burst } = useFeedback();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [day, setDay] = useState(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const appointments = biz?.appointments ?? [];
  const incoming = useMemo(() => appointments.filter((a) => a.createdBy === 'guest' && a.status === 'pending'), [appointments]);
  const filtered = useMemo(
    () => appointments.filter((a) => (filter === 'all' || a.status === filter) && (!day || a.date === day)),
    [appointments, filter, day],
  );

  if (!biz) {
    // La redirección a /login (sin sesión) la hace <App/>. Aquí solo cargamos el negocio.
    return (
      <PageTransition>
        <div className="empty-message">
          <div className="empty-icon">💧</div>
          <div>{businessLoading ? 'Cargando tu negocio…' : 'No encontramos los datos de tu negocio. Intenta cerrar sesión y entrar de nuevo.'}</div>
        </div>
      </PageTransition>
    );
  }
  const cfg = getBusinessConfig(biz.type);

  const confirm = async (a) => {
    if (!canAfford(biz)) return toast('No tienes saldo suficiente. Recarga tu monedero para aceptar la cita.', { type: 'error' });
    const { error } = await actions.setStatus(a.id, 'confirmed');
    if (error) return toast(error, { type: 'error' });
    sounds.success();
    toast(`Cita de ${a.name} confirmada.`, { type: 'success' });
  };

  const cancel = async (a) => {
    const { error } = await actions.setStatus(a.id, 'cancelled');
    if (error) return toast(error, { type: 'error' });
    sounds.click();
    toast(`Cita de ${a.name} cancelada.`, { type: 'info' });
  };

  const pay = async (amount) => {
    const { error } = await actions.recharge(amount);
    if (error) return toast(error, { type: 'error' });
    sounds.splash();
    burst();
    setRechargeOpen(false);
    toast(`Se acreditaron $${amount.toFixed(2)} a tu monedero.`, { type: 'success', title: 'Recarga simulada exitosa' });
  };

  const logout = async () => { sounds.click(); await actions.signOut(); navigate('/'); };

  return (
    <PageTransition>
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>{biz.name}</h1>
          <p>Gestiona las citas de tu negocio</p>
          <span className="business-type-badge">{cfg.icon} {biz.type}</span>
        </div>
        <button className="btn-secondary" onClick={logout}>Cerrar sesión</button>
      </div>

      <WalletCard wallet={biz.wallet} onRecharge={() => setRechargeOpen(true)} />

      {!canAfford(biz) && (
        <div className="wallet-alert">
          <span className="wa-icon">⚠️</span>
          <span>
            Tu saldo es insuficiente (${biz.wallet.balance.toFixed(2)} USD). Cada cita cuesta 0.25 USD.{' '}
            <strong>Recarga para seguir recibiendo reservas.</strong>
          </span>
        </div>
      )}

      <ReminderBox appointments={appointments} />
      <StatsRow appointments={appointments} />

      <section className="appointments-section first">
        <div className="section-header">
          <h2>Citas que te llegan</h2>
          <span className="counter">{pluralCitas(incoming.length)}</span>
        </div>
        <AppointmentList appointments={incoming} emptyText="Aún no hay citas entrantes de clientes" onConfirm={confirm} onCancel={cancel} />
      </section>

      <section className="appointments-section">
        <div className="section-header"><h2>Agregar cita manualmente</h2></div>
        <ManualBookingForm business={biz} onBook={async (appointment) => (await actions.addManual(appointment)).error} />
      </section>

      <section className="appointments-section">
        <div className="section-header">
          <h2>Mis citas</h2>
          <span className="counter">{pluralCitas(filtered.length)}</span>
        </div>
        <WeekStrip appointments={appointments} selected={day} onSelect={setDay} />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        {day && (
          <div className="day-filter-note">
            Mostrando el {formatDateShort(day)} · <a role="button" tabIndex={0} onClick={() => setDay(null)}>quitar filtro</a>
          </div>
        )}
        <AppointmentList
          appointments={filtered}
          emptyText={appointments.length === 0 ? 'Aún no hay citas agendadas' : 'No hay citas en este filtro'}
          onConfirm={confirm}
          onCancel={cancel}
        />
      </section>

      <RechargeModal open={rechargeOpen} onClose={() => setRechargeOpen(false)} onPay={pay} />
    </PageTransition>
  );
}
