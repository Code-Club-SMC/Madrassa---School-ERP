import { betterAuth } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db";
import { account, session, user } from "@/db/schema/auth";
import { authAc, authAdminRoles, authRoles } from "@/lib/auth-permissions";

function trustedOrigins() {
  return [
    process.env.BETTER_AUTH_URL,
    process.env.VITE_APP_URL,
    process.env.APP_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter((origin): origin is string => Boolean(origin));
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, account, session },
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 120,
  },
  user: {
    additionalFields: {
      nameUrdu: { type: "string", required: false },
      status: { type: "string", required: false, defaultValue: "active" },
      phone: { type: "string", required: false },
      cnic: { type: "string", required: false },
      systemAccess: { type: "string", required: false, defaultValue: "both" },
      mustChangePassword: { type: "boolean", required: false, defaultValue: true },
      linkedTeacherId: { type: "string", required: false },
      linkedStudentIds: { type: "string[]", required: false },
      permissions: { type: "json", required: false },
      department: { type: "string", required: false },
      designation: { type: "string", required: false },
    },
  },
  plugins: [
    username(),
    admin({
      ac: authAc,
      roles: authRoles,
      adminRoles: [...authAdminRoles],
      defaultRole: "teacher",
      bannedUserMessage: "This account is disabled. Contact the Super Admin.",
    }),
    tanstackStartCookies(),
  ],
});
