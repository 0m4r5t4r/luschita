export const SOUND_KEY = 'lushcita_sound_on';

export const PRICE_PER_APPOINTMENT = 0.25;
export const DEFAULT_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00'];

export const RECHARGE_PACKS = [
  { amount: 5, label: '5 USD — 20 citas' },
  { amount: 10, label: '10 USD — 40 citas' },
  { amount: 25, label: '25 USD — 100 citas' },
  { amount: 50, label: '50 USD — 200 citas' },
];

// Tipos de negocio: icono, etiqueta corta (para chips) y servicios por defecto.
export const BUSINESS_TYPES = {
  'Salón de belleza': {
    short: 'Belleza', icon: '💇‍♀️', hue: 330,
    services: ['Corte y peinado', 'Manicura + pedicura', 'Maquillaje profesional', 'Tratamiento capilar', 'Depilación con cera', 'Facial hidratante', 'Diseño de cejas'],
  },
  'Barbería': {
    short: 'Barbería', icon: '💈', hue: 210,
    services: ['Corte clásico', 'Arreglo de barba', 'Afeitado tradicional', 'Corte + barba', 'Diseño de cejas', 'Mascarilla facial'],
  },
  'Spa': {
    short: 'Spa', icon: '🧖‍♀️', hue: 160,
    services: ['Masaje relajante', 'Masaje descontracturante', 'Facial anti-edad', 'Aromaterapia', 'Exfoliación corporal', 'Envoltura de algas'],
  },
  'Consultorio médico': {
    short: 'Médico', icon: '🩺', hue: 190,
    services: ['Consulta general', 'Chequeo preventivo', 'Nutrición', 'Dermatología', 'Fisioterapia', 'Psicología'],
  },
  'Estudio de tatuajes': {
    short: 'Tatuajes', icon: '🎨', hue: 280,
    services: ['Tatuaje pequeño', 'Tatuaje mediano', 'Tatuaje grande', 'Retoque', 'Piercing', 'Diseño personalizado'],
  },
  'Entrenador personal': {
    short: 'Fitness', icon: '🏋️', hue: 25,
    services: ['Entrenamiento 1 a 1', 'Rutina personalizada', 'Evaluación física', 'Clase grupal', 'Plan nutricional', 'Sesión de estiramiento'],
  },
  'Fotografía': {
    short: 'Fotografía', icon: '📸', hue: 255,
    services: ['Sesión de retrato', 'Sesión de producto', 'Evento social', 'Book profesional', 'Sesión familiar', 'Edición de fotos'],
  },
  'Otro negocio': {
    short: 'Otro', icon: '✨', hue: 45,
    services: ['Consulta', 'Servicio básico', 'Servicio premium', 'Asesoría', 'Personalizado'],
  },
};

export const getBusinessConfig = (type) => BUSINESS_TYPES[type] || BUSINESS_TYPES['Otro negocio'];

export const STATUS = {
  pending: { label: 'pendiente', className: 'pending' },
  confirmed: { label: 'confirmada', className: 'confirmed' },
  cancelled: { label: 'cancelada', className: 'cancelled' },
};
