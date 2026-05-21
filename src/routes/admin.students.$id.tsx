import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getStudent, getStudentShavings } from "@/lib/services";
import type { Shaving, Student } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Scissors } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/students/$id")({
  component: StudentDetail,
});

function StudentDetail() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [shavings, setShavings] = useState<Shaving[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await getStudent(id);
      setStudent(s);
      if (s) setShavings(await getStudentShavings(s.id));
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <p className="text-muted-foreground">{t("common.loading")}</p>;
  if (!student) return <p>{t("students.notFound")}</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/students" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("students.backToStudents")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            {student.photoURL ? (
              <img src={student.photoURL} className="h-28 w-28 rounded-full object-cover border-4 border-primary/20" />
            ) : (
              <div className="h-28 w-28 rounded-full bg-primary/15 text-primary flex items-center justify-center text-3xl font-bold">
                {student.fullName.split(" ").slice(0, 2).map((p) => p[0]).join("")}
              </div>
            )}
            <h2 className="mt-4 text-xl font-bold">{student.fullName}</h2>
            <p className="text-sm text-muted-foreground">{student.className}</p>
            <div className="mt-3"><StatusBadge student={student} /></div>
            <div className="mt-4 w-full p-3 rounded-lg bg-muted/50">
              <p className="text-xs uppercase text-muted-foreground">{t("students.secretCode")}</p>
              <p className="font-mono font-bold text-lg text-primary">{student.secretCode}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2 space-y-4">
          <h3 className="font-semibold">{t("students.paymentCuts")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Info label={t("students.paymentAmount")} value={`${student.paymentAmount.toLocaleString()} RWF`} />
            <Info label={t("students.paymentDate")} value={student.paymentDate ? format(new Date(student.paymentDate), "PPP") : "—"} />
            <Info label={t("students.remainingCuts")} value={student.remainingCuts} />
            <Info label={t("students.totalUsed")} value={student.totalCutsUsed} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Scissors className="h-4 w-4" /> {t("students.shavingHistory")}
        </h3>
        {shavings.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{t("students.noShavingsYet")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                  <th className="py-2">{t("students.date")}</th>
                  <th className="py-2">{t("students.barber")}</th>
                  <th className="py-2 text-right">{t("students.price")}</th>
                </tr>
              </thead>
              <tbody>
                {shavings.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-3">{format(new Date(s.createdAt), "PPp")}</td>
                    <td className="py-3">{s.barberName}</td>
                    <td className="py-3 text-right text-success font-medium">+{s.pricePerShave} RWF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}
