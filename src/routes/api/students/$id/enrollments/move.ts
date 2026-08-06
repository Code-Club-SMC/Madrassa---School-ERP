import { createFileRoute } from "@tanstack/react-router";
import {
  moveEnrollmentSchema,
  moveStudentEnrollment,
} from "@/lib/server/students/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/students/$id/enrollments/move")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, moveEnrollmentSchema);
        if (!body.ok) return body.response;

        try {
          return json({ enrollment: await moveStudentEnrollment(request, params.id, body.data) });
        } catch (error) {
          return errorResponse(error, "Could not move enrollment");
        }
      },
    },
  },
});
