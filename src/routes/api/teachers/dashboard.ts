import { createFileRoute } from "@tanstack/react-router";
import { listTeachersWithTimetables } from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/dashboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json(await listTeachersWithTimetables(request));
        } catch (error) {
          return errorResponse(error, "Could not load teacher dashboard");
        }
      },
    },
  },
});
