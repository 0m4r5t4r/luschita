const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const getTodayStr = () => toStr(new Date());

export function getDateStr(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toStr(d);
}

export function formatDateShort(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} ${MONTHS_SHORT[parseInt(m, 10) - 1]}`;
}

export function formatDateLong(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} de ${MONTHS_LONG[parseInt(m, 10) - 1]}`;
}

// Fecha/hora local combinadas (evita problemas de zona horaria con strings ISO).
export const toDateTime = (date, time) => new Date(`${date}T${time}`);
export const isPast = (date, time) => toDateTime(date, time) < new Date();

export const byDateTime = (a, b) => toDateTime(a.date, a.time) - toDateTime(b.date, b.time);

export const getInitials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';

export const normalizePhone = (phone) => (phone || '').replace(/[^\d+]/g, '');

export const pluralCitas = (n) => (n === 1 ? '1 cita' : `${n} citas`);

export function getBusinessSlotsForDate(business, date, defaultSlots = []) {
  if (business.weeklySchedule) {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    return business.weeklySchedule[String(weekday)] || [];
  }
  return business.slots || defaultSlots;
}

// Primer día (de los próximos 7) con al menos un cupo libre y no pasado.
export function firstAvailableDate(business, defaultSlots = [], days = 7) {
  for (let i = 0; i < days; i++) {
    const date = getDateStr(i);
    const slots = getBusinessSlotsForDate(business, date, defaultSlots);
    const taken = new Set(business.appointments.filter((a) => a.date === date && a.status !== 'cancelled').map((a) => a.time));
    if (slots.some((s) => !taken.has(s) && !isPast(date, s))) return date;
  }
  return getDateStr(0);
}
