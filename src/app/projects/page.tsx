import { ProjectsExplorer } from "@/components/ProjectsExplorer";

export default function ProjectsPage() {
  return (
    <main className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">Saved output</p>
        <h1>Generated project history</h1>
        <p>
          This page reads persisted projects from the API and lets you reopen each run for review.
        </p>
      </section>
      <ProjectsExplorer />
    </main>
  );
}
