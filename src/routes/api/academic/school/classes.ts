import { createFileRoute } from "@tanstack/react-router";
import {
  createSchoolClass,
  listSchoolClasses,
  schoolClassInputSchema,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/school/classes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json({ classes: await listSchoolClasses(request) });
        } catch (error) {
          return errorResponse(error, "Could not load school classes");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, schoolClassInputSchema);
        if (!body.ok) return body.response;

        try {
          return json({ class: await createSchoolClass(request, body.data) }, 201);
        } catch (error) {
          return errorResponse(error, "Could not create school class");
        }
      },
    },
  },
});
