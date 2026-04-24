"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AgentTimeline } from "@/components/AgentTimeline";
import { AppPreview } from "@/components/AppPreview";
import { AuthRequired } from "@/components/AuthRequired";
import { useAuth } from "@/components/AuthProvider";
import { GeneratedCodePanel } from "@/components/GeneratedCodePanel";
import { ProjectAttachmentsPanel } from "@/components/ProjectAttachmentsPanel";
import { ProjectArtifactsPanel } from "@/components/ProjectArtifactsPanel";
import { ProjectMetaBadges, ProjectShareActions } from "@/components/ProjectSharePanel";
import { fetchWithAuth } from "@/lib/api-client";
import type { GenerationProject } from "@/lib/types";

type ProjectDetailsProps = {
  projectId: string;
};

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [project, setProject] = useState<GenerationProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProject(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadProject() {
      const fromApi = await fetchProject(projectId);

      if (fromApi && isMounted) {
        setProject(fromApi);
        setIsLoading(false);
        return;
      }

      if (isMounted) {
        setProject(null);
        setIsLoading(false);
      }
    }

    void loadProject();

    return () => {
      isMounted = false;
    };
  }, [projectId, user]);

  if (isAuthLoading) {
    return (
      <main className="page-stack">
        <p className="muted">正在检查登录状态...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page-stack">
        <AuthRequired
          title="登录后查看项目详情"
          description="项目详情页只对项目拥有者可见，请先登录后查看自己的项目内容。"
          nextPath={`/projects/${projectId}`}
        />
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="page-stack">
        <p className="muted">正在加载项目详情...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="page-stack">
        <section className="empty-state">
          <h2>未找到这个项目</h2>
          <p>数据库里没有对应记录。你可以回到生成台重新生成，或者检查当前链接是否正确。</p>
          <Link className="button primary" href="/builder">
            打开生成台
          </Link>
        </section>
      </main>
    );
  }

  const builderHref = { pathname: "/builder", query: { projectId: project.id } };

  return (
    <main className="page-stack">
      <section className="details-header">
        <div className="details-header-layout">
          <div className="details-header-main">
            <p className="eyebrow">项目详情</p>
            <h1>{project.title}</h1>
            <p>{project.prompt}</p>
          </div>

          <div className="details-header-side">
            <ProjectMetaBadges project={project} className="detail-header-badges" />
            <div className="detail-actions detail-actions-wide">
              <Link className="button secondary" href="/projects">
                返回项目库
              </Link>
              <Link className="button secondary" href={builderHref}>
                在生成台中打开
              </Link>
              {project.status === "ready" ? <ProjectShareActions project={project} onProjectChange={setProject} /> : null}
            </div>
          </div>
        </div>
      </section>

      <ProjectAttachmentsPanel attachments={project.attachments} />
      <ProjectArtifactsPanel artifacts={project.artifacts} />

      <section className="workspace-grid">
        <div className="main-column">
          <AppPreview project={project} />
          <GeneratedCodePanel code={project.generatedCode} />
        </div>

        <div className="side-column">
          <AgentTimeline steps={project.agentSteps} isGenerating={false} />
        </div>
      </section>
    </main>
  );
}

async function fetchProject(projectId: string) {
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
