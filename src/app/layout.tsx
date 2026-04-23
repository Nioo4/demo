import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Atoms Lite Demo",
  description: "A focused AI agent app builder prototype."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="brand-mark">A</span>
              <span>Atoms Lite</span>
            </Link>
            <nav className="nav-links" aria-label="Primary navigation">
              <Link href="/builder">Builder</Link>
              <Link href="/projects">Projects</Link>
              <a href="https://atoms.dev/" target="_blank" rel="noreferrer">
                Atoms
              </a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
