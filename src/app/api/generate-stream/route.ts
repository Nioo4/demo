import { NextResponse } from "next/server";

import { buildPendingSkeleton, generateProjectFromPrompt, normalizeMode } from "@/lib/generation-service";
import { saveProject } from "@/lib/server-store";
import type { AgentStep, GenerateRequest, GenerationProject } from "@/lib/types";

const encoder = new TextEncoder();

const pendingSummary: Record<AgentStep["key"], string> = {
  planner: "等待梳理这次需求的范围与目标。",
  ux: "等待规划结果后输出页面与交互结构。",
  coder: "等待交互方案确定后生成代码骨架。",
  qa: "等待代码与预览产物生成后进行校验。"
};

const runningSummary: Record<AgentStep["key"], string> = {
  planner: "正在分析需求并定义本次项目范围。",
  ux: "正在设计页面结构、流程与交互细节。",
  coder: "正在生成数据模型与组件骨架。",
  qa: "正在检查完成度、风险点与扩展方向。"
};

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
  const pendingSkeleton = buildPendingSkeleton(body.prompt);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        sendEvent(controller, "generation_started", {
          project: toPendingProject(pendingSkeleton)
        });

        sendEvent(controller, "step_update", {
          project: toProgressProject(pendingSkeleton, 0, "running")
        });

        const llmProject = await generateProjectFromPrompt(body.prompt, mode);
        const finalProject: GenerationProject = {
          ...llmProject,
          id: pendingSkeleton.id,
          createdAt: pendingSkeleton.createdAt,
          updatedAt: new Date().toISOString(),
          status: "ready"
        };

        sendEvent(controller, "step_update", {
          project: toProgressProject(finalProject, 0, "complete")
        });

        for (let index = 1; index < finalProject.agentSteps.length; index += 1) {
          await sleep(380);
          sendEvent(controller, "step_update", {
            project: toProgressProject(finalProject, index, "running")
          });

          await sleep(460);
          sendEvent(controller, "step_update", {
            project: toProgressProject(finalProject, index, "complete")
          });
        }

        const persisted = await saveProject({
          ...finalProject,
          status: "ready",
          updatedAt: new Date().toISOString()
        });

        sendEvent(controller, "generation_complete", { project: persisted });
        sendEvent(controller, "done", { ok: true });
        controller.close();
      } catch (error) {
        sendEvent(controller, "error", {
          error: error instanceof Error ? error.message : "流式生成失败。"
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

function toPendingProject(project: GenerationProject): GenerationProject {
  return {
    ...project,
    status: "running",
    updatedAt: new Date().toISOString(),
    agentSteps: project.agentSteps.map((step) => ({
      ...step,
      status: "pending",
      summary: pendingSummary[step.key],
      output: []
    }))
  };
}

function toProgressProject(
  project: GenerationProject,
  activeIndex: number,
  activeStatus: "running" | "complete"
): GenerationProject {
  return {
    ...project,
    status: "running",
    updatedAt: new Date().toISOString(),
    agentSteps: project.agentSteps.map((step, index) => {
      if (index < activeIndex) {
        return {
          ...step,
          status: "complete"
        };
      }

      if (index > activeIndex) {
        return {
          ...step,
          status: "pending",
          summary: pendingSummary[step.key],
          output: []
        };
      }

      if (activeStatus === "running") {
        return {
          ...step,
          status: "running",
          summary: runningSummary[step.key],
          output: []
        };
      }

      return {
        ...step,
        status: "complete"
      };
    })
  };
}

function sendEvent(controller: ReadableStreamDefaultController<Uint8Array>, event: string, payload: unknown) {
  controller.enqueue(encoder.encode(`event: ${event}\n`));
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
