import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquareText, Save, Copy, Smartphone, Send } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/templates")({
  component: TemplatesPage,
});

type ChannelKey = "sms" | "whatsapp";
type Template = {
  id: string;
  key: string;
  title: string;
  titleUrdu: string;
  description: string;
  trigger: string;
  enabled: boolean;
  en: string;
  ur: string;
};

const SEED: Template[] = [
  {
    id: "t1", key: "FEE_REMINDER", title: "Fee Reminder", titleUrdu: "فیس یاد دہانی",
    description: "Sent automatically 3 days before due date and again on the due date.",
    trigger: "On fee due date · -3 days",
    enabled: true,
    en: "Assalam-u-Alaikum {{guardian}}. Monthly fee for {{student}} ({{rollNo}}) of {{amount}} is due on {{dueDate}}. Please pay at the office or via bank transfer. — MSMIS",
    ur: "السلام علیکم {{guardian}}۔ {{student}} ({{rollNo}}) کی ماہانہ فیس {{amount}} {{dueDate}} تک واجب الادا ہے۔ براہ کرم دفتر یا بینک ٹرانسفر کے ذریعے ادا کریں۔ — مدینۃ الصالحین",
  },
  {
    id: "t2", key: "FEE_OVERDUE", title: "Fee Overdue Notice", titleUrdu: "فیس بقایا اطلاع",
    description: "Triggered when a fee remains unpaid 7 days past the due date.",
    trigger: "On overdue · +7 days",
    enabled: true,
    en: "Reminder: {{student}} ({{rollNo}}) has an overdue fee of {{amount}}. Kindly settle by {{newDueDate}} to avoid late fee. — MSMIS",
    ur: "یاد دہانی: {{student}} ({{rollNo}}) کی فیس {{amount}} بقایا ہے۔ براہِ کرم {{newDueDate}} تک ادا کریں ورنہ لیٹ فیس عائد ہوگی۔ — مدینۃ الصالحین",
  },
  {
    id: "t3", key: "ABSENCE_ALERT", title: "Absence Alert", titleUrdu: "غیر حاضری اطلاع",
    description: "Sent to guardian on the same day a student is marked absent.",
    trigger: "On attendance · status=absent",
    enabled: true,
    en: "Note: {{student}} ({{rollNo}}) was marked absent today ({{date}}). If this is a planned leave, please notify the office. — MSMIS",
    ur: "اطلاع: {{student}} ({{rollNo}}) آج ({{date}}) غیر حاضر ہیں۔ اگر چھٹی منظور شدہ ہے تو دفتر کو مطلع کریں۔ — مدینۃ الصالحین",
  },
  {
    id: "t4", key: "EXAM_RESULT", title: "Exam Result Published", titleUrdu: "نتیجہ شائع",
    description: "Sent when results for an exam are released to the parents portal.",
    trigger: "On result publish",
    enabled: true,
    en: "Result for {{examName}}: {{student}} scored {{percentage}}% — Grade {{grade}}. Full DMC available on parents portal. — MSMIS",
    ur: "نتیجہ {{examName}}: {{student}} نے {{percentage}}٪ نمبر حاصل کیے — گریڈ {{grade}}۔ مکمل ڈی ایم سی پورٹل پر دستیاب ہے۔ — مدینۃ الصالحین",
  },
  {
    id: "t5", key: "ADMISSION_DECISION", title: "Admission Decision", titleUrdu: "داخلہ کا فیصلہ",
    description: "Sent to the applicant when admission status is updated.",
    trigger: "On application status change",
    enabled: false,
    en: "Application {{refNo}} for {{student}}: {{status}}. {{nextStep}} — MSMIS",
    ur: "درخواست {{refNo}} برائے {{student}}: {{status}}۔ {{nextStep}} — مدینۃ الصالحین",
  },
];

const VARS = ["{{guardian}}", "{{student}}", "{{rollNo}}", "{{amount}}", "{{dueDate}}", "{{newDueDate}}", "{{date}}", "{{examName}}", "{{percentage}}", "{{grade}}", "{{refNo}}", "{{status}}", "{{nextStep}}"];

