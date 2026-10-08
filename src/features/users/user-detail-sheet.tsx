import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { PermissionMatrix } from "./permission-matrix";
import { resolveDisplayPerms } from "./resolve-perms";
import { formatDate } from "@/lib/format";
import type { User } from "@/types";

import { useLanguage } from "@/components/language-context";
import { getUserDisplayName, getUserInitials, ROLE_LABELS, ACCESS_LABELS, STATUS_LABELS } from "@/lib/user-names";

type Props = { user: User | null; onClose: () => void };

export function UserDetailSheet({ user, onClose }: Props) {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  if (!user) return null;
  const initials = getUserInitials(user, lang);
  const perms = resolveDisplayPerms(user);

  return (
    <Sheet open={!!user} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" side="right">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-2xl">
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle>
                <span
                  className={isUrdu ? "font-urdu text-xl block leading-loose" : "font-sans text-xl font-bold block"}
                  dir={isUrdu ? "rtl" : "ltr"}
                  lang={lang}
                >
                  {getUserDisplayName(user, lang)}
                </span>
              </SheetTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <StatusBadge status={user.role || "teacher"} />
                <StatusBadge status={user.status || "active"} />
                {user.systemAccess && (
                  <Badge variant="outline">
                    {isUrdu ? ACCESS_LABELS[user.systemAccess]?.ur ?? user.systemAccess : ACCESS_LABELS[user.systemAccess]?.en ?? user.systemAccess}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList>
            <TabsTrigger value="details">{isUrdu ? "تفصیل" : "Details"}</TabsTrigger>
            <TabsTrigger value="perms">{isUrdu ? "اجازتیں" : "Permissions"}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <dl className="divide-y divide-border border border-border rounded-xl">
              <Row urdu="ای میل" en="Email" value={user.email || "—"} />
              <Row urdu="فون" en="Phone" value={user.phone ?? "—"} />
              <Row urdu="شناختی کارڈ" en="CNIC" value={maskCnic(user.cnic)} />
              <Row
                urdu="کردار"
                en="Role"
                value={(isUrdu ? ROLE_LABELS[user.role]?.ur : ROLE_LABELS[user.role]?.en) ?? user.role ?? "—"}
              />
              <Row
                urdu="سسٹم رسائی"
                en="System Access"
                value={isUrdu ? (ACCESS_LABELS[user.systemAccess ?? ""]?.ur ?? user.systemAccess ?? "—") : (ACCESS_LABELS[user.systemAccess ?? ""]?.en ?? user.systemAccess ?? "—")}
              />
              <Row
                urdu="آخری لاگ ان"
                en="Last Login"
                value={user.lastLoginAt ? formatDate(user.lastLoginAt) : (isUrdu ? "کبھی نہیں" : "Never")}
              />
              <Row
                urdu="بنانے والا"
                en="Created By"
                value={user.createdBy ? `${user.createdBy} · ${formatDate(user.createdAt)}` : (user.createdAt ? formatDate(user.createdAt) : "—")}
              />
              <Row
                urdu="کیفیت"
                en="Status"
                value={(isUrdu ? STATUS_LABELS[user.status ?? ""]?.ur : STATUS_LABELS[user.status ?? ""]?.en) ?? user.status ?? "—"}
              />
            </dl>
          </TabsContent>

          <TabsContent value="perms" className="mt-4">
            <PermissionMatrix value={perms} readOnly />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Row({ urdu, en, value }: { urdu: string; en: string; value: string }) {
  const { lang } = useLanguage();
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        {lang === "ur" ? (
          <p className="font-urdu text-sm leading-loose" dir="rtl" lang="ur">{urdu}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{en}</p>
        )}
      </div>
      <p className="text-sm font-medium text-end break-all">{value}</p>
    </div>
  );
}

function maskCnic(c?: string) {
  if (!c) return "—";
  const str = String(c);
  const last = str.slice(-1);
  return `XXXXX-XXXXXXX-${last}`;
}