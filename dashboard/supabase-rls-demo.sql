-- Allow anon key to read all tables (demo mode)
-- Run in Supabase → SQL Editor

drop policy if exists "auth read patients"             on patients;
drop policy if exists "auth read prescriptions"        on prescriptions;
drop policy if exists "auth read visits"               on visits;
drop policy if exists "auth read call_history"         on call_history;
drop policy if exists "auth read discharge_checklists" on discharge_checklists;

create policy "anon read patients"             on patients             for select using (true);
create policy "anon read prescriptions"        on prescriptions        for select using (true);
create policy "anon read visits"               on visits               for select using (true);
create policy "anon read call_history"         on call_history         for select using (true);
create policy "anon read discharge_checklists" on discharge_checklists for select using (true);
