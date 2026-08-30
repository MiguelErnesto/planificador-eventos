"use client";

import Link from "next/link";

const linkClass =
  "rounded-lg border border-border bg-transparent px-3 py-2 font-bold hover:bg-slate-100 hover:text-accent-dark";

export function HeaderNav() {
  return (
    <nav className="flex shrink-0 gap-2 text-sm text-muted sm:gap-4">
      <Link
        href="/projects#nuevo"
        className={linkClass}
        onClick={(event) => {
          if (window.location.pathname !== "/projects") return;
          event.preventDefault();
          if (window.location.hash === "#nuevo") {
            window.dispatchEvent(new Event("open-nuevo"));
            requestAnimationFrame(() => {
              document.getElementById("nuevo")?.focus();
            });
            return;
          }
          window.location.hash = "nuevo";
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
