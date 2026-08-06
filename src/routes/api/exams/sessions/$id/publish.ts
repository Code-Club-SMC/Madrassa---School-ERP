import { createFileRoute } from "@tanstack/react-router";
import { publishExamResults } from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/sessions/$id/publish")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          return json(await publishExamResults(request, params.id));
        } catch (error) {
          return errorResponse(error, "Could not publish exam");
        }
      },
    },
  },
});
