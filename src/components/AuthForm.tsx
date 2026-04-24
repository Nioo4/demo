"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

type AuthFormProps = {
  nextPath: string;
};

export function AuthForm({ nextPath }: AuthFormProps) {
  const router = useRouter();
  const { isConfigured, isLoading, user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(nextPath as never);
      router.refresh();
    }
  }, [isLoading, nextPath, router, user]);

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setMessage(null);
    setIsSubmitting(true);

    const action = mode === "signin" ? signIn : signUp;
    const result = await action(email.trim(), password);

    setIsSubmitting(false);

    if (result) {
      setMessage(result);
      return;
    }

    setMessage(mode === "signin" ? "登录成功，正在跳转。" : "注册成功，正在跳转。");
  }

  return (
    <section className="auth-card">
      <div className="panel-heading">
        <p className="eyebrow">账号</p>
        <h1>{mode === "signin" ? "登录后查看自己的项目" : "注册账号并保存你的项目"}</h1>
        <p className="muted">
          登录后，项目列表、详情页和生成结果都会只归属于当前账号，不再和其他人混在一起。
        </p>
      </div>

      <div className="auth-switch">
        <button
          className={`auth-switch-button ${mode === "signin" ? "active" : ""}`}
          onClick={() => setMode("signin")}
          type="button"
        >
          登录
        </button>
        <button
          className={`auth-switch-button ${mode === "signup" ? "active" : ""}`}
          onClick={() => setMode("signup")}
          type="button"
        >
          注册
        </button>
      </div>

      {!isConfigured ? (
        <p className="error-text">未配置 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，当前无法使用浏览器端登录。</p>
      ) : (
        <div className="auth-form">
          <label className="auth-label">
            <span>邮箱</span>
            <input
              autoComplete="email"
              className="auth-input"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>

          <label className="auth-label">
            <span>密码</span>
            <input
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="auth-input"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位"
              type="password"
              value={password}
            />
          </label>

          {message ? <p className={message.includes("成功") ? "muted" : "error-text"}>{message}</p> : null}

          <button className="button primary auth-submit" disabled={isSubmitting || isLoading} onClick={handleSubmit} type="button">
            {isSubmitting ? "提交中..." : mode === "signin" ? "登录并进入工作台" : "注册并进入工作台"}
          </button>
        </div>
      )}
    </section>
  );
}
