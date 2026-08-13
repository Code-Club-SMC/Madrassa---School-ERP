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

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
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
