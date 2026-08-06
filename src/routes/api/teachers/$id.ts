import { createFileRoute } from "@tanstack/react-router";
import {
  getTeacher,
  updateTeacherProfile,
  updateTeacherProfileSchema,
} from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return json(await getTeacher(request, params.id));
        } catch (error) {
          return errorResponse(error, "Could not load teacher");
        }
      },
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, updateTeacherProfileSchema);
        if (!body.ok) return body.response;

        try {
          return json(await updateTeacherProfile(request, params.id, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update teacher");
        }
      },
    },
  },
});
