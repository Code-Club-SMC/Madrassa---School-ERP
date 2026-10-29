import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  listInterviews,
  createOrUpdateSlot,
} from "@/lib/server/admission/interviews-service";
import { json, parseJsonBody } from "@/lib/server/super-admin";
import { errorResponse } from "@/lib/server/http";

const createSlotSchema = z.object({
  id: z.string().optional(),
  appId: z.string().min(1),
  applicantName: z.string().optional(),
  applicantNameUrdu: z.string().optional(),
  refNo: z.string().optional(),
  system: z.enum(["madrassa", "school"]).optional(),
  categoryOrClass: z.string().optional(),
  source: z.string().optional(),
  date: z.string().min(1),
  time: z.string().min(1),
  interviewer: z.string().min(1),
  room: z.string().min(1),
  status: z.enum(["scheduled", "completed", "passed", "failed", "no_show"]).optional(),
  marks: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  guardianPhone: z.string().optional(),
});

export const Route = createFileRoute("/api/admission/interviews")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await listInterviews();
          return json(data);
        } catch (error) {
          return errorResponse(error, "Could not load interviews");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, createSlotSchema);
        if (!body.ok) return body.response;

        try {
          const slot = await createOrUpdateSlot(body.data);
          return json({ slot }, 201);
        } catch (error) {
          return errorResponse(error, "Could not schedule interview");
        }
      },
    },
  },
});

