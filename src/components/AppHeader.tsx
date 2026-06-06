import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Home, BookmarkCheck, Send, X } from "lucide-react";

export function AppHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white hover:bg-secondary"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
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
          </div>
          <a
            href="https://telegram.me/scholarversepro_network"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full bg-[#229ED9] px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-[#1c8bc1] sm:inline-flex"
          >
            <Send className="h-3.5 w-3.5" /> Join Channel
          </a>
        </div>
      </header>

      {/* Sidebar drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 h-full w-72 max-w-[85%] border-r border-border bg-white p-5 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="text-base font-extrabold">AlphaPW</div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1">
              <SideItem to="/" icon={<Home className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Home
              </SideItem>
              <SideItem to="/" icon={<BookmarkCheck className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Enrolled
              </SideItem>
              <a
                href="https://telegram.me/scholarversepro_network"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="mt-4 flex items-center gap-3 rounded-xl bg-[#229ED9] px-3.5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#1c8bc1]"
              >
                <Send className="h-4 w-4" /> Join Channel
              </a>
            </nav>
            <div className="mt-8 rounded-xl border border-dashed border-border p-3 text-[11px] text-muted-foreground">
              Unofficial PW client · Built for learners
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function SideItem({
  to,
  icon,
  onClick,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
      activeProps={{ className: "bg-primary/10 text-primary" }}
      activeOptions={{ exact: true }}
    >
      {icon}
      {children}
    </Link>
  );
}
