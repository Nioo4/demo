import { NextResponse } from "next/server";

import { generateProjectFromPrompt, normalizeMode } from "@/lib/generation-service";
import { saveProject } from "@/lib/server-store";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";

export async function POST(request: Request) {
  let body: GenerateRequest;

  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "请求体不是合法的 JSON。" }, { status: 400 });
  }

  if (!body.prompt || body.prompt.trim().length < 8) {
    return NextResponse.json({ error: "需求描述至少需要 8 个字符。" }, { status: 400 });
  }

  const mode = normalizeMode(body.mode);
  let project: GenerateResponse["project"];

  try {
    const generatedProject = await generateProjectFromPrompt(body.prompt, mode);
    project = await saveProject(generatedProject);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存生成项目时失败。" },
      { status: 500 }
    );
  }

  const response: GenerateResponse = { project };

  return NextResponse.json(response);
}
