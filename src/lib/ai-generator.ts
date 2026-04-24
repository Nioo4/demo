import { generateMockProject } from "./mock-generator";
import type { AgentStep, AppBlueprint, GeneratedCode, GenerationProject } from "./types";

type AiProvider = "openai" | "deepseek";

const DEFAULT_OPENAI_MODEL = "gpt-4o";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
const MAX_TITLE_LENGTH = 84;

const AGENT_ORDER: AgentStep["key"][] = ["planner", "ux", "coder", "qa"];

const AGENT_LABELS: Record<AgentStep["key"], string> = {
  planner: "规划 Agent",
  ux: "交互 Agent",
  coder: "代码 Agent",
  qa: "校验 Agent"
};

const SYSTEM_PROMPT = `You are generating output for an AI-native app builder demo.
Return only JSON that matches the provided schema.
Use clear, practical product language.
Keep code files concise but realistic.
Match the language of the user's prompt for user-facing text fields.`;

const DEEPSEEK_JSON_EXAMPLE = `{
  "title": "Launch Planner",
  "theme": "command-center",
  "blueprint": {
    "audience": "Indie makers preparing a product launch",
    "valueProposition": "Turns a rough launch idea into a guided workflow with screens, tasks, and artifacts.",
    "screens": [
      {
        "name": "Brief Intake",
        "purpose": "Collect the product goal and constraints.",
        "interactions": ["Submit brief", "Edit target audience"]
      },
      {
        "name": "Launch Board",
        "purpose": "Show milestones, tasks, and risk checks.",
        "interactions": ["Update task status", "Filter milestones"]
      },
      {
        "name": "Release Notes",
        "purpose": "Generate launch copy and summary artifacts.",
        "interactions": ["Review draft", "Copy notes"]
      }
    ],
    "dataModel": [
      { "entity": "Project", "fields": ["id", "title", "status", "createdAt"] },
      { "entity": "Milestone", "fields": ["id", "projectId", "title", "dueDate"] },
      { "entity": "Task", "fields": ["id", "milestoneId", "title", "status"] }
    ],
    "extensionIdeas": ["Add auth", "Export launch plan", "Add analytics"]
  },
  "generatedCode": {
    "componentName": "LaunchPlannerPreview",
    "files": [
      { "path": "src/generated/AppPreview.tsx", "language": "tsx", "content": "export function LaunchPlannerPreview() { return <main>Launch Planner</main>; }" },
      { "path": "src/generated/data-model.ts", "language": "ts", "content": "export const dataModel = [] as const;" }
    ]
  },
  "agentSteps": [
    { "key": "planner", "summary": "Scoped the product direction.", "output": ["Defined audience", "Clarified workflow"] },
    { "key": "ux", "summary": "Designed the screen flow.", "output": ["Brief Intake", "Launch Board"] },
    { "key": "coder", "summary": "Generated code artifacts.", "output": ["Preview component", "Data model"] },
    { "key": "qa", "summary": "Checked demo readiness.", "output": ["Persistence-ready", "Shareable project"] }
  ]
}`;

const PROJECT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "theme", "blueprint", "generatedCode", "agentSteps"],
  properties: {
    title: { type: "string", minLength: 3, maxLength: 84 },
    theme: { type: "string" },
    blueprint: {
      type: "object",
      additionalProperties: false,
      required: ["audience", "valueProposition", "screens", "dataModel", "extensionIdeas"],
      properties: {
        audience: { type: "string", minLength: 3 },
        valueProposition: { type: "string", minLength: 8 },
        screens: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "purpose", "interactions"],
            properties: {
              name: { type: "string", minLength: 2 },
              purpose: { type: "string", minLength: 5 },
              interactions: {
                type: "array",
                minItems: 2,
                maxItems: 5,
                items: { type: "string", minLength: 2 }
              }
            }
          }
        },
        dataModel: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["entity", "fields"],
            properties: {
              entity: { type: "string", minLength: 2 },
              fields: {
                type: "array",
                minItems: 3,
                maxItems: 8,
                items: { type: "string", minLength: 2 }
              }
            }
          }
        },
        extensionIdeas: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string", minLength: 4 }
        }
      }
    },
    generatedCode: {
      type: "object",
      additionalProperties: false,
      required: ["componentName", "files"],
      properties: {
        componentName: { type: "string", minLength: 3 },
        files: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["path", "language", "content"],
            properties: {
              path: { type: "string", minLength: 4 },
              language: { type: "string", minLength: 2 },
              content: { type: "string", minLength: 12 }
            }
          }
        }
      }
    },
    agentSteps: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "summary", "output"],
        properties: {
          key: { type: "string", enum: AGENT_ORDER },
          summary: { type: "string", minLength: 8 },
          output: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: { type: "string", minLength: 2 }
          }
        }
      }
    }
  }
} as const;

export function getActiveAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (provider === "deepseek") {
    return "deepseek";
  }

  if (provider === "openai") {
    return "openai";
  }

  if (process.env.DEEPSEEK_API_KEY?.trim()) {
    return "deepseek";
  }

  return "openai";
}

