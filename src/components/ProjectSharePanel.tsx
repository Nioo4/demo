"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

import { fetchWithAuth } from "@/lib/api-client";
import type { GenerationProject } from "@/lib/types";
import { formatProjectVisibility } from "@/lib/ui";

type ProjectSharePanelProps = {
  project: GenerationProject;
  onProjectChange: (project: GenerationProject) => void;
  title?: string;
  description?: string;
};

export function ProjectSharePanel({
  project,
  onProjectChange,
  title = "分享设置",
  description = "项目生成完成后，你可以在这里直接切换私有 / 公开，并复制只读分享链接。"
}: ProjectSharePanelProps) {
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const sharePath = useMemo(() => {
    if (!project.isPublic || !project.shareToken) {
      return null;
    }

    return `/share/${project.shareToken}` as Route;
  }, [project]);

  async function handleToggleShare() {
    if (isUpdatingShare) {
      return;
    }

    setShareMessage(null);
    setCopyStatus("idle");
    setIsUpdatingShare(true);

    const nextIsPublic = !project.isPublic;
    const response = await fetchWithAuth(`/api/projects/${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        isPublic: nextIsPublic,
        shareToken: nextIsPublic ? project.shareToken : null
      })
    });

    setIsUpdatingShare(false);

    const payload = (await safeParseJson(response)) as { project?: GenerationProject; error?: string } | null;
    if (!response.ok || !payload?.project) {
      setShareMessage(payload?.error ?? "切换分享状态失败，请稍后再试。");
      return;
    }

    onProjectChange(payload.project);
    setShareMessage(nextIsPublic ? "公开分享已开启，新的只读链接已经生成。" : "项目已切回私有，旧分享链接已失效。");
  }

  async function handleCopyLink() {
    if (!sharePath || typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${sharePath}`);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <section className="panel share-panel">
      <div className="panel-heading">
        <p className="eyebrow">项目分享</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="share-layout">
        <div className="share-summary">
          <div className="chip-row">
            <span className="chip">{formatProjectVisibility(project.isPublic)}</span>
            <span className="chip">{project.isPublic ? "已生成分享链接" : "仅自己可见"}</span>
          </div>

          <p className="muted">
            {project.isPublic
              ? "公开后，别人不登录也能通过分享页查看这个项目，但只能只读浏览。"
              : "当前项目仍然是私有的，只有你登录后可以查看和管理。"}
          </p>

          {shareMessage ? <p className="muted">{shareMessage}</p> : null}
        </div>

        <div className="share-actions">
          <button className="button secondary" onClick={handleToggleShare} type="button" disabled={isUpdatingShare}>
            {isUpdatingShare ? "更新中..." : project.isPublic ? "切回私有" : "开启公开分享"}
          </button>

          {sharePath ? (
            <>
              <Link className="button secondary" href={sharePath} rel="noreferrer" target="_blank">
                打开分享页
              </Link>
              <button className="button primary" onClick={handleCopyLink} type="button">
                {copyStatus === "copied" ? "分享链接已复制" : copyStatus === "failed" ? "复制失败" : "复制分享链接"}
              </button>
            </>
          ) : (
            <button className="button primary" type="button" disabled>
              开启公开分享后复制链接
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

async function safeParseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}
