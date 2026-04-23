/* eslint-disable no-console */

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const uniqueSuffix = Date.now().toString(36);
const prompt = `Build a release planner with milestones and risk tracking ${uniqueSuffix}`;

async function main() {
  console.log(`Running real-db validation against ${baseUrl}`);

  const health = await requestJson("GET", "/api/health");
  assert(health.status === 200, "Health endpoint should return 200.");
  assert(health.body.ok === true, "Health check must report ok=true.");
  assert(health.body.persistence === "supabase", "Persistence must be supabase.");

  const generated = await requestJson("POST", "/api/generate", { prompt, mode: "mock" });
  assert(generated.status === 200, "Generate endpoint should return 200.");
  assert(generated.body?.project?.id, "Generate response must include project.id.");

  const projectId = generated.body.project.id;
  console.log(`Generated project: ${projectId}`);

  const one = await requestJson("GET", `/api/projects/${projectId}`);
  assert(one.status === 200, "Project detail should return 200.");
  assert(one.body?.project?.id === projectId, "Project detail id mismatch.");

  const list = await requestJson("GET", "/api/projects");
  assert(list.status === 200, "Project list should return 200.");
  assert(
    Array.isArray(list.body?.projects) && list.body.projects.some((item) => item.id === projectId),
    "Project list must include generated project."
  );

  const patched = await requestJson("PATCH", `/api/projects/${projectId}`, { status: "failed" });
  assert(patched.status === 200, "Project patch should return 200.");
  assert(patched.body?.project?.status === "failed", "Project status should be updated.");

  const removed = await requestJson("DELETE", `/api/projects/${projectId}`);
  assert(removed.status === 200, "Project delete should return 200.");

  const afterDelete = await requestJson("GET", `/api/projects/${projectId}`);
  assert(afterDelete.status === 404, "Deleted project should return 404.");

  console.log("Real database validation passed.");
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
  console.error("Real database validation failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