export function getActiveAiModel() {
  return getActiveAiProvider() === "deepseek"
    ? process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL
    : process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function isAiConfigured() {
  return getActiveAiProvider() === "deepseek"
    ? Boolean(process.env.DEEPSEEK_API_KEY?.trim())
    : Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function generateLlmProject(prompt: string): Promise<GenerationProject> {
  return getActiveAiProvider() === "deepseek" ? generateDeepSeekProject(prompt) : generateOpenAiProject(prompt);
}

async function generateOpenAiProject(prompt: string): Promise<GenerationProject> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Real AI mode requires OPENAI_API_KEY in server environment variables.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_output_tokens: 2800,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `User prompt:\n${prompt.trim()}\n\nGenerate the app blueprint, generated code files, and four ordered agent steps.`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "atoms_lite_project",
          strict: true,
          schema: PROJECT_SCHEMA
        }
      }
    })
  });

  const payload = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(readApiError(payload) ?? `OpenAI request failed with status ${response.status}.`);
  }

  const rawText = extractResponseText(payload);
  if (!rawText) {
    throw new Error("OpenAI response did not contain output text.");
  }

  const parsed = parseJsonObject(rawText);
  if (!parsed) {
    throw new Error("OpenAI response was not valid JSON.");
  }

  return normalizeLlmProject(prompt, parsed);
}

async function generateDeepSeekProject(prompt: string): Promise<GenerationProject> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Real AI mode requires DEEPSEEK_API_KEY in server environment variables.");
  }

  const baseUrl = (process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 4000,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}
