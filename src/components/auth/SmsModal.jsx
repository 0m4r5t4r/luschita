import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import OtpInput from './OtpInput';
import { sounds } from '../../lib/sound';

export default function SmsModal({ open, code, onCancel, onVerify }) {
  const [entered, setEntered] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setEntered(''); setError(''); setBusy(false); } }, [open]);

  const verify = async () => {
    if (entered !== code) { setError('Código incorrecto. Intenta de nuevo.'); sounds.error(); return; }
    setBusy(true);
    const err = await onVerify(); // crea la cuenta en Supabase
    setBusy(false);
    if (err) { setError(err); sounds.error(); }
  };

  return (
    <Modal open={open} onClose={onCancel} labelledBy="sms-title">
      <h3 id="sms-title">📱 Verifica tu teléfono</h3>
      <p>
        Para evitar cuentas duplicadas, enviamos un código SMS al número que registraste. Ingrésalo para activar tu
        cuenta y recibir tus 5 USD de crédito de prueba.
      </p>
      <div className="demo-code">
        Código de demostración: <strong>{code}</strong>
      </div>
      <OtpInput value={entered} onChange={(v) => { setEntered(v); setError(''); }} />
      <div className="form-error">{error}</div>
      <div className="modal-actions">
        <button className="btn-secondary" disabled={busy} onClick={() => { sounds.click(); onCancel(); }}>Cancelar</button>
        <button className="btn-primary btn-compact" disabled={busy} onClick={verify}>{busy ? 'Creando cuenta…' : 'Verificar y activar'}</button>
      </div>
    </Modal>
  );
}
