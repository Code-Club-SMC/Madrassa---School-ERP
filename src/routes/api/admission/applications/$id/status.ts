import { createFileRoute } from "@tanstack/react-router";
import {
  updateAdmissionApplicationStatus,
  updateApplicationStatusSchema,
} from "@/lib/server/admission/service";
import { admissionErrorResponse } from "@/lib/server/admission/errors";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admission/applications/$id/status")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, updateApplicationStatusSchema);
        if (!body.ok) return body.response;

        try {
          const result = await updateAdmissionApplicationStatus(request, params.id, body.data);
          return json(result);
        } catch (error) {
          return admissionErrorResponse(error, "Could not update application status");
        }
      },
    },
  },
});
