import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user as authUser } from "@/db/schema/auth";

const INTERNAL_PARENT_EMAIL_DOMAIN = "parents.msmis.invalid";

const urduNameParts: Record<string, string> = {
  محمد: "muhammad",
  احمد: "ahmad",
  احمدا: "ahmad",
  محمود: "mahmood",
  یوسف: "yousaf",
  يوسف: "yousaf",
  عمران: "imran",
  اسد: "asad",
  خان: "khan",
  علی: "ali",
  حسن: "hassan",
  حسین: "hussain",
  عبداللہ: "abdullah",
  عبدالله: "abdullah",
  عبدالرحمن: "abdurrahman",
  عبدالرحمان: "abdurrahman",
  عبدالستار: "abdulsattar",
  عبدالرزاق: "abdurrazzaq",
  عبدالغفور: "abdulghafoor",
  عبدالعزیز: "abdulaziz",
  اقبال: "iqbal",
  اسلم: "aslam",
  بلال: "bilal",
  طارق: "tariq",
  سجاد: "sajjad",
  سعید: "saeed",
  فاطمہ: "fatima",
  عائشہ: "aisha",
  زینب: "zainab",
  مریم: "maryam",
};

type ParentLoginIdentityOptions = {
  randomDigits?: (length: number) => string;
  usernameExists?: (username: string) => Promise<boolean>;
  maxAttempts?: number;
};

export function buildParentUsernameBase(name: string) {
  const normalized = normalizeName(name);
  const romanized = normalized
    .split(/\s+/)
    .map((part) => urduNameParts[part] ?? part)
    .join(" ");
  const slug = romanized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.+/g, ".");

  return (slug || "parent").slice(0, 20);
}

export async function createUniqueParentLoginIdentity(
  name: string,
  options: ParentLoginIdentityOptions = {},
) {
  const base = buildParentUsernameBase(name);
  const randomDigits = options.randomDigits ?? secureDigits;
  const usernameExists = options.usernameExists ?? defaultUsernameExists;
  const maxAttempts = options.maxAttempts ?? 12;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const username = `${base}${randomDigits(attempt < 8 ? 4 : 6)}`;
    if (!(await usernameExists(username))) {
      return {
        username,
        email: `${username}@${INTERNAL_PARENT_EMAIL_DOMAIN}`,
      };
    }
  }

  throw new Error("Could not generate a unique parent login ID");
}

async function defaultUsernameExists(username: string) {
  const [row] = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.username, username))
    .limit(1);
  return Boolean(row);
}

function secureDigits(length: number) {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return String(randomInt(min, max));
}

function normalizeName(name: string) {
  return name
    .trim()
    .normalize("NFKC")
    .replace(/[ًٌٍَُِّْٰـ]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ة/g, "ہ")
    .replace(/\s+/g, " ");
}
