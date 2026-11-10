import { supabase } from './supabase';
import { getBusinessConfig } from '../data/constants';

/**
 * Capa de acceso a datos (Supabase). Toda función devuelve { data, error }
 * donde error ya es un texto en español listo para mostrar en un toast.
 */

const ERRORS = {
  slot_taken: 'Ese cupo acaba de ser reservado. Elige otro.',
  business_unavailable: 'Este negocio no tiene saldo disponible para recibir reservas.',
  business_not_found: 'No se encontró el negocio.',
  invalid_service: 'Selecciona un servicio válido.',
  invalid_slot: 'Ese horario no existe en este negocio.',
  invalid_date: 'La fecha no es válida.',
  invalid_contact: 'Revisa tu nombre y teléfono.',
  invalid_business_profile: 'Revisa el nombre, el teléfono y los servicios del negocio.',
  invalid_service_price: 'Los precios deben ser números iguales o mayores que cero.',
  invalid_schedule: 'Agrega al menos un horario válido y sin duplicados.',
  insufficient_balance: 'No tienes saldo suficiente. Recarga tu monedero.',
  appointment_not_found: 'No se encontró la cita.',
  invalid_amount: 'Monto de recarga inválido.',
  not_authenticated: 'Tu sesión expiró. Inicia sesión de nuevo.',
  'Invalid login credentials': 'Credenciales incorrectas.',
  'Email not confirmed': 'Debes confirmar tu correo antes de entrar (revisa tu bandeja).',
  'User already registered': 'Ya existe una cuenta con ese email.',
  'Database error saving new user': 'No se pudo crear la cuenta. Es posible que el teléfono o el correo ya estén registrados.',
  'Failed to fetch': 'No hay conexión con el servidor. Revisa tu internet.',
};

export function friendlyError(err) {
  if (!err) return null;
  const msg = err.message || String(err);
  const key = Object.keys(ERRORS).find((k) => msg.includes(k));
  if (key) return ERRORS[key];
  if (/password/i.test(msg) && /characters|least/i.test(msg)) return 'La contraseña debe tener al menos 6 caracteres.';
  if (/rate limit/i.test(msg)) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  return msg;
}

const wrap = ({ data, error }) => ({ data, error: friendlyError(error) });
const attempt = async (fn) => {
  try { return wrap(await fn()); } catch (e) { return { data: null, error: friendlyError(e) }; }
};

// ---------- Mapeos BD → forma que usa la interfaz ----------
const mapAppointment = (a) => ({
  id: a.id,
  name: a.name,
  phone: a.phone,
  service: a.service,
  date: String(a.date).slice(0, 10),
  time: String(a.time).slice(0, 5),
  status: a.status,
  createdBy: a.created_by,
});

const mapOwnBusiness = (b, appointments) => ({
  id: b.id,
  name: b.name,
  owner: b.owner,
  email: b.email,
  phone: b.phone,
  type: b.type,
  services: b.services,
  servicePrices: b.service_prices || {},
  slots: b.slots,
  weeklySchedule: b.weekly_schedule,
  imageUrl: b.image_url,
  wallet: {
    balance: Number(b.balance),
    totalSpent: Number(b.total_spent),
    totalRecharged: Number(b.total_recharged),
    isTrial: b.is_trial,
  },
  appointments: appointments.map(mapAppointment),
});

// ---------- Autenticación ----------
export const signUpBusiness = ({ name, owner, email, phone, password, type }) =>
  attempt(() =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        // El trigger handle_new_user() de la BD crea el negocio con estos datos.
        data: { business_name: name, owner, phone, type, services: getBusinessConfig(type).services },
      },
    }),
  );

export const signIn = (email, password) => attempt(() => supabase.auth.signInWithPassword({ email, password }));
export const signOut = () => attempt(() => supabase.auth.signOut());
export const phoneAvailable = (phone) => attempt(() => supabase.rpc('phone_available', { p_phone: phone }));

