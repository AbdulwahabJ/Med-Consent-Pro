import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Stethoscope, FileText, Link as LinkIcon, Archive, Settings, LogOut } from "lucide-react";

const ADMIN_ROLES = ["super_admin", "admin"];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user?.roleName && ADMIN_ROLES.includes(user.roleName);

  const adminLinks = [
    { href: "/doctors", label: "الأطباء", icon: Stethoscope },
    { href: "/templates", label: "قوالب الموافقة", icon: FileText },
    { href: "/field-mapping", label: "ربط الحقول", icon: LinkIcon },
    { href: "/archive", label: "الأرشيف", icon: Archive },
  ];

  if (user?.permissions.includes("manage_users")) {
    adminLinks.push({ href: "/users", label: "المستخدمون", icon: Users });
  }

  adminLinks.push({ href: "/settings", label: "الإعدادات", icon: Settings });

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-border">
        <div className="bg-primary/10 text-primary p-2 rounded-xl">
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-primary">بوابة موافقات الطبيب</h1>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? "لوحة الإدارة" : "Doctor Consent Portal"}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {isAdmin ? (
          adminLinks.map((link) => {
            const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href + "/"));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground px-4 py-2">استخدم الشاشة الرئيسية للتنقل</p>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl">
          <div>
            <p className="font-semibold text-sm">{user?.fullNameAr}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.roleDisplayNameAr}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
