import { toAppUser } from "@/lib/auth-session";

const TOKEN_KEY = "msmis_auth_token";

export type AuthUser = ReturnType<typeof toAppUser>;

type LoginInput = {
  email: string;
  password: string;
};

export function useCustomAuth() {
  const getUser = async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/auth/me", {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (!data.user) return null;
      return toAppUser(data.user);
    } catch {
      return null;
    }
  };

  const login = async ({ email, password }: LoginInput) => {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error ?? "Login failed");
    }

    return toAppUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST" });
    } catch {}
  };

  return {
    getUser,
    login,
    logout,
  };
}
