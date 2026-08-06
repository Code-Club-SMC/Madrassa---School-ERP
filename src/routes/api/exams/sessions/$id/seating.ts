import { createFileRoute } from "@tanstack/react-router";
import {
  generateExamSeatingPlan,
  getExamSeatingPlan,
  seatingGenerateSchema,
} from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/sessions/$id/seating")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return json(await getExamSeatingPlan(request, params.id));
        } catch (error) {
          return errorResponse(error, "Could not load seating plan");
        }
      },
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, seatingGenerateSchema);
        if (!body.ok) return body.response;

        try {
          return json(await generateExamSeatingPlan(request, params.id, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not generate seating plan");
        }
      },
    },
  },
});
