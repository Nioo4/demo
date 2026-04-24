import Link from "next/link";

const featureItems = [
  "输入一句产品需求，生成应用方案、页面结构和执行路径",
  "上传图片和文档，让本次生成更贴近真实上下文",
  "查看 Agent 时间线、页面预览、代码片段和分享状态"
];

const guideItems = [
  "先进入生成台，描述目标用户、核心流程和想要的页面效果。",
  "如果你已经有文档或视觉参考，可以在生成前一起上传。",
  "生成完成后，查看预览、代码和分享设置，再决定是否公开。"
];

export default function HomePage() {
  return (
    <main className="page-stack">
      <section className="hero-card hero-card-compact">
        <p className="eyebrow">应用介绍</p>
        <h1>一个用于生成应用方案的中文 AI 工作台。</h1>
        <p className="hero-copy">
          你可以像和 ChatGPT 对话一样输入需求，再把文档和图片素材一起交给系统，在同一个工作区里查看生成过程、页面草图、代码片段和项目记录。
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/builder">
            打开生成台
          </Link>
          <Link className="button secondary" href="/projects">
            打开项目库
          </Link>
        </div>
      </section>

      <section className="home-grid">
        <section className="mission-panel" aria-label="Feature summary">
          <div>
            <p className="eyebrow">能做什么</p>
            <h2>核心功能</h2>
          </div>
          <ul className="check-list">
            {featureItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mission-panel" aria-label="Usage guide">
          <div>
            <p className="eyebrow">怎么使用</p>
            <h2>三步上手</h2>
          </div>
          <ul className="check-list">
            {guideItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
