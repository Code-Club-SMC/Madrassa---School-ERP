import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  addWaitlistEntry,
  removeWaitlistEntry,
} from "@/lib/server/admission/interviews-service";
import { json, parseJsonBody } from "@/lib/server/super-admin";
import { errorResponse } from "@/lib/server/http";

const waitlistSchema = z.object({
  appId: z.string().min(1),
  rank: z.number().int().min(1),
  reason: z.string().min(1),
});

export const Route = createFileRoute("/api/admission/interviews/waitlist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, waitlistSchema);
        if (!body.ok) return body.response;

        try {
          const entry = await addWaitlistEntry(body.data.appId, body.data.rank, body.data.reason);
          return json({ entry }, 201);
        } catch (error) {
          return errorResponse(error, "Could not update waitlist");
        }
      },
      DELETE: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const appId = url.searchParams.get("appId");
          if (!appId) {
            return json({ error: "Missing appId parameter" }, 400);
          }
          const success = await removeWaitlistEntry(appId);
          return json({ success });
        } catch (error) {
          return errorResponse(error, "Could not remove from waitlist");
        }
      },
    },
  },
});

