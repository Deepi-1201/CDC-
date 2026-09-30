-- Run once in Supabase: SQL Editor > New query > paste > Run  (after schema.sql)
create table if not exists staff (email text primary key, role text not null check (role in ('admin','viewer')));

create or replace function public.my_role() returns text
language sql security definer stable set search_path = public as $$
  select role from staff where lower(email) = lower(coalesce(auth.jwt() ->> 'email','')) limit 1 $$;

alter table staff enable row level security;
drop policy if exists "own row or admin" on staff;
drop policy if exists "admin manages staff" on staff;
create policy "own row or admin" on staff for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email','')) or my_role() = 'admin');
create policy "admin manages staff" on staff for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- Student data: anyone listed in staff can READ, only admin can ADD / CHANGE / DELETE
do $$ declare t text; begin
  foreach t in array array['students','companies','records','placed','delisted','rounds'] loop
    execute format('drop policy if exists "team access" on %I', t);
    execute format('drop policy if exists "staff read" on %I', t);
    execute format('drop policy if exists "admin write" on %I', t);
    execute format('create policy "staff read" on %I for select to authenticated using (my_role() is not null)', t);
    execute format('create policy "admin write" on %I for all to authenticated using (my_role() = ''admin'') with check (my_role() = ''admin'')', t);
  end loop; end $$;

-- Who is who. CHANGE the admin email below if it is not yours.
insert into staff (email, role) values
 ('deepikak@psgcas.ac.in','admin'),
 ('prasanth.r@psgcas.ac.in','viewer'),
 ('inigocampbel@psgcas.ac.in','viewer'),
 ('rahul.bcc@psgtech.ac.in','viewer'),
 ('krishnarupa@psgcas.ac.in','viewer'),
 ('gokulraj@psgcas.ac.in','viewer')
on conflict (email) do update set role = excluded.role;
