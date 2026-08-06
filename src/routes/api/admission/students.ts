import { createFileRoute } from "@tanstack/react-router";
import {
  createDirectAdmission,
  createAdmissionApplicationSchema,
} from "@/lib/server/admission/service";
import { admissionErrorResponse } from "@/lib/server/admission/errors";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admission/students")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, createAdmissionApplicationSchema);
        if (!body.ok) return body.response;

        try {
          const result = await createDirectAdmission(request, body.data);
          return json(result, 201);
        } catch (error) {
          return admissionErrorResponse(error, "Could not create admission");
        }
      },
    },
  },
});
