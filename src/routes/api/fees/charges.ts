import { createFileRoute } from "@tanstack/react-router";
import { createFeeCharge, createFeeChargeSchema } from "@/lib/server/finance/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/fees/charges")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, createFeeChargeSchema);
        if (!body.ok) return body.response;

        try {
          return json(await createFeeCharge(request, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not create fee charge");
        }
      },
    },
  },
});
