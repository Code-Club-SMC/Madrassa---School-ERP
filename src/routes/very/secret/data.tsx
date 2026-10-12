import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  Copy,
  Check,
  LogIn,
  KeyRound,
  Search,
  ArrowLeft,
  RefreshCw,
  Database,
  Loader2,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { quickLoginServer, getSecretCredentialsServer } from "@/lib/auth.server";
import { ROLE_LABELS, KNOWN_URDU_NAMES } from "@/lib/user-names";

export const Route = createFileRoute("/very/secret/data")({
  head: () => ({
    meta: [
      { title: "Institutional Testing Credentials — Live Database Directory" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SecretCredentialsPage,
});

type DbUser = {
  id: string;
  name: string;
  nameUrdu?: string | null;
  email: string;
  username?: string | null;
  role: string;
  status?: string | null;
  department?: string | null;
  designation?: string | null;
  phone?: string | null;
  systemAccess?: string | null;
  createdAt?: string | null;
};

type CredentialCategory = "super_admin" | "sub_admin" | "teacher" | "parent";

type CredentialItem = {
  id: string;
  category: CredentialCategory;
  role: string;
  roleTitleEn: string;
  roleTitleUr: string;
  nameEn: string;
  nameUr: string;
  email: string;
  password?: string;
  detailsEn: string;
  detailsUr: string;
  targetUrl: string;
  status: string;
  systemAccess?: string;
};

function getCategoryForRole(role: string): CredentialCategory {
  if (role === "super_admin") return "super_admin";
  if (role === "parent") return "parent";
  if (role === "teacher" || role === "principal") return "teacher";
  return "sub_admin";
}

function getTargetUrlForRole(role: string): string {
  if (role === "super_admin" || role === "admin") return "/dashboard";
  if (role === "teacher") return "/dashboard";
  if (role === "parent") return "/parents";
  if (role === "admission_admin") return "/admission";
  if (role === "academic_admin") return "/madrassa/students";
  if (role === "finance_admin" || role === "accountant") return "/finance";
  if (role === "hr_admin" || role === "hr_manager") return "/hr";
  if (role === "reports_admin") return "/reports";
  return "/dashboard";
}

function SecretCredentialsPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loggingInId, setLoggingInId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getSecretCredentialsServer();
      if (res && Array.isArray(res.users) && res.users.length > 0) {
        setUsers(res.users);
      } else {
        const fallback = await fetch("/api/users").then((r) => (r.ok ? r.json() : { users: [] }));
        setUsers(fallback.users || []);
      }
    } catch {
      try {
        const fallback = await fetch("/api/users").then((r) => (r.ok ? r.json() : { users: [] }));
        setUsers(fallback.users || []);
      } catch {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard!`, { duration: 1800 });
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const credentialItems = useMemo<CredentialItem[]>(() => {
    return users.map((u) => {
      const category = getCategoryForRole(u.role);
      const roleMeta = ROLE_LABELS[u.role] || { en: u.role, ur: u.role };
      const nameUr = u.nameUrdu || (u.name ? KNOWN_URDU_NAMES[u.name] : null) || u.name;
      const targetUrl = getTargetUrlForRole(u.role);

      const isSuper = u.role === "super_admin";
      const password = isSuper ? "Admin@123" : "Admin@123";

      const detailsEn = `${u.department ? `Dept: ${u.department}` : ""}${u.designation ? ` • ${u.designation}` : ""} • Status: ${u.status || "active"}${u.systemAccess ? ` • Access: ${u.systemAccess}` : ""}`.replace(/^ • /, "");
      const detailsUr = `${u.department ? `شعبہ: ${u.department}` : ""}${u.status === "active" ? " • فعال اکاؤنٹ" : " • غیر فعال"}`.replace(/^ • /, "");

      return {
        id: u.id,
        category,
        role: u.role,
        roleTitleEn: roleMeta.en,
        roleTitleUr: roleMeta.ur,
        nameEn: u.name,
        nameUr: nameUr,
        email: u.email,
        password,
        detailsEn: detailsEn || "Active user record in PostgreSQL database.",
        detailsUr: detailsUr || "ڈیٹا بیس میں موجود فعال صارف۔",
        targetUrl,
        status: u.status || "active",
        systemAccess: u.systemAccess || "both",
      };
    });
  }, [users]);

  const counts = useMemo(() => {
    const superCount = credentialItems.filter((i) => i.category === "super_admin").length;
    const subCount = credentialItems.filter((i) => i.category === "sub_admin").length;
    const teacherCount = credentialItems.filter((i) => i.category === "teacher").length;
    const parentCount = credentialItems.filter((i) => i.category === "parent").length;
    return {
      all: credentialItems.length,
      super_admin: superCount,
      sub_admin: subCount,
      teacher: teacherCount,
      parent: parentCount,
    };
  }, [credentialItems]);

  const handleQuickLogin = async (item: CredentialItem) => {
    setLoggingInId(item.id);
    try {
      const res = await quickLoginServer({ data: { userId: item.id } });
      if ((res as any)?.error) {
        throw new Error((res as any).error);
      }
      toast.success(`Logged in as ${item.nameEn} (${item.roleTitleEn})`);
      window.location.href = item.targetUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quick login failed");
    } finally {
      setLoggingInId(null);
    }
  };

  const filteredItems = credentialItems.filter((item) => {
    if (filter !== "all" && item.category !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.nameEn.toLowerCase().includes(q) ||
      item.nameUr.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.roleTitleEn.toLowerCase().includes(q) ||
      item.detailsEn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Top Banner */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-base leading-tight">
                  Secret Credentials Directory
                </h1>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] py-0 px-1.5 gap-1">
                  <Database className="h-3 w-3" />
                  Live PostgreSQL
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                /very/secret/data • Real users loaded from database ({users.length} accounts)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link to="/login">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <LogIn className="h-3.5 w-3.5" />
                Login Page
              </Button>
            </Link>
            <Link to="/">
              <Button size="sm" variant="ghost" className="text-xs">
                Public Website
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Info Notification */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex items-start gap-3.5">
          <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-semibold text-foreground">
              Live Database User Credentials
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This page connects directly to your active PostgreSQL database. Only accounts that actually exist in the database are listed.
              You can click <strong>Copy</strong> to copy email/password, or click <strong>Quick Login</strong> to instantly authenticate into any role.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Tabs value={filter} onValueChange={setFilter} className="w-auto">
            <TabsList className="grid grid-cols-5 w-full sm:w-auto h-9">
              <TabsTrigger value="all" className="text-xs">
                All ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="super_admin" className="text-xs">
                Super Admin ({counts.super_admin})
              </TabsTrigger>
              <TabsTrigger value="sub_admin" className="text-xs">
                Sub-Admins ({counts.sub_admin})
              </TabsTrigger>
              <TabsTrigger value="teacher" className="text-xs">
                Teachers ({counts.teacher})
              </TabsTrigger>
              <TabsTrigger value="parent" className="text-xs">
                Parents ({counts.parent})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative max-w-xs w-full">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Credentials Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading users from PostgreSQL database...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center border border-dashed rounded-2xl bg-card/40 p-6">
            <Database className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <h4 className="font-heading font-semibold text-base">No Users Found in Database</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
              {filter !== "all"
                ? `There are currently no "${filter.replace("_", " ")}" accounts registered in PostgreSQL.`
                : "There are no accounts matching your search query in the database."}
            </p>
            <Link to="/users">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5" />
                Manage Users Portal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isLoggingIn = loggingInId === item.id;
              const categoryBadge =
                item.category === "super_admin"
                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                  : item.category === "sub_admin"
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  : item.category === "teacher"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-purple-500/10 text-purple-600 border-purple-500/20";

              return (
                <Card
                  key={item.id}
                  className="p-5 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className={categoryBadge}>
                        {item.roleTitleEn}
                      </Badge>
                      <span className="font-urdu text-xs text-muted-foreground font-medium">
                        {item.roleTitleUr}
                      </span>
                    </div>

                    <h3 className="font-heading font-semibold text-base text-foreground leading-tight">
                      {item.nameEn}
                    </h3>
                    <p className="font-urdu text-xs text-muted-foreground mt-0.5">
                      {item.nameUr}
                    </p>

                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {item.detailsEn}
                    </p>

                    {/* Credentials Box */}
                    <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold">
                          Email / ID
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate select-all text-foreground font-medium">
                            {item.email}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => copyToClipboard(item.email, "Email", `email-${item.id}`)}
                            title="Copy email"
                          >
                            {copiedKey === `email-${item.id}` ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                        <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold">
                          Password
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="select-all text-foreground font-medium bg-background px-1.5 py-0.5 rounded border border-border/50">
                            {item.password || "Admin@123"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() =>
                              copyToClipboard(item.password || "Admin@123", "Password", `pwd-${item.id}`)
                            }
                            title="Copy password"
                          >
                            {copiedKey === `pwd-${item.id}` ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Target: <code className="text-primary">{item.targetUrl}</code>
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleQuickLogin(item)}
                      disabled={Boolean(loggingInId)}
                      className="gap-1.5 text-xs font-medium"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      {isLoggingIn ? "Signing In..." : "Quick Login"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 sm:px-6 bg-card text-center text-xs text-muted-foreground mt-auto">
        <p>
          MSMIS Testing Directory • Real-time users from PostgreSQL database • All permissions synced with server.
        </p>
      </footer>
    </div>
  );
}
