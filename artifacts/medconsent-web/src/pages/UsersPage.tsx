import { useState } from "react";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListUsers({ search }, { 
    query: { queryKey: getListUsersQueryKey({ search }) } 
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-1">إضافة وتعديل صلاحيات الأطباء والموظفين</p>
        </div>
        <Button className="h-12 px-6 rounded-xl font-bold gap-2">
          <Plus className="w-5 h-5" />
          مستخدم جديد
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="ابحث بالاسم أو البريد..." 
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
                  <th className="p-4 font-semibold text-muted-foreground">البريد الإلكتروني</th>
                  <th className="p-4 font-semibold text-muted-foreground">الدور</th>
                  <th className="p-4 font-semibold text-muted-foreground">تاريخ الانضمام</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="p-4"><Skeleton className="h-6 w-6" /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-6 w-32" />
                        </div>
                      </td>
                      <td className="p-4"><Skeleton className="h-6 w-48" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-20 mx-auto" /></td>
                    </tr>
                  ))
                ) : data?.users?.length ? (
                  data.users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 text-muted-foreground">{user.id}</td>
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <UserCircle className="w-6 h-6" />
                          </div>
                          <span>{user.fullNameAr}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground dir-ltr text-right">{user.email}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
                          {user.roleDisplayNameAr}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {format(new Date(user.createdAt), "dd MMM yyyy")}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
                            <Edit className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive">
                            <Trash className="w-5 h-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      لا يوجد مستخدمين
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
