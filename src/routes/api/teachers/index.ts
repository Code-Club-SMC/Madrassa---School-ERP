import { createFileRoute } from "@tanstack/react-router";
import {
  createTeacher,
  createTeacherSchema,
  listTeachers,
  teacherListQuerySchema,
} from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = teacherListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await listTeachers(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load teachers");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, createTeacherSchema);
        if (!body.ok) return body.response;

        try {
          return json(await createTeacher(request, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not create teacher");
        }
      },
    },
  },
});
