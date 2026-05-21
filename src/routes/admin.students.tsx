import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  subscribeClasses, subscribeStudents, createStudent, deleteStudent, resetStudentPayment,
  nameExists, updateStudent, uploadStudentPhoto,
} from "@/lib/services";
import type { SchoolClass, Student } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Trash2, RotateCcw, Eye, ImagePlus } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/admin/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dialog, setDialog] = useState(false);

  useEffect(() => {
    const a = subscribeStudents(setStudents);
    const b = subscribeClasses(setClasses);
    return () => { a(); b(); };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(
      (s) =>
        (classFilter === "all" || s.className === classFilter) &&
        (!q || s.fullName.toLowerCase().includes(q) || s.secretCode.toLowerCase().includes(q)),
    );
  }, [students, search, classFilter]);

  function exportPdf() {
    const docPdf = new jsPDF();
    docPdf.text("HairTrack — Student Payment Report", 14, 16);
    docPdf.setFontSize(10);
    docPdf.text(`${format(new Date(), "PPpp")}`, 14, 22);
    autoTable(docPdf, {
      startY: 28,
      head: [[t("students.fullName"), t("students.class"), t("students.code"), t("common.yes")+"/"+t("common.no"), t("students.remainingCuts"), t("students.totalUsed"), t("students.paymentAmount")]],
      body: filtered.map((s) => [
        s.fullName, s.className, s.secretCode, s.paid ? t("common.yes") : t("common.no"),
        s.remainingCuts, s.totalCutsUsed, s.paymentAmount,
      ]),
      headStyles: { fillColor: [14, 85, 102] },
    });
    docPdf.save(`students-${Date.now()}.pdf`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("students.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("students.countLine", { shown: filtered.length, total: students.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPdf} disabled={!filtered.length}>{t("common.exportPdf")}</Button>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> {t("students.addStudent")}</Button>
            </DialogTrigger>
            <DialogContent>
              <AddStudentForm classes={classes} onDone={() => setDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("students.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("students.allClasses")}</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">{t("students.student")}</th>
                <th className="text-left p-3">{t("students.class")}</th>
                <th className="text-left p-3">{t("students.code")}</th>
                <th className="text-left p-3">{t("students.status")}</th>
                <th className="text-right p-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">{t("students.noStudents")}</td></tr>
              )}
              {filtered.map((s) => (
                <StudentRow key={s.id} student={s} classes={classes} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StudentRow({ student, classes }: { student: Student; classes: SchoolClass[] }) {
  const { t } = useTranslation();
  const [delOpen, setDelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  return (
    <tr className="border-t hover:bg-muted/30">
      <td className="p-3">
        <div className="flex items-center gap-3">
          {student.photoURL ? (
            <img src={student.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
              {student.fullName.split(" ").slice(0, 2).map((p) => p[0]).join("")}
            </div>
          )}
          <div>
            <p className="font-medium">{student.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {t("students.addedOn", { date: format(new Date(student.createdAt), "MMM d, yyyy") })}
            </p>
          </div>
        </div>
      </td>
      <td className="p-3">{student.className}</td>
      <td className="p-3"><code className="font-mono bg-muted px-2 py-1 rounded text-xs">{student.secretCode}</code></td>
      <td className="p-3"><StatusBadge student={student} /></td>
      <td className="p-3 text-right">
        <div className="inline-flex gap-1">
          <Link to="/admin/students/$id" params={{ id: student.id }}>
            <Button size="icon" variant="ghost" title={t("common.view")}><Eye className="h-4 w-4" /></Button>
          </Link>
          <Button size="icon" variant="ghost" title={t("students.resetPayment")} onClick={async () => {
            await resetStudentPayment(student.id);
            toast.success(t("students.paymentReset"));
          }}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title={t("common.edit")} onClick={() => setEditOpen(true)}>
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title={t("common.delete")} onClick={() => setDelOpen(true)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <EditStudentForm student={student} classes={classes} onDone={() => setEditOpen(false)} />
          </DialogContent>
        </Dialog>

        <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("students.deleteTitle", { name: student.fullName })}</AlertDialogTitle>
              <AlertDialogDescription>{t("students.deleteDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                await deleteStudent(student.id);
                toast.success(t("students.studentDeleted"));
              }}>{t("common.delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  );
}

function AddStudentForm({ classes, onDone }: { classes: SchoolClass[]; onDone: () => void }) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState(classes[0]?.name ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [paid, setPaid] = useState(true);
  const [warn, setWarn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    if (!fullName.trim() || !className) {
      toast.error(t("students.fillRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const created = await createStudent({ fullName, className, photoFile, paid });
      toast.success(t("students.studentAdded", { code: created.secretCode }));
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
      setWarn(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !className) return toast.error(t("students.allRequired"));
    if (await nameExists(fullName)) { setWarn(true); return; }
    save();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{t("students.addNew")}</DialogTitle>
        <DialogDescription>{t("students.addDesc")}</DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-4 flex-wrap">
        {preview ? (
          <img src={preview} alt="" className="h-16 w-16 rounded-full object-cover border" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground text-center px-1">{t("common.optional")}</div>
        )}
        <div className="flex gap-2 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)); }
            }} />
            <span className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-muted">{t("students.choosePhoto")}</span>
          </label>
          <label className="cursor-pointer sm:hidden">
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)); }
            }} />
            <span className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-muted">{t("students.useCamera")}</span>
          </label>
          {preview && (
            <button type="button" onClick={() => { setPhotoFile(null); setPreview(""); }}
              className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-muted text-destructive">{t("students.remove")}</button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("students.photoOptional")}</p>

      <div className="space-y-2">
        <Label>{t("students.fullName")}</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>{t("students.class")}</Label>
        <Select value={className} onValueChange={setClassName}>
          <SelectTrigger><SelectValue placeholder={t("students.pickClass")} /></SelectTrigger>
          <SelectContent>
            {classes.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">{t("students.createClassFirst")}</div>}
            {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
        {t("students.markPaid")}
      </label>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={submitting}>{submitting ? t("common.saving") : t("common.save")}</Button>
      </DialogFooter>

      <AlertDialog open={warn} onOpenChange={setWarn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("students.duplicateName")}</AlertDialogTitle>
            <AlertDialogDescription>{t("students.duplicateDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={save}>{t("common.continue")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

function EditStudentForm({ student, classes, onDone }: { student: Student; classes: SchoolClass[]; onDone: () => void }) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(student.fullName);
  const [className, setClassName] = useState(student.className);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(student.photoURL || "");
  const [saving, setSaving] = useState(false);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        const patch: Partial<Student> = { fullName, className };
        if (photoFile) patch.photoURL = await uploadStudentPhoto(photoFile, student.id);
        await updateStudent(student.id, patch);
        toast.success(t("students.studentUpdated"));
        onDone();
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setSaving(false);
      }
    }} className="space-y-4">
      <DialogHeader><DialogTitle>{t("students.editStudent")}</DialogTitle></DialogHeader>

      <div className="flex items-center gap-4 flex-wrap">
        {preview ? (
          <img src={preview} alt="" className="h-16 w-16 rounded-full object-cover border" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">{t("students.noPhoto")}</div>
        )}
        <div className="flex gap-2 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)); }
            }} />
            <span className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-muted">{t("students.choosePhoto")}</span>
          </label>
          <label className="cursor-pointer sm:hidden">
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)); }
            }} />
            <span className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-muted">{t("students.useCamera")}</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("students.fullName")}</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>{t("students.class")}</Label>
        <Select value={className} onValueChange={setClassName}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("common.saveChanges")}</Button>
      </DialogFooter>
    </form>
  );
}
