import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import Hls from "hls.js";
import { ChevronLeft, Radio, Clock4, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/Loaders";

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

  // For LIVE we first try the deltastudy live link proxy (no DRM, plain HLS).
  const liveQ = useQuery({
    queryKey: ["live-link", batchId],
    queryFn: () => api.liveLink(batchId),
    enabled: !!live,
    refetchInterval: live ? 30_000 : false,
    retry: 0,
  });

  // Fallback: upstream pimaxer video-url-details
  const videoQ = useQuery({
    queryKey: ["video", batchId, childId],
    queryFn: () => api.videoUrl(batchId, childId),
    retry: 1,
  });

  const liveHls: string | undefined = useMemo(() => {
    const arr = liveQ.data?.data ?? [];
    const first = arr?.[0];
    return first?.url ?? first?.hls_url ?? first?.videoUrl ?? undefined;
  }, [liveQ.data]);

  const d: any = videoQ.data?.data ?? {};
  const fallbackHls: string | undefined =
    d?.hls?.url ?? d?.videoDetails?.hls_url ?? d?.videoUrl ?? undefined;
  const dashUrl: string | undefined = d?.dash?.url;

  const hlsUrl = liveHls ?? fallbackHls;
  const isLoading = (live && liveQ.isLoading) || videoQ.isLoading;
  const noStream = !hlsUrl && !isLoading;

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

  const retry = () => {
    if (live) liveQ.refetch();
    videoQ.refetch();
  };

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
          ) : noStream ? (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="max-w-sm space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
                  {live ? <Clock4 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
                </div>
                <div className="text-base font-bold text-white">
                  {live ? "Lecture is not live yet" : "Stream unavailable"}
                </div>
                <p className="text-xs text-white/60">
                  {live
                    ? "Live link not active right now. We'll keep checking — try again in a few minutes."
                    : "Couldn't load this lecture. It may be DRM protected or temporarily unavailable."}
                </p>
                <button
                  onClick={retry}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition hover:bg-white/90"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Try again
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
          AlphaPW Player · {live ? "Low-latency live HLS" : "HLS playback"}
          {liveHls ? " · via DeltaStudy live" : ""}
        </p>
      </div>

      {(hlsUrl || dashUrl) && (
        <details className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-semibold text-foreground">Stream debug</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all">
            HLS: {hlsUrl ?? "(none)"}
            {dashUrl ? `\n\nDASH: ${dashUrl}` : ""}
            {d?.dash?.drmDetails ? `\n\nDRM: ${d.dash.drmDetails}` : ""}
          </pre>
        </details>
      )}
    </div>
  );
}
