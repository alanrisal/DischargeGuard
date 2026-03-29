-- Run in Supabase SQL editor if call_history.transcript is missing.
alter table public.call_history
  add column if not exists transcript text;
