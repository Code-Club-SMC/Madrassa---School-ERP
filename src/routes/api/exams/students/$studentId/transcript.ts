import { createFileRoute } from "@tanstack/react-router";
import { getStudentAnnualTranscript } from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/students/$studentId/transcript")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return json(await getStudentAnnualTranscript(request, params.studentId));
        } catch (error) {
          return errorResponse(error, "Could not load annual transcript");
        }
      },
    },
  },
});
