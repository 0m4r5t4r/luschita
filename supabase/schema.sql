-- =====================================================================
--  LushCita · esquema de base de datos para Supabase (PostgreSQL)
--  Pégalo completo en: Supabase → SQL Editor → New query → Run
--  Es seguro volver a ejecutarlo (usa IF NOT EXISTS / CREATE OR REPLACE).
-- =====================================================================
--
--  Modelo de seguridad
--  -------------------
--  * Un NEGOCIO = un usuario de Supabase Auth (businesses.id = auth.users.id).
--  * Las tablas tienen RLS activado y el navegador solo puede LEER lo suyo.
--  * Toda escritura sensible (reservar, aceptar/cobrar, recargar) pasa por
--    funciones SQL (RPC): así nadie puede ponerse saldo desde la consola.
--  * Los clientes SIN cuenta solo ven una vista pública (sin teléfono, email ni saldo).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) TABLAS
-- ---------------------------------------------------------------------

create table if not exists public.businesses (
  id              uuid primary key references auth.users (id) on delete cascade,
  name            text        not null check (char_length(name) between 1 and 80),
  owner           text        not null check (char_length(owner) between 1 and 80),
  email           text        not null,
  phone           text        not null unique,
  type            text        not null,
  services        text[]      not null default '{}',
  slots           text[]      not null default array['09:00','10:00','11:00','12:00','13:00','16:00','17:00','18:00','19:00'],
  balance         numeric(10,2) not null default 5.00 check (balance >= 0),
  total_spent     numeric(10,2) not null default 0,
  total_recharged numeric(10,2) not null default 0,
  is_trial        boolean     not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid        not null references public.businesses (id) on delete cascade,
  name        text        not null check (char_length(name) between 1 and 80),
  phone       text        not null check (char_length(phone) between 6 and 30),
  service     text        not null check (char_length(service) between 1 and 80),
  date        date        not null,
  time        time        not null,
  status      text        not null default 'pending'   check (status in ('pending','confirmed','cancelled')),
  created_by  text        not null default 'guest'     check (created_by in ('guest','business')),
  created_at  timestamptz not null default now()
);

-- Un cupo solo puede tener UNA cita activa (evita dobles reservas aun con clics simultáneos).
create unique index if not exists appointments_one_active_per_slot
  on public.appointments (business_id, date, time)
  where status <> 'cancelled';

create index if not exists appointments_business_date_idx
  on public.appointments (business_id, date);

create table if not exists public.wallet_transactions (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid        not null references public.businesses (id) on delete cascade,
  type           text        not null check (type in ('signup_bonus','charge','recharge')),
  amount         numeric(10,2) not null,
  balance_after  numeric(10,2) not null,
  appointment_id uuid        references public.appointments (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists wallet_transactions_business_idx
  on public.wallet_transactions (business_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2) ROW LEVEL SECURITY + permisos mínimos
-- ---------------------------------------------------------------------

alter table public.businesses          enable row level security;
alter table public.appointments        enable row level security;
alter table public.wallet_transactions enable row level security;

revoke all on public.businesses, public.appointments, public.wallet_transactions from anon, authenticated;
grant select on public.businesses, public.appointments, public.wallet_transactions to authenticated;

drop policy if exists "negocio ve su perfil"   on public.businesses;
drop policy if exists "negocio ve sus citas"   on public.appointments;
drop policy if exists "negocio ve sus movimientos" on public.wallet_transactions;

create policy "negocio ve su perfil"       on public.businesses          for select to authenticated using (id = auth.uid());
create policy "negocio ve sus citas"       on public.appointments        for select to authenticated using (business_id = auth.uid());
create policy "negocio ve sus movimientos" on public.wallet_transactions for select to authenticated using (business_id = auth.uid());

-- (No hay políticas de INSERT/UPDATE/DELETE: esas operaciones solo ocurren dentro de las funciones de abajo.)

-- ---------------------------------------------------------------------
-- 3) REGISTRO: al crear el usuario en Auth se crea su negocio
--    (los datos viajan en options.data de supabase.auth.signUp)
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  svc  text[];
begin
  -- Solo crea negocio si el registro trae los datos del formulario.
  if meta ->> 'business_name' is null then
    return new;
  end if;

  select coalesce(array_agg(value), '{}') into svc
  from jsonb_array_elements_text(coalesce(meta -> 'services', '[]'::jsonb));

  insert into public.businesses (id, name, owner, email, phone, type, services)
  values (
    new.id,
    left(meta ->> 'business_name', 80),
    left(coalesce(meta ->> 'owner', ''), 80),
    lower(new.email),
    regexp_replace(coalesce(meta ->> 'phone', ''), '[^0-9+]', '', 'g'),
    coalesce(meta ->> 'type', 'Otro negocio'),
    svc
  );

  insert into public.wallet_transactions (business_id, type, amount, balance_after)
  values (new.id, 'signup_bonus', 5.00, 5.00);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4) VISTAS PÚBLICAS (lo único que ven los clientes sin cuenta)
-- ---------------------------------------------------------------------

-- Negocios visibles en "Explorar": sin teléfono, email ni saldo exacto.
create or replace view public.public_businesses as
  select id, name, type, services, slots, (balance >= 0.25) as available
  from public.businesses;

-- Cupos ocupados de los próximos días (para pintar la grilla de horarios).
create or replace view public.public_taken_slots as
  select business_id, date, to_char(time, 'HH24:MI') as time
  from public.appointments
  where status <> 'cancelled'
    and date >= current_date - 1;

grant select on public.public_businesses, public.public_taken_slots to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) FUNCIONES (RPC)
-- ---------------------------------------------------------------------

