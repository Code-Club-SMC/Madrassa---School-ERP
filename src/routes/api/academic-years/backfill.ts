import { createFileRoute } from "@tanstack/react-router";
import {
  academicYearBackfillSchema,
  backfillActiveEnrollments,
} from "@/lib/server/academic-years/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic-years/backfill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, academicYearBackfillSchema);
        if (!body.ok) return body.response;

        try {
          return json(await backfillActiveEnrollments(request, body.data));
        } catch (error) {
          return errorResponse(error, "داخلوں کا تعلیمی سال اپ ڈیٹ نہیں ہو سکا");
        }
      },
    },
  },
});
