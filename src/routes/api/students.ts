import { createFileRoute } from "@tanstack/react-router";
import { listStudents, listStudentsQuerySchema } from "@/lib/server/students/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/students")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = listStudentsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await listStudents(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load students");
        }
      },
    },
  },
});
