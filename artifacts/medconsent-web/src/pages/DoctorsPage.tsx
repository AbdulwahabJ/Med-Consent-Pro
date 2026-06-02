import { useState } from "react";
import { Link } from "wouter";
import { useListDoctors, getListDoctorsQueryKey, useCreateDoctor, useUpdateDoctor, useDeleteDoctor, useListSpecialties, getListSpecialtiesQueryKey, useListBranches, getListBranchesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  fullNameAr: z.string().min(2, "الاسم الكامل بالعربي مطلوب"),
  fullNameEn: z.string().optional(),
  specialtyId: z.coerce.number().min(1, "التخصص مطلوب"),
  branchId: z.coerce.number().min(1, "الفرع مطلوب"),
  mobile: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function DoctorsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListDoctors({ search, limit: 20 }, { query: { queryKey: getListDoctorsQueryKey({ search, limit: 20 }) } });
  
  const { data: specialties } = useListSpecialties({ activeOnly: true }, { query: { queryKey: getListSpecialtiesQueryKey({ activeOnly: true }) } });
  const { data: branches } = useListBranches({ activeOnly: true }, { query: { queryKey: getListBranchesQueryKey({ activeOnly: true }) } });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateDoctor();
  const updateMutation = useUpdateDoctor();
  const deleteMutation = useDeleteDoctor();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      fullNameAr: "", fullNameEn: "", specialtyId: 0, branchId: 0, mobile: "", email: "", isActive: true 
    },
  });

  const onSubmit = (values: FormValues) => {
    const apiData = {
      ...values,
      fullNameEn: values.fullNameEn || undefined,
      mobile: values.mobile || undefined,
      email: values.email || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: apiData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
          toast({ title: "تم التحديث", description: "تم تحديث بيانات الطبيب بنجاح" });
          setIsSheetOpen(false);
        },
        onError: () => {
          toast({ title: "خطأ", description: "حدث خطأ أثناء التحديث", variant: "destructive" });
        }
      });
    } else {
      createMutation.mutate({ data: apiData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
          toast({ title: "تمت الإضافة", description: "تم تسجيل الطبيب بنجاح" });
          setIsSheetOpen(false);
        },
        onError: () => {
          toast({ title: "خطأ", description: "حدث خطأ أثناء الإضافة", variant: "destructive" });
        }
      });
    }
  };

  const openEdit = (doctor: any) => {
    setEditingId(doctor.id);
    form.reset({ 
      fullNameAr: doctor.fullNameAr, 
      fullNameEn: doctor.fullNameEn || "",
      specialtyId: doctor.specialtyId,
      branchId: doctor.branchId,
      mobile: doctor.mobile || "",
      email: doctor.email || "",
      isActive: doctor.isActive ?? true
    });
    setIsSheetOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ 
      fullNameAr: "", fullNameEn: "", specialtyId: 0, branchId: 0, mobile: "", email: "", isActive: true 
    });
    setIsSheetOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
        toast({ title: "تم الحذف", description: "تم حذف الطبيب بنجاح" });
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
          <h1 className="text-3xl font-bold text-foreground">الأطباء</h1>
          <p className="text-muted-foreground mt-1">إدارة الكادر الطبي</p>
        </div>
        <Button onClick={openNew} className="h-12 px-6 rounded-xl font-bold gap-2">
          <Plus className="w-5 h-5" />
          طبيب جديد
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="بحث بالاسم..." 
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
                  <th className="p-4 font-semibold text-muted-foreground">التخصص</th>
                  <th className="p-4 font-semibold text-muted-foreground">الفرع</th>
                  <th className="p-4 font-semibold text-muted-foreground">الحالة</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="p-4"><Skeleton className="h-6 w-48" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-32 mx-auto" /></td>
                    </tr>
                  ))
                ) : data?.doctors?.length ? (
                  data.doctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        <Link href={`/doctors/${doctor.id}`} className="hover:text-primary transition-colors">
                          {doctor.fullNameAr}
                        </Link>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{doctor.specialtyNameAr}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{doctor.branchNameAr}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={doctor.isActive ? "default" : "secondary"}>
                          {doctor.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/doctors/${doctor.id}`} className="text-sm font-medium text-primary hover:underline ml-2">
                            الملف
                          </Link>
                          <Button onClick={() => openEdit(doctor)} variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
                            <Edit className="w-5 h-5" />
                          </Button>
                          <Button onClick={() => setDeleteId(doctor.id)} variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive">
                            <Trash className="w-5 h-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Stethoscope className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg">لا يوجد أطباء حتى الآن</p>
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
            <SheetTitle>{editingId ? "تعديل بيانات الطبيب" : "تسجيل طبيب جديد"}</SheetTitle>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullNameAr" render={({ field }) => (
                <FormItem><FormLabel>الاسم الكامل بالعربي *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="fullNameEn" render={({ field }) => (
                <FormItem><FormLabel>الاسم بالإنجليزي</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="specialtyId" render={({ field }) => (
                <FormItem>
                  <FormLabel>التخصص *</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value ? field.value.toString() : ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التخصص" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {specialties?.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.nameAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="branchId" render={({ field }) => (
                <FormItem>
                  <FormLabel>الفرع *</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value ? field.value.toString() : ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفرع" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches?.map(b => (
                        <SelectItem key={b.id} value={b.id.toString()}>{b.nameAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem><FormLabel>رقم الجوال</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" className="text-right" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} dir="ltr" className="text-right" /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">الحالة (نشط / غير نشط)</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
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
              هل أنت متأكد من حذف هذا الطبيب؟ لا يمكن التراجع عن هذا الإجراء.
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