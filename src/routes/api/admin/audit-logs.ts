import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/server/super-admin";
import { errorResponse } from "@/lib/server/http";
import { listAuditLogs, recordAuditLog } from "@/lib/server/audit/audit-service";

export const Route = createFileRoute("/api/admin/audit-logs")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const logs = await listAuditLogs();
          return json({ logs });
        } catch (error) {
          return errorResponse(error, "Could not load administrative audit logs");
        }
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          if (!body.action || !body.entity) {
            return new Response(
              JSON.stringify({ error: "Missing required fields: action and entity" }),
              { status: 400, headers: { "content-type": "application/json" } },
            );
          }

          const entry = await recordAuditLog({
            userId: body.userId || "u-admin",
            userName: body.userName || "Admin",
            action: body.action,
            entity: body.entity,
            entityId: body.entityId || "SYSTEM",
            details: body.details || "",
            at: body.at,
          });

          return json({ entry }, 201);
        } catch (error) {
          return errorResponse(error, "Could not record audit log entry");
        }
      },
    },
  },
});

