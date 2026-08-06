import { createFileRoute } from "@tanstack/react-router";
import { refundFeePayment, refundPaymentSchema } from "@/lib/server/finance/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/fees/payments/$id/refund")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, refundPaymentSchema);
        if (!body.ok) return body.response;

        try {
          return json(await refundFeePayment(request, params.id, body.data));
        } catch (error) {
          return errorResponse(error, "Could not refund fee payment");
        }
      },
    },
  },
});
