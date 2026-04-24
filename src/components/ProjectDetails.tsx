"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AgentTimeline } from "@/components/AgentTimeline";
import { AppPreview } from "@/components/AppPreview";
import { GeneratedCodePanel } from "@/components/GeneratedCodePanel";
import type { GenerationProject } from "@/lib/types";

type ProjectDetailsProps = {
  projectId: string;
};

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const [project, setProject] = useState<GenerationProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
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
  }, [projectId]);

  async function handleCopyLink() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
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
          <p>数据库中没有对应记录，你可以回到生成台重新生成，或者检查链接是否正确。</p>
          <Link className="button primary" href="/builder">
            打开生成台
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-stack">
      <section className="details-header">
        <div>
          <p className="eyebrow">项目详情</p>
          <h1>{project.title}</h1>
          <p>{project.prompt}</p>
        </div>
        <div className="detail-actions">
          <Link className="button secondary" href="/projects">
            返回项目库
          </Link>
          <Link className="button secondary" href={{ pathname: "/builder", query: { projectId: project.id } }}>
            在生成台中打开
          </Link>
          <button className="button primary" onClick={handleCopyLink} type="button">
            {copyStatus === "copied" ? "链接已复制" : copyStatus === "failed" ? "复制失败" : "复制分享链接"}
          </button>
        </div>
      </section>

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
