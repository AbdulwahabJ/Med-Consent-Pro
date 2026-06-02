import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Users, UserRound, Stethoscope, FileText, Files, Archive, Settings, LogOut } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const links = [
    { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/patients", label: "المرضى", icon: UserRound },
    { href: "/doctors", label: "الأطباء", icon: Stethoscope },
    { href: "/templates", label: "القوالب", icon: FileText },
    { href: "/forms", label: "النماذج", icon: Files },
    { href: "/archive", label: "الأرشيف", icon: Archive },
  ];

  if (user?.permissions.includes("manage_users")) {
    links.push({ href: "/users", label: "المستخدمون", icon: Users });
  }

  links.push({ href: "/settings", label: "الإعدادات", icon: Settings });

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-border">
        <div className="bg-primary/10 text-primary p-2 rounded-xl">
          <Stethoscope className="w-8 h-8" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-primary">مجمع السن الرقمي</h1>
          <p className="text-xs text-muted-foreground">نظام إدارة النماذج الطبية</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors min-h-[44px] ${isActive ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl">
          <div>
            <p className="font-semibold text-sm">{user?.fullNameAr}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.roleDisplayNameAr}</p>
          </div>
          <button onClick={logout} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="تسجيل الخروج">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
