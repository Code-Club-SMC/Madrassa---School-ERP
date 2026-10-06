import { useCallback, useEffect, useState } from "react";
import { loginServer, logoutServer, getUserServer } from "@/lib/auth.server";
import type { User, UserRole } from "@/types";

type AuthState = {
  user: (User & { role: UserRole }) | null;
  isLoading: boolean;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });

  const getUser = useCallback(async () => {
    try {
      const response = await Promise.race([
        getUserServer(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Session check timed out")), 8000),
        ),
      ]);
      const data =
        response && typeof (response as { json?: unknown }).json === "function"
          ? await (response as Response).json()
          : (response as { user?: User; error?: string } | null);
      const user = data?.user ? { ...data.user, role: data.user.role as UserRole } : null;
      setState({ user, isLoading: false });
      return user;
    } catch {
      setState({ user: null, isLoading: false });
      return null;
    }
  }, []);

  const login = useCallback(async ({ identifier, password }: { identifier: string; password: string }) => {
    const response = await loginServer({ data: { identifier, password } });
    const data =
      response && typeof (response as { json?: unknown }).json === "function"
        ? await (response as Response).json()
        : (response as { user?: User; error?: string } | null);
    if (!data || data.error) {
      throw new Error(data?.error ?? "Login failed");
    }
    if (!data.user) {
      throw new Error("Login failed");
    }
    const user = { ...data.user, role: data.user.role as UserRole };
    setState({ user, isLoading: false });
    return user;
  }, []);

  const logout = useCallback(async () => {
    await logoutServer();
    setState({ user: null, isLoading: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getUser().then(() => {
      if (!cancelled) setState((prev) => ({ ...prev, isLoading: false }));
    });
    return () => {
      cancelled = true;
    };
  }, [getUser]);

  return { ...state, login, logout, getUser };
}
