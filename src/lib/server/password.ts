import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(storedPassword: string, password: string) {
  return bcrypt.compare(password, storedPassword);
}
