import { createFileRoute } from "@tanstack/react-router";
import { examUpdateSchema, getExamSession, updateExamSession } from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/sessions/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return json(await getExamSession(request, params.id));
        } catch (error) {
          return errorResponse(error, "Could not load exam");
        }
      },
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, examUpdateSchema);
        if (!body.ok) return body.response;

        try {
          return json(await updateExamSession(request, params.id, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update exam");
        }
      },
    },
  },
});
