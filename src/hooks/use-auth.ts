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
      const response = await getUserServer();
      const data = await response.json();
      const user = data.user ? { ...data.user, role: data.user.role as UserRole } : null;
      setState({ user, isLoading: false });
      return user;
    } catch {
      setState({ user: null, isLoading: false });
      return null;
    }
  }, []);

  const login = useCallback(async ({ identifier, password }: { identifier: string; password: string }) => {
    const response = await loginServer({ data: { identifier, password } });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error ?? "Login failed");
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
