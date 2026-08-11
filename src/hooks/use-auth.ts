import { useCallback, useEffect, useState } from "react";
import { loginServer, logoutServer, getUserServer } from "@/lib/auth.server";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  nameUrdu?: string;
  phone?: string;
  cnic?: string;
  systemAccess?: string;
  mustChangePassword?: boolean;
  department?: string;
  designation?: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });

  const getUser = useCallback(async () => {
    try {
      const response = await getUserServer();
      const data = await response.json();
      setState({ user: data.user, isLoading: false });
      return data.user;
    } catch {
      setState({ user: null, isLoading: false });
      return null;
    }
  }, []);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const response = await loginServer({ data: { email, password } });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error ?? "Login failed");
    }
    setState({ user: data.user, isLoading: false });
    return data.user;
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
