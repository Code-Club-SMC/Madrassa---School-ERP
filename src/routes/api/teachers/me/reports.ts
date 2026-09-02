import { createFileRoute } from "@tanstack/react-router";
import { getMyTeacherReports } from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/me/reports")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json(await getMyTeacherReports(request));
        } catch (error) {
          return errorResponse(error, "Could not load teacher reports");
        }
      },
    },
  },
});
