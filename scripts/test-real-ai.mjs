/* eslint-disable no-console */

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const uniqueSuffix = Date.now().toString(36);
const prompt = `Build an AI sprint planner for indie makers with milestones and release notes ${uniqueSuffix}`;

async function main() {
  console.log(`Running real-ai validation against ${baseUrl}`);

  const health = await requestJson("GET", "/api/health");
  assert(health.status === 200, "Health endpoint should return 200.");
  assert(health.body.ok === true, "Health check must report ok=true.");
  assert(health.body.persistence === "supabase", "Persistence must be supabase.");
  assert(health.body.llmConfigured === true, "A provider API key is required for real AI test.");
  console.log(`AI provider: ${health.body.aiProvider ?? "unknown"} (${health.body.llmModel ?? "unknown model"})`);

  const generated = await requestJson("POST", "/api/generate", { prompt, mode: "llm" });
  assert(generated.status === 200, "Generate endpoint should return 200 in llm mode.");

  const project = generated.body?.project;
  assert(project?.id, "Generate response must include project.id.");
  assert(project?.status === "ready", "Project status must be ready.");
  assert(Array.isArray(project?.agentSteps) && project.agentSteps.length === 4, "Project must have 4 agent steps.");
  assert(
    Array.isArray(project?.blueprint?.screens) && project.blueprint.screens.length >= 3,
    "Blueprint should include at least 3 screens."
  );
  assert(
    Array.isArray(project?.generatedCode?.files) && project.generatedCode.files.length >= 2,
    "Generated code should include at least 2 files."
  );

  const projectId = project.id;
  console.log(`Generated LLM project: ${projectId}`);

  const one = await requestJson("GET", `/api/projects/${projectId}`);
  assert(one.status === 200, "Project detail should return 200.");
  assert(one.body?.project?.id === projectId, "Project detail id mismatch.");

  const removed = await requestJson("DELETE", `/api/projects/${projectId}`);
  assert(removed.status === 200, "Project delete should return 200.");

  console.log("Real AI validation passed.");
}

async function requestJson(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let parsed = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  return {
    status: response.status,
    body: parsed
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error("Real AI validation failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
