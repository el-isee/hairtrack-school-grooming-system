import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
    docPdf.text(`Generated ${format(new Date(), "PPpp")}`, 14, 22);
    autoTable(docPdf, {
      startY: 28,
      head: [["Name", "Class", "Code", "Paid", "Remaining", "Used", "Amount"]],
      body: filtered.map((s) => [
        s.fullName, s.className, s.secretCode, s.paid ? "Yes" : "No",
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
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {students.length} students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPdf} disabled={!filtered.length}>Export PDF</Button>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Add student</Button>
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
            <Input className="pl-9" placeholder="Search by name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
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
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Class</th>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No students found</td></tr>
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
            <p className="text-xs text-muted-foreground">Added {format(new Date(student.createdAt), "MMM d, yyyy")}</p>
          </div>
        </div>
      </td>
      <td className="p-3">{student.className}</td>
      <td className="p-3"><code className="font-mono bg-muted px-2 py-1 rounded text-xs">{student.secretCode}</code></td>
      <td className="p-3"><StatusBadge student={student} /></td>
      <td className="p-3 text-right">
        <div className="inline-flex gap-1">
          <Link to="/admin/students/$id" params={{ id: student.id }}>
            <Button size="icon" variant="ghost" title="View"><Eye className="h-4 w-4" /></Button>
          </Link>
          <Button size="icon" variant="ghost" title="Reset payment" onClick={async () => {
            await resetStudentPayment(student.id);
            toast.success("Payment reset");
          }}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditOpen(true)}>
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title="Delete" onClick={() => setDelOpen(true)}>
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
              <AlertDialogTitle>Delete {student.fullName}?</AlertDialogTitle>
              <AlertDialogDescription>This permanently removes the student record.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                await deleteStudent(student.id);
                toast.success("Student deleted");
              }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  );
}

function AddStudentForm({ classes, onDone }: { classes: SchoolClass[]; onDone: () => void }) {
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState(classes[0]?.name ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [paid, setPaid] = useState(true);
  const [warn, setWarn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    if (!fullName.trim() || !className) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createStudent({ fullName, className, photoFile, paid });
      toast.success(`Student added. Secret code: ${created.secretCode}`);
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
    if (!fullName.trim() || !className) return toast.error("All fields required");
    if (await nameExists(fullName)) { setWarn(true); return; }
    save();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Add new student</DialogTitle>
        <DialogDescription>A unique secret code will be generated automatically.</DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-4 flex-wrap">
        {preview ? (
          <img src={preview} alt="" className="h-16 w-16 rounded-full object-cover border" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground text-center px-1">Optional</div>
        )}
        <div className="flex gap-2 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)); }
            }} />
            <span className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-muted">Choose photo</span>
          </label>
          <label className="cursor-pointer sm:hidden">
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)); }
            }} />
            <span className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-muted">Use camera</span>
          </label>
          {preview && (
            <button type="button" onClick={() => { setPhotoFile(null); setPreview(""); }}
              className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-muted text-destructive">Remove</button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Photo is optional.</p>

      <div className="space-y-2">
        <Label>Full name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>Class</Label>
        <Select value={className} onValueChange={setClassName}>
          <SelectTrigger><SelectValue placeholder="Pick a class" /></SelectTrigger>
          <SelectContent>
            {classes.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">Create a class first</div>}
            {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
        Mark term payment as paid now
      </label>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
      </DialogFooter>

      <AlertDialog open={warn} onOpenChange={setWarn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate name</AlertDialogTitle>
            <AlertDialogDescription>
              This student name already exists. Continue registration?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={save}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

function EditStudentForm({ student, classes, onDone }: { student: Student; classes: SchoolClass[]; onDone: () => void }) {
  const [fullName, setFullName] = useState(student.fullName);
  const [className, setClassName] = useState(student.className);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      await updateStudent(student.id, { fullName, className });
      toast.success("Student updated");
      onDone();
    }} className="space-y-4">
      <DialogHeader><DialogTitle>Edit student</DialogTitle></DialogHeader>
      <div className="space-y-2">
        <Label>Full name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Class</Label>
        <Select value={className} onValueChange={setClassName}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
}
