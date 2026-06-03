import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, PlayCircle, FileText, ListChecks, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { ErrorState } from "@/components/Loaders";

type ContentType = "videos" | "notes" | "DppNotes" | "DppVideos";

const TABS: { key: ContentType; label: string; icon: typeof PlayCircle }[] = [
  { key: "videos", label: "Lectures", icon: PlayCircle },
  { key: "notes", label: "Notes", icon: FileText },
  { key: "DppNotes", label: "DPP Notes", icon: ListChecks },
  { key: "DppVideos", label: "DPP Videos", icon: PlayCircle },
];

export const Route = createFileRoute("/batch/$batchId/subject/$subjectId")({
  validateSearch: (s: Record<string, unknown>) => ({
    name: typeof s.name === "string" ? s.name : undefined,
    topic: typeof s.topic === "string" ? s.topic : undefined,
    type: (TABS.find((t) => t.key === s.type)?.key ?? "videos") as ContentType,
  }),
  head: ({ params }) => ({
    meta: [{ title: `Subject · AlphaPW`, name: "description", content: `Subject ${params.subjectId} contents.` }],
  }),
  component: SubjectPage,
});

function SubjectPage() {
  const { batchId, subjectId } = Route.useParams();
  const { name, topic, type } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [openTopics, setOpenTopics] = useState(true);

  const topics = useQuery({
    queryKey: ["topics", batchId, subjectId],
    queryFn: () => api.topics(batchId, subjectId),
  });
  const topicList: any[] = topics.data?.data ?? [];
  const activeTopic = topic ?? topicList[0]?._id;

  const content = useQuery({
    queryKey: ["content", batchId, subjectId, type, activeTopic],
    queryFn: () => api.content(batchId, subjectId, { contentType: type, tag: activeTopic }),
    enabled: !!activeTopic,
  });
  const items: any[] = content.data?.data ?? [];

  const setType = (t: ContentType) => navigate({ search: (p: any) => ({ ...p, type: t }), replace: true });
  const setTopic = (id: string) => navigate({ search: (p: any) => ({ ...p, topic: id }), replace: true });

  return (
    <div className="space-y-6">
      <Link
        to="/batch/$batchId"
        params={{ batchId }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to batch
      </Link>

      <header className="rounded-3xl border border-border bg-gradient-to-br from-card to-background p-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{name ?? "Subject"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {topicList.length} chapters · {(topics.data as any)?.paginate?.videosCount ?? 0} videos
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = type === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Topics */}
        <aside className="rounded-2xl border border-border bg-card lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <button
            onClick={() => setOpenTopics((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-sm font-bold lg:cursor-default"
          >
            Chapters
            <ChevronDown className={`h-4 w-4 transition lg:hidden ${openTopics ? "rotate-180" : ""}`} />
          </button>
          <div className={`px-2 pb-2 ${openTopics ? "block" : "hidden lg:block"}`}>
            {topics.isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-secondary" />
                ))}
              </div>
            ) : topicList.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground">No chapters yet.</div>
            ) : (
              topicList.map((t) => (
                <button
                  key={t._id}
                  onClick={() => setTopic(t._id)}
                  className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeTopic === t._id
                      ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <div className="line-clamp-2 font-medium">{t.name}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider opacity-70">
                    {t.videos ?? 0} videos · {t.notes ?? 0} notes
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Content */}
        <section>
          {content.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-card" />
              ))}
            </div>
          ) : content.error ? (
            <ErrorState error={content.error} />
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nothing here yet.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <ContentRow
                  key={it._id}
                  item={it}
                  type={type}
                  batchId={batchId}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ContentRow({ item, type, batchId }: { item: any; type: ContentType; batchId: string }) {
  if (type === "videos" || type === "DppVideos") {
    const title = item.topic ?? item.videoDetails?.name ?? "Lecture";
    const img = item.videoDetails?.image;
    const duration = item.videoDetails?.duration;
    return (
      <Link
        to="/watch/$batchId/$childId"
        params={{ batchId, childId: item._id }}
        search={{ title }}
        className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/60"
      >
        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-secondary">
          {img ? <img src={img} alt={title} className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
            <PlayCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-semibold">{title}</div>
          <div className="mt-1 flex gap-2 text-[11px] text-muted-foreground">
            {duration && <span>{duration}</span>}
            {item.date && <span>· {new Date(item.date).toLocaleDateString()}</span>}
          </div>
        </div>
        <PlayCircle className="h-6 w-6 text-primary opacity-0 transition group-hover:opacity-100" />
      </Link>
    );
  }

  // notes / DppNotes
  const hw = item.homeworkIds?.[0];
  const att = hw?.attachmentIds?.[0];
  const url = att ? `${att.baseUrl}${att.key}` : null;
  const title = hw?.topic ?? item.topic ?? "Notes";
  return (
    <a
      href={url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/60"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <FileText className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm font-semibold">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{att?.name ?? "Open document"}</div>
      </div>
      <span className="rounded-full border border-border px-3 py-1 text-xs">Open</span>
    </a>
  );
}
