import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Calendar,
  Layers,
  ArrowRight,
  PlayCircle,
  Radio,
  Clock,
  Lock,
} from "lucide-react";
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

interface SchedItem {
  _id: string;
  topic: string;
  thumb: string;
  subject?: string;
  scheduleCode?: string;
  tag?: string;
  lectureType?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  isLive: boolean;
  isUpcoming: boolean;
  isEnded: boolean;
  duration?: string;
}

function normalizeSched(raw: any, nowMs: number): SchedItem {
  const d = raw?.data ?? raw ?? {};
  const start = d.startTime ? new Date(d.startTime).getTime() : 0;
  const end = d.endTime ? new Date(d.endTime).getTime() : 0;
  const tag = d.tag ?? "";
  const status = d.status ?? "";
  const lectureType = d.lectureType ?? "";
  // A class is "live" if:
  //  - upstream marks tag/status LIVE, OR
  //  - it's a LIVE lecture and now is inside the time window
  const tagLive = /live/i.test(tag) || /live/i.test(status);
  const inWindow = start > 0 && end > 0 && nowMs >= start && nowMs <= end;
  const isLive = tagLive || (lectureType === "LIVE" && inWindow);
  const isUpcoming = !isLive && start > nowMs;
  const isEnded = !isLive && end > 0 && end < nowMs && lectureType === "LIVE";
  return {
    _id: d._id ?? raw?._id,
    topic: d.topic ?? d.name ?? "Class",
    thumb:
      d.previewImageUrlMWeb ||
      d.previewImageUrl ||
      d.videoDetails?.image ||
      "",
    subject: d.subjectId?.name ?? d.subjectName,
    scheduleCode: d.scheduleCode,
    tag,
    lectureType,
    startTime: d.startTime,
    endTime: d.endTime,
    status,
    isLive,
    isUpcoming,
    isEnded,
    duration: d.videoDetails?.duration,
  };
}

function BatchPage() {
  const { batchId } = Route.useParams();
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const details = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => api.batchDetails(batchId),
    retry: 1,
  });
  const schedule = useQuery({
    queryKey: ["schedule", batchId],
    queryFn: () => api.todaysSchedule(batchId),
    retry: 1,
    refetchInterval: 60_000,
  });

  const b = details.data?.data;
  const subjects: any[] = b?.subjects ?? [];

  // Upstream double-wraps: { data: { data: [...] } }
  const rawSched: any = schedule.data?.data;
  const rawList: any[] = Array.isArray(rawSched)
    ? rawSched
    : Array.isArray(rawSched?.data)
      ? rawSched.data
      : [];
  const scheduleItems: SchedItem[] = rawList.map((r) => normalizeSched(r, nowMs));
  scheduleItems.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return (new Date(a.startTime ?? 0).getTime()) - (new Date(b.startTime ?? 0).getTime());
  });
  const liveCount = scheduleItems.filter((s) => s.isLive).length;

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
          {liveCount > 0 && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              {liveCount} LIVE
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
            {scheduleItems.map((s) => (
              <ScheduleCard key={s._id} item={s} batchId={batchId} />
            ))}
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

function ScheduleCard({ item, batchId }: { item: SchedItem; batchId: string }) {
  const time = item.startTime
    ? new Date(item.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  // Only LIVE classes are clickable. Recorded lectures also playable.
  const clickable = item.isLive || item.lectureType === "RECORDED";

  const Inner = (
    <>
      <div className="relative aspect-video h-24 shrink-0 overflow-hidden rounded-xl bg-secondary">
        {item.thumb ? (
          <img
            src={item.thumb}
            alt={item.topic}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary text-primary">
            <PlayCircle className="h-9 w-9" />
          </div>
        )}
        {item.isLive && (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-lg">
            <Radio className="h-2.5 w-2.5 animate-pulse" /> Live
          </span>
        )}
        {item.isEnded && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Ended
          </span>
        )}
        {clickable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <PlayCircle className="h-10 w-10 text-white" />
          </div>
        )}
        {!clickable && !item.isLive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Lock className="h-5 w-5 text-white/80" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
          {item.subject && <span className="truncate text-primary">{item.subject}</span>}
          {item.scheduleCode && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">
              {item.scheduleCode}
            </span>
          )}
        </div>
        <div className="mt-1 line-clamp-2 text-sm font-bold leading-snug">{item.topic}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {time}
            </span>
          )}
          {item.duration && <span>· {item.duration}</span>}
          {!item.isLive && item.tag && (
            <span className="rounded-full bg-secondary px-2 py-0.5">{item.tag}</span>
          )}
          {item.lectureType && (
            <span className="rounded-full border border-border px-2 py-0.5">
              {item.lectureType}
            </span>
          )}
        </div>
        {!clickable && (
          <div className="mt-1.5 text-[10px] font-semibold text-amber-500">
            Lecture is not live yet
          </div>
        )}
      </div>
    </>
  );

  const baseCls = `group flex gap-3 overflow-hidden rounded-2xl border bg-card p-3 transition ${
    item.isLive
      ? "border-red-500/50 ring-1 ring-red-500/30 shadow-lg shadow-red-500/10"
      : "border-border"
  }`;

  if (clickable) {
    return (
      <Link
        to="/watch/$batchId/$childId"
        params={{ batchId, childId: item._id }}
        search={{ title: item.topic, live: item.isLive ? 1 : 0 }}
        className={`${baseCls} hover:-translate-y-0.5 hover:border-primary/60`}
      >
        {Inner}
      </Link>
    );
  }
  return (
    <div className={`${baseCls} cursor-not-allowed opacity-75`} title="Lecture is not live yet">
      {Inner}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border bg-background/40 px-2.5 py-1">{children}</span>;
}
