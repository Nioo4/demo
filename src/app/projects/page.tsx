import { ProjectsExplorer } from "@/components/ProjectsExplorer";

export default function ProjectsPage() {
  return (
    <main className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">项目库</p>
        <h1>查看已经保存的项目记录</h1>
        <p>这里会显示历史生成结果，方便你重新打开、继续查看或回到生成台迭代。</p>
      </section>
      <ProjectsExplorer />
    </main>
  );
}
