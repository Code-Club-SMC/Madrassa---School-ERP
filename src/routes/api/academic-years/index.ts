import { createFileRoute } from "@tanstack/react-router";
import {
  academicYearInputSchema,
  createAcademicYear,
  listAcademicYears,
} from "@/lib/server/academic-years/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic-years/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json(await listAcademicYears(request));
        } catch (error) {
          return errorResponse(error, "تعلیمی سال لوڈ نہیں ہو سکے");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, academicYearInputSchema);
        if (!body.ok) return body.response;

        try {
          return json({ academicYear: await createAcademicYear(request, body.data) }, 201);
        } catch (error) {
          return errorResponse(error, "تعلیمی سال نہیں بن سکا");
        }
      },
    },
  },
});
