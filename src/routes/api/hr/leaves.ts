import { createFileRoute } from "@tanstack/react-router";
import {
  createLeaveRequest,
  listLeaveRequests,
  updateLeaveStatus,
} from "@/lib/server/hr/leaves-service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/hr/leaves")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const staffId = url.searchParams.get("staffId") || undefined;
          const leaves = listLeaveRequests(staffId);
          return json({ leaves });
        } catch (error) {
          return errorResponse(error, "Could not load leave requests");
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          if (!body?.reason || !String(body.reason).trim()) {
            return json({ error: "Reason for leave is required" }, 400);
          }
          if (!body?.fromDate) {
            return json({ error: "Leave date is required" }, 400);
          }

          const leave = createLeaveRequest({
            staffId: String(body.staffId || "STAFF-TEACHER"),
            staffName: body.staffName ? String(body.staffName).trim() : undefined,
            leaveType: body.leaveType || "emergency",
            fromDate: String(body.fromDate),
            toDate: body.toDate ? String(body.toDate) : undefined,
            days: body.days ? Number(body.days) : undefined,
            reason: String(body.reason),
          });

          return json({ success: true, leave }, 201);
        } catch (error) {
          return errorResponse(error, "Could not create leave request");
        }
      },
      PATCH: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          if (!body?.id) {
            return json({ error: "Leave ID is required" }, 400);
          }
          if (body?.status !== "approved" && body?.status !== "rejected") {
            return json({ error: "Status must be 'approved' or 'rejected'" }, 400);
          }

          const updated = updateLeaveStatus(
            String(body.id),
            body.status,
            body.adminNote ? String(body.adminNote) : undefined,
          );

          if (!updated) {
            return json({ error: "Leave request not found" }, 404);
          }

          return json({ success: true, leave: updated });
        } catch (error) {
          return errorResponse(error, "Could not update leave request");
        }
      },
    },
  },
});

