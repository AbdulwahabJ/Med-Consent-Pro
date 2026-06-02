import { useParams, Link } from "wouter";
import { useGetDoctor, getGetDoctorQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Edit } from "lucide-react";
import { format } from "date-fns";

export function DoctorProfilePage() {
  const params = useParams();
  const id = params.id ? parseInt(params.id) : 0;
  
  const { data: doctor, isLoading, isError } = useGetDoctor(id, { 
    query: { enabled: !!id, queryKey: getGetDoctorQueryKey(id) } 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">لم يتم العثور على الطبيب</h2>
        <Link href="/doctors" className="text-primary hover:underline mt-4 inline-block">العودة إلى قائمة الأطباء</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/doctors" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowRight className="w-4 h-4 ml-1" />
          العودة إلى الأطباء
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {doctor.fullNameAr}
              <Badge variant="outline" className="text-lg px-3 py-1">{doctor.specialtyNameAr}</Badge>
            </h1>
          </div>
          <Button variant="outline" className="gap-2">
            <Edit className="w-4 h-4" />
            تعديل
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">الفرع</p>
              <p className="font-medium">{doctor.branchNameAr}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">الجوال</p>
              <p className="font-medium font-mono dir-ltr text-right">{doctor.mobile || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
              <p className="font-medium dir-ltr text-right">{doctor.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">الحالة</p>
              <p className="font-medium">
                <Badge variant={doctor.isActive ? "default" : "secondary"}>
                  {doctor.isActive ? "نشط" : "غير نشط"}
                </Badge>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">تاريخ الانضمام</p>
              <p className="font-medium">{format(new Date(doctor.createdAt), "dd MMM yyyy")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 pt-4 border-t border-border">
        <Button disabled className="gap-2">
          مواعيد الطبيب
        </Button>
      </div>
    </div>
  );
}