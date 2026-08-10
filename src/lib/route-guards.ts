import { redirect } from "@tanstack/react-router";
import { hasAnyRole, staffRoles, toAppUser } from "@/lib/auth-session";
import { navItems } from "@/lib/nav-config";
import type { User, UserRole } from "@/types";

type GuardContext = {
  location: {
    href: string;
    pathname: string;
  };
  context: {
    authUser?: {
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

export async function requireAuth({ location, context }: GuardContext): Promise<void> {
  const authUser = context.authUser ?? null;

  if (!authUser) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }

  const user = toAppUser(authUser);

  if (!hasAnyRole(user, [...staffRoles, "parent"])) {
    throw redirect({ to: "/login", search: { redirect: undefined } });
  }

  assertParentPathAccess(location.pathname, user);
  assertPathRoleAccess(location.pathname, user);
}

export function requireRoles(roles: readonly UserRole[]) {
  return async (ctx: GuardContext): Promise<void> => {
    await requireAuth(ctx);
    const authUser = ctx.context.authUser;
    if (!authUser) return;
    const user = toAppUser(authUser);
    if (!hasAnyRole(user, roles)) {
      throw redirect({ to: "/dashboard" });
    }
  };
}