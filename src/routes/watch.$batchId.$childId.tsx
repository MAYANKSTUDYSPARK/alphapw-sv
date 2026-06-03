import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import { PageLoader, ErrorState } from "@/components/Loaders";

export const Route = createFileRoute("/watch/$batchId/$childId")({
  validateSearch: (s: Record<string, unknown>) => ({
    title: typeof s.title === "string" ? s.title : undefined,
  }),
  head: ({ params }) => ({
    meta: [{ title: `Watch · AlphaPW`, name: "description", content: `Lecture ${params.childId}` }],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { batchId, childId } = Route.useParams();
  const { title } = Route.useSearch();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["video", batchId, childId],
    queryFn: () => api.videoUrl(batchId, childId),
  });

  const hlsUrl: string | undefined = data?.data?.hls?.url;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
  }, [hlsUrl]);

  return (
    <div className="space-y-5">
      <Link
        to="/batch/$batchId"
        params={{ batchId }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to batch
      </Link>

      {isLoading ? (
        <PageLoader label="Fetching stream…" />
      ) : error ? (
        <ErrorState error={error} />
      ) : !hlsUrl ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
          Stream unavailable. This lecture may require a purchase or DRM playback.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-black shadow-2xl">
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            className="aspect-video w-full bg-black"
          />
        </div>
      )}

      <div>
        <h1 className="text-xl font-extrabold md:text-2xl">{title ?? "Lecture"}</h1>
        <p className="mt-1 text-xs text-muted-foreground">AlphaPW Player · HLS stream</p>
      </div>

      {data?.data?.dash?.url && (
        <details className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-semibold text-foreground">Stream debug info</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all">
            HLS: {data.data.hls?.url}
            {"\n\n"}
            DASH: {data.data.dash?.url}
            {data.data.dash?.drmDetails ? `\n\nDRM: ${data.data.dash.drmDetails}` : ""}
          </pre>
        </details>
      )}
    </div>
  );
}
