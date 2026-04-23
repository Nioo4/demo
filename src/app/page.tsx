import Link from "next/link";

const evaluationItems = [
  "Real interaction through a prompt-to-preview workflow",
  "Persistence contract mapped directly to Supabase tables",
  "Agent-driven product, UX, code, and QA steps",
  "Dual generation modes: deterministic mock and real LLM"
];

export default function HomePage() {
  return (
    <main className="home-grid">
      <section className="hero-card">
        <p className="eyebrow">ROOT full-stack challenge prototype</p>
        <h1>Turn an app idea into a reviewable product blueprint.</h1>
        <p className="hero-copy">
          Atoms Lite is a compact AI-native builder demo. It simulates a team of agents that
          plan, design, code, and validate a small web application from a single prompt.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/builder">
            Open Builder
          </Link>
          <Link className="button secondary" href="/projects">
            View Projects
          </Link>
        </div>
      </section>

      <section className="mission-panel" aria-label="Demo fit">
        <div>
          <p className="eyebrow">Why this fits</p>
          <h2>Built for a 6-8 hour delivery window.</h2>
        </div>
        <ul className="check-list">
          {evaluationItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="pipeline-card">
        <p className="eyebrow">Agent pipeline</p>
        <div className="pipeline">
          {["Prompt", "Planner", "UX", "Code", "QA", "Preview"].map((step, index) => (
            <div className="pipeline-node" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
