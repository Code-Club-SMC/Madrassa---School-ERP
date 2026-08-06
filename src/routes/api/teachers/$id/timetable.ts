import { createFileRoute } from "@tanstack/react-router";
import {
  createTeacherTimetablePeriod,
  teacherTimetablePeriodSchema,
} from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/$id/timetable")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, teacherTimetablePeriodSchema);
        if (!body.ok) return body.response;

        try {
          return json(await createTeacherTimetablePeriod(request, params.id, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not create teacher timetable period");
        }
      },
    },
  },
});
