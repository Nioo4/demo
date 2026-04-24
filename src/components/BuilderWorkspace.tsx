"use client";

import { useEffect, useState } from "react";

import { AgentTimeline } from "@/components/AgentTimeline";
import { AppPreview } from "@/components/AppPreview";
import { GeneratedCodePanel } from "@/components/GeneratedCodePanel";
import { PromptComposer } from "@/components/PromptComposer";
import type { GenerationMode, GenerationProject } from "@/lib/types";
import { formatAiProvider, formatGenerationMode } from "@/lib/ui";

type BuilderWorkspaceProps = {
  samplePrompt: string;
  initialProjectId?: string | null;
};

type StreamEventName = "generation_started" | "step_update" | "generation_complete" | "done" | "error";

type StreamPayload = {
  project?: GenerationProject;
  error?: string;
};

type StreamListener = (eventName: StreamEventName, payload: StreamPayload) => void;

export function BuilderWorkspace({ samplePrompt, initialProjectId = null }: BuilderWorkspaceProps) {
  const [prompt, setPrompt] = useState(samplePrompt);
  const [mode, setMode] = useState<GenerationMode>("mock");
  const [llmConfigured, setLlmConfigured] = useState(false);
  const [aiProvider, setAiProvider] = useState("openai");
  const [llmModel, setLlmModel] = useState("");
  const [project, setProject] = useState<GenerationProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProjectFromContext(id: string) {
      const fromApi = await fetchProjectFromApi(id);
      if (isMounted && fromApi) {
        setProject(fromApi);
        return;
      }

      if (isMounted) {
        setError("数据库里没有找到这个项目。");
      }
    }

    if (initialProjectId) {
      void loadProjectFromContext(initialProjectId);
    }

    return () => {
      isMounted = false;
    };
  }, [initialProjectId]);

  useEffect(() => {
    let isMounted = true;

    async function loadDefaultMode() {
      try {
        const response = await fetch("/api/health");
        if (!response.ok) {
          return;
        }

        const health = (await response.json()) as {
          defaultGenerationMode?: GenerationMode;
          generationMode?: GenerationMode;
          llmConfigured?: boolean;
          aiProvider?: string;
          llmModel?: string;
        };

        if (!isMounted) {
          return;
        }

        const defaultMode = health.defaultGenerationMode ?? health.generationMode;
        if (defaultMode === "llm" || defaultMode === "mock") {
          setMode(defaultMode);
        }

        setLlmConfigured(health.llmConfigured === true);
        setAiProvider(health.aiProvider ?? "openai");
        setLlmModel(health.llmModel ?? "");
      } catch {
        if (isMounted) {
          setLlmConfigured(false);
          setAiProvider("openai");
          setLlmModel("");
        }
      }
    }

    void loadDefaultMode();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleGenerate() {
    if (isGenerating) {
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      await streamGenerate(prompt, mode, (eventName, payload) => {
        if (payload.project) {
          setProject(payload.project);
        }

        if (eventName === "error" && payload.error) {
          setError(payload.error);
        }
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "生成过程中出现了未知错误。");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="builder-layout">
      <section className="builder-focus">
        <section className="builder-hero builder-hero-compact">
          <div>
            <p className="eyebrow">生成台</p>
            <h1>把一句需求，变成一套可查看的应用方案。</h1>
            <p>描述你的产品想法，然后在下方查看时间线、预览和代码结果。</p>
          </div>

          <div className="hero-actions">
            <span className="topbar-chip">模式：{formatGenerationMode(mode)}</span>
            <span className="topbar-chip">
              模型：{formatAiProvider(aiProvider)} {llmConfigured ? llmModel || "已连接" : "未连接"}
            </span>
          </div>
        </section>

        <PromptComposer
          prompt={prompt}
          mode={mode}
          llmConfigured={llmConfigured}
          aiProvider={aiProvider}
          isGenerating={isGenerating}
          error={error}
          onPromptChange={setPrompt}
          onModeChange={setMode}
          onGenerate={handleGenerate}
        />
      </section>

      <section className="workspace-grid">
        <div className="main-column">
          <AppPreview project={project} />
          <GeneratedCodePanel code={project?.generatedCode ?? null} />
        </div>

        <div className="side-column">
          <AgentTimeline steps={project?.agentSteps ?? []} isGenerating={isGenerating} />

          <section className="panel tips-panel">
            <div className="panel-heading">
              <p className="eyebrow">使用指南</p>
              <h2>建议你这样看结果</h2>
            </div>
            <ul className="check-list">
              <li>先看右侧时间线，确认四个阶段都正常完成。</li>
              <li>再看中间预览区，检查页面结构和用户流程是否合理。</li>
              <li>最后对照代码区，确认代码产物和预览结果基本一致。</li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}

async function streamGenerate(prompt: string, mode: GenerationMode, onEvent: StreamListener) {
  const response = await fetch("/api/generate-stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt, mode })
  });

  if (!response.ok) {
    const failure = (await safeParseJson(response)) as { error?: string } | null;
    throw new Error(failure?.error ?? "生成失败。");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const fallback = (await safeParseJson(response)) as StreamPayload | null;
    if (fallback?.project) {
      onEvent("generation_complete", fallback);
      return;
    }
    throw new Error("流式兜底响应格式不正确。");
  }

  if (!response.body) {
    throw new Error("流式响应缺少可读取的数据体。");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const parsed = parseSseBlock(block);
      if (!parsed) {
        continue;
      }

      onEvent(parsed.eventName, parsed.payload);

      if (parsed.eventName === "done") {
        return;
      }
    }
  }
}

async function fetchProjectFromApi(projectId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}`);
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { project?: GenerationProject };
    return data.project ?? null;
  } catch {
    return null;
  }
}

async function safeParseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function parseSseBlock(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  let eventName: StreamEventName = "step_update";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim() as StreamEventName;
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  try {
    const payload = JSON.parse(dataLines.join("\n")) as StreamPayload;
    return { eventName, payload };
  } catch {
    return null;
  }
}
