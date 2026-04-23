import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminClient, isSupabaseConfigured } from "./supabase-server";
import type { AgentStep, AppBlueprint, GeneratedCode, GenerationProject } from "./types";

type ProjectRow = {
  id: string;
  title: string;
  prompt: string;
  status: GenerationProject["status"];
  theme: string;
  blueprint: AppBlueprint;
  generated_code: GeneratedCode;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type AgentRunRow = {
  id: string;
  project_id: string;
  agent_key: AgentStep["key"];
  label: string;
  status: AgentStep["status"];
  summary: string;
  output: string[];
  sort_order: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export function isDatabaseEnabled() {
  return isSupabaseConfigured();
}

export async function saveProject(project: GenerationProject) {
  const supabase = getRequiredSupabaseClient();
  const now = new Date().toISOString();
  const projectPayload = toProjectUpsertPayload(project, now);
  const upsert = await supabase
    .from("projects")
    .upsert(projectPayload, { onConflict: "id" })
    .select("*")
    .single<ProjectRow>();

  if (upsert.error || !upsert.data) {
    throw new Error(`Failed to save project: ${upsert.error?.message ?? "unknown error"}`);
  }

  const projectId = upsert.data.id;
  const removeRuns = await supabase.from("agent_runs").delete().eq("project_id", projectId);
  if (removeRuns.error) {
    throw new Error(`Failed to replace agent runs: ${removeRuns.error.message}`);
  }

  const runRows = toAgentRunRows(projectId, project.agentSteps, now);
  if (runRows.length > 0) {
    const insertRuns = await supabase.from("agent_runs").insert(runRows);
    if (insertRuns.error) {
      throw new Error(`Failed to insert agent runs: ${insertRuns.error.message}`);
    }
  }

  const persisted = await getProjectFromDb(supabase, projectId);
  if (!persisted) {
    throw new Error("Project was saved but could not be read back from database.");
  }

  return persisted;
}

export async function listProjects() {
  const supabase = getRequiredSupabaseClient();
  const projectsResult = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (projectsResult.error) {
    throw new Error(`Failed to list projects: ${projectsResult.error.message}`);
  }

  const projectRows = (projectsResult.data ?? []) as ProjectRow[];
  if (projectRows.length === 0) {
    return [] as GenerationProject[];
  }

  const runsByProject = await listAgentRunsByProjectIds(supabase, projectRows.map((row) => row.id));
  return projectRows.map((row) => normalizeProject(row, runsByProject.get(row.id) ?? []));
}

export async function getProject(id: string) {
  const supabase = getRequiredSupabaseClient();
  return getProjectFromDb(supabase, id);
}

export async function updateProject(id: string, patch: Partial<GenerationProject>) {
  const current = await getProject(id);
  if (!current) {
    return null;
  }

  const nextProject: GenerationProject = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
    agentSteps: patch.agentSteps ?? current.agentSteps,
    blueprint: patch.blueprint ?? current.blueprint,
    generatedCode: patch.generatedCode ?? current.generatedCode
  };

  return saveProject(nextProject);
}

export async function deleteProject(id: string) {
  const supabase = getRequiredSupabaseClient();
  const remove = await supabase.from("projects").delete().eq("id", id).select("id");
  if (remove.error) {
    throw new Error(`Failed to delete project: ${remove.error.message}`);
  }

  return (remove.data ?? []).length > 0;
}

function toProjectUpsertPayload(project: GenerationProject, now: string) {
  return {
    id: project.id,
    title: project.title,
    prompt: project.prompt,
    status: project.status,
    theme: project.theme,
    blueprint: project.blueprint,
    generated_code: project.generatedCode,
    metadata: {
      persistenceMode: "database",
      savedFrom: "api"
    },
    created_at: project.createdAt || now,
    updated_at: now
  };
}

function toAgentRunRows(projectId: string, steps: AgentStep[], now: string) {
  return steps.map((step, index) => ({
    id: step.id,
    project_id: projectId,
    agent_key: step.key,
    label: step.label,
    status: step.status,
    summary: step.summary,
    output: step.output,
    sort_order: index,
    started_at: step.status === "pending" ? null : now,
    completed_at: step.status === "complete" ? now : null
  }));
}

async function getProjectFromDb(supabase: SupabaseClient, id: string) {
  const projectResult = await supabase.from("projects").select("*").eq("id", id).maybeSingle<ProjectRow>();
  if (projectResult.error) {
    throw new Error(`Failed to read project: ${projectResult.error.message}`);
  }

  if (!projectResult.data) {
    return null;
  }

  const runsByProject = await listAgentRunsByProjectIds(supabase, [id]);
  return normalizeProject(projectResult.data, runsByProject.get(id) ?? []);
}

async function listAgentRunsByProjectIds(supabase: SupabaseClient, projectIds: string[]) {
  if (projectIds.length === 0) {
    return new Map<string, AgentRunRow[]>();
  }

  const runsResult = await supabase
    .from("agent_runs")
    .select("*")
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true });

  if (runsResult.error) {
    throw new Error(`Failed to list agent runs: ${runsResult.error.message}`);
  }

  const rows = (runsResult.data ?? []) as AgentRunRow[];
  const grouped = new Map<string, AgentRunRow[]>();

  for (const row of rows) {
    const current = grouped.get(row.project_id) ?? [];
    current.push(row);
    grouped.set(row.project_id, current);
  }

  return grouped;
}

function normalizeProject(project: ProjectRow, runs: AgentRunRow[]): GenerationProject {
  const normalizedRuns = runs
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((run) => ({
      id: run.id,
      key: run.agent_key,
      label: run.label,
      status: run.status,
      summary: run.summary,
      output: Array.isArray(run.output) ? run.output.filter((item): item is string => typeof item === "string") : []
    }));

  return {
    id: project.id,
    title: project.title,
    prompt: project.prompt,
    status: project.status,
    theme: project.theme,
    blueprint: project.blueprint,
    generatedCode: project.generated_code,
    agentSteps: normalizedRuns,
    createdAt: project.created_at,
    updatedAt: project.updated_at
  };
}

function getRequiredSupabaseClient() {
  if (!isDatabaseEnabled()) {
    throw new Error(
      "Supabase is required but not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return getSupabaseAdminClient();
}
