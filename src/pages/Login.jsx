import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import PageTransition from '../components/ui/PageTransition';
import Field from '../components/ui/Field';
import { sounds } from '../lib/sound';

export default function Login() {
  const { actions } = useApp();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await actions.signIn(email.trim().toLowerCase(), password);
    setBusy(false);
    if (error) return toast(error, { type: 'error' });
    sounds.success();
    navigate('/panel');
  };

  return (
    <PageTransition>
      <div className="hero-title">
        <h1>Bienvenido de vuelta</h1>
        <p>Inicia sesión para gestionar tu negocio</p>
      </div>
      <div className="login-wrap spot auth-panel">
        <form className="auth-form" onSubmit={submit}>
          <Field label="Correo electrónico">
            {(id) => <input id={id} type="email" className="glass-input" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Contraseña">
            {(id) => <input id={id} type="password" className="glass-input" placeholder="Tu contraseña" required value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Entrando…' : 'Iniciar sesión'}</button>
          <div className="auth-switch">
            ¿No tienes cuenta? <Link to="/" onClick={sounds.navigate}>Registra tu negocio</Link>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
