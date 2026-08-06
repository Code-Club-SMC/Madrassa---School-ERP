import { createFileRoute } from "@tanstack/react-router";
import { lockExamSubject } from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/sessions/$id/subjects/$subjectId/lock")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          return json(await lockExamSubject(request, params.id, params.subjectId));
        } catch (error) {
          return errorResponse(error, "Could not lock exam subject");
        }
      },
    },
  },
});
