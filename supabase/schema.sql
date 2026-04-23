create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  prompt text not null,
  status text not null default 'draft' check (status in ('draft', 'running', 'ready', 'failed')),
  theme text not null default 'command-center',
  blueprint jsonb not null default '{}'::jsonb,
  generated_code jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  agent_key text not null,
  label text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'complete', 'failed')),
  summary text not null default '',
  output jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('blueprint', 'component', 'page', 'style', 'test', 'note')),
  name text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists projects_created_at_idx on public.projects(created_at desc);
create index if not exists agent_runs_project_order_idx on public.agent_runs(project_id, sort_order);
create index if not exists artifacts_project_kind_idx on public.artifacts(project_id, kind);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Enable RLS on all tables
alter table public.projects enable row level security;
alter table public.agent_runs enable row level security;
alter table public.artifacts enable row level security;
alter table public.feedback enable row level security;

-- Service role bypasses RLS entirely, so these policies only affect anon key.
-- For a public demo we allow all inserts/selects (no auth required).
create policy "public_insert_projects" on public.projects
  for insert to anon, authenticated with check (true);
create policy "public_select_projects" on public.projects
  for select to anon, authenticated using (true);
create policy "public_update_projects" on public.projects
  for update to anon, authenticated using (true);
create policy "public_delete_projects" on public.projects
  for delete to anon, authenticated using (true);

create policy "public_insert_agent_runs" on public.agent_runs
  for insert to anon, authenticated with check (true);
create policy "public_select_agent_runs" on public.agent_runs
  for select to anon, authenticated using (true);
create policy "public_update_agent_runs" on public.agent_runs
  for update to anon, authenticated using (true);

create policy "public_insert_artifacts" on public.artifacts
  for insert to anon, authenticated with check (true);
create policy "public_select_artifacts" on public.artifacts
  for select to anon, authenticated using (true);

create policy "public_insert_feedback" on public.feedback
  for insert to anon, authenticated with check (true);
create policy "public_select_feedback" on public.feedback
  for select to anon, authenticated using (true);
