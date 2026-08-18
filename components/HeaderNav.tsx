"use client";

import Link from "next/link";

const linkClass =
  "rounded-lg border border-border bg-transparent px-2.5 py-1 font-bold hover:bg-slate-100 hover:text-accent-dark";

export function HeaderNav() {
  return (
    <nav className="flex gap-4 text-sm text-muted">
      <Link
        href="/projects#nuevo"
        className={linkClass}
        onClick={(event) => {
          if (window.location.pathname !== "/projects") return;
          if (window.location.hash === "#nuevo") {
            event.preventDefault();
          }
          requestAnimationFrame(() => {
            document.getElementById("nuevo")?.focus();
          });
        }}
      >
        Nuevo
      </Link>
      <Link href="/projects" className={linkClass}>
        Ver listado
      </Link>
    </nav>
  );
}
