import Link from "next/link";
import type { Route } from "next";

import type { GenerationProject } from "@/lib/types";
import { formatDateTime, formatProjectStatus, formatProjectVisibility } from "@/lib/ui";

type ProjectCardProps = {
  project: GenerationProject;
  isBusy?: boolean;
  onRename: (project: GenerationProject) => void;
  onDelete: (project: GenerationProject) => void;
  onToggleFavorite: (project: GenerationProject) => void;
};

export function ProjectCard({ project, isBusy = false, onRename, onDelete, onToggleFavorite }: ProjectCardProps) {
  return (
    <article className="project-card">
      <div>
        <div className="project-badges">
          <span className="status-pill">{formatProjectStatus(project.status)}</span>
          <span className="chip">{formatProjectVisibility(project.isPublic)}</span>
          {project.isFavorite ? <span className="chip">已收藏</span> : null}
          {project.attachments.length > 0 ? <span className="chip">{project.attachments.length} 个素材</span> : null}
          {project.artifacts.length > 0 ? <span className="chip">{project.artifacts.length} 个 artifacts</span> : null}
        </div>
        <h2>{project.title}</h2>
        <p>{project.prompt}</p>
      </div>

      <div className="project-meta">
        <span>{project.agentSteps.length} 个执行阶段</span>
        <span>创建于 {formatDateTime(project.createdAt)}</span>
        <span>更新于 {formatDateTime(project.updatedAt)}</span>
      </div>

      <div className="project-actions">
        <Link className="button secondary" href={`/projects/${project.id}` as Route}>
          查看详情
        </Link>
        <Link className="button secondary" href={{ pathname: "/builder", query: { projectId: project.id } }}>
          回到生成台
        </Link>
        {project.isPublic && project.shareToken ? (
          <Link className="button secondary" href={`/share/${project.shareToken}` as Route} target="_blank">
            打开分享页
          </Link>
        ) : null}
      </div>

      <div className="project-manage-actions">
        <button className="button secondary" disabled={isBusy} onClick={() => onToggleFavorite(project)} type="button">
          {project.isFavorite ? "取消收藏" : "收藏"}
        </button>
        <button className="button secondary" disabled={isBusy} onClick={() => onRename(project)} type="button">
          重命名
        </button>
        <button className="button secondary danger" disabled={isBusy} onClick={() => onDelete(project)} type="button">
          删除
        </button>
      </div>
    </article>
  );
}
