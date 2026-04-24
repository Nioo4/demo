import { NextResponse } from "next/server";

import { generateProjectFromPrompt, normalizeMode } from "@/lib/generation-service";
import { saveProject } from "@/lib/server-store";
import { getRequestUser } from "@/lib/supabase-server";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: GenerateRequest;

  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "请求体不是合法的 JSON。" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (prompt.length === 0) {
    return NextResponse.json({ error: "需求描述不能为空。" }, { status: 400 });
  }

  const mode = normalizeMode(body.mode);
  let project: GenerateResponse["project"];

  try {
    const generatedProject = await generateProjectFromPrompt(prompt, mode);
    project = await saveProject(generatedProject, user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存生成项目时失败。" },
      { status: 500 }
    );
  }

  const response: GenerateResponse = { project };

  return NextResponse.json(response);
}
