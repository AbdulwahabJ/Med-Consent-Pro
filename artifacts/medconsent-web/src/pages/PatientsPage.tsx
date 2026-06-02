import { useState } from "react";
import { Link } from "wouter";
import { useListPatients, getListPatientsQueryKey, useCreatePatient, useUpdatePatient, useDeletePatient } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  fullNameAr: z.string().min(2, "الاسم الكامل مطلوب"),
  fileNumber: z.string().min(1, "رقم الملف مطلوب"),
  nationalId: z.string().optional(),
  mobile: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function PatientsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListPatients({ search, limit: 20 }, { query: { queryKey: getListPatientsQueryKey({ search, limit: 20 }) } });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      fullNameAr: "", fileNumber: "", nationalId: "", mobile: "", 
      dateOfBirth: "", gender: "male", allergies: "", medicalHistory: "", notes: "", isActive: true 
    },
  });

  const onSubmit = (values: FormValues) => {
    // API expects a valid ISO date or empty string. Since it's a string from input date, it usually looks like "YYYY-MM-DD"
    // Coerce empty strings to undefined to match API types
    const apiData = {
      ...values,
      nationalId: values.nationalId || undefined,
      mobile: values.mobile || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      allergies: values.allergies || undefined,
      medicalHistory: values.medicalHistory || undefined,
      notes: values.notes || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: apiData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
          toast({ title: "تم التحديث", description: "تم تحديث بيانات المريض بنجاح" });
          setIsSheetOpen(false);
        },
        onError: () => {
          toast({ title: "خطأ", description: "رقم الملف قد يكون مستخدماً مسبقاً أو هناك خطأ آخر", variant: "destructive" });
        }
      });
    } else {
      createMutation.mutate({ data: apiData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
          toast({ title: "تمت الإضافة", description: "تم تسجيل المريض بنجاح" });
          setIsSheetOpen(false);
        },
        onError: () => {
          toast({ title: "خطأ", description: "رقم الملف مستخدم مسبقاً أو هناك خطأ آخر", variant: "destructive" });
        }
      });
    }
  };

  const openEdit = (patient: any) => {
    setEditingId(patient.id);
    form.reset({ 
      fullNameAr: patient.fullNameAr, 
      fileNumber: patient.fileNumber,
      nationalId: patient.nationalId || "",
      mobile: patient.mobile || "",
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : "",
      gender: patient.gender || "male",
      allergies: patient.allergies || "",
      medicalHistory: patient.medicalHistory || "",
      notes: patient.notes || "",
      isActive: patient.isActive ?? true
    });
    setIsSheetOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ 
      fullNameAr: "", fileNumber: "", nationalId: "", mobile: "", 
      dateOfBirth: "", gender: "male", allergies: "", medicalHistory: "", notes: "", isActive: true 
    });
    setIsSheetOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        toast({ title: "تم الحذف", description: "تم حذف المريض بنجاح" });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "خطأ", description: "حدث خطأ أثناء الحذف", variant: "destructive" });
        setDeleteId(null);
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المرضى</h1>
          <p className="text-muted-foreground mt-1">إدارة ملفات المرضى</p>
        </div>
        <Button onClick={openNew} className="h-12 px-6 rounded-xl font-bold gap-2">
          <Plus className="w-5 h-5" />
          مريض جديد
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="بحث بالاسم أو رقم الملف أو الهاتف أو الهوية" 
                className="pl-4 pr-10 h-12 bg-muted/50 border-transparent focus:bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 font-semibold text-muted-foreground">الاسم</th>
                  <th className="p-4 font-semibold text-muted-foreground">رقم الملف</th>
                  <th className="p-4 font-semibold text-muted-foreground">الجوال</th>
                  <th className="p-4 font-semibold text-muted-foreground">الجنس</th>
                  <th className="p-4 font-semibold text-muted-foreground">الحالة</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="p-4"><Skeleton className="h-6 w-48" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-32 mx-auto" /></td>
                    </tr>
                  ))
                ) : data?.patients?.length ? (
                  data.patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold text-foreground">{patient.fullNameAr}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-mono">{patient.fileNumber}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground dir-ltr text-right">{patient.mobile || "-"}</td>
                      <td className="p-4">
                        <Badge variant="secondary">
                          {patient.gender === "male" ? "ذكر" : patient.gender === "female" ? "أنثى" : "-"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={patient.isActive ? "default" : "secondary"}>
                          {patient.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/patients/${patient.id}`} className="text-sm font-medium text-primary hover:underline ml-2">
                            عرض الملف
                          </Link>
                          <Button onClick={() => openEdit(patient)} variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
                            <Edit className="w-5 h-5" />
                          </Button>
                          <Button onClick={() => setDeleteId(patient.id)} variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive">
                            <Trash className="w-5 h-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg">لا يوجد مرضى حتى الآن</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingId ? "تعديل بيانات المريض" : "تسجيل مريض جديد"}</SheetTitle>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullNameAr" render={({ field }) => (
                <FormItem><FormLabel>الاسم الكامل *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="fileNumber" render={({ field }) => (
                <FormItem><FormLabel>رقم الملف *</FormLabel><FormControl><Input {...field} dir="ltr" className="text-right" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="nationalId" render={({ field }) => (
                <FormItem><FormLabel>رقم الهوية / الإقامة</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" className="text-right" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem><FormLabel>رقم الجوال</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" className="text-right" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                <FormItem><FormLabel>تاريخ الميلاد</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>الجنس</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="allergies" render={({ field }) => (
                <FormItem><FormLabel>الحساسية من الأدوية</FormLabel><FormControl><Textarea {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="medicalHistory" render={({ field }) => (
                <FormItem><FormLabel>التاريخ الطبي</FormLabel><FormControl><Textarea {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="pt-4 flex gap-3">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">حفظ</Button>
                <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="flex-1">إلغاء</Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المريض؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}