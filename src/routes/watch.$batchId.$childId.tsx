import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { ChevronLeft, Radio, Clock4, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { PageLoader, ErrorState } from "@/components/Loaders";

export const Route = createFileRoute("/watch/$batchId/$childId")({
  validateSearch: (s: Record<string, unknown>) => ({
    title: typeof s.title === "string" ? s.title : undefined,
    live: s.live === 1 || s.live === "1" ? 1 : 0,
  }),
  head: ({ params }) => ({
    meta: [{ title: `Watch · AlphaPW`, name: "description", content: `Lecture ${params.childId}` }],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { batchId, childId } = Route.useParams();
  const { title, live } = Route.useSearch();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["video", batchId, childId],
    queryFn: () => api.videoUrl(batchId, childId),
    retry: 1,
  });

  // Try multiple possible shapes from upstream
  const d: any = data?.data ?? {};
  const hlsUrl: string | undefined =
    d?.hls?.url ?? d?.videoDetails?.hls_url ?? d?.videoUrl ?? undefined;
  const dashUrl: string | undefined = d?.dash?.url;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      return;
    }
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: !!live });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
  }, [hlsUrl, live]);

  // Friendlier error: upstream returns 500 with "Payment required" when class
  // hasn't gone live yet or requires a purchase.
  const errMsg = error instanceof Error ? error.message : "";
  const isPaywall = /Payment|402|500/.test(errMsg);

  return (
    <div className="space-y-5">
      <Link
        to="/batch/$batchId"
        params={{ batchId }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to batch
      </Link>

      {/* Player frame */}
      <div className="overflow-hidden rounded-3xl border border-border bg-black shadow-2xl">
        <div className="relative aspect-video w-full bg-black">
          {isLoading ? (
            <div className="absolute inset-0 grid place-items-center text-white/70">
              <PageLoader label="Connecting to stream…" />
            </div>
          ) : error || !hlsUrl ? (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="max-w-sm space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
                  {isPaywall ? <Clock4 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
                </div>
                <div className="text-base font-bold text-white">
                  {isPaywall ? "Lecture is not live yet" : "Stream unavailable"}
                </div>
                <p className="text-xs text-white/60">
                  {isPaywall
                    ? "The class hasn't started, or it requires a purchase. Try again at the scheduled time."
                    : "We couldn't load this stream. It may be DRM protected or temporarily down."}
                </p>
                <button
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition hover:bg-white/90 disabled:opacity-60"
                >
                  {isRefetching ? "Checking…" : "Try again"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                controls
                autoPlay
                playsInline
                className="h-full w-full bg-black"
              />
              {live ? (
                <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                  <Radio className="h-3 w-3 animate-pulse" /> Live
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-xl font-extrabold md:text-2xl">{title ?? "Lecture"}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          AlphaPW Player · {live ? "Live HLS broadcast" : "HLS stream"}
        </p>
      </div>

      {dashUrl && (
        <details className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-semibold text-foreground">Stream debug info</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all">
            HLS: {hlsUrl}
            {"\n\n"}
            DASH: {dashUrl}
            {d?.dash?.drmDetails ? `\n\nDRM: ${d.dash.drmDetails}` : ""}
          </pre>
        </details>
      )}
    </div>
  );
}
