"use client";

import Link from "next/link";
import { btn } from "@/lib/button-styles";

export function HeaderNav() {
  return (
    <nav className="flex shrink-0 gap-2 text-sm sm:gap-4">
      <Link
        href="/projects#nuevo"
        className={`${btn.primary} ${btn.md} font-bold`}
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
      <Link href="/projects" className={`${btn.secondary} ${btn.md} font-bold`}>
        Ver listado
      </Link>
    </nav>
  );
}
