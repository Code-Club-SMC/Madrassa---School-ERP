import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { hasAnyRole, staffRoles, toAppUser } from "@/lib/auth-session";
import { navItems } from "@/lib/nav-config";
import type { AuthSession } from "@/lib/auth";
import type { User, UserRole } from "@/types";

export type AuthRouteContext = {
  auth: {
    session: AuthSession["session"];
    user: User;
  };
};

type GuardContext = {
  location: {
    href: string;
    pathname: string;
  };
};

const getAuthSession = createServerFn({ method: "GET" }).handler(async () => {
  const [{ getRequest }, { auth }] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("@/lib/auth"),
  ]);

  const request = getRequest();
  const cookieHeader = request.headers.get("cookie");
  console.log("[route-guards] cookie header:", cookieHeader);
  console.log("[route-guards] headers:", Object.fromEntries(request.headers.entries()));

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  console.log("[route-guards] session user:", session?.user?.email ?? null);
  return session;
});

export async function getCurrentAuthSession(): Promise<AuthSession | null> {
  return getAuthSession();
}

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
  const session = await getCurrentAuthSession();

  if (!session?.user || !session.session) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }

  const user = toAppUser(session.user);

  if (!hasAnyRole(user, [...staffRoles, "parent"])) {
    throw redirect({ to: "/login", search: { redirect: undefined } });
  }

  assertParentPathAccess(location.pathname, user);
  assertPathRoleAccess(location.pathname, user);

  return {
    auth: {
      session: session.session,
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
