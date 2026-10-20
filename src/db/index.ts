import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as academicSchema from "@/db/schema/academic";
import * as academicYearSchema from "@/db/schema/academic-years";
import * as admissionSchema from "@/db/schema/admission";
import * as attendanceSchema from "@/db/schema/attendance";
import * as authSchema from "@/db/schema/auth";
import * as examSchema from "@/db/schema/exams";
import * as financeSchema from "@/db/schema/finance";
import * as notificationSchema from "@/db/schema/notifications";
import * as studentSchema from "@/db/schema/students";
import * as teacherSchema from "@/db/schema/teachers";
import * as timetableSchema from "@/db/schema/timetable";

function resolveConnectionString(rawUrl?: string): string | undefined {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    // If it's a Neon database and doesn't use the pooler yet, route through Neon's PgBouncer pooler
    if (url.hostname.includes("neon.tech") && !url.hostname.includes("-pooler")) {
      const parts = url.hostname.split(".");
      parts[0] = parts[0] + "-pooler";
      url.hostname = parts.join(".");
      return url.toString();
    }
  } catch {
    // If URL parsing fails, fallback to rawUrl
  }
  return rawUrl;
}

const connectionString = resolveConnectionString(process.env.DATABASE_URL);

const isSsl =
  process.env.DATABASE_SSL === "true" ||
  Boolean(
    connectionString &&
      (connectionString.includes("sslmode=require") ||
        connectionString.includes("neon.tech") ||
        connectionString.includes("supabase.co") ||
        connectionString.includes("pooler.supabase.com")),
  );

export const pool = new Pool({
  connectionString,
  ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  min: 2,
  max: 20,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 300000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
});

// Warm pool connection in background to eliminate first-request cold latency
if (connectionString) {
  pool.query("SELECT 1").catch(() => {
    // Ignore initial warmup error if offline/sandbox
  });
}

pool.on("error", (err) => {
  console.error("Unexpected database pool client error:", err);
});

export const db = drizzle(pool, {
  schema: {
    ...authSchema,
    ...academicSchema,
    ...academicYearSchema,
    ...studentSchema,
    ...admissionSchema,
    ...attendanceSchema,
    ...examSchema,
    ...teacherSchema,
    ...financeSchema,
    ...notificationSchema,
    ...timetableSchema,
  },
});
