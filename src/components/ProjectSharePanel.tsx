"use client";

import { useState } from "react";

import { fetchWithAuth } from "@/lib/api-client";
import type { GenerationProject } from "@/lib/types";
import { formatProjectStatus, formatProjectVisibility } from "@/lib/ui";

type ProjectMetaBadgesProps = {
  project: GenerationProject;
  className?: string;
};

type ProjectShareActionsProps = {
  project: GenerationProject;
  onProjectChange: (project: GenerationProject) => void;
  className?: string;
};

export function ProjectMetaBadges({ project, className }: ProjectMetaBadgesProps) {
  return (
    <div className={joinClassNames("project-badges project-meta-badges", className)}>
      <span className="status-pill">{formatProjectStatus(project.status)}</span>
      <span className="chip">{formatProjectVisibility(project.isPublic)}</span>
      {project.isFavorite ? <span className="chip">已收藏</span> : null}
      <span className="chip">{project.isPublic ? "公开链接可访问" : "仅自己可见"}</span>
    </div>
  );
}

export function ProjectShareActions({ project, onProjectChange, className }: ProjectShareActionsProps) {
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function handleToggleShare() {
    if (isUpdatingShare) {
      return;
    }

    setCopyStatus("idle");
    setIsUpdatingShare(true);

    const nextIsPublic = !project.isPublic;

    try {
      const response = await fetchWithAuth(`/api/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          isPublic: nextIsPublic,
          shareToken: nextIsPublic ? project.shareToken : null
        })
      });

      const payload = (await safeParseJson(response)) as { project?: GenerationProject } | null;
      if (!response.ok || !payload?.project) {
        throw new Error("Failed to update share state.");
      }

      onProjectChange(payload.project);
    } catch {
      setCopyStatus("failed");
    } finally {
      setIsUpdatingShare(false);
    }
  }

  async function handleCopyLink() {
    if (!project.isPublic || !project.shareToken || typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${project.shareToken}`);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <div className={joinClassNames("project-share-actions-inline", className)}>
      <button className="button secondary" onClick={handleToggleShare} type="button" disabled={isUpdatingShare}>
        {isUpdatingShare ? "更新中..." : project.isPublic ? "切回私有项目" : "开启公开分享"}
      </button>
      <button
        className="button primary"
        onClick={handleCopyLink}
        type="button"
        disabled={!project.isPublic || !project.shareToken}
      >
        {copyStatus === "copied"
          ? "链接已复制"
          : copyStatus === "failed"
            ? "复制失败"
            : project.isPublic && project.shareToken
              ? "复制分享链接"
              : "开启公开分享后复制链接"}
      </button>
    </div>
  );
}

async function safeParseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
