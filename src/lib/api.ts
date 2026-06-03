const BASE = "https://api.pimaxer.in/v2";

async function get<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export interface ApiEnvelope<T> {
  success: boolean;
  timstamp?: number;
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
