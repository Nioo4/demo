import { generateLlmProject, getActiveAiModel, getActiveAiProvider, isAiConfigured } from "./ai-generator";
import { generateMockProject } from "./mock-generator";
import type { GenerationMode, GenerationProject } from "./types";

const LLM_PROVIDER_ALIASES = new Set(["llm", "openai", "deepseek", "real", "live"]);

export function isLlmConfigured() {
  return isAiConfigured();
}

export function getLlmProviderInfo() {
  return {
    provider: getActiveAiProvider(),
    model: getActiveAiModel()
  };
}

export function getDefaultGenerationMode(): GenerationMode {
  const provider = normalizeProvider(process.env.AI_PROVIDER);

  if (provider === "mock") {
    return "mock";
  }

  if (provider === "llm" && isLlmConfigured()) {
    return "llm";
  }

  return "mock";
}

export async function generateProjectFromPrompt(prompt: string, requestedMode?: GenerationMode) {
  const mode = resolveGenerationMode(requestedMode);

  if (mode === "llm") {
    if (!isLlmConfigured()) {
      const { provider } = getLlmProviderInfo();
      const keyName = provider === "deepseek" ? "DEEPSEEK_API_KEY" : "OPENAI_API_KEY";
      throw new Error(`Real AI mode is selected but ${keyName} is not configured.`);
    }

    return generateLlmProject(prompt);
  }

  return generateMockProject(prompt);
}

function resolveGenerationMode(requestedMode?: GenerationMode): GenerationMode {
  if (requestedMode) {
    return requestedMode;
  }

  return getDefaultGenerationMode();
}

function normalizeProvider(rawProvider: string | undefined) {
  if (!rawProvider) {
    return "auto";
  }

  const lower = rawProvider.trim().toLowerCase();
  if (lower === "mock") {
    return "mock";
  }

  if (LLM_PROVIDER_ALIASES.has(lower)) {
    return "llm";
  }

  return "auto";
}

export function normalizeMode(value: unknown) {
  if (value === "mock" || value === "llm") {
    return value as GenerationMode;
  }

  return undefined;
}

export function buildPendingSkeleton(prompt: string): GenerationProject {
  return generateMockProject(prompt);
}
