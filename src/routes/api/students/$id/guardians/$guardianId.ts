import { createFileRoute } from "@tanstack/react-router";
import {
  updateGuardianSchema,
  updateStudentGuardian,
} from "@/lib/server/students/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/students/$id/guardians/$guardianId")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, updateGuardianSchema);
        if (!body.ok) return body.response;

        try {
          return json(await updateStudentGuardian(request, params.id, params.guardianId, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update guardian");
        }
      },
    },
  },
});
