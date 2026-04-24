import type { AgentStatus, GenerationMode, ProjectStatus } from "./types";

export function formatProjectStatus(status: ProjectStatus) {
  switch (status) {
    case "draft":
      return "草稿";
    case "running":
      return "生成中";
    case "ready":
      return "已完成";
    case "failed":
      return "失败";
    default:
      return status;
  }
}

export function formatAgentStatus(status: AgentStatus) {
  switch (status) {
    case "pending":
      return "等待中";
    case "running":
      return "执行中";
    case "complete":
      return "已完成";
    case "failed":
      return "失败";
    default:
      return status;
  }
}

export function formatGenerationMode(mode: GenerationMode) {
  return mode === "llm" ? "真实 AI" : "稳定 Mock";
}

export function formatAiProvider(provider: string) {
  if (provider === "deepseek") {
    return "DeepSeek";
  }

  if (provider === "openai") {
    return "OpenAI";
  }

  return provider;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
