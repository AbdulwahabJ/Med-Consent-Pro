import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ClipboardList, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function DoctorHomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-xl font-bold text-primary">بوابة موافقات الطبيب</h1>
          <p className="text-xs text-muted-foreground">Doctor Consent Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{user?.fullNameAr}</p>
            <p className="text-xs text-muted-foreground">{user?.roleDisplayNameAr}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded-lg hover:bg-destructive/10"
          >
            خروج
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg space-y-6"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">
              مرحباً، {user?.fullNameAr}
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">ماذا تريد أن تفعل اليوم؟</p>
          </div>

          <div className="grid gap-4">
            <Link href="/new-consent">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-6 p-8 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors text-right"
              >
                <div className="bg-white/20 p-4 rounded-xl">
                  <ClipboardList className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">موافقة جديدة</h3>
                  <p className="text-primary-foreground/80 mt-1">إنشاء نموذج موافقة لمريض</p>
                </div>
              </motion.button>
            </Link>

            <Link href="/previous-consents">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-6 p-8 rounded-2xl bg-card border-2 border-border shadow-sm hover:border-primary/40 hover:bg-accent transition-colors text-right"
              >
                <div className="bg-muted p-4 rounded-xl">
                  <Clock className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">الموافقات السابقة</h3>
                  <p className="text-muted-foreground mt-1">عرض وتحميل الموافقات المكتملة</p>
                </div>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        بوابة موافقات الطبيب
      </footer>
    </div>
  );
}
