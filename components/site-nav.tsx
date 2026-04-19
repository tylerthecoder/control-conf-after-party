"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/play", label: "Play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-baseline gap-2"
          aria-label="The Eval — home"
        >
          <span className="font-serif text-xl tracking-tight text-foreground transition-colors group-hover:text-brand">
            The&nbsp;Eval
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            ControlConf 2026
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "text-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {active && (
                  <span className="ml-1.5 inline-block h-1 w-1 rounded-full bg-brand align-middle" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
