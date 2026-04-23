import { NextResponse } from "next/server";

import { generateProjectFromPrompt, normalizeMode } from "@/lib/generation-service";
import { saveProject } from "@/lib/server-store";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";

export async function POST(request: Request) {
  let body: GenerateRequest;

  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.prompt || body.prompt.trim().length < 8) {
    return NextResponse.json({ error: "Prompt must be at least 8 characters." }, { status: 400 });
  }

  const mode = normalizeMode(body.mode);
  let project: GenerateResponse["project"];

  try {
    const generatedProject = await generateProjectFromPrompt(body.prompt, mode);
    project = await saveProject(generatedProject);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to persist generated project." },
      { status: 500 }
    );
  }

  const response: GenerateResponse = { project };

  return NextResponse.json(response);
}
