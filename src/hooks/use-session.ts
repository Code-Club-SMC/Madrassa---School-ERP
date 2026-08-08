import { useCallback, useEffect, useState } from "react";
import { hasAnyRole, toAppUser } from "@/lib/auth-session";
import type { User, UserRole } from "@/types";
import { useCustomAuth } from "@/lib/custom-auth-client";

type SessionState = {
  user: User | null;
  isLoading: boolean;
};

export function useSession() {
  const { getUser, logout } = useCustomAuth();
  const [state, setState] = useState<SessionState>({ user: null, isLoading: true });

  useEffect(() => {
    let cancelled = false;
    getUser().then((user) => {
      if (!cancelled) setState({ user, isLoading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [getUser]);

  const login = useCallback(async (email: string, password: string) => {
    const user = await useCustomAuth().login({ email, password });
    setState({ user, isLoading: false });
    return true;
  }, []);

  const hasRole = useCallback(
    (...roles: User["role"][]) => Boolean(state.user && roles.includes(state.user.role)),
    [state.user],
  );

  return { ...state, login, logout, hasRole };
}
