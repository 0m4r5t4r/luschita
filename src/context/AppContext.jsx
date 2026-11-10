import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { supabase } from '../lib/supabase';
import * as api from '../lib/api';

/**
 * Estado global de la app, ahora respaldado por Supabase (PostgreSQL).
 *
 *  - user:        usuario autenticado (negocio) o null
 *  - business:    su negocio + citas + monedero (solo si hay sesión)
 *  - businesses:  lista pública para "Explorar" (clientes sin cuenta)
 *
 * El estado se maneja con useReducer; las acciones async llaman a la API y luego
 * refrescan los datos desde la base (la BD es la fuente de verdad).
 */
const AppContext = createContext(null);

const initial = {
  authReady: false,        // ya sabemos si hay sesión guardada
  user: null,
  business: null,
  businessLoading: false,
  businesses: [],
  publicLoading: false,
  publicError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'AUTH':
      return { ...state, authReady: true, user: action.user, ...(action.user ? {} : { business: null, businessLoading: false }) };
    case 'BUSINESS_LOADING':
      return { ...state, businessLoading: true };
    case 'BUSINESS_LOADED':
      // undefined = falló la consulta: conservamos lo que ya se mostraba
      return { ...state, business: action.business === undefined ? state.business : action.business, businessLoading: false };
    case 'PUBLIC_LOADING':
      return { ...state, publicLoading: true };
    case 'PUBLIC_LOADED':
      return { ...state, businesses: action.businesses ?? state.businesses, publicLoading: false, publicError: action.error ?? null };
    default:
      return state;
  }
}

const POLL_MS = 15000; // el panel se refresca solo para ver reservas nuevas

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const userId = state.user?.id;

  // ---------- Carga de datos ----------
  const refreshBusiness = useCallback(async ({ silent = false } = {}) => {
    if (!silent) dispatch({ type: 'BUSINESS_LOADING' });
    const { data, error } = await api.fetchOwnBusiness();
    dispatch({ type: 'BUSINESS_LOADED', business: error ? undefined : data });
    return error;
  }, []);

  const refreshPublic = useCallback(async () => {
    dispatch({ type: 'PUBLIC_LOADING' });
    const { data, error } = await api.fetchPublicBusinesses();
    dispatch({ type: 'PUBLIC_LOADED', businesses: data, error });
    return error;
  }, []);

  // ---------- Sesión (Supabase Auth) ----------
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) dispatch({ type: 'AUTH', user: data.session?.user ?? null });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) dispatch({ type: 'AUTH', user: session?.user ?? null });
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  // Al iniciar sesión: cargar el negocio y mantenerlo fresco (polling + al volver a la pestaña).
  useEffect(() => {
    if (!userId) return undefined;
    refreshBusiness();
    const timer = setInterval(() => refreshBusiness({ silent: true }), POLL_MS);
    const onFocus = () => refreshBusiness({ silent: true });
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [userId, refreshBusiness]);

  // ---------- Acciones (devuelven { error } con texto listo para mostrar) ----------
  const actions = useMemo(() => ({
    refreshPublic,
    refreshBusiness,

    async signUp(form) {
      const { data, error } = await api.signUpBusiness(form);
      if (error) return { error };
      // Con "confirmar email" activo Supabase devuelve identities vacías si el correo ya existe.
      if (data.user && data.user.identities?.length === 0) return { error: 'Ya existe una cuenta con ese email.' };
      return { error: null, needsConfirmation: !data.session };
    },

    async signIn(email, password) {
      const { error } = await api.signIn(email, password);
      return { error };
    },

    async signOut() {
      await api.signOut();
    },

    async bookGuest(businessId, appointment) {
      const { error } = await api.bookGuestAppointment(businessId, appointment);
      await refreshPublic(); // el cupo debe verse ocupado de inmediato
      return { error };
    },

    async addManual(appointment) {
      const { error } = await api.addManualAppointment(appointment);
      await refreshBusiness({ silent: true });
      return { error };
    },

    async setStatus(appointmentId, status) {
      const { error } = await api.setAppointmentStatus(appointmentId, status);
      await refreshBusiness({ silent: true });
      return { error };
    },

    async recharge(amount) {
      const { error } = await api.rechargeWallet(amount);
      await refreshBusiness({ silent: true });
      return { error };
    },

    async updateBusiness(profile, photoFile) {
      const { error, data } = await api.updateBusinessSettings(profile, photoFile, userId);
      if (!error) {
        await refreshBusiness({ silent: true });
        await refreshPublic();
      }
      return { error, data };
    },

    async rateBusiness(businessId, rating, voterId) {
      const { data, error } = await api.submitBusinessRating(businessId, rating, voterId);
      if (!error) await refreshPublic();
      return { data, error };
    },

    phoneAvailable: async (phone) => {
      const { data, error } = await api.phoneAvailable(phone);
      return { available: error ? true : data, error }; // si falla la consulta, la BD igual valida el teléfono único
    },
  }), [refreshBusiness, refreshPublic, userId]);

  const getBusinessById = useCallback((id) => state.businesses.find((b) => b.id === id), [state.businesses]);

  const value = useMemo(
    () => ({
      authReady: state.authReady,
      user: state.user,
      currentBusiness: state.business,
      businessLoading: state.businessLoading,
      businesses: state.businesses,
      publicLoading: state.publicLoading,
      publicError: state.publicError,
      getBusinessById,
      actions,
    }),
    [state, getBusinessById, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