-- 5.1 ¿Teléfono libre? (para avisar antes de enviar el SMS de verificación)
create or replace function public.phone_available(p_phone text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from public.businesses
    where phone = regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g')
  );
$$;

-- 5.2 Un cliente (sin cuenta) reserva: queda PENDIENTE; el negocio cobra al aceptar.
create or replace function public.book_appointment(
  p_business uuid,
  p_name     text,
  p_phone    text,
  p_service  text,
  p_date     date,
  p_time     time
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  biz public.businesses%rowtype;
  new_id uuid;
begin
  select * into biz from public.businesses where id = p_business;
  if not found then raise exception 'business_not_found'; end if;
  if biz.balance < 0.25 then raise exception 'business_unavailable'; end if;
  if not (p_service = any (biz.services)) then raise exception 'invalid_service'; end if;
  if not (to_char(p_time, 'HH24:MI') = any (biz.slots)) then raise exception 'invalid_slot'; end if;
  if p_date < current_date - 1 or p_date > current_date + 60 then raise exception 'invalid_date'; end if;
  if char_length(trim(p_name)) < 1 or char_length(regexp_replace(p_phone, '[^0-9]', '', 'g')) < 8 then
    raise exception 'invalid_contact';
  end if;

  begin
    insert into public.appointments (business_id, name, phone, service, date, time, status, created_by)
    values (p_business, left(trim(p_name), 80), left(trim(p_phone), 30), p_service, p_date, p_time, 'pending', 'guest')
    returning id into new_id;
  exception when unique_violation then
    raise exception 'slot_taken';
  end;

  return new_id;
end;
$$;

-- 5.3 El negocio agenda una cita manual: confirmada y cobrada al instante.
create or replace function public.add_manual_appointment(
  p_name    text,
  p_phone   text,
  p_service text,
  p_date    date,
  p_time    time
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid     uuid := auth.uid();
  new_bal numeric(10,2);
  new_id  uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.businesses where id = uid) then raise exception 'business_not_found'; end if;

  -- Cobro atómico: solo descuenta si alcanza el saldo.
  update public.businesses
     set balance = balance - 0.25, total_spent = total_spent + 0.25
   where id = uid and balance >= 0.25
   returning balance into new_bal;
  if not found then raise exception 'insufficient_balance'; end if;

  begin
    insert into public.appointments (business_id, name, phone, service, date, time, status, created_by)
    values (uid, left(trim(p_name), 80), left(trim(p_phone), 30), left(trim(p_service), 80), p_date, p_time, 'confirmed', 'business')
    returning id into new_id;
  exception when unique_violation then
    raise exception 'slot_taken';   -- revierte también el cobro
  end;

  insert into public.wallet_transactions (business_id, type, amount, balance_after, appointment_id)
  values (uid, 'charge', -0.25, new_bal, new_id);

  return new_id;
end;
$$;

-- 5.4 El negocio acepta (cobra 0.25) o cancela/rechaza una cita.
--     Transiciones válidas: pending → confirmed | cancelled ; confirmed → cancelled
create or replace function public.set_appointment_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid     uuid := auth.uid();
  appt    public.appointments%rowtype;
  new_bal numeric(10,2);
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if p_status not in ('confirmed','cancelled') then raise exception 'invalid_status'; end if;

  select * into appt from public.appointments where id = p_id and business_id = uid for update;
  if not found then raise exception 'appointment_not_found'; end if;
  if appt.status = p_status or appt.status = 'cancelled' then return; end if;

  if p_status = 'confirmed' then
    update public.businesses
       set balance = balance - 0.25, total_spent = total_spent + 0.25
     where id = uid and balance >= 0.25
     returning balance into new_bal;
    if not found then raise exception 'insufficient_balance'; end if;

    insert into public.wallet_transactions (business_id, type, amount, balance_after, appointment_id)
    values (uid, 'charge', -0.25, new_bal, p_id);
  end if;

  update public.appointments set status = p_status where id = p_id;
end;
$$;

-- 5.5 Recarga (SIMULADA). En producción esto lo ejecutaría el webhook de la pasarela
--     de pago (Stripe / MercadoPago) con la service key, nunca el navegador.
create or replace function public.recharge_wallet(p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  uid     uuid := auth.uid();
  new_bal numeric(10,2);
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if p_amount not in (5, 10, 25, 50) then raise exception 'invalid_amount'; end if;

  update public.businesses
     set balance = balance + p_amount, total_recharged = total_recharged + p_amount, is_trial = false
   where id = uid
   returning balance into new_bal;
  if not found then raise exception 'business_not_found'; end if;

  insert into public.wallet_transactions (business_id, type, amount, balance_after)
  values (uid, 'recharge', p_amount, new_bal);

  return new_bal;
end;
$$;

-- ---------------------------------------------------------------------
-- 6) PERMISOS DE EJECUCIÓN (por defecto Postgres da EXECUTE a todos: lo cerramos)
-- ---------------------------------------------------------------------

revoke all on function public.handle_new_user()                                          from public, anon, authenticated;
revoke all on function public.phone_available(text)                                      from public;
revoke all on function public.book_appointment(uuid, text, text, text, date, time)       from public;
revoke all on function public.add_manual_appointment(text, text, text, date, time)       from public;
revoke all on function public.set_appointment_status(uuid, text)                         from public;
revoke all on function public.recharge_wallet(numeric)                                   from public;

grant execute on function public.phone_available(text)                                   to anon, authenticated;
grant execute on function public.book_appointment(uuid, text, text, text, date, time)    to anon, authenticated;
grant execute on function public.add_manual_appointment(text, text, text, date, time)    to authenticated;
grant execute on function public.set_appointment_status(uuid, text)                      to authenticated;
grant execute on function public.recharge_wallet(numeric)                                to authenticated;
