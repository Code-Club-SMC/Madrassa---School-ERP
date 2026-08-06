import { createFileRoute } from "@tanstack/react-router";
import { getExamDmc } from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/sessions/$id/dmc/$studentId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return json(await getExamDmc(request, params.id, params.studentId));
        } catch (error) {
          return errorResponse(error, "Could not load DMC");
        }
      },
    },
  },
});
