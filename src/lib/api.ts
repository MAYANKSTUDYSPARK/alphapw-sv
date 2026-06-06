import {
  pwBatches,
  pwBatchDetails,
  pwTodaysSchedule,
  pwTopics,
  pwContent,
  pwVideoUrl,
  pwDeltaLive,
  pwAllBatches,
} from "./pw.functions";

export interface ApiEnvelope<T> {
  success: boolean;
  timestamp?: number | string;
  data: T;
}

export const api = {
  batches: () => pwBatches() as Promise<ApiEnvelope<any>>,
  allBatches: () => pwAllBatches(),
  batchDetails: (batchId: string) =>
    pwBatchDetails({ data: { batchId } }) as Promise<ApiEnvelope<any>>,
  todaysSchedule: (batchId: string) =>
    pwTodaysSchedule({ data: { batchId } }) as Promise<ApiEnvelope<any>>,
  topics: (batchId: string, subjectId: string) =>
    pwTopics({ data: { batchId, subjectId } }) as Promise<ApiEnvelope<any>>,
  content: (
    batchId: string,
    subjectId: string,
    opts: { page?: number; contentType: "videos" | "notes" | "DppNotes" | "DppVideos"; tag?: string },
  ) =>
    pwContent({
      data: {
        batchId,
        subjectId,
        page: opts.page ?? 1,
        contentType: opts.contentType,
        tag: opts.tag,
      },
    }) as Promise<ApiEnvelope<any>>,
  videoUrl: (batchId: string, childId: string) =>
    pwVideoUrl({ data: { batchId, childId } }) as Promise<ApiEnvelope<any>>,
  liveLink: (batchId: string) => pwDeltaLive({ data: { batchId } }),
};
