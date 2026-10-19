import { describe, expect, it } from "bun:test";
import { formatDatabaseError, isDatabaseOrInternalError } from "./http";

describe("database error sanitization", () => {
  it("detects raw SQL queries and Drizzle query errors", () => {
    const rawSql =
      'Failed query: select "id", "name", "email", "initial_password" from "user" where (lower("user"."email") = $1) limit $2 params: admin@example.com,1';
    expect(isDatabaseOrInternalError(rawSql)).toBe(true);
  });

  it("sanitizes connection timeout and getaddrinfo DNS failure cleanly", () => {
    const cause = {
      syscall: "getaddrinfo",
      errno: 12,
      hostname: "ep-icy-sound-b4tpwsx8.c-6.us-east-2.aws.neon.tech",
      code: "ETIMEOUT",
      message: "getaddrinfo ETIMEOUT ep-icy-sound-b4tpwsx8.c-6.us-east-2.aws.neon.tech",
    };
    const drizzleError = new Error(
      'Failed query: select "id", "name", "email" from "user" where "email" = $1 params: admin@example.com',
    );
    (drizzleError as any).cause = cause;

    const message = formatDatabaseError(drizzleError);
    expect(message).toBe(
      "Database connection unavailable. Please check your internet connection or verify the database service is running.",
    );
    expect(message).not.toContain("Failed query");
    expect(message).not.toContain("admin@example.com");
    expect(message).not.toContain("select");
  });

  it("sanitizes ECONNREFUSED error cleanly", () => {
    const cause = {
      code: "ECONNREFUSED",
      syscall: "connect",
      message: "connect ECONNREFUSED 127.0.0.1:5432",
    };
    const drizzleError = new Error('Failed query: select * from "user"');
    (drizzleError as any).cause = cause;

    const message = formatDatabaseError(drizzleError);
    expect(message).toBe(
      "Database connection unavailable. Please check your internet connection or verify the database service is running.",
    );
  });

  it("sanitizes missing column or table errors (schema mismatch)", () => {
    const cause = {
      code: "42703",
      message: 'column "initial_password" of relation "user" does not exist',
    };
    const drizzleError = new Error('Failed query: select "initial_password" from "user"');
    (drizzleError as any).cause = cause;

    const message = formatDatabaseError(drizzleError);
    expect(message).toBe(
      "Database schema update required. Please ensure database migrations have been applied.",
    );
  });

  it("sanitizes postgres authentication failures cleanly", () => {
    const cause = {
      code: "28P01",
      message: 'password authentication failed for user "postgres"',
    };
    const drizzleError = new Error('Failed query: select * from "user"');
    (drizzleError as any).cause = cause;

    const message = formatDatabaseError(drizzleError);
    expect(message).toBe(
      "Database authentication failed. Please verify database credentials in server configuration.",
    );
  });

  it("sanitizes generic unclassified query errors without leaking SQL", () => {
    const drizzleError = new Error(
      'Failed query: select "secret_data" from "vault" params: supersecret',
    );
    const message = formatDatabaseError(drizzleError);
    expect(message).toBe(
      "Database service is temporarily unavailable. Please try again in a few moments.",
    );
    expect(message).not.toContain("supersecret");
    expect(message).not.toContain("Failed query");
  });

  it("preserves standard user-facing non-database errors", () => {
    const standardError = new Error("Current password is incorrect");
    const message = formatDatabaseError(standardError);
    expect(message).toBe("Current password is incorrect");
  });
});

