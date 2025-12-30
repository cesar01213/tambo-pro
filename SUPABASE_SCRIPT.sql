-- SCRIPT DE INSTALACIÓN LIMPIA (MODO EQUIPO)
-- =========================================

-- 1. LIMPIEZA DE TABLAS PREVIAS (Para evitar errores de columnas faltantes)
drop table if exists events cascade;
drop table if exists cows cascade;
drop table if exists profiles cascade;
drop table if exists establecimientos cascade;

-- 2. CREACIÓN DE ESTRUCTURA NUEVA
create table establecimientos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamp with time zone default now()
);

create table profiles (
  id uuid references auth.users primary key,
  email text,
  role text check (role in ('admin', 'tambero', 'vaquero')) default 'tambero',
  establecimiento_id uuid references establecimientos(id),
  updated_at timestamp with time zone default now()
);

create table cows (
  id text primary key,
  rp text,
  raza text,
  categoria text,
  fecha_nacimiento timestamp with time zone,
  padre text,
  madre text,
  estado text,
  estado_repro text,
  ultimo_parto timestamp with time zone,
  partos_totales integer default 0,
  fpp timestamp with time zone,
  dias_preñez integer default 0,
  senas_particulares text,
  ultimo_celo timestamp with time zone,
  establecimiento_id uuid references establecimientos(id),
  updated_at timestamp with time zone default now()
);

create table events (
  id bigint primary key generated always as identity,
  cow_id text references cows(id) on delete cascade,
  tipo text,
  fecha timestamp with time zone,
  detalle text,
  grado_mastitis text,
  cuartos text[],
  medicamento text,
  dias_retiro integer,
  fecha_liberacion timestamp with time zone,
  resultado_tacto text,
  meses_gestacion integer,
  litros float,
  grasa float,
  proteina float,
  intensidad_celo text,
  sexo_cria text,
  peso_cria float,
  destino_cria text,
  establecimiento_id uuid references establecimientos(id),
  recorded_by uuid references profiles(id),
  created_at timestamp with time zone default now()
);

-- 3. HABILITAR SEGURIDAD (RLS)
alter table profiles enable row level security;
alter table cows enable row level security;
alter table events enable row level security;

-- 4. POLÍTICAS DE ACCESO
create policy "Gestionar perfil propio" on profiles for all using (auth.uid() = id);

create policy "Equipo ve vacas" on cows for select to authenticated 
  using (establecimiento_id in (select establecimiento_id from profiles where id = auth.uid()));

create policy "Admin gestiona stock" on cows for all to authenticated 
  using (
    establecimiento_id in (select establecimiento_id from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Equipo ve eventos" on events for select to authenticated 
  using (establecimiento_id in (select establecimiento_id from profiles where id = auth.uid()));

create policy "Equipo anota eventos" on events for insert to authenticated 
  with check (establecimiento_id in (select establecimiento_id from profiles where id = auth.uid()));

-- 5. AUTOMATIZACIÓN DE PERFILES
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'admin');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. TIEMPO REAL
drop publication if exists supabase_realtime;
create publication supabase_realtime for table cows, events;
