import { createFileRoute } from "@tanstack/react-router";
import {
  rejectAdmissionApplication,
  rejectAdmissionApplicationSchema,
} from "@/lib/server/admission/service";
import { admissionErrorResponse } from "@/lib/server/admission/errors";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admission/applications/$id/reject")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, rejectAdmissionApplicationSchema);
        if (!body.ok) return body.response;

        try {
          const result = await rejectAdmissionApplication(request, params.id, body.data);
          return json(result);
        } catch (error) {
          return admissionErrorResponse(error, "Could not reject admission application");
        }
      },
    },
  },
});
