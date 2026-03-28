-- DischargeGuard — Supabase Schema
-- Paste this into Supabase Dashboard → SQL Editor → Run

-- Patients
create table patients (
  id            uuid primary key default gen_random_uuid(),
  mrn           text not null unique,
  name          text not null,
  dob           date not null,
  language      text not null,          -- e.g. "Spanish"
  language_code text not null,          -- e.g. "es"
  diagnosis     text not null,
  phone         text,
  created_at    timestamptz default now()
);

-- Prescriptions
create table prescriptions (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid references patients(id) on delete cascade,
  name            text not null,
  purpose         text not null,
  status          text not null check (status in ('active','new','discontinued')),
  prescribed_by   text not null,
  prescribed_date date not null,
  refills         int default 0,
  created_at      timestamptz default now()
);

-- Visit history
create table visits (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references patients(id) on delete cascade,
  date        date not null,
  type        text not null,
  provider    text not null,
  department  text not null,
  notes       text,
  created_at  timestamptz default now()
);

-- Call history (written by ElevenLabs webhook / Google ADK)
create table call_history (
  id                          uuid primary key default gen_random_uuid(),
  patient_id                  uuid references patients(id) on delete cascade,
  date                        date not null,
  time                        text not null,
  duration                    text not null,
  type                        text not null,
  status                      text not null check (status in ('completed','no-answer','failed')),
  agent                       text not null,
  language_code               text not null,
  comprehension_score         int default 0,
  flags                       text[] default '{}',
  summary                     text,
  elevenlabs_conversation_id  text,
  created_at                  timestamptz default now()
);

-- Discharge checklist items per patient
create table discharge_checklists (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references patients(id) on delete cascade,
  item_id     text not null,
  name        text not null,
  detail      text not null,
  category    text not null,
  created_at  timestamptz default now()
);

-- Enable Row Level Security (RLS) — lock down to authenticated users
alter table patients             enable row level security;
alter table prescriptions        enable row level security;
alter table visits               enable row level security;
alter table call_history         enable row level security;
alter table discharge_checklists enable row level security;

-- Allow read for authenticated users (tighten per role in production)
create policy "auth read patients"             on patients             for select using (auth.role() = 'authenticated');
create policy "auth read prescriptions"        on prescriptions        for select using (auth.role() = 'authenticated');
create policy "auth read visits"               on visits               for select using (auth.role() = 'authenticated');
create policy "auth read call_history"         on call_history         for select using (auth.role() = 'authenticated');
create policy "auth read discharge_checklists" on discharge_checklists for select using (auth.role() = 'authenticated');

-- Allow service role to insert call results (from ADK/ElevenLabs webhook)
create policy "service insert call_history" on call_history for insert with check (true);

-- Sample patient seed (Maria Garcia)
insert into patients (mrn, name, dob, language, language_code, diagnosis, phone)
values ('847291', 'Maria Garcia', '1955-03-15', 'Spanish', 'es', 'Post-cholecystectomy, Type 2 Diabetes, Hypertension', '+18135550142');
