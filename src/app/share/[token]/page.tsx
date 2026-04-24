import Link from "next/link";

import { AgentTimeline } from "@/components/AgentTimeline";
import { AppPreview } from "@/components/AppPreview";
import { GeneratedCodePanel } from "@/components/GeneratedCodePanel";
import { ProjectAttachmentsPanel } from "@/components/ProjectAttachmentsPanel";
import { ProjectArtifactsPanel } from "@/components/ProjectArtifactsPanel";
import { getPublicProjectByShareToken } from "@/lib/server-store";

type SharedProjectPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharedProjectPage({ params }: SharedProjectPageProps) {
  const { token } = await params;
  const project = await getPublicProjectByShareToken(token);

  if (!project) {
    return (
      <main className="page-stack">
        <section className="empty-state">
          <p className="eyebrow">公开分享</p>
          <h2>这个分享链接已失效</h2>
          <p>项目可能已经切回私有，或者当前链接不再有效。你可以联系项目拥有者重新获取新的公开链接。</p>
          <Link className="button primary" href="/">
            返回首页
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-stack">
      <section className="details-header">
        <div>
          <p className="eyebrow">公开分享</p>
          <h1>{project.title}</h1>
          <p>{project.prompt}</p>
          <p className="muted">这是一个只读分享页。你可以查看结构、流程、参考素材和生成代码，但不能修改项目内容。</p>
        </div>

        <div className="detail-actions">
          <Link className="button secondary" href="/">
            返回首页
          </Link>
          <Link className="button secondary" href="/builder">
            打开生成台
          </Link>
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
