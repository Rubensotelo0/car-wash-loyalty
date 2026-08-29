-- Corre esto una sola vez en Supabase: panel del proyecto -> SQL Editor -> New query -> pega y dale "Run"

create table if not exists customers (
  phone text primary key,          -- 10 dígitos, sin espacios
  stamps integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists codes (
  token text primary key,
  created_at timestamptz not null default now(),
  used boolean not null default false,
  used_by text references customers(phone)
);

-- índice para poder limpiar códigos viejos cada tanto (opcional, no obligatorio para el MVP)
create index if not exists codes_created_at_idx on codes (created_at);

-- Desactivar RLS para permitir que el backend gestione los datos con seguridad interna
alter table customers disable row level security;
alter table codes disable row level security;

