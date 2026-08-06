import { createFileRoute } from "@tanstack/react-router";
import { getMarksEntry, marksQuerySchema, marksSaveSchema, saveExamMarks } from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/sessions/$id/marks")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const query = marksQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await getMarksEntry(request, params.id, query.data.examSubjectId));
        } catch (error) {
          return errorResponse(error, "Could not load marks entry");
        }
      },
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, marksSaveSchema);
        if (!body.ok) return body.response;

        try {
          return json(await saveExamMarks(request, params.id, body.data));
        } catch (error) {
          return errorResponse(error, "Could not save marks");
        }
      },
    },
  },
});
