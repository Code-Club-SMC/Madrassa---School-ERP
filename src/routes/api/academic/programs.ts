import { createFileRoute } from "@tanstack/react-router";
import { listAcademicPrograms } from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/programs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json({ programs: await listAcademicPrograms(request) });
        } catch (error) {
          return errorResponse(error, "Could not load programs");
        }
      },
    },
  },
});
