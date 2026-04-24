import type { GenerationProject } from "@/lib/types";

type AppPreviewProps = {
  project: GenerationProject | null;
};

export function AppPreview({ project }: AppPreviewProps) {
  if (!project) {
    return (
      <section className="panel preview-panel empty-preview">
        <p className="eyebrow">应用预览</p>
        <h2>还没有生成结果</h2>
        <p>提交一段产品需求后，这里会展示页面草图、数据结构和下一步扩展建议。</p>
      </section>
    );
  }

  return (
    <section className="panel preview-panel">
      <div className="panel-heading">
        <p className="eyebrow">应用草图</p>
        <h2>生成结果预览</h2>
      </div>

      <div className="preview-hero">
        <p className="eyebrow">{project.blueprint.audience}</p>
        <h2>{project.title}</h2>
        <p>{project.blueprint.valueProposition}</p>
      </div>

      <div className="screen-grid">
        {project.blueprint.screens.map((screen) => (
          <article className="screen-card" key={screen.name}>
            <span className="screen-dot" />
            <h3>{screen.name}</h3>
            <p>{screen.purpose}</p>
            <div className="chip-row">
              {screen.interactions.map((interaction) => (
                <span className="chip" key={interaction}>
                  {interaction}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="model-strip">
        {project.blueprint.dataModel.map((model) => (
          <article key={model.entity}>
            <strong>{model.entity}</strong>
            <span>{model.fields.join(" / ")}</span>
          </article>
        ))}
      </div>

      <ul className="extension-list">
        {project.blueprint.extensionIdeas.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
    </section>
  );
}