// ---------- Datos del negocio autenticado ----------
export async function fetchOwnBusiness() {
  try {
    const [biz, appts] = await Promise.all([
      supabase.from('businesses').select('*').maybeSingle(),
      supabase.from('appointments').select('*').order('date').order('time'),
    ]);
    if (biz.error) return { data: null, error: friendlyError(biz.error) };
    if (appts.error) return { data: null, error: friendlyError(appts.error) };
    return { data: biz.data ? mapOwnBusiness(biz.data, appts.data) : null, error: null };
  } catch (e) {
    return { data: null, error: friendlyError(e) };
  }
}

export const setAppointmentStatus = (id, status) =>
  attempt(() => supabase.rpc('set_appointment_status', { p_id: id, p_status: status }));

export const addManualAppointment = (a) =>
  attempt(() => supabase.rpc('add_manual_appointment', { p_name: a.name, p_phone: a.phone, p_service: a.service, p_date: a.date, p_time: a.time }));

export const rechargeWallet = (amount) => attempt(() => supabase.rpc('recharge_wallet', { p_amount: amount }));

const PHOTO_BUCKET = 'business-photos';
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function updateBusinessSettings(profile, photoFile, userId) {
  let imageUrl = profile.imageUrl || null;
  let uploadedPath = null;

  if (photoFile) {
    if (!PHOTO_TYPES.has(photoFile.type) || photoFile.size > MAX_PHOTO_SIZE) {
      return { data: null, error: 'Elige una imagen JPG, PNG o WebP de máximo 5 MB.' };
    }

    const extension = photoFile.type.split('/')[1].replace('jpeg', 'jpg');
    uploadedPath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const upload = await supabase.storage.from(PHOTO_BUCKET).upload(uploadedPath, photoFile, {
      cacheControl: '3600',
      contentType: photoFile.type,
      upsert: false,
    });
    if (upload.error) return { data: null, error: friendlyError(upload.error) };
    imageUrl = `${supabase.storage.from(PHOTO_BUCKET).getPublicUrl(uploadedPath).data.publicUrl}?v=${Date.now()}`;
  }

  const result = await attempt(() => supabase.rpc('update_business_settings', {
    p_name: profile.name,
    p_owner: profile.owner,
    p_phone: profile.phone,
    p_services: profile.services,
    p_slots: profile.slots,
    p_service_prices: profile.servicePrices,
    p_weekly_schedule: profile.weeklySchedule,
    p_image_url: imageUrl,
  }));

  if (result.error && uploadedPath) {
    const cleanup = await supabase.storage.from(PHOTO_BUCKET).remove([uploadedPath]);
    if (cleanup.error) {
      return { data: null, error: `${result.error} No se pudo limpiar la imagen cargada: ${friendlyError(cleanup.error)}` };
    }
  }
  return result.error ? result : { ...result, data: { imageUrl } };
}

// ---------- Datos públicos (clientes sin cuenta) ----------
export async function fetchPublicBusinesses() {
  try {
    const [biz, taken] = await Promise.all([
      supabase.from('public_businesses').select('*').order('name'),
      supabase.from('public_taken_slots').select('*'),
    ]);
    if (biz.error) return { data: null, error: friendlyError(biz.error) };
    if (taken.error) return { data: null, error: friendlyError(taken.error) };
    const data = biz.data.map((b) => ({
      ...b,
      servicePrices: b.service_prices || {},
      imageUrl: b.image_url,
      weeklySchedule: b.weekly_schedule,
      // Formato compatible con SlotGrid/BusinessCard: cupos ocupados como "citas" mínimas.
      appointments: taken.data
        .filter((t) => t.business_id === b.id)
        .map((t) => ({ date: String(t.date).slice(0, 10), time: String(t.time).slice(0, 5), status: 'confirmed' })),
    }));
    return { data, error: null };
  } catch (e) {
    return { data: null, error: friendlyError(e) };
  }
}

export const bookGuestAppointment = (businessId, a) =>
  attempt(() => supabase.rpc('book_appointment', { p_business: businessId, p_name: a.name, p_phone: a.phone, p_service: a.service, p_date: a.date, p_time: a.time }));
