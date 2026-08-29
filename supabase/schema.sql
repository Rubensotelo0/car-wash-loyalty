-- Corre esto una sola vez en Supabase: panel del proyecto -> SQL Editor -> New query -> pega y dale "Run"

create table if not exists customers (
  phone text,                      -- 10 dígitos, sin espacios
  plate text not null default 'GENERAL',
  stamps integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (phone, plate)
);

create table if not exists codes (
  token text primary key,
  created_at timestamptz not null default now(),
  used boolean not null default false,
  used_by text,
  used_by_plate text,
  foreign key (used_by, used_by_plate) references customers(phone, plate)
);

-- índice para poder limpiar códigos viejos cada tanto (opcional, no obligatorio para el MVP)
create index if not exists codes_created_at_idx on codes (created_at);

-- Desactivar RLS para permitir que el backend gestione los datos con seguridad interna
alter table customers disable row level security;
alter table codes disable row level security;

