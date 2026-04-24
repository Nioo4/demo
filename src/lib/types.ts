export type ProjectStatus = "draft" | "running" | "ready" | "failed";

export type AgentStatus = "pending" | "running" | "complete" | "failed";

export type GenerationMode = "mock" | "llm";

export type ProjectAttachmentKind = "image" | "document";

export type ProjectArtifactKind = "blueprint" | "component" | "page" | "style" | "test" | "note";

export type PreviewFieldInputType = "text" | "number" | "email" | "search";

export type PreviewSectionType =
  | "hero"
  | "form"
  | "stats"
  | "cardGrid"
  | "checklist"
  | "table"
  | "kanban"
  | "calculator";

export type PreviewField = {
  id: string;
  label: string;
  inputType: PreviewFieldInputType;
  placeholder: string;
  initialValue?: string;
};

export type PreviewMetric = {
  label: string;
  value: string;
};

export type PreviewCard = {
  title: string;
  description: string;
  meta?: string;
};

export type PreviewKanbanColumn = {
  name: string;
  cards: string[];
};

export type PreviewSection = {
  id: string;
  type: PreviewSectionType;
  title: string;
  description?: string;
  badges?: string[];
  primaryAction?: string;
  secondaryAction?: string;
  items?: string[];
  metrics?: PreviewMetric[];
  cards?: PreviewCard[];
  fields?: PreviewField[];
  columns?: string[];
  rows?: string[][];
  board?: PreviewKanbanColumn[];
  presetExpression?: string;
  history?: string[];
};

export type PreviewPage = {
  id: string;
  title: string;
  summary: string;
  primaryAction?: string;
  secondaryAction?: string;
  sections: PreviewSection[];
};

export type PreviewSchema = {
  defaultPageId?: string;
  pages: PreviewPage[];
};

export type ProjectAttachment = {
  id: string;
  kind: ProjectAttachmentKind;
  name: string;
  mimeType: string;
  size: number;
  extractedText: string | null;
  width: number | null;
  height: number | null;
};

export type ProjectArtifact = {
  id: string;
  kind: ProjectArtifactKind;
  name: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

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
  previewSchema?: PreviewSchema | null;
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
  isPublic: boolean;
  isFavorite: boolean;
  shareToken: string | null;
  theme: string;
  attachments: ProjectAttachment[];
  artifacts: ProjectArtifact[];
  agentSteps: AgentStep[];
  blueprint: AppBlueprint;
  generatedCode: GeneratedCode;
  createdAt: string;
  updatedAt: string;
};

export type GenerateRequest = {
  prompt: string;
  mode?: GenerationMode;
  attachments?: ProjectAttachment[];
};

export type GenerateResponse = {
  project: GenerationProject;
};
