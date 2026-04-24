import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminClient, isSupabaseConfigured } from "./supabase-server";
import type { AgentStep, AppBlueprint, GeneratedCode, GenerationProject } from "./types";

type ProjectRow = {
  id: string;
  owner_id: string | null;
  title: string;
  prompt: string;
  status: GenerationProject["status"];
  is_public: boolean;
  share_token: string | null;
  theme: string;
  blueprint: AppBlueprint;
  generated_code: GeneratedCode;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ExistingProjectState = {
  id: string;
  owner_id: string | null;
  is_public: boolean | null;
  share_token: string | null;
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

export async function saveProject(project: GenerationProject, ownerId: string) {
  const supabase = getRequiredSupabaseClient();
  const now = new Date().toISOString();
  const existing = await getExistingProjectState(supabase, project.id);

  assertProjectOwnership(existing, ownerId);

  const projectPayload = toProjectUpsertPayload(project, ownerId, now, resolveShareState(project, existing));
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

  const persisted = await getProjectFromDb(supabase, projectId, ownerId);
  if (!persisted) {
    throw new Error("Project was saved but could not be read back from database.");
  }

  return persisted;
}

export async function listProjects(ownerId: string) {
  const supabase = getRequiredSupabaseClient();
  const projectsResult = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", ownerId)
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

export async function getProject(id: string, ownerId: string) {
  const supabase = getRequiredSupabaseClient();
  return getProjectFromDb(supabase, id, ownerId);
}

export async function getPublicProjectByShareToken(shareToken: string) {
  const normalizedToken = normalizeShareToken(shareToken);
  if (!normalizedToken) {
    return null;
  }

  const supabase = getRequiredSupabaseClient();
  const projectResult = await supabase
    .from("projects")
    .select("*")
    .eq("share_token", normalizedToken)
    .eq("is_public", true)
    .maybeSingle<ProjectRow>();

  if (projectResult.error) {
    throw new Error(`Failed to read shared project: ${projectResult.error.message}`);
  }

  if (!projectResult.data) {
    return null;
  }

  const runsByProject = await listAgentRunsByProjectIds(supabase, [projectResult.data.id]);
  return normalizeProject(projectResult.data, runsByProject.get(projectResult.data.id) ?? []);
}

export async function updateProject(id: string, patch: Partial<GenerationProject>, ownerId: string) {
  const current = await getProject(id, ownerId);
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
    generatedCode: patch.generatedCode ?? current.generatedCode,
    isPublic: patch.isPublic ?? current.isPublic,
    shareToken: Object.prototype.hasOwnProperty.call(patch, "shareToken") ? patch.shareToken ?? null : current.shareToken
  };

  return saveProject(nextProject, ownerId);
}

export async function deleteProject(id: string, ownerId: string) {
  const supabase = getRequiredSupabaseClient();
  const remove = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("id");

  if (remove.error) {
    throw new Error(`Failed to delete project: ${remove.error.message}`);
  }

  return (remove.data ?? []).length > 0;
}

function toProjectUpsertPayload(
  project: GenerationProject,
  ownerId: string,
  now: string,
  shareState: { isPublic: boolean; shareToken: string | null }
) {
  return {
    id: project.id,
    owner_id: ownerId,
    title: project.title,
    prompt: project.prompt,
    status: project.status,
    is_public: shareState.isPublic,
    share_token: shareState.shareToken,
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

async function getProjectFromDb(supabase: SupabaseClient, id: string, ownerId: string) {
  const projectResult = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle<ProjectRow>();

  if (projectResult.error) {
    throw new Error(`Failed to read project: ${projectResult.error.message}`);
  }

  if (!projectResult.data) {
    return null;
  }

  const runsByProject = await listAgentRunsByProjectIds(supabase, [id]);
  return normalizeProject(projectResult.data, runsByProject.get(id) ?? []);
}

async function getExistingProjectState(supabase: SupabaseClient, projectId: string) {
  const existing = await supabase
    .from("projects")
    .select("id, owner_id, is_public, share_token")
    .eq("id", projectId)
    .maybeSingle<ExistingProjectState>();

  if (existing.error) {
    throw new Error(`Failed to verify project ownership: ${existing.error.message}`);
  }

  return existing.data ?? null;
}

function assertProjectOwnership(existing: ExistingProjectState | null, ownerId: string) {
  if (existing && existing.owner_id !== ownerId) {
    throw new Error("You do not have access to this project.");
  }
}

function resolveShareState(project: GenerationProject, existing: ExistingProjectState | null) {
  if (!project.isPublic) {
    return {
      isPublic: false,
      shareToken: null
    };
  }

  return {
    isPublic: true,
    shareToken:
      normalizeShareToken(project.shareToken) ??
      normalizeShareToken(existing?.share_token ?? null) ??
      generateShareToken()
  };
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
    isPublic: project.is_public === true,
    shareToken: normalizeShareToken(project.share_token),
    theme: project.theme,
    blueprint: project.blueprint,
    generatedCode: project.generated_code,
    agentSteps: normalizedRuns,
    createdAt: project.created_at,
    updatedAt: project.updated_at
  };
}

function normalizeShareToken(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function generateShareToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function getRequiredSupabaseClient() {
  if (!isDatabaseEnabled()) {
    throw new Error(
      "Supabase is required but not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return getSupabaseAdminClient();
}
