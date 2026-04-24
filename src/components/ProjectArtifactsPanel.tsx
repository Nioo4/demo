"use client";

import { getArtifactDataUri } from "@/lib/project-artifacts";
import { formatDateTime, formatArtifactKind } from "@/lib/ui";
import type { ProjectArtifact } from "@/lib/types";

type ProjectArtifactsPanelProps = {
  artifacts: ProjectArtifact[];
};

export function ProjectArtifactsPanel({ artifacts }: ProjectArtifactsPanelProps) {
  if (artifacts.length === 0) {
    return null;
  }

  return (
    <section className="panel artifacts-panel">
      <div className="panel-heading">
        <p className="eyebrow">Artifacts</p>
        <h2>本次生成已保存的产物</h2>
        <p>这些产物会和项目一起落库。你可以直接下载蓝图、说明和代码文件。</p>
      </div>

      <div className="artifact-summary-grid">
        {artifacts.map((artifact) => (
          <article className="artifact-summary-card" key={artifact.id}>
            <div className="artifact-summary-top">
              <span className={`artifact-kind ${artifact.kind}`}>{formatArtifactKind(artifact.kind)}</span>
              <span className="attachment-size">{formatDateTime(artifact.createdAt)}</span>
            </div>
            <strong>{artifact.name}</strong>
            <span>{describeArtifact(artifact)}</span>
            <a className="button secondary artifact-download" download={artifact.name} href={getArtifactDataUri(artifact)}>
              下载
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function describeArtifact(artifact: ProjectArtifact) {
  if (artifact.kind === "blueprint") {
    return "保存了页面蓝图、数据模型与扩展方向。";
  }

  if (artifact.kind === "note") {
    return "保存了本次需求、定位与页面结构说明。";
  }

  const language = typeof artifact.metadata.language === "string" ? artifact.metadata.language : null;
  const path = typeof artifact.metadata.path === "string" ? artifact.metadata.path : null;

  if (language || path) {
    return [language, path].filter(Boolean).join(" · ");
  }

  return "已持久化保存的项目产物。";
}
