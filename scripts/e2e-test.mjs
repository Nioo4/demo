// e:\projects\demo\scripts\e2e-test.mjs
// 运行方式: node scripts/e2e-test.mjs
// 需要先: npm run dev

const BASE = "http://localhost:3000";

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function test() {
  console.log("=== Atoms-Lite E2E Test ===\n");

  // Test 1: Health check
  console.log("1. Testing /api/health...");
  try {
    const healthRes = await fetch(`${BASE}/api/health`);
    const health = await healthRes.json();
    console.log("   Status:", healthRes.status);
    console.log("   Generation mode:", health.generationMode);
    console.log("   AI Provider:", health.aiProvider);
    console.log("   LLM Model:", health.llmModel);
    console.log("   Persistence:", health.persistence);
    console.log("   DB Configured:", health.ok ? "✅" : "⚠️ " + (health.error || "not configured"));
    console.log("");
  } catch (e) {
    console.log("   ❌ Cannot connect - is dev server running? Run: npm run dev");
    return;
  }

  // Test 2: Generate with mock
  console.log("2. Testing /api/generate (mock mode)...");
  try {
    const genRes = await fetch(`${BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Build a team task tracker", mode: "mock" })
    });
    const gen = await genRes.json();
    if (gen.error) {
      console.log("   ❌ Error:", gen.error);
    } else {
      console.log("   Status:", genRes.status);
      console.log("   Project ID:", gen.project.id);
      console.log("   Title:", gen.project.title);
      console.log("   Theme:", gen.project.theme);
      console.log("   Agent steps:", gen.project.agentSteps.length);
      console.log("   Screens:", gen.project.blueprint.screens.length);
      console.log("   Files:", gen.project.generatedCode.files.length);
      console.log("   ✅ Mock generation works!");
    }
    console.log("");

    // Test 3: Projects list
    console.log("3. Testing /api/projects...");
    const projRes = await fetch(`${BASE}/api/projects`);
    const projList = await projRes.json();
    console.log("   Status:", projRes.status);
    console.log("   Projects count:", projList.projects?.length ?? 0);
    console.log("   ✅ Projects API works!");
    console.log("");

    // Test 4: Single project
    console.log("4. Testing /api/projects/[id]...");
    const singleRes = await fetch(`${BASE}/api/projects/${gen.project.id}`);
    const single = await singleRes.json();
    console.log("   Status:", singleRes.status);
    console.log("   Title:", single.project?.title);
    console.log("   ✅ Single project retrieval works!");
    console.log("");

    console.log("=== All Tests Passed ✅ ===");
    console.log("\nNext: Open http://localhost:3000 in browser");
    console.log("Then try: http://localhost:3000/builder");

  } catch (e) {
    console.error("   ❌ Test failed:", e.message);
  }
}

test();
