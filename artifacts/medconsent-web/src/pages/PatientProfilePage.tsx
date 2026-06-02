import { useParams, Link } from "wouter";
import { useGetPatient, getGetPatientQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, AlertTriangle, Activity, Edit } from "lucide-react";
import { format } from "date-fns";

export function PatientProfilePage() {
  const params = useParams();
  const id = params.id ? parseInt(params.id) : 0;
  
  const { data: patient, isLoading, isError } = useGetPatient(id, { 
    query: { enabled: !!id, queryKey: getGetPatientQueryKey(id) } 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">لم يتم العثور على المريض</h2>
        <Link href="/patients" className="text-primary hover:underline mt-4 inline-block">العودة إلى قائمة المرضى</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/patients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowRight className="w-4 h-4 ml-1" />
          العودة إلى المرضى
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {patient.fullNameAr}
              <Badge variant="outline" className="text-lg font-mono px-3 py-1">{patient.fileNumber}</Badge>
            </h1>
          </div>
          <Button variant="outline" className="gap-2">
            <Edit className="w-4 h-4" />
            تعديل
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2 shadow-sm border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">رقم الهوية</p>
                <p className="font-medium font-mono">{patient.nationalId || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">الجوال</p>
                <p className="font-medium font-mono dir-ltr text-right">{patient.mobile || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">الجنس</p>
                <p className="font-medium">{patient.gender === "male" ? "ذكر" : patient.gender === "female" ? "أنثى" : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">تاريخ الميلاد</p>
                <p className="font-medium">{patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "dd MMM yyyy") : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">تاريخ التسجيل</p>
                <p className="font-medium">{format(new Date(patient.createdAt), "dd MMM yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <CardTitle className="text-lg">الحساسية من الأدوية</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{patient.allergies || "لا توجد حساسية مسجلة"}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <CardTitle className="text-lg">التاريخ الطبي</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{patient.medicalHistory || "لا يوجد تاريخ طبي مسجل"}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/50 text-accent-foreground flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <CardTitle className="text-lg">ملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{patient.notes || "لا توجد ملاحظات"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 pt-4 border-t border-border">
        <Button disabled className="gap-2">
          موافقة جديدة
        </Button>
        <Button disabled variant="outline" className="gap-2">
          تقرير جديد
        </Button>
      </div>
    </div>
  );
}