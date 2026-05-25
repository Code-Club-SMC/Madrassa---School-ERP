import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarRange, HandCoins, Globe, MessageSquareText, DatabaseBackup,
  Receipt, Banknote, ShieldCheck, Users2, type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsHub,
});

type Tile = { to: string; icon: LucideIcon; en: string; ur: string; desc: string };

const TILES: Tile[] = [
  { to: "/settings/academic-year", icon: CalendarRange, en: "Academic Year", ur: "تعلیمی سال", desc: "Current year, terms, and key milestones." },
  { to: "/settings/concessions", icon: HandCoins, en: "Fee Concessions", ur: "فیس رعایات", desc: "Orphan, hardship, merit and sibling discounts." },
  { to: "/settings/website", icon: Globe, en: "Website CMS", ur: "ویب سائٹ", desc: "Hero, announcements, gallery & theme." },
  { to: "/settings/templates", icon: MessageSquareText, en: "SMS / WhatsApp Templates", ur: "پیغام سانچے", desc: "Bilingual templates for fees, absence & results." },
  { to: "/settings/backup", icon: DatabaseBackup, en: "Backup & Restore", ur: "بیک اپ", desc: "Export full database, schedule automatic backups." },
  { to: "/teachers/salary", icon: Banknote, en: "Salary Slips", ur: "تنخواہ سلپ", desc: "Generate and print monthly teacher salary slips." },
  { to: "/finance/donations", icon: Receipt, en: "Donation Receipts", ur: "عطیات کی رسیدیں", desc: "Issue zakat / sadqa / general donation receipts." },
  { to: "/users", icon: Users2, en: "User Accounts", ur: "صارفین", desc: "Create admins, teachers and parent logins." },
  { to: "/audit", icon: ShieldCheck, en: "Audit Log", ur: "آڈٹ لاگ", desc: "Track every privileged action in the system." },
];

function SettingsHub() {
  return (
    <div>
      <PageHeader title="Settings" titleUrdu="ترتیبات" description="Central control panel for institutional configuration, communications, finance, and security." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map((t) => (
          <Link key={t.to} to={t.to as never} className="group">
            <Card className="p-5 h-full hover:border-primary/40 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <t.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-semibold leading-tight">{t.en}</p>
                  <p className="font-urdu text-sm text-muted-foreground">{t.ur}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
