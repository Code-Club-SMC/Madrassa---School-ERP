import { createFileRoute } from "@tanstack/react-router";
import { listAcademicInstitutions } from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/institutions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json({ institutions: await listAcademicInstitutions(request) });
        } catch (error) {
          return errorResponse(error, "Could not load institutions");
        }
      },
    },
  },
});
