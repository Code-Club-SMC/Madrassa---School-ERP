import { createFileRoute } from "@tanstack/react-router";
import { lockExamSeatingPlan } from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/sessions/$id/seating/$planId/lock")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          return json(await lockExamSeatingPlan(request, params.id, params.planId));
        } catch (error) {
          return errorResponse(error, "Could not lock seating plan");
        }
      },
    },
  },
});
