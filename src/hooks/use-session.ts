import { useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { hasAnyRole, toAppUser } from "@/lib/auth-session";
import type { User } from "@/types";

type SessionState = {
  user: User | null;
  isLoading: boolean;
};

export function useSession() {
  const session = authClient.useSession();
  const user = session.data?.user ? toAppUser(session.data.user) : null;
  const state: SessionState = { user, isLoading: session.isPending };

  const login = useCallback(async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password });
    return !result.error;
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
  }, []);

  const hasRole = useCallback(
    (...roles: User["role"][]) => hasAnyRole(state.user, roles),
    [state.user],
  );

  return { ...state, login, logout, hasRole, refetch: session.refetch, session: session.data };
}
