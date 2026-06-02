import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Plus, Archive, Users, FileText, LogOut, ClipboardList } from "lucide-react";

const NAV_LINKS = [
  { href: "/home", label: "الرئيسية", icon: Home },
  { href: "/new-consent", label: "إنشاء موافقة", icon: Plus },
  { href: "/previous-consents", label: "الموافقات السابقة", icon: Archive },
  { href: "/patients", label: "المرضى", icon: Users },
  { href: "/consent-templates", label: "قوالب الموافقة", icon: FileText },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-border">
        <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight text-foreground">بوابة الموافقات</h1>
          <p className="text-xs text-muted-foreground">Consent Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_LINKS.map((link) => {
          const isActive =
            location === link.href ||
            (link.href !== "/" && location.startsWith(link.href + "/"));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 min-h-[48px] ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-sm font-bold">
            {user?.name?.charAt(0) ?? "؟"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
