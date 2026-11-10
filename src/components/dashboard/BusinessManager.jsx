import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SLOTS } from '../../data/constants';
import { useApp } from '../../context/AppContext';
import { useFeedback } from '../../context/FeedbackContext';
import BusinessAudioPlayer from '../ui/BusinessAudioPlayer';

const TABS = [
  { id: 'profile', label: 'Perfil del salón', icon: '✦' },
  { id: 'services', label: 'Servicios y precios', icon: '♡' },
  { id: 'schedule', label: 'Horarios', icon: '◷' },
];

const WEEKDAYS = [
  { id: '1', name: 'Lunes' },
  { id: '2', name: 'Martes' },
  { id: '3', name: 'Miércoles' },
  { id: '4', name: 'Jueves' },
  { id: '5', name: 'Viernes' },
  { id: '6', name: 'Sábado' },
  { id: '0', name: 'Domingo' },
];

const toServiceRows = (business) => (business.services || []).map((name) => ({
  id: crypto.randomUUID(),
  name,
  price: business.servicePrices?.[name] == null ? '' : String(business.servicePrices[name]),
}));

const initialSchedule = (business) => Object.fromEntries(WEEKDAYS.map(({ id }) => [
  id,
  [...(business.weeklySchedule?.[id] ?? business.slots ?? DEFAULT_SLOTS)].sort(),
]));

