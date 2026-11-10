# LushCita · Sistema de citas en línea (React)

Proyecto de la materia de Frameworks. Migración de la versión HTML/JS a **React 18 + Vite**, con la estética
**liquid glass pastel** original, ampliada con más efectos visuales.

## Puesta en marcha (3 pasos)

**1. Base de datos.** En Supabase → *SQL Editor* → *New query*, pega TODO el contenido de
`supabase/schema.sql` y pulsa **Run**. Si ya configuraste una versión anterior, vuelve a ejecutar el script para
agregar precios, foto del negocio, ubicación, enlace de YouTube, valoraciones, permisos de almacenamiento y las funciones de edición.

**2. (Recomendado para la demo) Desactiva la confirmación por correo.**
*Authentication → Sign In / Providers → Email → desactiva "Confirm email"*. Si la dejas activa, todo funciona,
pero cada negocio nuevo debe confirmar su correo antes de entrar.

**3. Ejecutar la app.** Las claves públicas ya están en `.env`.

```bash
npm install
npm run dev       # desarrollo → http://localhost:5173
npm run build     # build de producción en /dist
```

## Base de datos (Supabase · PostgreSQL)

| Tabla / vista | Para qué |
|---|---|
| `businesses` | Un negocio por usuario de Auth (`id = auth.users.id`), con su saldo, servicios, precios, horarios, imagen y música |
| `appointments` | Citas; índice único = un cupo no se puede reservar dos veces |
| `wallet_transactions` | Historial del monedero (bono, cobros, recargas) |
| `business_ratings` | Votos de visitantes; se publica solo el promedio y el total |
| `public_businesses` / `public_taken_slots` | Vistas públicas para "Explorar" (sin teléfono, email ni saldo) |

- **Seguridad (RLS):** cada negocio solo lee lo suyo. El navegador **no puede** modificar saldos ni citas con
  `update/insert`; solo mediante funciones SQL (`book_appointment`, `set_appointment_status`,
  `add_manual_appointment`, `recharge_wallet`), que validan y cobran de forma atómica.
- **Registro:** `supabase.auth.signUp` + trigger `handle_new_user` crea el negocio y el bono de 5 USD.
- **Administración:** el panel permite editar el perfil del salón, subir su imagen, gestionar servicios y precios, y definir días de trabajo y horarios específicos para cada día de la semana.
- **Ubicación:** el perfil acepta ciudad, colonia o zona; Explorar permite filtrar por ubicación y el perfil público ofrece abrirla en Google Maps.
- **Música:** el negocio puede agregar un enlace de video de YouTube; el visitante inicia y detiene el reproductor desde el perfil público.
- **Valoraciones:** visitantes pueden votar de 1 a 5 estrellas sin iniciar sesión; el voto se puede actualizar desde el mismo navegador.
- **Fotos:** se guardan en el bucket público `business-photos`; las políticas solo permiten a cada negocio administrar sus propios archivos.
- **Reservas:** los clientes ven el catálogo y los precios públicos del salón. Los cambios de horario aplican a nuevas reservas; las citas existentes se conservan.
- **Login real:** Supabase Auth (contraseñas cifradas, sesión persistente).
- El script se probó en un Postgres local (41 pruebas: registro, doble reserva, cobro único, recarga, aislamiento).

## Conceptos de React que usa

| Concepto | Dónde |
|---|---|
| Componentes y props | `src/components/**` |
| `useState` / `useEffect` / `useMemo` / `useRef` / `useId` | formularios, dashboard, `OtpInput`, `Field` |
| `useReducer` + Context API (estado global) | `src/context/AppContext.jsx` (sesión, negocio, lista pública) |
| Context para feedback (toasts, burbujas) | `src/context/FeedbackContext.jsx` |
| Custom hooks | `useGlassEffects`, `useAnimatedNumber` |
| React Router (HashRouter, rutas con parámetro, ruta protegida) | `src/App.jsx`, `/explorar/:bizId` |
| Portales | `components/ui/Modal.jsx` |
| Animaciones declarativas (framer-motion) | transiciones de página, listas, modales, toasts |
| Datos remotos async (Supabase) | `src/lib/api.js`, acciones en `AppContext` (polling cada 15 s en el panel) |

## Estructura

```
src/
├─ components/ layout · ui · auth · dashboard · explore
├─ context/    AppContext (reducer) · FeedbackContext (toasts + splash)
├─ data/       constantes y tipos de negocio
├─ hooks/      useGlassEffects · useAnimatedNumber
├─ lib/        supabase (cliente) · api (acceso a datos) · dates · wallet · sound
├─ pages/      Landing · Login · Dashboard · Explore
├─ styles/     base.css (estilo original) · enhance.css (mejoras visuales)
└─ supabase/schema.sql   ← pegar en el SQL Editor
```

## Rutas

`/#/` landing + registro · `/#/login` · `/#/panel` (requiere sesión) · `/#/explorar` · `/#/explorar/:id`

## Mejoras visuales

- Fondo vivo: blobs pastel con parallax del mouse, burbujas de jabón, grano de vidrio esmerilado.
- Brillo especular que sigue al cursor y inclinación 3D suave en tarjetas.
- Ripple líquido en botones, barrido de luz en botones primarios.
- Monedero con anillo de progreso y números animados.
- Agenda semanal con puntos por estado; avatares con iniciales; transiciones al aceptar/cancelar.
- Toasts de cristal (reemplazan `alert()`), explosión de burbujas en acciones exitosas.
- Landing con "cómo funciona", búsqueda en Explorar, paquetes de recarga visuales, botón de silencio.
- Experiencia enfocada en salones de belleza, con catálogo de precios y diseño adaptable a móviles.
- Respeta `prefers-reduced-motion`.

## Notas

- El SMS de verificación y el pago de la recarga siguen **simulados** (en producción: Twilio y Stripe/MercadoPago).
- La clave del `.env` es la *publishable key* (pública por diseño). Nunca pongas la `secret`/`service_role` en el frontend.
- Para la demo, registra 2-3 negocios y aparecerán en Explorar.
