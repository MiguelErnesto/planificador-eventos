import type { Metadata } from "next";
import { Source_Sans_3, Fraunces } from "next/font/google";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-display",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-brand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Planificador de Eventos, Tareas y Proyectos",
  description:
    "Gestión logística con dependencias visuales y camino crítico (CPM)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <header className="border-b border-border/80 bg-panel/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <a href="/" className="group">
              <p
                className="text-xl tracking-tight text-accent-dark sm:text-2xl"
                style={{ fontFamily: "var(--font-brand), serif" }}
              >
                Planificador de Eventos, Tareas y Proyectos
              </p>
              <p className="text-sm text-muted">Trace la ruta para su éxito...</p>
            </a>
            <nav className="flex gap-4 text-sm text-muted">
              <a href="/projects" className="hover:text-accent-dark">
                Proyectos
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
