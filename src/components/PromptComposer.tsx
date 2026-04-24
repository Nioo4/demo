"use client";

import { useRef, type ChangeEvent } from "react";

import { MAX_ATTACHMENTS, MAX_TEXT_ATTACHMENT_LENGTH, formatFileSize } from "@/lib/attachments";
import { PROMPT_TEMPLATES } from "@/lib/prompt-templates";
import type { GenerationMode, ProjectAttachment } from "@/lib/types";

export type ComposerAttachment = ProjectAttachment & {
  previewUrl: string | null;
};

type PromptComposerProps = {
  prompt: string;
  mode: GenerationMode;
  llmConfigured: boolean;
  aiProvider: string;
  attachments: ComposerAttachment[];
  isGenerating: boolean;
  error: string | null;
  onPromptChange: (value: string) => void;
  onModeChange: (mode: GenerationMode) => void;
  onAttachmentsChange: (attachments: ComposerAttachment[]) => void;
  onAttachmentIssue: (message: string | null) => void;
  onGenerate: () => void;
};

export function PromptComposer({
  prompt,
  mode,
  llmConfigured,
  aiProvider,
  attachments,
  isGenerating,
  error,
  onPromptChange,
  onModeChange,
  onAttachmentsChange,
  onAttachmentIssue,
  onGenerate
}: PromptComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const availableSlots = Math.max(MAX_ATTACHMENTS - attachments.length, 0);
    if (availableSlots === 0) {
      onAttachmentIssue(`最多上传 ${MAX_ATTACHMENTS} 个参考文件。`);
      return;
    }

    const acceptedFiles = files.slice(0, availableSlots);
    const created = await Promise.all(acceptedFiles.map((file) => createComposerAttachment(file)));
    onAttachmentsChange([...attachments, ...created]);

    if (files.length > acceptedFiles.length) {
      onAttachmentIssue(`已达到最多 ${MAX_ATTACHMENTS} 个文件的上限，多余文件未加入。`);
      return;
    }

    onAttachmentIssue(null);
  }

  function handleRemoveAttachment(attachmentId: string) {
    const target = attachments.find((attachment) => attachment.id === attachmentId);
    if (target) {
      releaseComposerAttachmentPreview(target);
    }

    onAttachmentsChange(attachments.filter((attachment) => attachment.id !== attachmentId));
    onAttachmentIssue(null);
  }

  function handleApplyTemplate(templatePrompt: string) {
    onPromptChange(templatePrompt);
    onAttachmentIssue(null);
  }

  return (
    <section className="composer-card composer-card-elevated">
      <div className="composer-header">
        <div>
          <p className="eyebrow">需求输入</p>
          <h2>描述你想生成的应用</h2>
        </div>

        <div className="composer-controls">
          <label className="mode-picker" htmlFor="generation-mode">
            <span>生成模式</span>
            <select
              id="generation-mode"
              value={mode}
              disabled={isGenerating}
              onChange={(event) => onModeChange(event.target.value as GenerationMode)}
            >
              <option value="llm">真实 AI</option>
              <option value="mock">稳定 Mock</option>
            </select>
          </label>
          <span className="status-pill">{isGenerating ? "生成中" : "准备就绪"}</span>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="例如：做一个面向独立开发者的发布计划助手，包含任务拆解、里程碑、发布说明生成和历史记录。"
      />

      <section className="template-library">
        <div className="template-library-header">
          <div>
            <p className="eyebrow">Prompt 模板库</p>
            <strong>先选一个模板，再按你的项目继续改写</strong>
          </div>
          <span className="upload-zone-limit">点击模板可直接填入输入框</span>
        </div>

        <div className="template-grid">
          {PROMPT_TEMPLATES.map((template) => {
            const isActive = prompt.trim() === template.prompt.trim();

            return (
              <button
                className={`template-card${isActive ? " active" : ""}`}
                key={template.id}
                onClick={() => handleApplyTemplate(template.prompt)}
                type="button"
              >
                <span className="chip">{template.category}</span>
                <strong>{template.title}</strong>
                <span>{template.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="upload-zone">
        <div className="upload-zone-copy">
          <p className="eyebrow">参考素材</p>
          <strong>支持上传文档与图片</strong>
          <span>图片会作为视觉参考，文档会尽量提取摘要，一起进入生成上下文。</span>
        </div>

        <div className="upload-zone-actions">
          <button
            className="button secondary"
            disabled={isGenerating}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            上传文件
          </button>
          <span className="upload-zone-limit">最多 {MAX_ATTACHMENTS} 个文件</span>
        </div>

        <input
          ref={fileInputRef}
          accept="image/*,.pdf,.txt,.md,.csv,.json,.doc,.docx"
          className="composer-file-input"
          multiple
          onChange={handleFileSelect}
          type="file"
        />
      </div>

      {attachments.length > 0 ? (
        <div className="composer-attachment-grid">
          {attachments.map((attachment) => (
            <article className="composer-attachment-card" key={attachment.id}>
              <div className="composer-attachment-media">
                {attachment.kind === "image" && attachment.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={attachment.name} src={attachment.previewUrl} />
                ) : (
                  <span className="composer-attachment-icon">{attachment.kind === "image" ? "图" : "文"}</span>
                )}
              </div>

              <div className="composer-attachment-copy">
                <strong>{attachment.name}</strong>
                <span>
                  {attachment.kind === "image" ? "图片" : "文档"} · {formatFileSize(attachment.size)}
                </span>
                <span>{attachment.mimeType}</span>
              </div>

              <button
                className="composer-attachment-remove"
                disabled={isGenerating}
                onClick={() => handleRemoveAttachment(attachment.id)}
                type="button"
              >
                移除
              </button>
            </article>
          ))}
        </div>
      ) : null}

      <div className="composer-footer">
        {error ? (
          <p className="error-text">{error}</p>
        ) : (
          <p>
            {mode === "llm" && !llmConfigured
              ? `真实 AI 需要服务端配置 ${aiProvider === "deepseek" ? "DEEPSEEK_API_KEY" : "OPENAI_API_KEY"}，未配置时可先切回稳定 Mock。`
              : attachments.length > 0
                ? `当前已附加 ${attachments.length} 个参考文件。建议把目标用户、核心流程和最在意的页面效果写清楚。`
                : "建议把目标用户、核心流程、希望得到的页面或结果写清楚。"}
          </p>
        )}

        <button className="button primary composer-submit" type="button" disabled={isGenerating} onClick={onGenerate}>
          {isGenerating ? "正在生成..." : "开始生成"}
        </button>
      </div>
    </section>
  );
}

export function releaseComposerAttachmentPreview(attachment: ComposerAttachment) {
  if (attachment.previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

async function createComposerAttachment(file: File): Promise<ComposerAttachment> {
  const kind = file.type.startsWith("image/") ? "image" : "document";
  const baseAttachment: ComposerAttachment = {
    id: crypto.randomUUID(),
    kind,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    extractedText: null,
    width: null,
    height: null,
    previewUrl: null
  };

  if (kind === "image") {
    const dimensions = await readImageDimensions(file);
    return {
      ...baseAttachment,
      width: dimensions.width,
      height: dimensions.height,
      previewUrl: URL.createObjectURL(file)
    };
  }

  if (isTextExtractable(file)) {
    const extractedText = await file.text();
    return {
      ...baseAttachment,
      extractedText: extractedText.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_ATTACHMENT_LENGTH) || null
    };
  }

  return baseAttachment;
}

function isTextExtractable(file: File) {
  const mimeType = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return (
    mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    [".txt", ".md", ".csv", ".json"].some((suffix) => name.endsWith(suffix))
  );
}

async function readImageDimensions(file: File) {
  const previewUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number | null; height: number | null }>((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth || null, height: image.naturalHeight || null });
      image.onerror = () => resolve({ width: null, height: null });
      image.src = previewUrl;
    });

    return dimensions;
  } finally {
    URL.revokeObjectURL(previewUrl);
  }
}
