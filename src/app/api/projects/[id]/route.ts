import { NextResponse } from "next/server";

import { deleteProject, getProject, updateProject } from "@/lib/server-store";
import { getRequestUser } from "@/lib/supabase-server";
import type { GenerationProject } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  let project;

  try {
    project = await getProject(id, user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read project." },
      { status: 500 }
    );
  }

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  let patch: Partial<GenerationProject>;

  try {
    patch = (await request.json()) as Partial<GenerationProject>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let project;

  try {
    project = await updateProject(id, patch, user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update project." },
      { status: 500 }
    );
  }

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  let deleted;

  try {
    deleted = await deleteProject(id, user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete project." },
      { status: 500 }
    );
  }

  if (!deleted) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
