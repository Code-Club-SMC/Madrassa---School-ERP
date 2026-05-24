import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  madrassaCategories,
  schoolClasses,
  type Student,
  type System,
} from "@/mock";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system: Extract<System, "madrassa" | "school">;
  onAdd: (s: Student) => void;
};

export function AddStudentDialog({ open, onOpenChange, system, onAdd }: Props) {
  const [name, setName] = useState("");
  const [nameUrdu, setNameUrdu] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [groupId, setGroupId] = useState<string>("");
  const [subId, setSubId] = useState<string>("");
  const [section, setSection] = useState("A");
  const [fee, setFee] = useState("");
  const [phone, setPhone] = useState("");
  const [guardian, setGuardian] = useState("");
  const [guardianUrdu, setGuardianUrdu] = useState("");

  const category =
    system === "madrassa" ? madrassaCategories.find((c) => c.id === groupId) : null;

  const reset = () => {
    setName("");
    setNameUrdu("");
    setGroupId("");
    setSubId("");
    setFee("");
    setPhone("");
    setGuardian("");
    setGuardianUrdu("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nameUrdu || !groupId || !fee || !phone) {
      toast.error("Please fill all required fields", {
        description: "تمام ضروری خانے پُر کریں",
      });
      return;
    }
    const id = `S${Date.now()}`;
    const newStudent: Student = {
      id,
      rollNo:
        system === "madrassa"
          ? `${(category?.subcategories.find((s) => s.id === subId)?.rollPrefix ?? "NEW")}-${Math.floor(
              Math.random() * 900 + 100,
            )}`
          : `SCH-${Date.now().toString().slice(-6)}`,
      name,
      nameUrdu,
      gender,
      dob: new Date().toISOString(),
      address: "—",
      system,
      categoryId: system === "madrassa" ? groupId : undefined,
      subcategoryId: system === "madrassa" ? subId : undefined,
      classId: system === "school" ? groupId : undefined,
      section: system === "school" ? section : undefined,
      monthlyFee: Number(fee) || 0,
      status: "active",
      admissionDate: new Date().toISOString(),
      guardianName: guardian || "—",
      guardianNameUrdu: guardianUrdu || "—",
      guardianPhone: phone,
      guardianCnic: "—",
    };
    onAdd(newStudent);
    toast.success("Student added", { description: "نیا طالبِ علم شامل ہو گیا" });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-start">
          <DialogTitle className="font-heading">Add New Student</DialogTitle>
          <DialogDescription className="font-urdu text-base">
            نیا طالبِ علم شامل کریں
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name (English)" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Muhammad Ali" />
            </Field>
            <Field label="نام (اردو)" required>
              <Input
                value={nameUrdu}
                onChange={(e) => setNameUrdu(e.target.value)}
                className="font-urdu"
                placeholder="محمد علی"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Gender — جنس">
              <Select value={gender} onValueChange={(v: "male" | "female") => setGender(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male — مرد</SelectItem>
                  <SelectItem value="female">Female — خاتون</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Monthly Fee (PKR)" required>
              <Input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="2500"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={system === "madrassa" ? "Category — درجہ" : "Class — جماعت"} required>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(system === "madrassa" ? madrassaCategories : schoolClasses).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="font-urdu">{g.nameUrdu}</span>
                      <span className="ms-2 text-xs text-muted-foreground">{g.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {system === "madrassa" ? (
              <Field label="Subcategory">
                <Select value={subId} onValueChange={setSubId} disabled={!category}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {category?.subcategories.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="font-urdu">{s.nameUrdu}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <Field label="Section — سیکشن">
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Guardian Name">
              <Input value={guardian} onChange={(e) => setGuardian(e.target.value)} />
            </Field>
            <Field label="ولی کا نام">
              <Input
                value={guardianUrdu}
                onChange={(e) => setGuardianUrdu(e.target.value)}
                className="font-urdu"
              />
            </Field>
          </div>

          <Field label="Guardian Phone — رابطہ نمبر" required>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300-1234567"
              className="font-mono"
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Student <span className="font-urdu text-xs ms-1">داخل کریں</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}