"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AuthRequired } from "@/components/AuthRequired";
import { useAuth } from "@/components/AuthProvider";
import { ProjectCard } from "@/components/ProjectCard";
import { fetchWithAuth } from "@/lib/api-client";
import type { GenerationProject } from "@/lib/types";

type VisibilityFilter = "all" | "favorite" | "public" | "private";
type SortMode = "updated-desc" | "created-desc" | "created-asc";

export function ProjectsExplorer() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [projects, setProjects] = useState<GenerationProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("updated-desc");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadProjects() {
      try {
        const response = await fetchWithAuth("/api/projects");
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
  }, [user]);

  const visibleProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.prompt.toLowerCase().includes(normalizedQuery);

      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "favorite" && project.isFavorite) ||
        (visibilityFilter === "public" && project.isPublic) ||
        (visibilityFilter === "private" && !project.isPublic);

      return matchesQuery && matchesVisibility;
    });

    return filtered.sort((left, right) => {
      if (sortMode === "created-asc") {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }

      if (sortMode === "created-desc") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
  }, [projects, searchQuery, sortMode, visibilityFilter]);

  if (isAuthLoading) {
    return <p className="muted">正在检查登录状态...</p>;
  }

  if (!user) {
    return (
      <AuthRequired
        title="登录后查看自己的项目记录"
        description="项目库会按账号隔离，登录后只会显示你自己生成并保存的项目。"
        nextPath="/projects"
      />
    );
  }

  if (isLoading) {
    return <p className="muted">正在加载项目记录...</p>;
  }

  if (projects.length === 0) {
    return (
      <section className="empty-state">
        <h2>还没有项目记录</h2>
        <p>先去生成台创建第一条应用结果，这里就会出现可复看的项目卡片。</p>
        <Link className="button primary" href="/builder">
          打开生成台
        </Link>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <section className="panel projects-toolbar">
        <div className="projects-toolbar-main">
          <label className="projects-search">
            <span>搜索项目</span>
            <input
              className="projects-search-input"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="按项目名称或需求关键词搜索"
              type="search"
              value={searchQuery}
            />
          </label>
        </div>

        <div className="projects-toolbar-filters">
          <label className="projects-filter">
            <span>筛选</span>
            <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}>
              <option value="all">全部项目</option>
              <option value="favorite">仅看收藏</option>
              <option value="public">仅看公开</option>
              <option value="private">仅看私有</option>
            </select>
          </label>

          <label className="projects-filter">
            <span>排序</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="updated-desc">最近更新优先</option>
              <option value="created-desc">创建时间从新到旧</option>
              <option value="created-asc">创建时间从旧到新</option>
            </select>
          </label>
        </div>

        <div className="projects-toolbar-meta">
          <span className="chip">共 {projects.length} 个项目</span>
          <span className="chip">当前显示 {visibleProjects.length} 个</span>
        </div>
      </section>

      {actionError ? <p className="error-text">{actionError}</p> : null}

      {visibleProjects.length === 0 ? (
        <section className="empty-state">
          <h2>没有符合条件的项目</h2>
          <p>你可以换一个关键词、切换筛选条件，或者回到生成台创建新的项目。</p>
        </section>
      ) : (
        <section className="project-grid">
          {visibleProjects.map((project) => (
            <ProjectCard
              isBusy={busyProjectId === project.id}
              key={project.id}
              onDelete={handleDeleteProject}
              onRename={handleRenameProject}
              onToggleFavorite={handleToggleFavorite}
              project={project}
            />
          ))}
        </section>
      )}
    </section>
  );

  async function handleToggleFavorite(project: GenerationProject) {
    setActionError(null);
    await patchProject(project.id, {
      isFavorite: !project.isFavorite
    });
  }

  async function handleRenameProject(project: GenerationProject) {
    const nextTitle = window.prompt("请输入新的项目名称", project.title)?.trim();

    if (!nextTitle || nextTitle === project.title) {
      return;
    }

    setActionError(null);
    await patchProject(project.id, {
      title: nextTitle
    });
  }

  async function handleDeleteProject(project: GenerationProject) {
    const confirmed = window.confirm(`确定删除项目“${project.title}”吗？删除后无法恢复。`);
    if (!confirmed) {
      return;
    }

    setActionError(null);
    setBusyProjectId(project.id);

    try {
      const response = await fetchWithAuth(`/api/projects/${project.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await safeParseJson(response)) as { error?: string } | null;
        throw new Error(payload?.error ?? "删除项目失败。");
      }

      setProjects((currentProjects) => currentProjects.filter((currentProject) => currentProject.id !== project.id));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "删除项目失败。");
    } finally {
      setBusyProjectId(null);
    }
  }

  async function patchProject(projectId: string, patch: Partial<GenerationProject>) {
    setBusyProjectId(projectId);

    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });

      const payload = (await safeParseJson(response)) as { project?: GenerationProject; error?: string } | null;
      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "更新项目失败。");
      }

      setProjects((currentProjects) =>
        currentProjects.map((currentProject) => (currentProject.id === projectId ? payload.project! : currentProject))
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "更新项目失败。");
    } finally {
      setBusyProjectId(null);
    }
  }
}

async function safeParseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}
