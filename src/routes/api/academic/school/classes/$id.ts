import { createFileRoute } from "@tanstack/react-router";
import {
  schoolClassUpdateSchema,
  updateSchoolClass,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/school/classes/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, schoolClassUpdateSchema);
        if (!body.ok) return body.response;

        try {
          return json({ class: await updateSchoolClass(request, params.id, body.data) });
        } catch (error) {
          return errorResponse(error, "Could not update school class");
        }
      },
    },
  },
});
