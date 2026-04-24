import Link from "next/link";

type AuthRequiredProps = {
  title: string;
  description: string;
  nextPath?: string;
};

export function AuthRequired({ title, description, nextPath = "/builder" }: AuthRequiredProps) {
  return (
    <section className="empty-state auth-required">
      <p className="eyebrow">需要登录</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="hero-actions">
        <Link className="button primary" href={{ pathname: "/auth", query: { next: nextPath } }}>
          登录或注册
        </Link>
      </div>
    </section>
  );
}
