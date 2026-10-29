import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  listDocTypes,
  saveDocTypes,
  addOrUpdateDocType,
  deleteDocType,
  resetDocTypes,
} from "@/lib/server/admission/interviews-service";
import { json, parseJsonBody } from "@/lib/server/super-admin";
import { errorResponse } from "@/lib/server/http";

const docTypeSchema = z.object({
  key: z.string().min(1),
  en: z.string().min(1),
  ur: z.string().min(1),
  required: z.boolean(),
});

const saveDocTypesSchema = z.object({
  docTypes: z.array(docTypeSchema).optional(),
  action: z.enum(["save_all", "add_or_update", "reset"]).optional(),
  item: docTypeSchema.optional(),
});

export const Route = createFileRoute("/api/admission/interviews/doc-types")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const docTypes = await listDocTypes();
          return json({ docTypes });
        } catch (error) {
          return errorResponse(error, "Could not load document types");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, saveDocTypesSchema);
        if (!body.ok) return body.response;

        try {
          if (body.data.action === "reset") {
            const docTypes = await resetDocTypes();
            return json({ docTypes });
          }

          if (body.data.action === "add_or_update" && body.data.item) {
            const docTypes = await addOrUpdateDocType(body.data.item);
            return json({ docTypes });
          }

          if (body.data.docTypes) {
            const docTypes = await saveDocTypes(body.data.docTypes);
            return json({ docTypes });
          }

          const docTypes = await listDocTypes();
          return json({ docTypes });
        } catch (error) {
          return errorResponse(error, "Could not save document types");
        }
      },
      DELETE: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const key = url.searchParams.get("key");
          if (!key) {
            return json({ error: "Missing key parameter" }, 400);
          }
          const docTypes = await deleteDocType(key);
          return json({ docTypes });
        } catch (error) {
          return errorResponse(error, "Could not delete document type");
        }
      },
    },
  },
});

