import { createFileRoute } from "@tanstack/react-router";
import {
  deleteSchoolClass,
  updateSchoolClass,
  schoolClassUpdateSchema,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/school/classes/$classId")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, schoolClassUpdateSchema);
        if (!body.ok) return body.response;

        try {
          const classId = params.classId;
          const updated = await updateSchoolClass(request, classId, body.data);
          return json({ class: updated });
        } catch (error) {
          return errorResponse(error, "Could not update school class");
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          const classId = params.classId;
          await deleteSchoolClass(request, classId);
          return json({ success: true });
        } catch (error) {
          return errorResponse(error, "Could not delete school class");
        }
      },
    },
  },
});
