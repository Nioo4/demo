import { generateMockProject } from "./src/lib/mock-generator.js";
import { getActiveAiProvider, getActiveAiModel } from "./src/lib/ai-generator.js";

console.log("=== 1. Mock Generator Test ===");
const mock = generateMockProject("Build a team task tracker");
console.log("Title:", mock.title);
console.log("Theme:", mock.theme);
console.log("Audience:", mock.blueprint.audience);
console.log("Screens:", mock.blueprint.screens.length);
console.log("Agent steps:", mock.agentSteps.length);
console.log("Files:", mock.generatedCode.files.length);
console.log("✅ Mock generator works!\n");

console.log("=== 2. AI Provider Config ===");
console.log("Active provider:", getActiveAiProvider());
console.log("Active model:", getActiveAiModel());
console.log("✅ Provider config loaded!\n");

console.log("=== 3. Env Variables ===");
console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ set" : "❌ missing");
console.log("SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ set" : "❌ missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ set" : "❌ missing");
console.log("DEEPSEEK_API_KEY:", process.env.DEEPSEEK_API_KEY ? "✅ set" : "❌ missing");
console.log("AI_PROVIDER:", process.env.AI_PROVIDER || "(not set, defaults to openai)");
