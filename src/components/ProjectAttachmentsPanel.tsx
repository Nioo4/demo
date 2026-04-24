import { formatFileSize } from "@/lib/attachments";
import type { ProjectAttachment } from "@/lib/types";

type ProjectAttachmentsPanelProps = {
  attachments: ProjectAttachment[];
};

export function ProjectAttachmentsPanel({ attachments }: ProjectAttachmentsPanelProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <section className="panel attachments-panel">
      <div className="panel-heading">
        <p className="eyebrow">参考素材</p>
        <h2>本次生成使用的上传内容</h2>
        <p>文档内容摘要和图片信息会进入当前项目上下文，帮助 AI 更快对齐需求。</p>
      </div>

      <div className="attachment-grid">
        {attachments.map((attachment) => (
          <article className="attachment-card" key={attachment.id}>
            <div className="attachment-card-top">
              <span className={`attachment-kind ${attachment.kind}`}>{attachment.kind === "image" ? "图片" : "文档"}</span>
              <span className="attachment-size">{formatFileSize(attachment.size)}</span>
            </div>

            <div className="attachment-card-copy">
              <strong>{attachment.name}</strong>
              <span>{attachment.mimeType}</span>
              {attachment.width && attachment.height ? <span>{attachment.width} × {attachment.height}</span> : null}
            </div>

            <p className="attachment-excerpt">
              {attachment.extractedText
                ? attachment.extractedText
                : attachment.kind === "image"
                  ? "当前版本会记录图片的名称、格式与尺寸，并把它作为视觉参考素材。"
                  : "当前版本尚未直接提取该文件正文，生成时会优先使用文件名和类型。"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
