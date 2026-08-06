import { createFileRoute } from "@tanstack/react-router";
import {
  getSchoolAttendanceRoster,
  schoolAttendanceRosterQuerySchema,
} from "@/lib/server/attendance/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/attendance/school/roster")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = schoolAttendanceRosterQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await getSchoolAttendanceRoster(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load attendance roster");
        }
      },
    },
  },
});
