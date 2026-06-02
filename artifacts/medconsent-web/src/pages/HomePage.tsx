import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Plus, Archive, Users, FileText, ChevronLeft } from "lucide-react";

const secondaryCards = [
  {
    href: "/previous-consents",
    label: "الموافقات السابقة",
    description: "عرض وتنزيل الموافقات المكتملة",
    icon: Archive,
    color: "text-indigo-500 bg-indigo-50",
  },
  {
    href: "/patients",
    label: "المرضى",
    description: "سجلات المرضى وموافقاتهم",
    icon: Users,
    color: "text-violet-500 bg-violet-50",
  },
  {
    href: "/consent-templates",
    label: "قوالب الموافقة",
    description: "رفع وإدارة قوالب PDF",
    icon: FileText,
    color: "text-amber-500 bg-amber-50",
  },
];

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto py-6 px-2 md:py-10">
      <div className="space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-sm text-muted-foreground mb-1">مرحباً بك</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {user?.name ?? "..."}
          </h1>
        </motion.div>

        {/* Primary Action */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.07 }}
        >
          <Link href="/new-consent">
            <div className="group relative bg-primary rounded-2xl p-7 cursor-pointer shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.99] transition-all duration-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">إنشاء موافقة جديدة</h2>
                <p className="text-sm text-white/70">ابدأ نموذج موافقة جديد الآن</p>
              </div>
              <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-6 h-6 text-white/60" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Secondary Cards */}
        <div className="grid grid-cols-1 gap-3">
          {secondaryCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: (i + 2) * 0.07 }}
              >
                <Link href={card.href}>
                  <div className="group flex items-center gap-4 bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm active:scale-[0.99] transition-all duration-150">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{card.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.description}</p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/50 transition-colors shrink-0" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
