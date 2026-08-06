import { createFileRoute } from "@tanstack/react-router";
import {
  academicYearUpdateSchema,
  archiveAcademicYear,
  updateAcademicYear,
} from "@/lib/server/academic-years/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic-years/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, academicYearUpdateSchema);
        if (!body.ok) return body.response;

        try {
          return json({ academicYear: await updateAcademicYear(request, params.id, body.data) });
        } catch (error) {
          return errorResponse(error, "تعلیمی سال اپ ڈیٹ نہیں ہو سکا");
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          return json({ academicYear: await archiveAcademicYear(request, params.id) });
        } catch (error) {
          return errorResponse(error, "تعلیمی سال محفوظ نہیں ہو سکا");
        }
      },
    },
  },
});
