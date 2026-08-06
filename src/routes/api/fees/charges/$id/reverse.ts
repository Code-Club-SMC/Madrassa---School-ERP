import { createFileRoute } from "@tanstack/react-router";
import { reverseFeeCharge, reverseChargeSchema } from "@/lib/server/finance/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/fees/charges/$id/reverse")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, reverseChargeSchema);
        if (!body.ok) return body.response;

        try {
          return json(await reverseFeeCharge(request, params.id, body.data));
        } catch (error) {
          return errorResponse(error, "Could not reverse fee charge");
        }
      },
    },
  },
});