export default function BusinessManager({ business }) {
  const { actions } = useApp();
  const { toast } = useFeedback();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: business.name,
    owner: business.owner,
    phone: business.phone,
    location: business.location || '',
    audioUrl: business.audioUrl || '',
    imageUrl: business.imageUrl || null,
  });
  const [services, setServices] = useState(() => toServiceRows(business));
  const [weeklySchedule, setWeeklySchedule] = useState(() => initialSchedule(business));
  const [newService, setNewService] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newSlots, setNewSlots] = useState({});
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [audioRemoved, setAudioRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (!audioFile) {
      setAudioPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(audioFile);
    setAudioPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  const servicePrices = useMemo(() => Object.fromEntries(
    services.filter((service) => service.price.trim() !== '').map((service) => [service.name.trim(), Number(service.price)]),
  ), [services]);
  const slots = useMemo(() => [...new Set(Object.values(weeklySchedule).flat())].sort(), [weeklySchedule]);

  const save = async (event) => {
    event.preventDefault();
    if (services.some((service) => !service.name.trim() || (service.price !== '' && (!Number.isFinite(Number(service.price)) || Number(service.price) < 0)))) {
      return toast('Revisa los nombres de servicios y sus precios.', { type: 'error' });
    }
    if (new Set(services.map((service) => service.name.trim().toLocaleLowerCase()).filter(Boolean)).size !== services.length) {
      return toast('Cada servicio debe tener un nombre único.', { type: 'error' });
    }

    setBusy(true);
    const { error, data, warning } = await actions.updateBusiness({
      ...profile,
      audioUrl: audioRemoved ? null : profile.audioUrl,
      previousAudioUrl: profile.audioUrl,
      services: services.map((service) => service.name.trim()),
      servicePrices,
      slots,
      weeklySchedule,
    }, photo, audioFile);
    setBusy(false);
    if (error) return toast(error, { type: 'error' });
    setPhoto(null);
    setAudioFile(null);
    setAudioRemoved(false);
    setProfile((current) => ({
      ...current,
      imageUrl: data && 'imageUrl' in data ? data.imageUrl : current.imageUrl,
      audioUrl: data && 'audioUrl' in data ? data.audioUrl : current.audioUrl,
    }));
    toast('Los cambios del salón se guardaron correctamente.', { type: 'success' });
    if (warning) toast(warning, { type: 'error' });
  };

  const addService = () => {
    const name = newService.trim();
    if (!name) return toast('Escribe el nombre del servicio.', { type: 'error' });
    if (services.some((service) => service.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
      return toast('Ese servicio ya está en tu catálogo.', { type: 'error' });
    }
    if (services.length >= 30) return toast('Puedes agregar hasta 30 servicios.', { type: 'error' });
    setServices((current) => [...current, { id: crypto.randomUUID(), name, price: newPrice }]);
    setNewService('');
    setNewPrice('');
  };

  const toggleWorkDay = (dayId, isWorking) => {
    setWeeklySchedule((current) => ({
      ...current,
      [dayId]: isWorking ? (current[dayId].length ? current[dayId] : ['09:00']) : [],
    }));
  };

  const addSlot = (dayId) => {
    const time = newSlots[dayId];
    if (!time) return toast('Selecciona una hora.', { type: 'error' });
    const daySlots = weeklySchedule[dayId];
    if (daySlots.includes(time)) return toast('Ese horario ya está agregado para este día.', { type: 'error' });
    if (daySlots.length >= 48) return toast('Puedes agregar hasta 48 horarios por día.', { type: 'error' });
    setWeeklySchedule((current) => ({ ...current, [dayId]: [...current[dayId], time].sort() }));
    setNewSlots((current) => ({ ...current, [dayId]: '' }));
  };

  return (
    <section className="business-manager" aria-labelledby="manager-title">
      <div className="manager-heading">
        <div>
          <span className="manager-eyebrow">PANEL DE ADMINISTRACIÓN</span>
          <h2 id="manager-title">Administra tu salón</h2>
          <p>Actualiza tu perfil, menú de belleza y horarios de atención.</p>
        </div>
        <span className="manager-flower" aria-hidden="true">✿</span>
      </div>

      <div className="manager-tabs" role="tablist" aria-label="Administrar salón">
        {TABS.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`manager-${item.id}`}
            id={`tab-${item.id}`}
            className={`manager-tab${tab === item.id ? ' active' : ''}`}
            key={item.id}
            onClick={() => setTab(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>{item.label}
          </button>
        ))}
      </div>

      <form className="manager-content" onSubmit={save}>
        {tab === 'profile' && (
          <div id="manager-profile" role="tabpanel" aria-labelledby="tab-profile">
            <div className="profile-photo-row">
              <div className="profile-photo">
                {photoPreview || profile.imageUrl
                  ? <img src={photoPreview || profile.imageUrl} alt={`Foto de ${profile.name}`} />
                  : <span aria-hidden="true">✿</span>}
              </div>
              <div className="profile-photo-actions">
                <strong>Imagen de tu salón</strong>
                <p>JPG, PNG o WebP · máximo 5 MB</p>
                <label className="btn-secondary photo-upload">
                  Elegir imagen
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const selected = event.target.files?.[0] || null;
                      if (selected && (selected.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(selected.type))) {
                        toast('Elige una imagen JPG, PNG o WebP de máximo 5 MB.', { type: 'error' });
                        event.target.value = '';
                        return;
                      }
                      setPhoto(selected);
                      event.target.value = '';
                    }}
                  />
                </label>
                {(photoPreview || profile.imageUrl) && (
                  <button
                    type="button"
                    className="manager-text-button"
                    onClick={() => { setPhoto(null); setProfile((current) => ({ ...current, imageUrl: null })); }}
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>
            <div className="manager-form-grid">
              <label className="input-group">
                <span>Nombre del salón</span>
                <input className="glass-input" required maxLength={80} value={profile.name} onChange={(e) => setProfile((current) => ({ ...current, name: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Nombre de la persona responsable</span>
                <input className="glass-input" required maxLength={80} value={profile.owner} onChange={(e) => setProfile((current) => ({ ...current, owner: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Teléfono de contacto</span>
                <input className="glass-input" type="tel" required value={profile.phone} onChange={(e) => setProfile((current) => ({ ...current, phone: e.target.value }))} />
              </label>
              <label className="input-group manager-location-field">
                <span>Ciudad, colonia o zona</span>
                <input
                  className="glass-input"
                  maxLength={160}
                  placeholder="Ej. Colonia Escalón, San Salvador"
                  value={profile.location}
                  onChange={(e) => setProfile((current) => ({ ...current, location: e.target.value }))}
                />
                <small>Esta ubicación aparecerá en Explorar para que tus clientes te encuentren.</small>
              </label>
              <div className="manager-audio-field">
                <div className="manager-section-copy">
                  <h3>Música para tu salón</h3>
                  <p>Sube una pista de audio para que tú y tus clientes puedan escucharla sin video.</p>
                </div>
                <label className="btn-secondary photo-upload">
                  {audioFile ? 'Cambiar audio' : 'Elegir archivo de audio'}
                  <input
                    type="file"
                    accept=".mp3,.m4a,.aac,.ogg,.wav,.webm,audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/x-wav,audio/webm"
                    onChange={(event) => {
                      const selected = event.target.files?.[0] || null;
                      const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/x-aac', 'audio/ogg', 'audio/wave', 'audio/vnd.wave', 'audio/wav', 'audio/x-wav', 'audio/webm'];
                      if (selected && (selected.size > 10 * 1024 * 1024 || !allowedTypes.includes(selected.type))) {
                        toast('Elige un audio MP3, M4A, AAC, OGG, WAV o WebM de máximo 10 MB.', { type: 'error' });
                        event.target.value = '';
                        return;
                      }
                      setAudioFile(selected);
                      setAudioRemoved(false);
                      event.target.value = '';
                    }}
                  />
                </label>
                <small className="manager-audio-help">MP3, M4A, AAC, OGG, WAV o WebM · máximo 10 MB</small>
                <BusinessAudioPlayer
                  src={audioPreview || (audioRemoved ? null : profile.audioUrl)}
                  label={`Vista previa de música de ${profile.name}`}
                  className="manager-audio-player"
                />
                {(audioFile || profile.audioUrl) && (
                  <button
                    type="button"
                    className="manager-text-button"
                    onClick={() => {
                      setAudioFile(null);
                      setAudioRemoved(true);
                    }}
                  >
                    Quitar música
                  </button>
                )}
              </div>
              <div className="manager-type-note">
                <span>Especialidad</span>
                <strong>💇‍♀️ {business.type}</strong>
              </div>
            </div>
          </div>
        )}

        {tab === 'services' && (
          <div id="manager-services" role="tabpanel" aria-labelledby="tab-services">
            <div className="manager-section-copy">
              <h3>Menú de servicios</h3>
              <p>Define qué ofreces y el precio que verán tus clientes al reservar. Precios en USD.</p>
            </div>
            <div className="service-editor-list">
              {services.map((service, index) => (
                <div className="service-editor-row" key={service.id}>
                  <label className="sr-only" htmlFor={`service-name-${index}`}>Nombre del servicio</label>
                  <input
                    id={`service-name-${index}`}
                    className="glass-input"
                    required
                    maxLength={80}
                    value={service.name}
                    onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))}
                  />
                  <label className="price-input">
                    <span>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      aria-label={`Precio de ${service.name}`}
                      placeholder="Precio"
                      value={service.price}
                      onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, price: event.target.value } : item))}
                    />
                  </label>
                  <button type="button" className="manager-remove" aria-label={`Eliminar ${service.name}`} onClick={() => setServices((current) => current.filter((_, i) => i !== index))}>×</button>
                </div>
              ))}
            </div>
            <div className="service-add-row">
              <input className="glass-input" aria-label="Nuevo servicio" placeholder="Ej. Manicura semipermanente" maxLength={80} value={newService} onChange={(e) => setNewService(e.target.value)} />
              <label className="price-input">
                <span>$</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" aria-label="Precio del nuevo servicio" placeholder="Precio" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
              </label>
              <button type="button" className="btn-secondary" onClick={addService}>Añadir</button>
            </div>
          </div>
        )}

        {tab === 'schedule' && (
          <div id="manager-schedule" role="tabpanel" aria-labelledby="tab-schedule">
            <div className="manager-section-copy">
              <h3>Tu semana de trabajo</h3>
              <p>Elige los días que trabajas y define horas específicas para cada uno. Las citas existentes se conservan.</p>
            </div>
            <div className="weekly-schedule-grid">
              {WEEKDAYS.map(({ id, name }, index) => {
                const daySlots = weeklySchedule[id];
                return (
                  <article className="schedule-day" style={{ '--day-index': index }} key={id}>
                    <header className="schedule-day-header">
                      <h4>{name}</h4>
                      <label className="schedule-toggle">
                        <input type="checkbox" checked={daySlots.length > 0} onChange={(event) => toggleWorkDay(id, event.target.checked)} />
                        <span>{daySlots.length ? 'Trabajo' : 'Cerrado'}</span>
                      </label>
                    </header>
                    {daySlots.length > 0 ? (
                      <>
                        <div className="schedule-slots">
                          {daySlots.map((slot) => (
                            <span className="schedule-slot" key={slot}>
                              {slot}
                              <button type="button" aria-label={`Quitar ${slot} del ${name}`} onClick={() => setWeeklySchedule((current) => ({ ...current, [id]: current[id].filter((item) => item !== slot) }))}>×</button>
                            </span>
                          ))}
                        </div>
                        <div className="schedule-day-add">
                          <input
                            type="time"
                            aria-label={`Nueva hora para ${name}`}
                            value={newSlots[id] || ''}
                            onChange={(event) => setNewSlots((current) => ({ ...current, [id]: event.target.value }))}
                          />
                          <button type="button" onClick={() => addSlot(id)}>+ Hora</button>
                        </div>
                      </>
                    ) : (
                      <p className="schedule-closed">Día libre · no se mostrarán citas</p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div className="manager-save-row">
          <span>Los cambios se reflejan en las próximas reservas.</span>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  );
}
