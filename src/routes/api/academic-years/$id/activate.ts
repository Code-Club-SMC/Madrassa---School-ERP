import { createFileRoute } from "@tanstack/react-router";
import { activateAcademicYear } from "@/lib/server/academic-years/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic-years/$id/activate")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          return json({ academicYear: await activateAcademicYear(request, params.id) });
        } catch (error) {
          return errorResponse(error, "تعلیمی سال فعال نہیں ہو سکا");
        }
      },
    },
  },
});
