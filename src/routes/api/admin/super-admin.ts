import { createFileRoute } from "@tanstack/react-router";
import {
  parseJsonBody,
  updateCurrentSuperAdmin,
  updateSuperAdminSchema,
} from "@/lib/server/super-admin";
import { errorResponse } from "@/lib/server/http";

export const Route = createFileRoute("/api/admin/super-admin")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        const body = await parseJsonBody(request, updateSuperAdminSchema);
        if (!body.ok) return body.response;

        try {
          return await updateCurrentSuperAdmin(request, body.data);
        } catch (error) {
          return errorResponse(error, "سپر ایڈمن کی تفصیلات اپ ڈیٹ نہیں ہو سکیں · Could not update super admin");
        }
      },
    },
  },
});
