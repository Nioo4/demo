"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";

import { AgentTimeline } from "@/components/AgentTimeline";
import { AppPreview } from "@/components/AppPreview";
import { AuthRequired } from "@/components/AuthRequired";
import { BuilderFlowStrip } from "@/components/BuilderFlowStrip";
import { useAuth } from "@/components/AuthProvider";
import { GeneratedCodePanel } from "@/components/GeneratedCodePanel";
import { ProjectAttachmentsPanel } from "@/components/ProjectAttachmentsPanel";
import { ProjectArtifactsPanel } from "@/components/ProjectArtifactsPanel";
import { ProjectMetaBadges, ProjectShareActions } from "@/components/ProjectSharePanel";
import { PromptComposer, releaseComposerAttachmentPreview, type ComposerAttachment } from "@/components/PromptComposer";
import { fetchWithAuth } from "@/lib/api-client";
import type { GenerationMode, GenerationProject, ProjectAttachment } from "@/lib/types";
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
  const { isLoading: isAuthLoading, user } = useAuth();
  const [prompt, setPrompt] = useState(samplePrompt);
  const [mode, setMode] = useState<GenerationMode>("mock");
  const [llmConfigured, setLlmConfigured] = useState(false);
  const [aiProvider, setAiProvider] = useState("openai");
  const [llmModel, setLlmModel] = useState("");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [project, setProject] = useState<GenerationProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const attachmentsRef = useRef<ComposerAttachment[]>([]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach(releaseComposerAttachmentPreview);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      replaceAttachments([]);
      setProject(null);
      setPrompt(samplePrompt);
      return;
    }

    let isMounted = true;

    async function loadProjectFromContext(id: string) {
      const fromApi = await fetchProjectFromApi(id);

      if (isMounted && fromApi) {
        setProject(fromApi);
        setPrompt(fromApi.prompt);
        replaceAttachments(toComposerAttachments(fromApi.attachments));
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
  }, [initialProjectId, samplePrompt, user]);

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
      await streamGenerate(prompt, mode, toPersistedAttachments(attachments), (eventName, payload) => {
        if (payload.project) {
          setProject(payload.project);

          if (eventName === "generation_complete") {
            replaceAttachments(mergeProjectAttachmentsWithPreviews(payload.project.attachments, attachmentsRef.current));
          }
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

  function handleAttachmentsChange(nextAttachments: ComposerAttachment[]) {
    replaceAttachments(nextAttachments);
  }

  function replaceAttachments(nextAttachments: ComposerAttachment[]) {
    const nextPreviewUrls = new Set(
      nextAttachments
        .map((attachment) => attachment.previewUrl)
        .filter((previewUrl): previewUrl is string => typeof previewUrl === "string")
    );

    attachmentsRef.current.forEach((attachment) => {
      if (attachment.previewUrl && !nextPreviewUrls.has(attachment.previewUrl)) {
        releaseComposerAttachmentPreview(attachment);
      }
    });

    setAttachments(nextAttachments);
  }

  const isShareReady = project?.status === "ready";

  return (
    <main className="builder-layout">
      {isAuthLoading ? (
        <section className="empty-state auth-required">
          <h2>正在检查登录状态...</h2>
          <p>请稍等，我们正在确认当前账号信息。</p>
        </section>
      ) : !user ? (
        <AuthRequired
          title="登录后才能生成并保存项目"
          description="生成结果会绑定到你的账号名下，因此需要先登录或注册，再进入生成台。"
          nextPath="/builder"
        />
      ) : (
        <>
          <section className="builder-focus">
            <section className="builder-hero builder-hero-compact">
              <div>
                <p className="eyebrow">生成台</p>
                <h1>从一句需求，到素材输入、AI 生成、预览和分享。</h1>
                <p>你可以先写需求，再上传文档或图片参考；生成完成后，直接在这里查看结构、代码和分享状态。</p>
              </div>

              <div className="hero-actions">
                <span className="topbar-chip">模式：{formatGenerationMode(mode)}</span>
                <span className="topbar-chip">
                  模型：{formatAiProvider(aiProvider)} {llmConfigured ? llmModel || "已连接" : "未连接"}
                </span>
              </div>
            </section>

            <BuilderFlowStrip
              hasAttachments={attachments.length > 0}
              hasResult={Boolean(project)}
              isGenerating={isGenerating}
              isPublic={project?.isPublic === true}
            />

            <PromptComposer
              prompt={prompt}
              mode={mode}
              llmConfigured={llmConfigured}
              aiProvider={aiProvider}
              attachments={attachments}
              isGenerating={isGenerating}
              error={error}
              onPromptChange={setPrompt}
              onModeChange={setMode}
              onAttachmentsChange={handleAttachmentsChange}
              onAttachmentIssue={setError}
              onGenerate={handleGenerate}
            />

            {isShareReady && project ? (
              <section className="panel builder-project-toolbar">
                <div className="builder-project-toolbar-copy">
                  <p className="eyebrow">当前项目</p>
                  <h2>{project.title}</h2>
                  <p>{project.prompt}</p>
                </div>

                <div className="builder-project-toolbar-side">
                  <ProjectMetaBadges project={project} className="builder-project-badges" />
                  <div className="detail-actions detail-actions-wide builder-project-actions">
                    <Link className="button secondary" href={`/projects/${project.id}` as Route}>
                      在项目库中查看
                    </Link>
                    <ProjectShareActions project={project} onProjectChange={setProject} />
                  </div>
                </div>
              </section>
            ) : null}

            {project?.attachments.length ? <ProjectAttachmentsPanel attachments={project.attachments} /> : null}
            {project?.artifacts.length ? <ProjectArtifactsPanel artifacts={project.artifacts} /> : null}
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
                  <li>先看流程条，确认当前已经进入哪一步。</li>
                  <li>如果上传了素材，先检查“参考素材”面板里的信息是否正确。</li>
                  <li>再看右侧时间线、预览区和代码区，确认结构与生成结果一致。</li>
                </ul>
              </section>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

async function streamGenerate(
  prompt: string,
  mode: GenerationMode,
  attachments: ProjectAttachment[],
  onEvent: StreamListener
) {
  const response = await fetchWithAuth("/api/generate-stream", {
    method: "POST",
    body: JSON.stringify({ prompt, mode, attachments })
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
    const response = await fetchWithAuth(`/api/projects/${projectId}`);
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

function toPersistedAttachments(attachments: ComposerAttachment[]): ProjectAttachment[] {
  return attachments.map(({ previewUrl: _previewUrl, ...attachment }) => attachment);
}

function toComposerAttachments(attachments: ProjectAttachment[]): ComposerAttachment[] {
  return attachments.map((attachment) => ({
    ...attachment,
    previewUrl: null
  }));
}

function mergeProjectAttachmentsWithPreviews(
  attachments: ProjectAttachment[],
  currentAttachments: ComposerAttachment[]
): ComposerAttachment[] {
  return attachments.map((attachment) => ({
    ...attachment,
    previewUrl: currentAttachments.find((currentAttachment) => currentAttachment.id === attachment.id)?.previewUrl ?? null
  }));
}
