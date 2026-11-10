import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import PageTransition from '../components/ui/PageTransition';
import { sounds } from '../lib/sound';

const STEPS = [
  { icon: '🔎', title: 'Elige tu salón', text: 'Descubre salones de belleza y encuentra el servicio ideal para ti.' },
  { icon: '🗓️', title: 'Reserva tu cita', text: 'Consulta precios y horarios disponibles antes de elegir tu espacio.' },
  { icon: '💬', title: 'Conecta', text: 'Deja tu teléfono para que el salón pueda confirmar tu reserva.' },
];

export default function Landing() {
  const navigate = useNavigate();
  return (
    <PageTransition>
      <section className="hero">
        <div className="hero-title">
          <span className="hero-eyebrow">✨ Citas en línea, sin fricción</span>
          <h1>Tu próxima cita de belleza empieza aquí</h1>
          <p>Encuentra un salón, elige tu servicio favorito y reserva en segundos.</p>
        </div>
        <div className="hero-orbs" aria-hidden="true">
          <span className="gem gem-1">🌸</span>
          <span className="gem gem-2">💧</span>
          <span className="gem gem-3">✨</span>
        </div>
      </section>

      <div className="steps-row">
        {STEPS.map((s, i) => (
          <div key={s.title} className="step-card spot" style={{ '--i': i }}>
            <span className="step-num">{i + 1}</span>
            <div className="step-icon">{s.icon}</div>
            <h4>{s.title}</h4>
            <p>{s.text}</p>
          </div>
        ))}
      </div>

      <div className="auth-split">
        <div className="auth-panel spot cta-panel">
          <div className="cta-flower">🌸</div>
          <h3>¿Lista para tu próxima cita?</h3>
          <p>
            No necesitas crear cuenta. Solo explora los negocios, elige un cupo disponible y deja tu teléfono para que
            te contacten.
          </p>
          <button className="btn-primary" onClick={() => { sounds.navigate(); navigate('/explorar'); }}>Explorar negocios</button>
        </div>

        <div className="auth-panel spot">
          <h3>Registra tu negocio</h3>
          <p className="panel-note">
            <strong>5 USD de crédito gratis</strong> al registrarte. Cada cita cuesta 0.25 USD. Cuando se acabe el saldo,
            recarga para seguir recibiendo reservas.
          </p>
          <RegisterForm />
        </div>
      </div>
    </PageTransition>
  );
}
