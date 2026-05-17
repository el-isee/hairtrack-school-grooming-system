import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { subscribeClasses, createClass, deleteClass, updateClass } from "@/lib/services";
import type { SchoolClass } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/classes")({
  component: ClassesPage,
});

function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => subscribeClasses(setClasses), []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createClass(name.trim());
    setName("");
    toast.success("Class added");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Classes</h1>
        <p className="text-sm text-muted-foreground">Register classes used when adding students.</p>
      </div>

      <Card className="p-5">
        <form onSubmit={add} className="flex gap-2">
          <Input placeholder="e.g. S1, L3 CSA" value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" className="gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="divide-y">
          {classes.length === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground italic">No classes yet.</p>
          )}
          {classes.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4">
              {editId === c.id ? (
                <Input className="max-w-xs" value={editName} onChange={(e) => setEditName(e.target.value)} />
              ) : (
                <p className="font-medium">{c.name}</p>
              )}
              <div className="flex gap-1">
                {editId === c.id ? (
                  <>
                    <Button size="icon" variant="ghost" onClick={async () => {
                      await updateClass(c.id, editName.trim());
                      setEditId(null);
                      toast.success("Updated");
                    }}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(c.id); setEditName(c.name); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={async () => {
                      await deleteClass(c.id);
                      toast.success("Deleted");
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
