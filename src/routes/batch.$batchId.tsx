import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Calendar, Layers, ArrowRight, PlayCircle, Radio, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { ErrorState, SkeletonCard } from "@/components/Loaders";

export const Route = createFileRoute("/batch/$batchId")({
  head: ({ params }) => ({
    meta: [
      { title: `Batch · AlphaPW` },
      { name: "description", content: `Subjects and today's schedule for batch ${params.batchId}.` },
    ],
  }),
  component: BatchPage,
});

function BatchPage() {
  const { batchId } = Route.useParams();
  const details = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => api.batchDetails(batchId),
    retry: 1,
  });
  const schedule = useQuery({
    queryKey: ["schedule", batchId],
    queryFn: () => api.todaysSchedule(batchId),
    retry: 1,
  });

  const b = details.data?.data;
  const subjects: any[] = b?.subjects ?? [];
  const rawSched = schedule.data?.data;
  const scheduleItems: any[] = Array.isArray(rawSched)
    ? rawSched
    : Array.isArray((rawSched as any)?.data)
      ? (rawSched as any).data
      : [];

  return (
    <div className="space-y-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> All batches
      </Link>

      {details.isLoading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-card" />
      ) : details.error ? (
        <ErrorState error={details.error} />
      ) : (
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-background p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              {b?.exam && (
                <span className="inline-block rounded-full bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
                  {b.exam}
                </span>
              )}
              <h1 className="mt-3 text-2xl font-extrabold leading-tight md:text-3xl">{b?.name}</h1>
              {b?.byName && <p className="mt-1 text-sm text-muted-foreground">{b.byName}</p>}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {b?.class && <Tag>Class {b.class}</Tag>}
                {b?.language && <Tag>{b.language}</Tag>}
                {b?.startDate && <Tag>Starts {new Date(b.startDate).toLocaleDateString()}</Tag>}
                <Tag><Layers className="mr-1 inline h-3 w-3" />{subjects.length} subjects</Tag>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Schedule */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Calendar className="h-5 w-5 text-primary" /> Today's Schedule
          {scheduleItems.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {scheduleItems.length}
            </span>
          )}
        </h2>
        {schedule.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-28 animate-pulse rounded-2xl bg-card" />
            <div className="h-28 animate-pulse rounded-2xl bg-card" />
          </div>
        ) : schedule.error ? (
          <ErrorState error={schedule.error} />
        ) : scheduleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No classes scheduled today.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {scheduleItems.map((s: any, i: number) => {
              const d = s?.data ?? s ?? {};
              const title = d.topic ?? d.name ?? s.topic ?? "Class";
              const thumb = d.previewImageUrlMWeb || d.previewImageUrl || "";
              const subject = d.subjectId?.name ?? d.subjectName;
              const tag = d.tag ?? (s.type === "LECTURE" ? "Lecture" : s.type);
              const isLive = (d.status === "LIVE") || (tag && /live/i.test(tag));
              const time = d.startTime
                ? new Date(d.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : null;
              const lecCode = d.scheduleCode;
              const childId = d._id ?? s._id;
              return (
                <Link
                  key={childId ?? i}
                  to="/watch/$batchId/$childId"
                  params={{ batchId, childId }}
                  search={{ title }}
                  className="group flex gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-primary/60"
                >
                  <div className="relative aspect-video h-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {thumb ? (
                      <img src={thumb} alt={title} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <PlayCircle className="h-7 w-7" />
                      </div>
                    )}
                    {isLive && (
                      <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        <Radio className="h-2.5 w-2.5 animate-pulse" /> Live
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {subject && <span className="truncate text-primary">{subject}</span>}
                      {lecCode && <span className="rounded bg-secondary px-1.5 py-0.5">{lecCode}</span>}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug">{title}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {time}
                        </span>
                      )}
                      {tag && !isLive && (
                        <span className="rounded-full bg-secondary px-2 py-0.5">{tag}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Subjects */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Layers className="h-5 w-5 text-primary" /> Subjects
        </h2>
        {details.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {subjects.map((s) => {
              const img = s.imageId ? `${s.imageId.baseUrl}${s.imageId.key}` : null;
              return (
                <Link
                  key={s._id}
                  to="/batch/$batchId/subject/$subjectId"
                  params={{ batchId, subjectId: s._id }}
                  search={{ name: s.subject }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                      {img ? <img src={img} alt={s.subject} className="h-full w-full object-cover" /> : <Layers className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{s.subject}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {s.lectureCount ?? 0} lectures
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border bg-background/40 px-2.5 py-1">{children}</span>;
}
