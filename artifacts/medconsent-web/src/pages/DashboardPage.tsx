import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Stethoscope, FileText, CheckCircle, Users, ClipboardList, FileText as FileIcon } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Link } from "wouter";

export function DashboardPage() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl lg:col-span-2" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = [
    { title: "الأطباء", value: summary?.totalDoctors ?? 0, icon: Stethoscope, color: "text-teal-600", bg: "bg-teal-500/10" },
    { title: "قوالب الموافقة", value: summary?.totalTemplates ?? 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-500/10" },
    { title: "موافقات اليوم", value: summary?.consentsTodayCount ?? 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-500/10" },
    { title: "المستخدمون النشطون", value: summary?.activeUsers ?? 0, icon: Users, color: "text-purple-600", bg: "bg-purple-500/10" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">نظرة عامة على نشاط نظام الموافقات</p>
        </div>
        <Link href="/fill-consent">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors h-12">
            <ClipboardList className="w-5 h-5" />
            <span>موافقة جديدة</span>
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle>سجل النشاطات الأخير</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.recentAuditLogs?.length ? (
              <div className="space-y-4">
                {summary.recentAuditLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="bg-background border border-border p-2 rounded-lg">
                      <FileIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        <span className="text-primary font-bold">{log.userFullNameAr}</span> قام بـ <span className="font-semibold">{log.action}</span>{log.entityType ? ` في ${log.entityType}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.createdAt), "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">لا توجد نشاطات حديثة</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { label: "تعبئة موافقة جديدة", icon: ClipboardList, href: "/fill-consent" },
              { label: "إدارة قوالب الموافقة", icon: FileText, href: "/templates" },
              { label: "إدارة الأطباء", icon: Stethoscope, href: "/doctors" },
              { label: "الأرشيف", icon: CheckCircle, href: "/archive" },
            ].map((action, i) => (
              <Link key={i} href={action.href}>
                <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all text-right">
                  <div className="bg-background shadow-sm p-2 rounded-lg">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">{action.label}</span>
                </button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
