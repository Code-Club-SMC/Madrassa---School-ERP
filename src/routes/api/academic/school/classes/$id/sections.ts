import { createFileRoute } from "@tanstack/react-router";
import {
  createSchoolSection,
  schoolSectionInputSchema,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/school/classes/$id/sections")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, schoolSectionInputSchema);
        if (!body.ok) return body.response;

        try {
          return json({ section: await createSchoolSection(request, params.id, body.data) }, 201);
        } catch (error) {
          return errorResponse(error, "Could not create school section");
        }
      },
    },
  },
});
