import { Link } from "@tanstack/react-router";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-md ring-2 ring-primary/30">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
              <path d="M12 3L21 20H3L12 3Z" className="text-primary" />
              <path d="M12 9L16.5 17H7.5L12 9Z" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight">AlphaPW</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Learn · Practice · Win
            </div>
          </div>
        </Link>
        <nav className="hidden gap-6 text-sm font-semibold text-muted-foreground sm:flex">
          <Link to="/" className="hover:text-foreground" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>
            Batches
          </Link>
        </nav>
      </div>
    </header>
  );
}
