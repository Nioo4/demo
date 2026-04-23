import Link from "next/link";
import type { Route } from "next";

import type { GenerationProject } from "@/lib/types";

type ProjectCardProps = {
  project: GenerationProject;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="project-card">
      <div>
        <span className="status-pill">{project.status}</span>
        <h2>{project.title}</h2>
        <p>{project.prompt}</p>
      </div>
      <div className="project-meta">
        <span>{project.agentSteps.length} agent steps</span>
        <span>{new Date(project.createdAt).toLocaleString()}</span>
      </div>
      <div className="project-actions">
        <Link className="button secondary" href={`/projects/${project.id}` as Route}>
          Open details
        </Link>
        <Link className="button secondary" href={{ pathname: "/builder", query: { projectId: project.id } }}>
          Re-open builder
        </Link>
      </div>
    </article>
  );
}
