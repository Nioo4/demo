import type { GeneratedCode } from "@/lib/types";

type GeneratedCodePanelProps = {
  code: GeneratedCode | null;
};

export function GeneratedCodePanel({ code }: GeneratedCodePanelProps) {
  return (
    <section className="panel code-panel">
      <div className="panel-heading">
        <p className="eyebrow">代码产物</p>
        <h2>生成代码片段</h2>
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
        <p className="muted">Agent 完成后，这里会显示生成得到的组件片段与数据模型文件。</p>
      )}
    </section>
  );
}
