import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSiteSettings } from "@/lib/queries";
import { APP_TITLE, APP_TAGLINE } from "@/lib/branding";
import { HeaderNav } from "@/components/HeaderNav";

const sans = Source_Sans_3({
  variable: "--font-display",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-brand",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_TAGLINE,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { title, tagline } = await getSiteSettings();
  return (
    <html lang="es">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <header className="border-b border-border/80 bg-panel/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Link href="/" className="group min-w-0">
              <p
                className="truncate text-xl tracking-tight text-accent-dark sm:text-2xl"
                style={{ fontFamily: "var(--font-brand), serif" }}
              >
                {title}
              </p>
              <p className="truncate text-sm text-muted sm:text-base">{tagline}</p>
            </Link>
            <HeaderNav />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
