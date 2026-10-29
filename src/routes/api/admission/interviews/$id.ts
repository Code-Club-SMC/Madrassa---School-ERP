import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  updateSlot,
  deleteSlot,
} from "@/lib/server/admission/interviews-service";
import { json, parseJsonBody } from "@/lib/server/super-admin";
import { errorResponse } from "@/lib/server/http";

const updateSlotSchema = z.object({
  date: z.string().optional(),
  time: z.string().optional(),
  interviewer: z.string().optional(),
  room: z.string().optional(),
  status: z.enum(["scheduled", "completed", "passed", "failed", "no_show"]).optional(),
  marks: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const Route = createFileRoute("/api/admission/interviews/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, updateSlotSchema);
        if (!body.ok) return body.response;

        try {
          const updated = await updateSlot(params.id, body.data);
          if (!updated) {
            return json({ error: "Interview slot not found" }, 404);
          }
          return json({ slot: updated });
        } catch (error) {
          return errorResponse(error, "Could not update interview slot");
        }
      },
      DELETE: async ({ params }) => {
        try {
          const success = await deleteSlot(params.id);
          return json({ success });
        } catch (error) {
          return errorResponse(error, "Could not delete interview slot");
        }
      },
    },
  },
});

