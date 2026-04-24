alter table public.projects
  add column if not exists is_public boolean not null default false;

alter table public.projects
  add column if not exists share_token text;

create unique index if not exists projects_share_token_uidx
  on public.projects(share_token)
  where share_token is not null;

drop policy if exists "shared_select_projects" on public.projects;
drop policy if exists "shared_select_agent_runs" on public.agent_runs;
drop policy if exists "shared_select_artifacts" on public.artifacts;
drop policy if exists "shared_select_feedback" on public.feedback;

create policy "shared_select_projects" on public.projects
  for select to anon, authenticated using (is_public = true);

create policy "shared_select_agent_runs" on public.agent_runs
  for select to anon, authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = agent_runs.project_id
        and public.projects.is_public = true
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

create policy "shared_select_feedback" on public.feedback
  for select to anon, authenticated using (
    exists (
      select 1
      from public.projects
      where public.projects.id = feedback.project_id
        and public.projects.is_public = true
    )
  );
