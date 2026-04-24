import type { ProjectAttachment } from "./types";

export const MAX_ATTACHMENTS = 6;
export const MAX_TEXT_ATTACHMENT_LENGTH = 1200;

export function normalizeProjectAttachments(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ProjectAttachment[];
  }

  return value
    .map((item) => normalizeAttachment(item))
    .filter((item): item is ProjectAttachment => item !== null)
    .slice(0, MAX_ATTACHMENTS);
}

export function buildAttachmentContext(attachments: ProjectAttachment[]) {
  if (attachments.length === 0) {
    return "";
  }

  const lines = attachments.map((attachment, index) => {
    const kindLabel = attachment.kind === "image" ? "图片" : "文档";
    const details = [
      `${kindLabel} ${attachment.name}`,
      attachment.mimeType || "未知类型",
      formatFileSize(attachment.size)
    ];

    if (attachment.kind === "image" && attachment.width && attachment.height) {
      details.push(`${attachment.width}x${attachment.height}`);
    }

    const excerpt = attachment.extractedText
      ? `可提取内容摘录：${attachment.extractedText.slice(0, MAX_TEXT_ATTACHMENT_LENGTH)}`
      : attachment.kind === "image"
        ? "当前版本会将图片作为视觉参考素材记录，请在主需求里补充关键视觉诉求。"
        : "当前版本无法直接提取该文档正文，会优先使用文件名和类型作为参考。";

    return `${index + 1}. ${details.join(" | ")}\n${excerpt}`;
  });

  return `\n\n参考素材：\n${lines.join("\n\n")}`;
}

export function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function normalizeAttachment(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const id = asNonEmptyString(value.id);
  const name = asNonEmptyString(value.name);
  const mimeType = asNonEmptyString(value.mimeType) ?? "application/octet-stream";
  const kind = value.kind === "image" || value.kind === "document" ? value.kind : null;

  if (!id || !name || !kind) {
    return null;
  }

  return {
    id,
    kind,
    name,
    mimeType,
    size: normalizeNumber(value.size),
    extractedText: asNonEmptyString(value.extractedText) ?? null,
    width: normalizeNullableNumber(value.width),
    height: normalizeNullableNumber(value.height)
  } satisfies ProjectAttachment;
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  return 0;
}

function normalizeNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  return null;
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
