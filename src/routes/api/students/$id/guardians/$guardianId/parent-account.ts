import { createFileRoute } from "@tanstack/react-router";
import {
  retryGuardianParentAccount,
  retryGuardianParentAccountSchema,
} from "@/lib/server/students/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/students/$id/guardians/$guardianId/parent-account")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, retryGuardianParentAccountSchema);
        if (!body.ok) return body.response;

        try {
          return json(await retryGuardianParentAccount(request, params.id, params.guardianId, body.data));
        } catch (error) {
          return errorResponse(error, "Could not create parent account");
        }
      },
    },
  },
});
