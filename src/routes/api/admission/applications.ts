import { createFileRoute } from "@tanstack/react-router";
import {
  createAdmissionApplication,
  createAdmissionApplicationSchema,
  listAdmissionApplications,
  listAdmissionApplicationsSchema,
} from "@/lib/server/admission/service";
import { admissionErrorResponse } from "@/lib/server/admission/errors";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admission/applications")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = listAdmissionApplicationsSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) {
          return json({ error: "Invalid query", issues: query.error.issues }, 400);
        }

        try {
          const applications = await listAdmissionApplications(request, query.data);
          return json({ applications });
        } catch (error) {
          return admissionErrorResponse(error, "Could not list admission applications");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, createAdmissionApplicationSchema);
        if (!body.ok) return body.response;

        try {
          const result = await createAdmissionApplication(body.data, "public");
          return json(result, 201);
        } catch (error) {
          return admissionErrorResponse(error, "Could not submit admission application");
        }
      },
    },
  },
});
