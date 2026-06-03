import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ArrowRight, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { PageLoader, ErrorState, SkeletonCard } from "@/components/Loaders";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlphaPW — All Batches" },
      { name: "description", content: "Browse all PW batches across exams and cohorts." },
    ],
  }),
  component: BatchesIndex,
});

interface Batch {
  id: string;
  name: string;
  pngUrl?: string;
  cohort?: string;
  medium?: string;
  exam?: string;
  startsOn?: string;
}

function BatchesIndex() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["batches"],
    queryFn: () => api.batches(),
  });
  const [q, setQ] = useState("");
  const [exam, setExam] = useState<string>("All");

  const batches: Batch[] = data?.data ?? [];
  const exams = useMemo(() => ["All", ...Array.from(new Set(batches.map((b) => b.exam).filter(Boolean) as string[]))], [batches]);
  const filtered = useMemo(
    () =>
      batches.filter(
        (b) =>
          (exam === "All" || b.exam === exam) &&
          b.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [batches, q, exam],
  );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-card to-brand/10 p-8 md:p-12">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
            <BookOpen className="h-3.5 w-3.5" /> AlphaPW · Padhai ka naya tareeka
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Saari PW batches.<br />Ek hi jagah, bina jhanjhat.
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Apni batch chuno, subject kholo, lectures dekho aur DPP/Notes turant download karo — sab kuch fast, clean aur free.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-background/40 px-3 py-1">⚡ Instant HLS playback</span>
            <span className="rounded-full border border-border bg-background/40 px-3 py-1">📒 Notes + DPP</span>
            <span className="rounded-full border border-border bg-background/40 px-3 py-1">📅 Today's schedule</span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search batches…"
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {exams.slice(0, 8).map((e) => (
            <button
              key={e}
              onClick={() => setExam(e)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                exam === e
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <Link
              key={b.id}
              to="/batch/$batchId"
              params={{ batchId: b.id }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_10px_40px_-10px_oklch(0.62_0.22_295/0.5)]"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                {b.pngUrl ? (
                  <img src={b.pngUrl} alt={b.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                )}
                {b.exam && (
                  <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                    {b.exam}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug">{b.name}</h3>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{[b.cohort, b.medium].filter(Boolean).join(" · ")}</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No batches match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
