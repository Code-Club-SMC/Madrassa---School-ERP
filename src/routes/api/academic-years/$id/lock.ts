import { createFileRoute } from "@tanstack/react-router";
import { lockAcademicYear } from "@/lib/server/academic-years/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic-years/$id/lock")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          return json({ academicYear: await lockAcademicYear(request, params.id) });
        } catch (error) {
          return errorResponse(error, "تعلیمی سال مقفل نہیں ہو سکا");
        }
      },
    },
  },
});
