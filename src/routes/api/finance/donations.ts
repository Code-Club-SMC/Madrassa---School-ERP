import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { listDonations, saveDonation } from "@/lib/server/finance/donations-service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

const createDonationSchema = z.object({
  donor: z.string().min(1, "Donor name is required"),
  donorUrdu: z.string().optional(),
  phone: z.string().optional(),
  cnic: z.string().optional(),
  type: z.enum(["zakat", "sadqa", "general", "khairat", "fitra"]),
  purpose: z.string().optional().default(""),
  amountPaisa: z.number().int().positive("Amount must be greater than zero"),
  method: z.enum(["cash", "bank", "online"]).default("cash"),
  date: z.string().optional(),
});

export const Route = createFileRoute("/api/finance/donations")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const donations = listDonations();
          return json({ donations });
        } catch (error) {
          return errorResponse(error, "Could not load donations");
        }
      },
      POST: async ({ request }) => {
        const parsed = await parseJsonBody(request, createDonationSchema);
        if (!parsed.ok) return parsed.response;

        try {
          const created = saveDonation(parsed.data);
          return json({ donation: created }, 201);
        } catch (error) {
          return errorResponse(error, "Could not record donation");
        }
      },
    },
  },
});

