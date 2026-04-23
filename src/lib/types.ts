export type ProjectStatus = "draft" | "running" | "ready" | "failed";

export type AgentStatus = "pending" | "running" | "complete" | "failed";

export type GenerationMode = "mock" | "llm";

export type AgentStep = {
  id: string;
  key: "planner" | "ux" | "coder" | "qa";
  label: string;
  status: AgentStatus;
  summary: string;
  output: string[];
};

export type AppBlueprint = {
  audience: string;
  valueProposition: string;
  screens: Array<{
    name: string;
    purpose: string;
    interactions: string[];
  }>;
  dataModel: Array<{
    entity: string;
    fields: string[];
  }>;
  extensionIdeas: string[];
};

export type GeneratedCode = {
  componentName: string;
  files: Array<{
    path: string;
    language: string;
    content: string;
  }>;
};

export type GenerationProject = {
  id: string;
  title: string;
  prompt: string;
  status: ProjectStatus;
  theme: string;
  agentSteps: AgentStep[];
  blueprint: AppBlueprint;
  generatedCode: GeneratedCode;
  createdAt: string;
  updatedAt: string;
};

export type GenerateRequest = {
  prompt: string;
  mode?: GenerationMode;
};

export type GenerateResponse = {
  project: GenerationProject;
};
