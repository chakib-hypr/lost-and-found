create table users (
  id bigint generated always as identity primary key,
  username text not null unique,
  password_hash text not null,
  created_at timestamptz default now()
);

create table items (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  category text,
  type text not null,
  location text,
  status text not null default 'open',
  created_at timestamptz default now(),
  owner_id bigint references users(id)
);

alter table users enable row level security;
alter table items enable row level security;
