-- Run this once in Supabase: SQL Editor > New query > paste > Run
create table students  (roll text primary key, name text, dept text);
create table companies (code text primary key, name text not null, type text default 'Non-core');
create table records (
  id bigint generated always as identity primary key,
  roll text not null, code text not null default '-', kind text not null,   -- kind: CST, CSA, COMM, EXCEL
  ord int not null, label text, status text not null,                       -- status: P or A
  marks jsonb, exempt text,
  unique (roll, code, kind, ord));
create index on records (code, kind);
create index on records (roll);
create table placed   (roll text primary key, code text, salary text);
create table delisted (roll text primary key, reason text);
create table rounds   (roll text, code text, round_text text, primary key (roll, code));

do $$ declare t text; begin
  foreach t in array array['students','companies','records','placed','delisted','rounds'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "team access" on %I for all to authenticated using (true) with check (true)', t);
  end loop; end $$;

insert into companies values ('26CST001','Caterpillar','Core'),('26CST002','HCL','Non-core'),('26CST003','Cloud Destination','Non-core');
