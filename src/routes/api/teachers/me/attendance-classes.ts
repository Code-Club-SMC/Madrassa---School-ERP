import { createFileRoute } from "@tanstack/react-router";
import { getMyTeacherAttendanceClasses } from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/me/attendance-classes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const dateParam = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
          return json(await getMyTeacherAttendanceClasses(request, dateParam));
        } catch (error) {
          return errorResponse(error, "Could not load teacher attendance classes");
        }
      },
    },
  },
});