Return valid json only. Do not use markdown fences or explanatory text.
The json must follow this example shape:
${DEEPSEEK_JSON_EXAMPLE}`
        },
        {
          role: "user",
          content: `User prompt:\n${prompt.trim()}\n\nGenerate fresh json for the app blueprint, generated code files, and four ordered agent steps.`
        }
      ]
    })
  });
  clearTimeout(timeoutId);

  const payload = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(readApiError(payload) ?? `DeepSeek request failed with status ${response.status}.`);
  }

  if (readFirstFinishReason(payload) === "length") {
    throw new Error("DeepSeek response was truncated. Increase max_tokens or shorten the prompt.");
  }

  const rawText = extractChatCompletionText(payload);
  if (!rawText) {
    throw new Error("DeepSeek response did not contain output content.");
  }

  const parsed = parseJsonObject(rawText);
  if (!parsed) {
    throw new Error("DeepSeek response was not valid JSON.");
  }

  return normalizeLlmProject(prompt, parsed);
}

function normalizeLlmProject(prompt: string, raw: unknown): GenerationProject {
  const fallback = generateMockProject(prompt);
  if (!isRecord(raw)) {
    return fallback;
  }

  const now = new Date().toISOString();
  const title = sanitizeTitle(asNonEmptyString(raw.title) ?? fallback.title);
  const theme = asNonEmptyString(raw.theme) ?? fallback.theme;
  const blueprint = normalizeBlueprint(raw.blueprint, fallback.blueprint);
  const generatedCode = normalizeGeneratedCode(raw.generatedCode, fallback.generatedCode);
  const agentSteps = normalizeAgentSteps(raw.agentSteps, fallback.agentSteps);

  return {
    id: crypto.randomUUID(),
    title,
    prompt: prompt.trim() || fallback.prompt,
    status: "ready",
    isPublic: false,
    shareToken: null,
    theme,
    blueprint,
    generatedCode,
    agentSteps,
    createdAt: now,
    updatedAt: now
  };
}

function normalizeBlueprint(raw: unknown, fallback: AppBlueprint): AppBlueprint {
  if (!isRecord(raw)) {
    return fallback;
  }

  const screens = Array.isArray(raw.screens)
    ? raw.screens
        .map((item) => normalizeScreen(item))
        .filter((item): item is AppBlueprint["screens"][number] => item !== null)
        .slice(0, 5)
    : [];

  const dataModel = Array.isArray(raw.dataModel)
    ? raw.dataModel
        .map((item) => normalizeDataModel(item))
        .filter((item): item is AppBlueprint["dataModel"][number] => item !== null)
        .slice(0, 6)
    : [];

  const extensionIdeas = toStringArray(raw.extensionIdeas, 2, 4);

  return {
    audience: asNonEmptyString(raw.audience) ?? fallback.audience,
    valueProposition: asNonEmptyString(raw.valueProposition) ?? fallback.valueProposition,
    screens: screens.length > 0 ? screens : fallback.screens,
    dataModel: dataModel.length > 0 ? dataModel : fallback.dataModel,
    extensionIdeas: extensionIdeas.length > 0 ? extensionIdeas : fallback.extensionIdeas
  };
}

function normalizeGeneratedCode(raw: unknown, fallback: GeneratedCode): GeneratedCode {
  if (!isRecord(raw)) {
    return fallback;
  }

  const files = Array.isArray(raw.files)
    ? raw.files
        .map((file) => normalizeFile(file))
        .filter((file): file is GeneratedCode["files"][number] => file !== null)
        .slice(0, 4)
    : [];

  return {
    componentName: asNonEmptyString(raw.componentName) ?? fallback.componentName,
    files: files.length > 0 ? files : fallback.files
  };
}

function normalizeAgentSteps(raw: unknown, fallback: AgentStep[]): AgentStep[] {
  const stepMap = new Map<AgentStep["key"], { summary: string; output: string[] }>();

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!isRecord(item)) {
        continue;
      }

      const key = toAgentKey(item.key);
      if (!key) {
        continue;
      }

      const summary = asNonEmptyString(item.summary);
      const output = toStringArray(item.output, 1, 5);
      if (!summary || output.length === 0) {
        continue;
      }

      stepMap.set(key, { summary, output });
    }
  }

  const fallbackMap = new Map<AgentStep["key"], AgentStep>(fallback.map((step) => [step.key, step]));

  return AGENT_ORDER.map((key) => {
    const next = stepMap.get(key);
    const base = fallbackMap.get(key);

    return {
      id: crypto.randomUUID(),
      key,
      label: AGENT_LABELS[key],
      status: "complete",
      summary: next?.summary ?? base?.summary ?? "Completed this stage.",
      output: next?.output ?? base?.output ?? ["No output available."]
    };
  });
}

function normalizeScreen(raw: unknown) {
  if (!isRecord(raw)) {
    return null;
  }

  const name = asNonEmptyString(raw.name);
  const purpose = asNonEmptyString(raw.purpose);
  const interactions = toStringArray(raw.interactions, 2, 5);

  if (!name || !purpose || interactions.length === 0) {
    return null;
  }

  return {
    name,
    purpose,
    interactions
  };
}

function normalizeDataModel(raw: unknown) {
  if (!isRecord(raw)) {
    return null;
  }

  const entity = asNonEmptyString(raw.entity);
  const fields = toStringArray(raw.fields, 3, 8);

  if (!entity || fields.length === 0) {
    return null;
  }

  return {
    entity,
    fields
  };
}

function normalizeFile(raw: unknown) {
  if (!isRecord(raw)) {
    return null;
  }

  const path = asNonEmptyString(raw.path);
  const language = asNonEmptyString(raw.language);
  const content = asNonEmptyString(raw.content);

  if (!path || !language || !content) {
    return null;
  }

  return {
    path,
    language,
    content
  };
}

function extractResponseText(payload: unknown) {
  if (!isRecord(payload)) {
    return "";
  }

  const directText = readTextCandidate(payload.output_text);
  if (directText) {
    return directText;
  }

  const fromOutput: string[] = [];
  const output = payload.output;

  if (Array.isArray(output)) {
    for (const item of output) {
      if (!isRecord(item)) {
        continue;
      }

      const itemText = readTextCandidate(item.output_text);
      if (itemText) {
        fromOutput.push(itemText);
      }

      const content = item.content;
      if (!Array.isArray(content)) {
        continue;
      }

      for (const block of content) {
        if (!isRecord(block)) {
          continue;
        }

        const textCandidate =
          readTextCandidate(block.text) ?? readTextCandidate(block.output_text) ?? readTextCandidate(block.value);

        if (textCandidate) {
          fromOutput.push(textCandidate);
        }
      }
    }
  }

  return fromOutput.join("\n").trim();
}

function extractChatCompletionText(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    return "";
  }

  for (const choice of payload.choices) {
    if (!isRecord(choice) || !isRecord(choice.message)) {
      continue;
    }

    const text = readTextCandidate(choice.message.content);
    if (text) {
      return text;
    }
  }

  return "";
}

function readTextCandidate(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const chunks = value
      .map((item) => readTextCandidate(item))
      .filter((item): item is string => Boolean(item));

    return chunks.length > 0 ? chunks.join("\n") : null;
  }

  if (isRecord(value)) {
    return (
      readTextCandidate(value.text) ??
      readTextCandidate(value.output_text) ??
      readTextCandidate(value.value) ??
      null
    );
  }

  return null;
}

function parseJsonObject(rawText: string) {
  const trimmed = rawText.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    candidates.push(fenced[1].trim());
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      continue;
    }
  }

  return null;
}

function sanitizeTitle(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.slice(0, MAX_TITLE_LENGTH);
}

function toAgentKey(value: unknown): AgentStep["key"] | null {
  if (value === "planner" || value === "ux" || value === "coder" || value === "qa") {
    return value;
  }

  return null;
}

function toStringArray(value: unknown, minLength: number, maxLength: number) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length >= minLength)
    .slice(0, maxLength);
}

function asNonEmptyString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readFirstFinishReason(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    return null;
  }

  const [firstChoice] = payload.choices;
  if (!isRecord(firstChoice)) {
    return null;
  }

  return asNonEmptyString(firstChoice.finish_reason);
}

function readApiError(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  const error = payload.error;
  if (!isRecord(error)) {
    return null;
  }

  const message = asNonEmptyString(error.message);
  return message ?? null;
}

async function safeParseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}
