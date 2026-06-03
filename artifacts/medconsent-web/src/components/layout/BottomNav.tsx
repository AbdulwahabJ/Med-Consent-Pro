import { Link, useLocation } from "wouter";
import { Plus, Archive, FileText, Home } from "lucide-react";

const LINKS = [
  { href: "/home", label: "الرئيسية", icon: Home },
  { href: "/new-consent", label: "جديدة", icon: Plus },
  { href: "/previous-consents", label: "السابقة", icon: Archive },
  { href: "/consent-templates", label: "القوالب", icon: FileText },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="flex items-center justify-around px-1 py-1.5">
      {LINKS.map((link) => {
        const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href + "/"));
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center px-2 py-1.5 min-w-[56px] min-h-[48px] rounded-xl transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-primary/10" : ""}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium mt-0.5">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
