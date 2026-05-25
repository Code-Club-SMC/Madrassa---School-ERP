import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types";
import { users as mockUsers } from "@/mock/users";

const STORAGE_KEY = "msmis-session";

type SessionState = {
  user: User | null;
  isLoading: boolean;
};

function readStored(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const id = JSON.parse(raw) as string;
    return mockUsers.find((u) => u.id === id) ?? null;
  } catch {
    return null;
  }
}

export function useSession() {
  const [state, setState] = useState<SessionState>({ user: null, isLoading: true });

  useEffect(() => {
    setState({ user: readStored() ?? mockUsers[0] ?? null, isLoading: false });
  }, []);

  const login = useCallback((emailOrUsername: string) => {
    const found = mockUsers.find(
      (u) => u.email === emailOrUsername || u.username === emailOrUsername,
    );
    if (!found) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found.id));
    } catch {
      /* noop */
    }
    setState({ user: found, isLoading: false });
    return true;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    setState({ user: null, isLoading: false });
  }, []);

  const hasRole = useCallback(
    (...roles: User["role"][]) => Boolean(state.user && roles.includes(state.user.role)),
    [state.user],
  );

  return { ...state, login, logout, hasRole };
}