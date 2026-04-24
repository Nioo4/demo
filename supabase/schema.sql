create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  prompt text not null,
  status text not null default 'draft' check (status in ('draft', 'running', 'ready', 'failed')),
  is_public boolean not null default false,
  share_token text,
  theme text not null default 'command-center',
  blueprint jsonb not null default '{}'::jsonb,
  generated_code jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.projects
  add column if not exists is_public boolean not null default false;

alter table public.projects
  add column if not exists share_token text;

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
create index if not exists projects_owner_created_at_idx on public.projects(owner_id, created_at desc);
create unique index if not exists projects_share_token_uidx on public.projects(share_token) where share_token is not null;
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

alter table public.projects enable row level security;
alter table public.agent_runs enable row level security;
alter table public.artifacts enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "owner_insert_projects" on public.projects;
drop policy if exists "owner_select_projects" on public.projects;
drop policy if exists "owner_update_projects" on public.projects;
drop policy if exists "owner_delete_projects" on public.projects;
drop policy if exists "shared_select_projects" on public.projects;

drop policy if exists "owner_insert_agent_runs" on public.agent_runs;
drop policy if exists "owner_select_agent_runs" on public.agent_runs;
drop policy if exists "owner_update_agent_runs" on public.agent_runs;
drop policy if exists "owner_delete_agent_runs" on public.agent_runs;
drop policy if exists "shared_select_agent_runs" on public.agent_runs;

drop policy if exists "owner_insert_artifacts" on public.artifacts;
drop policy if exists "owner_select_artifacts" on public.artifacts;
drop policy if exists "owner_update_artifacts" on public.artifacts;
drop policy if exists "owner_delete_artifacts" on public.artifacts;
drop policy if exists "shared_select_artifacts" on public.artifacts;

drop policy if exists "owner_insert_feedback" on public.feedback;
drop policy if exists "owner_select_feedback" on public.feedback;
drop policy if exists "owner_update_feedback" on public.feedback;
drop policy if exists "owner_delete_feedback" on public.feedback;
drop policy if exists "shared_select_feedback" on public.feedback;

create policy "owner_insert_projects" on public.projects
  for insert to authenticated with check (owner_id = auth.uid());

create policy "owner_select_projects" on public.projects
  for select to authenticated using (owner_id = auth.uid());

create policy "owner_update_projects" on public.projects
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner_delete_projects" on public.projects
  for delete to authenticated using (owner_id = auth.uid());

create policy "shared_select_projects" on public.projects
  for select to anon, authenticated using (is_public = true);

create policy "owner_insert_agent_runs" on public.agent_runs
  for insert to authenticated with check (
    exists (
      select 1
      from public.projects
      where public.projects.id = agent_runs.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "owner_select_agent_runs" on public.agent_runs
  for select to authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = agent_runs.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "owner_update_agent_runs" on public.agent_runs
  for update to authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = agent_runs.project_id
        and public.projects.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.projects
      where public.projects.id = agent_runs.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "owner_delete_agent_runs" on public.agent_runs
  for delete to authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = agent_runs.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "shared_select_agent_runs" on public.agent_runs
  for select to anon, authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = agent_runs.project_id
        and public.projects.is_public = true
    )
  );

create policy "owner_insert_artifacts" on public.artifacts
  for insert to authenticated with check (
    exists (
      select 1
      from public.projects
      where public.projects.id = artifacts.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "owner_select_artifacts" on public.artifacts
  for select to authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = artifacts.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "owner_update_artifacts" on public.artifacts
  for update to authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = artifacts.project_id
        and public.projects.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.projects
      where public.projects.id = artifacts.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "owner_delete_artifacts" on public.artifacts
  for delete to authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = artifacts.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "shared_select_artifacts" on public.artifacts
  for select to anon, authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = artifacts.project_id
        and public.projects.is_public = true
    )
  );

create policy "owner_insert_feedback" on public.feedback
  for insert to authenticated with check (
    exists (
      select 1
      from public.projects
      where public.projects.id = feedback.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "owner_select_feedback" on public.feedback
  for select to authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = feedback.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "owner_update_feedback" on public.feedback
  for update to authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = feedback.project_id
        and public.projects.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.projects
      where public.projects.id = feedback.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "owner_delete_feedback" on public.feedback
  for delete to authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = feedback.project_id
        and public.projects.owner_id = auth.uid()
    )
  );

create policy "shared_select_feedback" on public.feedback
  for select to anon, authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = feedback.project_id
        and public.projects.is_public = true
    )
  );
