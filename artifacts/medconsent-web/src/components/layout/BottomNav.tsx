import { Link, useLocation } from "wouter";
import { LayoutDashboard, UserRound, FileText, Files, Archive } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const links = [
    { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
    { href: "/patients", label: "المرضى", icon: UserRound },
    { href: "/templates", label: "القوالب", icon: FileText },
    { href: "/forms", label: "النماذج", icon: Files },
    { href: "/archive", label: "الأرشيف", icon: Archive },
  ];

  return (
    <nav className="flex items-center justify-around px-2 py-2">
      {links.map((link) => {
        const isActive = location === link.href;
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href} className={`flex flex-col items-center justify-center p-2 min-w-[64px] min-h-[44px] rounded-lg transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
