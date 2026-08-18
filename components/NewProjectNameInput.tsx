"use client";

import { useEffect, useRef } from "react";

export function NewProjectNameInput() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const maybeFocus = () => {
      if (window.location.hash === "#nuevo") ref.current?.focus();
    };
    maybeFocus();
    window.addEventListener("hashchange", maybeFocus);
    return () => window.removeEventListener("hashchange", maybeFocus);
  }, []);

  return (
    <input
      ref={ref}
      id="nuevo"
      name="name"
      required
      placeholder="Nombre del evento, tarea o proyecto..."
      className="rounded-lg border border-border px-3 py-1.5 outline-none ring-accent placeholder:text-[11px] placeholder:italic focus:ring-2"
    />
  );
}
