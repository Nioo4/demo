"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ProjectCard } from "@/components/ProjectCard";
import type { GenerationProject } from "@/lib/types";

export function ProjectsExplorer() {
  const [projects, setProjects] = useState<GenerationProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        const data = response.ok ? ((await response.json()) as { projects: GenerationProject[] }) : { projects: [] };

        if (isMounted) {
          setProjects(data.projects);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <p className="muted">Loading generated projects...</p>;
  }

  if (projects.length === 0) {
    return (
      <section className="empty-state">
        <h2>No projects yet</h2>
        <p>Create the first app blueprint from the builder workspace.</p>
        <Link className="button primary" href="/builder">
          Open Builder
        </Link>
      </section>
    );
  }

  return (
    <section className="project-grid">
      {projects.map((project) => (
        <ProjectCard project={project} key={project.id} />
      ))}
    </section>
  );
}
