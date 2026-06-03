import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">AlphaPW</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Learn. Practice. Win.
            </div>
          </div>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-muted-foreground sm:flex">
          <Link to="/" className="hover:text-foreground" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>
            Batches
          </Link>
          <a href="https://api.pimaxer.in/v2/batches" target="_blank" rel="noreferrer" className="hover:text-foreground">
            API
          </a>
        </nav>
      </div>
    </header>
  );
}
