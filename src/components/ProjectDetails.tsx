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
        <p className="muted">Loading project details...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="page-stack">
        <section className="empty-state">
          <h2>Project not found</h2>
          <p>The project does not exist in the database. Open the builder and generate again.</p>
          <Link className="button primary" href="/builder">
            Open Builder
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-stack">
      <section className="details-header">
        <div>
          <p className="eyebrow">Project details</p>
          <h1>{project.title}</h1>
          <p>{project.prompt}</p>
        </div>
        <div className="detail-actions">
          <Link className="button secondary" href="/projects">
            Back to list
          </Link>
          <Link className="button secondary" href={{ pathname: "/builder", query: { projectId: project.id } }}>
            Open in builder
          </Link>
          <button className="button primary" onClick={handleCopyLink} type="button">
            {copyStatus === "copied" ? "Link copied" : copyStatus === "failed" ? "Copy failed" : "Copy share link"}
          </button>
        </div>
      </section>

      <section className="workspace-grid">
        <AgentTimeline steps={project.agentSteps} isGenerating={false} />
        <AppPreview project={project} />
        <GeneratedCodePanel code={project.generatedCode} />
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
