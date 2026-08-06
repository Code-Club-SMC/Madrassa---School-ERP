import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  Check,
  FileSignature,
  GraduationCap,
  Loader2,
  Megaphone,
  Send,
  UserRound,
  Wallet,
} from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { parentKeys } from "@/components/parents/parent-api";
import {
  createLocalAnnouncement,
  listNotifications,
  markNotificationRead,
  notificationKeys,
} from "./notification-api";
import type {
  NotificationAudience,
  NotificationCategory,
  NotificationItem,
} from "./notification-types";

const categoryMeta: Record<
  NotificationCategory,
  { label: string; icon: typeof Bell; className: string }
> = {
  admission: {
    label: "Admission",
    icon: FileSignature,
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  attendance: {
    label: "Attendance",
    icon: CalendarCheck,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  exam: {
    label: "Exam",
    icon: GraduationCap,
    className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  fee: {
    label: "Fee",
    icon: Wallet,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  guardian: {
    label: "Guardian",
    icon: UserRound,
    className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
  student: { label: "Student", icon: UserRound, className: "bg-primary/10 text-primary" },
  system: { label: "System", icon: AlertTriangle, className: "bg-muted text-foreground" },
};

const initialAnnouncementForm = {
  audience: "parent" as NotificationAudience,
  category: "system" as NotificationCategory,
  title: "",
  body: "",
  publishAt: "",
  expiresAt: "",
};

export function NotificationCenter() {
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState(initialAnnouncementForm);
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const canCreateAnnouncement =
    permissions.role === "super_admin" ||
    permissions.role === "admin" ||
    permissions.role === "principal" ||
    permissions.can("settings_website", "edit");
  const params = useMemo(() => {
    return { read: readFilter === "unread" ? ("false" as const) : undefined };
  }, [readFilter]);
  const notificationsQuery = useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => listNotifications(params),
    staleTime: 20_000,
  });
  const readMutation = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => markNotificationRead(id, read),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      await queryClient.invalidateQueries({ queryKey: parentKeys.all });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update notification");
    },
  });
  const announcementMutation = useMutation({
    mutationFn: () =>
      createLocalAnnouncement({
        audience: announcementForm.audience,
        category: announcementForm.category,
        title: announcementForm.title.trim(),
        body: announcementForm.body.trim(),
        publishAt: toIsoOrNull(announcementForm.publishAt),
        expiresAt: toIsoOrNull(announcementForm.expiresAt),
      }),
    onSuccess: async () => {
      toast.success("Announcement saved");
      setAnnouncementForm(initialAnnouncementForm);
      setAnnouncementOpen(false);
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      await queryClient.invalidateQueries({ queryKey: parentKeys.all });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not create announcement");
    },
  });

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const categoryOptions = useMemo(
    () =>
      (Object.keys(categoryMeta) as NotificationCategory[]).map((category) => ({
        value: category,
        label: categoryMeta[category].label,
      })),
    [],
  );

  const handleAnnouncementSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    announcementMutation.mutate();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        titleUrdu="اعلانات"
        description={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
        actions={
          canCreateAnnouncement ? (
            <Button onClick={() => setAnnouncementOpen(true)} className="gap-2">
              <Megaphone className="h-4 w-4" />
              New Announcement
            </Button>
          ) : undefined
        }
      />

      <ResponsiveDialog
        title="New Announcement"
        description="Publish a local in-app notice for staff or parents."
        open={announcementOpen}
        onOpenChange={setAnnouncementOpen}
        icon={Megaphone}
        className="sm:max-w-xl"
      >
        <form className="space-y-4 px-1 pb-1" onSubmit={handleAnnouncementSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="announcement-audience">Audience</Label>
              <Select
                value={announcementForm.audience}
                onValueChange={(value) =>
                  setAnnouncementForm((current) => ({
                    ...current,
                    audience: value as NotificationAudience,
                  }))
                }
              >
                <SelectTrigger id="announcement-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parents</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-category">Category</Label>
              <Select
                value={announcementForm.category}
                onValueChange={(value) =>
                  setAnnouncementForm((current) => ({
                    ...current,
                    category: value as NotificationCategory,
                  }))
                }
              >
                <SelectTrigger id="announcement-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              value={announcementForm.title}
              maxLength={120}
              onChange={(event) =>
                setAnnouncementForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Monthly fee reminder"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-body">Message</Label>
            <Textarea
              id="announcement-body"
              value={announcementForm.body}
              maxLength={1_000}
              rows={5}
              onChange={(event) =>
                setAnnouncementForm((current) => ({ ...current, body: event.target.value }))
              }
              placeholder="Write the announcement text"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="announcement-publish-at">Publish at</Label>
              <Input
                id="announcement-publish-at"
                type="datetime-local"
                value={announcementForm.publishAt}
                onChange={(event) =>
                  setAnnouncementForm((current) => ({ ...current, publishAt: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-expires-at">Expires at</Label>
              <Input
                id="announcement-expires-at"
                type="datetime-local"
                value={announcementForm.expiresAt}
                onChange={(event) =>
                  setAnnouncementForm((current) => ({ ...current, expiresAt: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnnouncementOpen(false)}
              disabled={announcementMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                announcementMutation.isPending ||
                !announcementForm.title.trim() ||
                !announcementForm.body.trim()
              }
              className="gap-2"
            >
              {announcementMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </form>
      </ResponsiveDialog>

      <Tabs value={readFilter} onValueChange={(value) => setReadFilter(value as typeof readFilter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
      </Tabs>

      {notificationsQuery.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading notifications
        </div>
      ) : notificationsQuery.isError ? (
        <EmptyState
          icon={Bell}
          heading="Could not load notifications"
          headingUrdu="اعلانات لوڈ نہیں ہو سکے"
          description={
            notificationsQuery.error instanceof Error
              ? notificationsQuery.error.message
              : "Request failed."
          }
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          heading="No notifications"
          headingUrdu="کوئی اعلان نہیں"
          description="New admission, fee, attendance, and exam events will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              pending={readMutation.isPending}
              onToggleRead={(read) => readMutation.mutate({ id: notification.id, read })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  pending,
  onToggleRead,
}: {
  notification: NotificationItem;
  pending: boolean;
  onToggleRead: (read: boolean) => void;
}) {
  const meta = categoryMeta[notification.category];
  const Icon = meta.icon;

  return (
    <Card className={cn("p-4", !notification.read && "border-primary/30 bg-primary/5")}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
            meta.className,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{notification.title}</p>
            <Badge variant="secondary">{meta.label}</Badge>
            {notification.source === "announcement" && (
              <Badge variant="outline">Announcement</Badge>
            )}
            {!notification.read && <Badge>New</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {formatDate(notification.createdAt)} · {relativeTime(notification.createdAt)}
          </p>
        </div>
        <Button
          size="sm"
          variant={notification.read ? "ghost" : "outline"}
          disabled={pending}
          className="shrink-0 gap-1.5"
          onClick={() => onToggleRead(!notification.read)}
        >
          <Check className="h-3.5 w-3.5" />
          {notification.read ? "Unread" : "Read"}
        </Button>
      </div>
    </Card>
  );
}

function toIsoOrNull(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
