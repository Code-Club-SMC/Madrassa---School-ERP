import { createFileRoute } from "@tanstack/react-router";
import {
  acceptAdmissionApplication,
  acceptAdmissionApplicationSchema,
} from "@/lib/server/admission/service";
import { admissionErrorResponse } from "@/lib/server/admission/errors";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admission/applications/$id/accept")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, acceptAdmissionApplicationSchema);
        if (!body.ok) return body.response;

        try {
          const result = await acceptAdmissionApplication(request, params.id, body.data);
          return json(result);
        } catch (error) {
          return admissionErrorResponse(error, "Could not accept admission application");
        }
      },
    },
  },
});
