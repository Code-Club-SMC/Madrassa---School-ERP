import { createFileRoute } from "@tanstack/react-router";
import {
  getStudentProfile,
  updateStudent,
  updateStudentSchema,
} from "@/lib/server/students/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/students/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return json(await getStudentProfile(request, params.id));
        } catch (error) {
          return errorResponse(error, "Could not load student profile");
        }
      },
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, updateStudentSchema);
        if (!body.ok) return body.response;

        try {
          return json({ student: await updateStudent(request, params.id, body.data) });
        } catch (error) {
          return errorResponse(error, "Could not update student");
        }
      },
    },
  },
});
