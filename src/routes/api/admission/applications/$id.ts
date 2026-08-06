import { createFileRoute } from "@tanstack/react-router";
import { getAdmissionApplication } from "@/lib/server/admission/service";
import { admissionErrorResponse } from "@/lib/server/admission/errors";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admission/applications/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const result = await getAdmissionApplication(request, params.id);
          return json(result);
        } catch (error) {
          return admissionErrorResponse(error, "Could not load admission application");
        }
      },
    },
  },
});
