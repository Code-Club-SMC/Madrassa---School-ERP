import { createFileRoute } from "@tanstack/react-router";
import {
  upsertStudentGuardian,
  upsertStudentGuardianSchema,
} from "@/lib/server/students/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/students/$id/guardians")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, upsertStudentGuardianSchema);
        if (!body.ok) return body.response;

        try {
          return json(await upsertStudentGuardian(request, params.id, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not link guardian");
        }
      },
    },
  },
});
