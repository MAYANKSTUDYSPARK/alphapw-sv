import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Upstream is kept server-side only — clients never see this URL.
const UPSTREAM = "https://api.pimaxer.in/v2";

async function proxy(path: string) {
  const res = await fetch(`${UPSTREAM}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "AlphaPWHub/1.0" },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Upstream ${res.status}: ${text.slice(0, 160)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Upstream returned non-JSON response");
  }
}

const idSchema = z.string().min(8).max(64).regex(/^[a-zA-Z0-9]+$/);

export const pwBatches = createServerFn({ method: "GET" }).handler(async () => proxy(`/batches`));

export const pwBatchDetails = createServerFn({ method: "GET" })
  .inputValidator(z.object({ batchId: idSchema }))
  .handler(async ({ data }) => proxy(`/batches/${data.batchId}/details`));

export const pwTodaysSchedule = createServerFn({ method: "GET" })
  .inputValidator(z.object({ batchId: idSchema }))
  .handler(async ({ data }) => proxy(`/batches/${data.batchId}/todays-schedule`));

export const pwTopics = createServerFn({ method: "GET" })
  .inputValidator(z.object({ batchId: idSchema, subjectId: idSchema }))
  .handler(async ({ data }) =>
    proxy(`/batches/${data.batchId}/subject/${data.subjectId}/topics`),
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
      `/batches/${data.batchId}/subject/${data.subjectId}/content?${p}`,
    );
  });

export const pwVideoUrl = createServerFn({ method: "GET" })
  .inputValidator(z.object({ batchId: idSchema, childId: idSchema }))
  .handler(async ({ data }) =>
    proxy(
      `/videos/video-url-details?batchId=${data.batchId}&parentId=${data.batchId}&childId=${data.childId}`,
    ),
  );
