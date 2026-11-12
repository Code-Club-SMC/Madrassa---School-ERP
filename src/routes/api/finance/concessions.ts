import { createFileRoute } from "@tanstack/react-router";
import {
  computeConcessionsSummary,
  deleteAllConcessions,
  deleteConcession,
  listConcessions,
  resetConcessionsToDefault,
  saveConcession,
  type Concession,
} from "@/lib/server/finance/concessions-service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/finance/concessions")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const concessions = listConcessions();
          const summary = computeConcessionsSummary(concessions);
          return json({ concessions, summary });
        } catch (error) {
          return errorResponse(error, "Could not load concessions");
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => null)) as any;

          if (body?.action === "reset") {
            const resetItems = resetConcessionsToDefault();
            const summary = computeConcessionsSummary(resetItems);
            return json({ success: true, concessions: resetItems, summary });
          }

          if (body?.action === "clear_all") {
            deleteAllConcessions();
            return json({ success: true, concessions: [], summary: computeConcessionsSummary([]) });
          }

          if (!body?.studentId) {
            return json({ error: "Student is required" }, 400);
          }

          const saved = saveConcession(body);
          const current = listConcessions();
          const summary = computeConcessionsSummary(current);
          return json({ success: true, concession: saved, concessions: current, summary }, 201);
        } catch (error) {
          return errorResponse(error, "Could not save concession");
        }
      },
      DELETE: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const queryId = url.searchParams.get("id");
          const queryAll = url.searchParams.get("all") === "true";

          let bodyId: string | undefined;
          let bodyAll: boolean | undefined;
          try {
            const body = await request.json();
            bodyId = body?.id;
            bodyAll = body?.all === true || body?.action === "clear_all";
          } catch {}

          const isAll = queryAll || bodyAll || queryId === "all" || bodyId === "all";
          if (isAll) {
            deleteAllConcessions();
            return json({ success: true, concessions: [], summary: computeConcessionsSummary([]) });
          }

          const targetId = queryId || bodyId;
          if (!targetId) {
            return json({ error: "Concession ID is required" }, 400);
          }

          deleteConcession(targetId);
          const current = listConcessions();
          const summary = computeConcessionsSummary(current);
          return json({ success: true, concessions: current, summary });
        } catch (error) {
          return errorResponse(error, "Could not delete concession");
        }
      },
    },
  },
});
