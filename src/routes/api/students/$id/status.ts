import { createFileRoute } from "@tanstack/react-router";
import {
  updateStudentStatus,
  updateStudentStatusSchema,
} from "@/lib/server/students/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/students/$id/status")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, updateStudentStatusSchema);
        if (!body.ok) return body.response;

        try {
          return json({ student: await updateStudentStatus(request, params.id, body.data) });
        } catch (error) {
          return errorResponse(error, "Could not update student status");
        }
      },
    },
  },
});
