import { createFileRoute } from "@tanstack/react-router";
import { reverseFeePayment, reversePaymentSchema } from "@/lib/server/finance/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/fees/payments/$id/reverse")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, reversePaymentSchema);
        if (!body.ok) return body.response;

        try {
          return json(await reverseFeePayment(request, params.id, body.data));
        } catch (error) {
          return errorResponse(error, "Could not reverse fee payment");
        }
      },
    },
  },
});
