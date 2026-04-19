export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border/70 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-5 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
        <p>
          <span className="font-serif text-foreground">PartyArena</span>
          <span className="mx-2 text-border">·</span>
          ControlConf 2026 After Party
        </p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
          A live AI control evaluation
        </p>
      </div>
    </footer>
  );
}