function TemplatesPage() {
  const [items, setItems] = useState<Template[]>(SEED);
  const [active, setActive] = useState(SEED[0].id);
  const [channel, setChannel] = useState<ChannelKey>("sms");
  const [senderId, setSenderId] = useState("MSMIS");

  const current = items.find((t) => t.id === active)!;

  const update = (patch: Partial<Template>) => setItems((p) => p.map((t) => t.id === active ? { ...t, ...patch } : t));

  const insert = (v: string, lang: "en" | "ur") => {
    const next = `${current[lang]} ${v}`.trim();
    update({ [lang]: next } as Partial<Template>);
  };

  return (
    <div>
      <PageHeader
        title="SMS & WhatsApp Templates"
        titleUrdu="پیغام سانچے"
        description="Bilingual message templates for automated parent communications. Use {{variables}} for dynamic content."
        actions={<Button className="gap-1.5" onClick={() => toast.success("All templates saved")}><Save className="h-4 w-4" />Save All</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* List */}
        <Card className="p-2 space-y-1 h-fit">
          {items.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)} className={`w-full text-start p-3 rounded-lg transition-colors ${active === t.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">{t.key}</span>
                {t.enabled ? <Badge className="bg-chart-1/15 text-chart-1 border-0 h-4 px-1.5 text-[9px]">ON</Badge> : <Badge variant="outline" className="h-4 px-1.5 text-[9px]">OFF</Badge>}
              </div>
              <p className="text-sm font-medium leading-tight">{t.title}</p>
              <p className="font-urdu text-xs text-muted-foreground">{t.titleUrdu}</p>
            </button>
          ))}
        </Card>

        {/* Editor */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
              <div>
                <h2 className="font-heading text-xl font-bold">{current.title} <span className="font-urdu text-base text-muted-foreground ms-2">{current.titleUrdu}</span></h2>
                <p className="text-xs text-muted-foreground mt-1">{current.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">⚡ {current.trigger}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs"><Switch checked={current.enabled} onCheckedChange={(v) => update({ enabled: v })} />Active</div>
              </div>
            </div>

            <Tabs value={channel} onValueChange={(v) => setChannel(v as ChannelKey)} className="mb-3">
              <TabsList>
                <TabsTrigger value="sms" className="gap-1.5"><Smartphone className="h-3.5 w-3.5" />SMS</TabsTrigger>
                <TabsTrigger value="whatsapp" className="gap-1.5"><Send className="h-3.5 w-3.5" />WhatsApp</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BilingualLabel urdu="انگریزی متن" english="English Body">
                <Textarea value={current.en} onChange={(e) => update({ en: e.target.value })} rows={5} className="font-mono text-xs" />
                <p className="text-[10px] text-muted-foreground mt-1">{current.en.length} chars · {Math.ceil(current.en.length / 160)} SMS part(s)</p>
              </BilingualLabel>
              <BilingualLabel urdu="اردو متن" english="Urdu Body">
                <Textarea value={current.ur} onChange={(e) => update({ ur: e.target.value })} rows={5} className="font-urdu text-right" dir="rtl" />
                <p className="text-[10px] text-muted-foreground mt-1">{current.ur.length} chars · {Math.ceil(current.ur.length / 70)} Unicode SMS part(s)</p>
              </BilingualLabel>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold mb-2">Insert variable:</p>
              <div className="flex flex-wrap gap-1.5">
                {VARS.map((v) => (
                  <button key={v} onClick={() => insert(v, "en")} className="font-mono text-[10px] px-2 py-1 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors">{v}</button>
                ))}
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3">PREVIEW · پیش نظارہ</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 max-w-sm">
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mb-1 font-mono">📱 From: {senderId}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{current.en.replace(/{{(\w+)}}/g, (_, k) => `<${k}>`)}</p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 max-w-sm">
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mb-1 font-mono">📱 From: {senderId}</p>
                <p className="font-urdu text-sm leading-relaxed text-right whitespace-pre-wrap" dir="rtl">{current.ur.replace(/{{(\w+)}}/g, (_, k) => `<${k}>`)}</p>
              </div>
            </div>
          </Card>

          {/* Gateway */}
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3">GATEWAY CONFIGURATION · گیٹ وے سیٹنگ</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <BilingualLabel urdu="سینڈر آئی ڈی" english="Sender ID / Brand"><Input value={senderId} onChange={(e) => setSenderId(e.target.value)} /></BilingualLabel>
              <BilingualLabel urdu="ایس ایم ایس API" english="SMS Gateway API"><Input placeholder="https://sms.…" /></BilingualLabel>
              <BilingualLabel urdu="واٹس ایپ API" english="WhatsApp Cloud API"><Input placeholder="Bearer token" type="password" /></BilingualLabel>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { navigator.clipboard.writeText(channel === "sms" ? current.en : current.ur); toast.success("Copied to clipboard"); }}><Copy className="h-3.5 w-3.5" />Copy</Button>
              <Button size="sm" className="gap-1.5" onClick={() => toast.success("Test message sent to admin number")}><Send className="h-3.5 w-3.5" />Send Test</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}