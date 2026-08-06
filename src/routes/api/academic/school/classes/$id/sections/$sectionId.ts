import { createFileRoute } from "@tanstack/react-router";
import {
  schoolSectionUpdateSchema,
  updateSchoolSection,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/school/classes/$id/sections/$sectionId")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, schoolSectionUpdateSchema);
        if (!body.ok) return body.response;

        try {
          return json({ section: await updateSchoolSection(request, params.id, params.sectionId, body.data) });
        } catch (error) {
          return errorResponse(error, "Could not update school section");
        }
      },
    },
  },
});
