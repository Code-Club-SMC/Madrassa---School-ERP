import { createFileRoute } from "@tanstack/react-router";
import { markMadrassaAttendance, markMadrassaAttendanceSchema } from "@/lib/server/attendance/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/attendance/madrassa/mark")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, markMadrassaAttendanceSchema);
        if (!body.ok) return body.response;

        try {
          return json(await markMadrassaAttendance(request, body.data));
        } catch (error) {
          return errorResponse(error, "Could not mark madrassa attendance");
        }
      },
    },
  },
});
