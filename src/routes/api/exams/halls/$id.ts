import { createFileRoute } from "@tanstack/react-router";
import { hallUpdateSchema, updateExamHall } from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/halls/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, hallUpdateSchema);
        if (!body.ok) return body.response;

        try {
          return json(await updateExamHall(request, params.id, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update exam hall");
        }
      },
    },
  },
});
