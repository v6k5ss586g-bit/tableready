-- ============================================================
-- Restaurant Reservation System — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────

create type user_role as enum ('admin', 'manager', 'hostess');
create type reservation_status as enum ('pending', 'approved', 'rejected', 'cancelled', 'arrived', 'no_show');
create type waiting_status as enum ('waiting', 'converted', 'cancelled', 'expired');

-- ─── Restaurant Settings ──────────────────────────────────────────────────────

create table restaurant_settings (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null default 'My Restaurant',
  max_seats             int  not null default 60,
  reservation_duration  int  not null default 90,  -- minutes
  open_time             time not null default '12:00',
  close_time            time not null default '23:00',
  slot_interval         int  not null default 30,  -- minutes between slots
  max_party_size        int  not null default 12,
  min_advance_hours     int  not null default 2,   -- min hours before reservation
  max_advance_days      int  not null default 30,  -- max days in advance
  closed_days           int[] not null default '{}', -- 0=Sun, 1=Mon, ... 6=Sat
  updated_at            timestamptz default now()
);

-- Insert default settings row
insert into restaurant_settings (id) values ('00000000-0000-0000-0000-000000000001');

-- ─── Customers ────────────────────────────────────────────────────────────────

create table customers (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  phone        text not null unique,
  email        text,
  notes        text,
  tags         text[] default '{}',
  visit_count  int  not null default 0,
  no_show_count int not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index idx_customers_phone on customers(phone);
create index idx_customers_name  on customers(lower(name));

-- ─── Reservations ─────────────────────────────────────────────────────────────

create table reservations (
  id           uuid primary key default uuid_generate_v4(),
  customer_id  uuid not null references customers(id) on delete restrict,
  date         date not null,
  time         time not null,
  party_size   int  not null check (party_size >= 1),
  status       reservation_status not null default 'pending',
  notes        text,
  internal_notes text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  arrived_at   timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid  -- references auth.users
);

create index idx_reservations_date   on reservations(date);
create index idx_reservations_status on reservations(status);
create index idx_reservations_customer on reservations(customer_id);

-- ─── Waiting List ─────────────────────────────────────────────────────────────

create table waiting_list (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references customers(id) on delete restrict,
  date            date not null,
  preferred_time  time,
  party_size      int  not null check (party_size >= 1),
  notes           text,
  status          waiting_status not null default 'waiting',
  converted_to    uuid references reservations(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_waiting_date   on waiting_list(date);
create index idx_waiting_status on waiting_list(status);

-- ─── Staff (extends Supabase auth.users) ──────────────────────────────────────

create table staff (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       user_role not null default 'hostess',
  is_active  boolean not null default true,
  created_at timestamptz default now()
);

-- ─── Functions ────────────────────────────────────────────────────────────────

-- Get booked seats for a given date+time slot (considers reservation duration)
create or replace function get_booked_seats(p_date date, p_time time)
returns int language sql stable as $$
  select coalesce(sum(r.party_size), 0)::int
  from reservations r
  join restaurant_settings s on s.id = '00000000-0000-0000-0000-000000000001'
  where r.date = p_date
    and r.status in ('pending', 'approved', 'arrived')
    and r.time < (p_time + (s.reservation_duration || ' minutes')::interval)
    and (r.time + (s.reservation_duration || ' minutes')::interval) > p_time
$$;

-- Check if a slot has capacity
create or replace function slot_has_capacity(p_date date, p_time time, p_party_size int)
returns boolean language sql stable as $$
  select (
    select max_seats from restaurant_settings where id = '00000000-0000-0000-0000-000000000001'
  ) >= get_booked_seats(p_date, p_time) + p_party_size
$$;

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_reservations_updated_at  before update on reservations  for each row execute function set_updated_at();
create trigger trg_customers_updated_at     before update on customers     for each row execute function set_updated_at();
create trigger trg_waiting_list_updated_at  before update on waiting_list  for each row execute function set_updated_at();

-- Increment customer visit count on arrival
create or replace function handle_reservation_status_change()
returns trigger language plpgsql as $$
begin
  if new.status = 'arrived' and old.status != 'arrived' then
    update customers set visit_count = visit_count + 1 where id = new.customer_id;
    new.arrived_at = now();
  end if;
  if new.status = 'no_show' and old.status != 'no_show' then
    update customers set no_show_count = no_show_count + 1 where id = new.customer_id;
  end if;
  if new.status in ('cancelled', 'rejected') and old.status not in ('cancelled', 'rejected') then
    new.cancelled_at = now();
  end if;
  return new;
end;
$$;

create trigger trg_reservation_status before update on reservations for each row execute function handle_reservation_status_change();

-- ─── Row Level Security ────────────────────────────────────────────────────────

alter table restaurant_settings enable row level security;
alter table customers            enable row level security;
alter table reservations         enable row level security;
alter table waiting_list         enable row level security;
alter table staff                enable row level security;

-- Public can insert reservations and customers (for the booking form)
create policy "Public can insert customers"     on customers    for insert with check (true);
create policy "Public can insert reservations"  on reservations for insert with check (true);
create policy "Public can insert waiting_list"  on waiting_list for insert with check (true);

-- Authenticated staff can read/write everything
create policy "Staff full access customers"     on customers            for all using (auth.role() = 'authenticated');
create policy "Staff full access reservations"  on reservations         for all using (auth.role() = 'authenticated');
create policy "Staff full access waiting"       on waiting_list         for all using (auth.role() = 'authenticated');
create policy "Staff read settings"             on restaurant_settings  for select using (true);
create policy "Admin write settings"            on restaurant_settings  for update using (auth.role() = 'authenticated');
create policy "Staff read staff"                on staff                for select using (auth.role() = 'authenticated');
create policy "Staff manage staff"              on staff                for all using (auth.role() = 'authenticated');
