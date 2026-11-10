import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useFeedback } from '../../context/FeedbackContext';
import { normalizePhone } from '../../lib/dates';
import { sounds } from '../../lib/sound';
import Field from '../ui/Field';
import TypeGrid from './TypeGrid';
import SmsModal from './SmsModal';

const EMPTY = { name: '', owner: '', email: '', phone: '', password: '' };

export default function RegisterForm() {
  const { actions } = useApp();
  const { toast, burst } = useFeedback();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [type, setType] = useState(null);
  const [pending, setPending] = useState(null); // { data, code }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    const phone = normalizePhone(form.phone);

    if (!type) return toast('Selecciona un tipo de negocio.', { type: 'error' });
    if (phone.length < 8) return toast('Ingresa un teléfono válido.', { type: 'error' });

    // Un teléfono = una cuenta (se comprueba en la base de datos antes de enviar el SMS).
    setChecking(true);
    const { available } = await actions.phoneAvailable(phone);
    setChecking(false);
    if (!available) return toast('Ya existe una cuenta con ese teléfono. Solo se permite una cuenta por número.', { type: 'error' });

    // En producción el código se genera y se envía por SMS desde el backend.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setPending({ code, data: { name: form.name.trim(), owner: form.owner.trim(), email, phone, password: form.password, type } });
    sounds.click();
  };

  // Devuelve un texto de error (se muestra en el modal) o null si todo salió bien.
  const verified = async () => {
    const { error, needsConfirmation } = await actions.signUp(pending.data);
    if (error) return error;
    setPending(null);
    setForm(EMPTY);
    setType(null);
    sounds.splash();
    burst();
    if (needsConfirmation) {
      toast('Te enviamos un correo para confirmar tu cuenta. Después podrás iniciar sesión.', { type: 'success', title: '¡Casi listo!', duration: 7000 });
      navigate('/login');
    } else {
      toast('Tu cuenta está activa y ya tienes 5 USD de crédito de prueba.', { type: 'success', title: '¡Bienvenido a LushCita!' });
      navigate('/panel');
    }
    return null;
  };

  return (
    <>
      <form className="auth-form" onSubmit={submit}>
        <Field label="Nombre del negocio">
          {(id) => <input id={id} className="glass-input" placeholder="Ej. Luminous Studio" required value={form.name} onChange={set('name')} />}
        </Field>
        <Field label="Nombre del propietario">
          {(id) => <input id={id} className="glass-input" placeholder="Ej. Ana Martínez" required value={form.owner} onChange={set('owner')} />}
        </Field>
        <Field label="Correo electrónico">
          {(id) => <input id={id} type="email" className="glass-input" placeholder="tu@email.com" required value={form.email} onChange={set('email')} />}
        </Field>
        <Field label="Teléfono (verificación SMS)">
          {(id) => <input id={id} type="tel" className="glass-input" placeholder="+503 7000 0000" required value={form.phone} onChange={set('phone')} />}
        </Field>
        <Field label="Contraseña">
          {(id) => <input id={id} type="password" className="glass-input" placeholder="Mínimo 6 caracteres" required minLength={6} value={form.password} onChange={set('password')} />}
        </Field>
        <div className="input-group">
          <label>Tipo de negocio</label>
          <TypeGrid value={type} onChange={setType} />
        </div>
        <button type="submit" className="btn-primary" disabled={checking}>{checking ? 'Verificando…' : 'Crear cuenta de negocio'}</button>
        <div className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login" onClick={sounds.navigate}>Inicia sesión</Link>
        </div>
      </form>

      <SmsModal
        open={!!pending}
        code={pending?.code}
        onCancel={() => setPending(null)}
        onVerify={verified}
      />
    </>
  );
}
