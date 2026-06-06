import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Upstream is kept server-side only — clients never see this URL.
const UPSTREAM = "https://api.pimaxer.in/v2";
const DELTA = "https://apiserver.deltastudy.site";
const DELTA_ALL = "https://deltastudy.site/allbatches.json";

async function proxy(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "User-Agent": "AlphaPWHub/1.0",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Upstream ${res.status}: ${text.slice(0, 160)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Upstream returned non-JSON response");
  }
}

const idSchema = z.string().min(8).max(64).regex(/^[a-zA-Z0-9]+$/);

export const pwBatches = createServerFn({ method: "GET" }).handler(async () =>
  proxy(`${UPSTREAM}/batches`),
);

export const pwBatchDetails = createServerFn({ method: "GET" })
  .inputValidator(z.object({ batchId: idSchema }))
  .handler(async ({ data }) => proxy(`${UPSTREAM}/batches/${data.batchId}/details`));

export const pwTodaysSchedule = createServerFn({ method: "GET" })
  .inputValidator(z.object({ batchId: idSchema }))
  .handler(async ({ data }) => proxy(`${UPSTREAM}/batches/${data.batchId}/todays-schedule`));

export const pwTopics = createServerFn({ method: "GET" })
  .inputValidator(z.object({ batchId: idSchema, subjectId: idSchema }))
  .handler(async ({ data }) =>
    proxy(`${UPSTREAM}/batches/${data.batchId}/subject/${data.subjectId}/topics`),
  );

export const pwContent = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      batchId: idSchema,
      subjectId: idSchema,
      page: z.number().int().min(1).max(500).default(1),
      contentType: z.enum(["videos", "notes", "DppNotes", "DppVideos"]),
      tag: z.string().max(64).regex(/^[a-zA-Z0-9]*$/).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const p = new URLSearchParams();
    p.set("page", String(data.page));
    p.set("contentType", data.contentType);
    if (data.tag) p.set("tag", data.tag);
    return proxy(
      `${UPSTREAM}/batches/${data.batchId}/subject/${data.subjectId}/content?${p}`,
    );
  });

export const pwVideoUrl = createServerFn({ method: "GET" })
  .inputValidator(z.object({ batchId: idSchema, childId: idSchema }))
  .handler(async ({ data }) =>
    proxy(
      `${UPSTREAM}/videos/video-url-details?batchId=${data.batchId}&parentId=${data.batchId}&childId=${data.childId}`,
    ),
  );

// Deltastudy live-link proxy. Returns { data: [{ url, ... }] } on success,
// or { data: [] } when not live. We expose graceful shape to the client.
export const pwDeltaLive = createServerFn({ method: "POST" })
  .inputValidator(z.object({ batchId: idSchema }))
  .handler(async ({ data }) => {
    try {
      const j = await proxy(`${DELTA}/api/pw/live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: data.batchId }),
      });
      return { ok: true as const, data: j?.data ?? [] };
    } catch (e) {
      return { ok: false as const, data: [], error: e instanceof Error ? e.message : "live failed" };
    }
  });

// Mega-list of 7000+ batches from deltastudy. Cached server-side per request.
export const pwAllBatches = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const j = await proxy(DELTA_ALL);
    const arr = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : [];
    return { ok: true as const, data: arr };
  } catch (e) {
    return { ok: false as const, data: [], error: e instanceof Error ? e.message : "all failed" };
  }
});
