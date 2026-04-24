"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

const navItems = [
  {
    href: "/" as Route,
    label: "总览",
    description: "了解应用功能与入口"
  },
  {
    href: "/builder" as Route,
    label: "生成台",
    description: "输入需求并实时生成结果"
  },
  {
    href: "/projects" as Route,
    label: "项目库",
    description: "浏览已保存的项目记录"
  }
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <Link className="sidebar-brand" href="/">
          <span className="brand-badge">A</span>
          <div>
            <strong>Atoms Lite</strong>
            <p>中文 AI 工作台</p>
          </div>
        </Link>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-caption">工作区导航</p>
        <nav className="sidebar-nav" aria-label="主导航">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link className={`sidebar-link ${isActive ? "active" : ""}`} href={item.href} key={item.href}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <p className="sidebar-caption">账号状态</p>
        {isLoading ? (
          <p>正在读取登录状态...</p>
        ) : user ? (
          <>
            <h2>已登录</h2>
            <p className="sidebar-user-email" title={user.email ?? "已登录用户"}>
              {user.email ?? "已登录用户"}
            </p>
            <p>现在生成和保存的项目只会归属于当前账号。</p>
            <button className="button secondary sidebar-action" onClick={handleSignOut} type="button">
              退出登录
            </button>
          </>
        ) : (
          <>
            <h2>登录后保存你的项目</h2>
            <p>未登录时无法查看自己的项目记录，也不能把生成结果绑定到个人账号。</p>
            <Link className="button primary sidebar-action" href={{ pathname: "/auth", query: { next: "/builder" } }}>
              登录 / 注册
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
