import type { GeneratedCode, GenerationProject, ProjectArtifact, ProjectArtifactKind } from "./types";

export function buildProjectArtifacts(project: GenerationProject): ProjectArtifact[] {
  const createdAt = project.updatedAt || project.createdAt || new Date().toISOString();

  return [
    {
      id: crypto.randomUUID(),
      kind: "blueprint",
      name: "app-blueprint.json",
      content: JSON.stringify(project.blueprint, null, 2),
      metadata: {
        format: "json",
        mimeType: "application/json"
      },
      createdAt
    },
    {
      id: crypto.randomUUID(),
      kind: "note",
      name: "generation-notes.md",
      content: buildGenerationNotes(project),
      metadata: {
        format: "markdown",
        mimeType: "text/markdown"
      },
      createdAt
    },
    ...project.generatedCode.files.map((file) => ({
      id: crypto.randomUUID(),
      kind: inferArtifactKind(file),
      name: file.path.split("/").pop() || file.path,
      content: file.content,
      metadata: {
        path: file.path,
        language: file.language,
        mimeType: inferMimeType(file.language, file.path)
      },
      createdAt
    }))
  ];
}

export function getArtifactDataUri(artifact: ProjectArtifact) {
  const mimeType = readStringMetadata(artifact.metadata, "mimeType") || "text/plain";
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(artifact.content)}`;
}

function inferArtifactKind(file: GeneratedCode["files"][number]): ProjectArtifactKind {
  const lowerPath = file.path.toLowerCase();
  const lowerLanguage = file.language.toLowerCase();

  if (lowerPath.includes("/page.") || lowerPath.endsWith("page.tsx") || lowerPath.endsWith("page.jsx")) {
    return "page";
  }

  if (lowerLanguage.includes("css") || lowerPath.endsWith(".css") || lowerPath.endsWith(".scss")) {
    return "style";
  }

  if (
    lowerPath.includes(".test.") ||
    lowerPath.includes(".spec.") ||
    lowerPath.includes("__tests__") ||
    lowerLanguage.includes("test")
  ) {
    return "test";
  }

  return "component";
}

function inferMimeType(language: string, path: string) {
  const lowerLanguage = language.toLowerCase();
  const lowerPath = path.toLowerCase();

  if (lowerLanguage === "json" || lowerPath.endsWith(".json")) {
    return "application/json";
  }

  if (lowerLanguage === "md" || lowerLanguage === "markdown" || lowerPath.endsWith(".md")) {
    return "text/markdown";
  }

  if (lowerLanguage === "css" || lowerPath.endsWith(".css")) {
    return "text/css";
  }

  if (lowerLanguage === "html" || lowerPath.endsWith(".html")) {
    return "text/html";
  }

  if (lowerLanguage === "sql" || lowerPath.endsWith(".sql")) {
    return "application/sql";
  }

  if (
    lowerLanguage === "tsx" ||
    lowerLanguage === "ts" ||
    lowerLanguage === "jsx" ||
    lowerLanguage === "js" ||
    lowerPath.endsWith(".ts") ||
    lowerPath.endsWith(".tsx") ||
    lowerPath.endsWith(".js") ||
    lowerPath.endsWith(".jsx")
  ) {
    return "text/plain";
  }

  return "text/plain";
}

function buildGenerationNotes(project: GenerationProject) {
  const screens = project.blueprint.screens.map((screen) => `- ${screen.name}: ${screen.purpose}`).join("\n");
  const extensions = project.blueprint.extensionIdeas.map((idea) => `- ${idea}`).join("\n");

  return `# ${project.title}

## 原始需求
${project.prompt}

## 目标用户
${project.blueprint.audience}

## 核心价值
${project.blueprint.valueProposition}

## 页面结构
${screens}

## 后续扩展
${extensions}`;
}

function readStringMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : null;
}
