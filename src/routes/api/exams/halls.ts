import { createFileRoute } from "@tanstack/react-router";
import {
  createExamHall,
  hallInputSchema,
  hallListQuerySchema,
  listExamHalls,
} from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/halls")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = hallListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await listExamHalls(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load exam halls");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, hallInputSchema);
        if (!body.ok) return body.response;

        try {
          return json(await createExamHall(request, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not create exam hall");
        }
      },
    },
  },
});
