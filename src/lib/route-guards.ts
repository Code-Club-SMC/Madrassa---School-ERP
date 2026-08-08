import { redirect } from "@tanstack/react-router";
import { hasAnyRole, staffRoles, toAppUser } from "@/lib/auth-session";
import { navItems } from "@/lib/nav-config";
import type { User, UserRole } from "@/types";

export type AuthRouteContext = {
  auth: {
    session: Record<string, unknown>;
    user: User;
  };
};

type GuardContext = {
  location: {
    href: string;
    pathname: string;
  };
};

function bestNavMatch(pathname: string) {
  return navItems
    .filter((item) => pathname === item.url || pathname.startsWith(`${item.url}/`))
    .sort((a, b) => b.url.length - a.url.length)[0];
}

function assertPathRoleAccess(pathname: string, user: User) {
  const item = bestNavMatch(pathname);
  if (item?.roles && !hasAnyRole(user, item.roles)) {
    throw redirect({ to: user.role === "parent" ? "/parents" : "/dashboard" });
  }
}

function assertParentPathAccess(pathname: string, user: User) {
  if (user.role !== "parent") return;
  const allowed = ["/dashboard", "/parents", "/notifications"];
  if (!allowed.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    throw redirect({ to: "/parents" });
  }
}

export async function requireAuth({ location }: GuardContext): Promise<AuthRouteContext> {
  const res = await fetch("/auth/validate-session", {
    headers: { Accept: "application/json" },
  });
  const data = (await res.json().catch(() => ({ user: null }))) as { user: null | Record<string, unknown> };

  if (!data.user) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }

  const user = toAppUser(data.user);

  if (!hasAnyRole(user, [...staffRoles, "parent"])) {
    throw redirect({ to: "/login", search: { redirect: undefined } });
  }

  assertParentPathAccess(location.pathname, user);
  assertPathRoleAccess(location.pathname, user);

  return {
    auth: {
      session: { user: data.user } as Record<string, unknown>,
      user,
    },
  };
}

export function requireRoles(roles: readonly UserRole[]) {
  return async (ctx: GuardContext): Promise<AuthRouteContext> => {
    const authContext = await requireAuth(ctx);
    if (!hasAnyRole(authContext.auth.user, roles)) {
      throw redirect({ to: "/dashboard" });
    }

    return authContext;
  };
}