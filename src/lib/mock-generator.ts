import type { AgentStep, AppBlueprint, GeneratedCode, GenerationProject } from "./types";

const SAMPLE_PROMPT =
  "Build a lightweight launch planner for indie makers to turn product ideas into landing pages, task lists, and release notes.";

export function getSamplePrompt() {
  return SAMPLE_PROMPT;
}

export function generateMockProject(prompt: string): GenerationProject {
  const normalizedPrompt = normalizePrompt(prompt);
  const now = new Date().toISOString();
  const title = buildTitle(normalizedPrompt);
  const blueprint = buildBlueprint(normalizedPrompt, title);
  const generatedCode = buildGeneratedCode(title, blueprint);
  const agentSteps = buildAgentSteps(blueprint);

  return {
    id: crypto.randomUUID(),
    title,
    prompt: normalizedPrompt,
    status: "ready",
    theme: "command-center",
    agentSteps,
    blueprint,
    generatedCode,
    createdAt: now,
    updatedAt: now
  };
}

function normalizePrompt(prompt: string) {
  const trimmed = prompt.trim();
  return trimmed.length > 0 ? trimmed : SAMPLE_PROMPT;
}

function buildTitle(prompt: string) {
  const words = prompt
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);

  if (words.length === 0) {
    return "Agent Built App";
  }

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function buildBlueprint(prompt: string, title: string): AppBlueprint {
  const lower = prompt.toLowerCase();
  const isTeamTool = lower.includes("team") || lower.includes("collaborat");
  const isCommerce = lower.includes("shop") || lower.includes("store") || lower.includes("commerce");
  const isLearning = lower.includes("learn") || lower.includes("course") || lower.includes("study");

  const audience = isTeamTool
    ? "Small teams that need fast alignment"
    : isCommerce
      ? "Operators who need a focused selling workflow"
      : isLearning
        ? "Learners who want guided progress"
        : "Builders validating a focused product idea";

  const primaryEntity = isCommerce ? "Product" : isLearning ? "Lesson" : isTeamTool ? "Workspace" : "Idea";

  return {
    audience,
    valueProposition: `${title} turns a rough idea into a guided workflow with clear next actions, saved state, and a shareable result.`,
    screens: [
      {
        name: "Launch Console",
        purpose: "Collect the user's goal and show the current generation status.",
        interactions: ["Submit a prompt", "Review agent progress", "Restart generation"]
      },
      {
        name: "Generated Workspace",
        purpose: "Show the app structure, primary workflow, and suggested next steps.",
        interactions: ["Inspect screens", "Open generated code", "Save the project"]
      },
      {
        name: "Project History",
        purpose: "Persist generated apps so the user can compare and iterate.",
        interactions: ["Browse saved ideas", "Re-open a project", "Delete stale drafts"]
      }
    ],
    dataModel: [
      {
        entity: primaryEntity,
        fields: ["id", "title", "status", "summary", "createdAt", "updatedAt"]
      },
      {
        entity: "AgentRun",
        fields: ["id", "projectId", "agentKey", "status", "summary", "output"]
      },
      {
        entity: "Artifact",
        fields: ["id", "projectId", "kind", "name", "content"]
      }
    ],
    extensionIdeas: [
      "Connect a real LLM provider for dynamic app plans and code.",
      "Add Supabase persistence with auth and row-level security.",
      "Add a deploy preview step that exports the generated app as a repository."
    ]
  };
}

function buildGeneratedCode(title: string, blueprint: AppBlueprint): GeneratedCode {
  const componentName = `${title.replace(/[^\w]/g, "") || "Generated"}Preview`;
  const firstScreen = blueprint.screens[0];

  return {
    componentName,
    files: [
      {
        path: "src/generated/AppPreview.tsx",
        language: "tsx",
        content: `export function ${componentName}() {
  return (
    <main className="generated-app">
      <p className="eyebrow">${blueprint.audience}</p>
      <h1>${title}</h1>
      <p>${blueprint.valueProposition}</p>
      <section>
        <h2>${firstScreen.name}</h2>
        <p>${firstScreen.purpose}</p>
      </section>
    </main>
  );
}
`
      },
      {
        path: "src/generated/data-model.ts",
        language: "ts",
        content: `export const dataModel = ${JSON.stringify(blueprint.dataModel, null, 2)} as const;
`
      }
    ]
  };
}

function buildAgentSteps(blueprint: AppBlueprint): AgentStep[] {
  return [
    {
      id: crypto.randomUUID(),
      key: "planner",
      label: "Planner Agent",
      status: "complete",
      summary: "Converted the raw idea into a scoped product direction.",
      output: [blueprint.audience, blueprint.valueProposition]
    },
    {
      id: crypto.randomUUID(),
      key: "ux",
      label: "UX Agent",
      status: "complete",
      summary: "Designed the main screens and interaction path.",
      output: blueprint.screens.map((screen) => `${screen.name}: ${screen.purpose}`)
    },
    {
      id: crypto.randomUUID(),
      key: "coder",
      label: "Code Agent",
      status: "complete",
      summary: "Generated a component skeleton and typed data model.",
      output: blueprint.dataModel.map((model) => `${model.entity}: ${model.fields.join(", ")}`)
    },
    {
      id: crypto.randomUUID(),
      key: "qa",
      label: "QA Agent",
      status: "complete",
      summary: "Checked the result for review-ready viability.",
      output: [
        "The prototype has a complete prompt-to-preview loop.",
        "Persistence is mapped to Supabase projects and agent_runs tables.",
        "Real LLM generation is available through the same API contract."
      ]
    }
  ];
}
