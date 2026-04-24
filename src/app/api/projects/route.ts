import { NextResponse } from "next/server";

import { listProjects, saveProject } from "@/lib/server-store";
import { getRequestUser } from "@/lib/supabase-server";
import type { GenerationProject } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const projects = await listProjects(user.id);
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list projects." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let project: GenerationProject;

  try {
    project = (await request.json()) as GenerationProject;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!project.id || !project.title || !project.prompt) {
    return NextResponse.json({ error: "Project payload is incomplete." }, { status: 400 });
  }

  try {
    const savedProject = await saveProject(project, user.id);
    return NextResponse.json({ project: savedProject }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save project." },
      { status: 500 }
    );
  }
}
