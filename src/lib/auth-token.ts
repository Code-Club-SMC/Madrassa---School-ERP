import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

export type TokenPayload = {
  userId: string;
  email: string;
  role: string;
  exp: number;
};

export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (decoded.exp && Date.now() > decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function validateToken(token: string) {
  const payload = decodeToken(token);
  if (!payload) return null;

  const [foundUser] = await db.select().from(user).where(eq(user.id, payload.userId)).limit(1);
  if (!foundUser) return null;

  return {
    user: {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      nameUrdu: foundUser.nameUrdu,
      phone: foundUser.phone,
      cnic: foundUser.cnic,
      systemAccess: foundUser.systemAccess,
      mustChangePassword: foundUser.mustChangePassword,
      department: foundUser.department,
      designation: foundUser.designation,
    },
  };
}
