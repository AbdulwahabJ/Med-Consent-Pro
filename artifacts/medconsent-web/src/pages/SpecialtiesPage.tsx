import { useState } from "react";
import { useListSpecialties, getListSpecialtiesQueryKey, useCreateSpecialty, useUpdateSpecialty, useDeleteSpecialty } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  nameAr: z.string().min(2, "الاسم بالعربي مطلوب"),
  nameEn: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function SpecialtiesPage() {
  const [search, setSearch] = useState("");
  const { data: specialtiesData, isLoading } = useListSpecialties(undefined, { query: { queryKey: getListSpecialtiesQueryKey() } });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateSpecialty();
  const updateMutation = useUpdateSpecialty();
  const deleteMutation = useDeleteSpecialty();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nameAr: "", nameEn: "", isActive: true },
  });

  const onSubmit = (values: FormValues) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSpecialtiesQueryKey() });
          toast({ title: "تم التحديث", description: "تم تحديث التخصص بنجاح" });
          setIsDialogOpen(false);
        },
        onError: () => {
          toast({ title: "خطأ", description: "حدث خطأ أثناء التحديث", variant: "destructive" });
        }
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSpecialtiesQueryKey() });
          toast({ title: "تمت الإضافة", description: "تمت إضافة التخصص بنجاح" });
          setIsDialogOpen(false);
        },
        onError: () => {
          toast({ title: "خطأ", description: "حدث خطأ أثناء الإضافة", variant: "destructive" });
        }
      });
    }
  };

  const openEdit = (specialty: any) => {
    setEditingId(specialty.id);
    form.reset({ nameAr: specialty.nameAr, nameEn: specialty.nameEn || "", isActive: specialty.isActive });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ nameAr: "", nameEn: "", isActive: true });
    setIsDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSpecialtiesQueryKey() });
        toast({ title: "تم الحذف", description: "تم حذف التخصص بنجاح" });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "خطأ", description: "حدث خطأ أثناء الحذف", variant: "destructive" });
        setDeleteId(null);
      }
    });
  };

  const filteredData = specialtiesData?.filter(s => s.nameAr.includes(search) || (s.nameEn && s.nameEn.includes(search))) || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التخصصات</h1>
          <p className="text-muted-foreground mt-1">إدارة التخصصات الطبية</p>
        </div>
        <Button onClick={openNew} className="h-12 px-6 rounded-xl font-bold gap-2">
          <Plus className="w-5 h-5" />
          تخصص جديد
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="ابحث..." 
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
                  <th className="p-4 font-semibold text-muted-foreground w-12">#</th>
                  <th className="p-4 font-semibold text-muted-foreground">الاسم</th>
                  <th className="p-4 font-semibold text-muted-foreground">الحالة</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="p-4"><Skeleton className="h-6 w-6" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-48" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-20 mx-auto" /></td>
                    </tr>
                  ))
                ) : filteredData.length ? (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 text-muted-foreground">{item.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-foreground">{item.nameAr}</div>
                        {item.nameEn && <div className="text-sm text-muted-foreground">{item.nameEn}</div>}
                      </td>
                      <td className="p-4">
                        <Badge variant={item.isActive ? "default" : "secondary"}>
                          {item.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button onClick={() => openEdit(item)} variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
                            <Edit className="w-5 h-5" />
                          </Button>
                          <Button onClick={() => setDeleteId(item.id)} variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive">
                            <Trash className="w-5 h-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      لا توجد تخصصات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل تخصص" : "تخصص جديد"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالعربي *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالإنجليزي</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">الحالة</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>حفظ</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التخصص؟ لا يمكن التراجع عن هذا الإجراء.
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