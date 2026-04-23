import type { GeneratedCode } from "@/lib/types";

type GeneratedCodePanelProps = {
  code: GeneratedCode | null;
};

export function GeneratedCodePanel({ code }: GeneratedCodePanelProps) {
  return (
    <section className="panel code-panel">
      <div className="panel-heading">
        <p className="eyebrow">Artifact</p>
        <h2>Generated code</h2>
      </div>
      {code ? (
        <div className="code-stack">
          {code.files.map((file) => (
            <article className="code-file" key={file.path}>
              <div>
                <strong>{file.path}</strong>
                <span>{file.language}</span>
              </div>
              <pre>
                <code>{file.content}</code>
              </pre>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">Generated component snippets will appear after the agents finish.</p>
      )}
    </section>
  );
}
