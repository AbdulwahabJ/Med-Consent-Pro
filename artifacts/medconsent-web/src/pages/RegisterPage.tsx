import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        setUser(data);
        setLocation("/home");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password) {
      registerMutation.mutate({ data: { name, email, password } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-cyan-50/40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-primary text-primary-foreground flex items-center justify-center rounded-2xl mb-4 shadow-lg shadow-primary/25">
            <ClipboardList className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">بوابة الموافقات</h1>
          <p className="text-sm text-muted-foreground mt-1">أنشئ حسابك الآن</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {registerMutation.error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl text-center font-medium">
                {(registerMutation.error as any)?.error || "فشل إنشاء الحساب"}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">الاسم</Label>
              <Input
                id="name"
                type="text"
                className="h-12 text-base rounded-xl border-border/60 focus-visible:ring-primary"
                placeholder="اسمك الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                className="h-12 text-base text-left rounded-xl border-border/60 focus-visible:ring-primary"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                className="h-12 text-base text-left rounded-xl border-border/60 focus-visible:ring-primary"
                placeholder="6 أحرف على الأقل"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl mt-2"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
