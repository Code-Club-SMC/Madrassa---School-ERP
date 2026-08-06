import { createFileRoute } from "@tanstack/react-router";
import { markSchoolAttendance, markSchoolAttendanceSchema } from "@/lib/server/attendance/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/attendance/school/mark")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, markSchoolAttendanceSchema);
        if (!body.ok) return body.response;

        try {
          return json(await markSchoolAttendance(request, body.data));
        } catch (error) {
          return errorResponse(error, "Could not mark school attendance");
        }
      },
    },
  },
});
