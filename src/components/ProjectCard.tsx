import Link from "next/link";
import type { Route } from "next";

import type { GenerationProject } from "@/lib/types";
import { formatDateTime, formatProjectStatus } from "@/lib/ui";

type ProjectCardProps = {
  project: GenerationProject;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="project-card">
      <div>
        <span className="status-pill">{formatProjectStatus(project.status)}</span>
        <h2>{project.title}</h2>
        <p>{project.prompt}</p>
      </div>
      <div className="project-meta">
        <span>{project.agentSteps.length} 个执行阶段</span>
        <span>{formatDateTime(project.createdAt)}</span>
      </div>
      <div className="project-actions">
        <Link className="button secondary" href={`/projects/${project.id}` as Route}>
          查看详情
        </Link>
        <Link className="button secondary" href={{ pathname: "/builder", query: { projectId: project.id } }}>
          回到生成台
        </Link>
      </div>
    </article>
  );
}
