const BASE = "https://api.pimaxer.in/v2";

// Tiny in-flight dedupe + small concurrency limiter to avoid 403 rate limits
const inflight = new Map<string, Promise<any>>();
let active = 0;
const queue: Array<() => void> = [];
const MAX = 4;

function take() {
  return new Promise<void>((resolve) => {
    const run = () => {
      active++;
      resolve();
    };
    if (active < MAX) run();
    else queue.push(run);
  });
}
function release() {
  active--;
  const next = queue.shift();
  if (next) next();
}

async function fetchWithRetry(url: string, attempt = 0): Promise<Response> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if ((res.status === 403 || res.status === 429 || res.status >= 500) && attempt < 3) {
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1) + Math.random() * 200));
    return fetchWithRetry(url, attempt + 1);
  }
  return res;
}

async function get<T = any>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  if (inflight.has(url)) return inflight.get(url)!;
  const p = (async () => {
    await take();
    try {
      const res = await fetchWithRetry(url);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Request failed (${res.status}). ${text.slice(0, 120)}`);
      }
      return (await res.json()) as T;
    } catch (e: any) {
      if (e?.message === "Failed to fetch") {
        throw new Error("Network unreachable — check your connection and try again.");
      }
      throw e;
    } finally {
      release();
      setTimeout(() => inflight.delete(url), 0);
    }
  })();
  inflight.set(url, p);
  return p;
}

export interface ApiEnvelope<T> {
  success: boolean;
  timestamp?: number | string;
  data: T;
}

export const api = {
  batches: () => get<ApiEnvelope<any>>(`/batches`),
  batchDetails: (batchId: string) =>
    get<ApiEnvelope<any>>(`/batches/${encodeURIComponent(batchId)}/details`),
  topics: (batchId: string, subjectId: string) =>
    get<ApiEnvelope<any>>(
      `/batches/${encodeURIComponent(batchId)}/subject/${encodeURIComponent(subjectId)}/topics`,
    ),
  content: (
    batchId: string,
    subjectId: string,
    opts: { page?: number; contentType: string; tag?: string },
  ) => {
    const params = new URLSearchParams();
    params.set("page", String(opts.page ?? 1));
    params.set("contentType", opts.contentType);
    if (opts.tag) params.set("tag", opts.tag);
    return get<ApiEnvelope<any>>(
      `/batches/${encodeURIComponent(batchId)}/subject/${encodeURIComponent(subjectId)}/content?${params}`,
    );
  },
  todaysSchedule: (batchId: string) =>
    get<ApiEnvelope<any>>(
      `/batches/${encodeURIComponent(batchId)}/todays-schedule`,
    ),
  videoUrl: (batchId: string, childId: string) =>
    get<ApiEnvelope<any>>(
      `/videos/video-url-details?batchId=${encodeURIComponent(batchId)}&parentId=${encodeURIComponent(batchId)}&childId=${encodeURIComponent(childId)}`,
    ),
};
