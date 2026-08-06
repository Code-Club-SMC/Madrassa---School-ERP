import { createFileRoute } from "@tanstack/react-router";
import {
  createExamSession,
  examInputSchema,
  examListQuerySchema,
  listExamSessions,
} from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/sessions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = examListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await listExamSessions(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load exams");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, examInputSchema);
        if (!body.ok) return body.response;

        try {
          return json(await createExamSession(request, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not create exam");
        }
      },
    },
  },
});
