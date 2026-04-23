import { NextResponse } from "next/server";

import { buildPendingSkeleton, generateProjectFromPrompt, normalizeMode } from "@/lib/generation-service";
import { saveProject } from "@/lib/server-store";
import type { AgentStep, GenerateRequest, GenerationProject } from "@/lib/types";

const encoder = new TextEncoder();

const pendingSummary: Record<AgentStep["key"], string> = {
  planner: "Waiting to scope the app idea.",
  ux: "Waiting for product direction from Planner Agent.",
  coder: "Waiting for UX structure to generate code.",
  qa: "Waiting for generated artifacts to validate quality."
};

const runningSummary: Record<AgentStep["key"], string> = {
  planner: "Analyzing the prompt and defining project scope.",
  ux: "Designing screens, flow, and interaction details.",
  coder: "Generating data model and component blueprint.",
  qa: "Reviewing readiness, risks, and extension path."
};

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
          error: error instanceof Error ? error.message : "Generation stream failed."
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
