import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { DoctorHomePage } from "@/pages/DoctorHomePage";
import { DoctorsPage } from "@/pages/DoctorsPage";
import { DoctorProfilePage } from "@/pages/DoctorProfilePage";
import { UsersPage } from "@/pages/UsersPage";
import { AppShell } from "@/components/layout/AppShell";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const ADMIN_ROLES = ["super_admin", "admin"];

const StubPage = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 opacity-40">
      <span className="text-5xl">🚧</span>
    </div>
    <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
    <p className="text-muted-foreground max-w-md">
      {subtitle || "هذه الصفحة قيد التطوير وستكون متاحة قريباً."}
    </p>
  </div>
);

function AdminRoute({ component: Component, requiredPermission }: { component: any; requiredPermission?: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;

  const isAdmin = ADMIN_ROLES.includes(user.roleName);
  if (!isAdmin) return <Redirect to="/home" />;

  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return <Redirect to="/doctors" />;
  }

  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}

function DoctorRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;

  return <Component />;
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <span className="text-muted-foreground">جاري التحميل...</span>
    </div>
  );
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  const isAdmin = ADMIN_ROLES.includes(user.roleName);
  return <Redirect to={isAdmin ? "/doctors" : "/home"} />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login">
        {user ? <Redirect to={ADMIN_ROLES.includes(user.roleName) ? "/doctors" : "/home"} /> : <LoginPage />}
      </Route>

      {/* Doctor-facing routes (no AppShell sidebar) */}
      <Route path="/home"><DoctorRoute component={DoctorHomePage} /></Route>
      <Route path="/new-consent"><DoctorRoute component={() => <StubPage title="موافقة جديدة" subtitle="اختر قالباً وابدأ نموذج الموافقة — قادم قريباً." />} /></Route>
      <Route path="/previous-consents"><DoctorRoute component={() => <StubPage title="الموافقات السابقة" subtitle="قائمة بجميع موافقاتك المكتملة — قادم قريباً." />} /></Route>

      {/* Admin-only routes (with AppShell sidebar) */}
      <Route path="/doctors"><AdminRoute component={DoctorsPage} /></Route>
      <Route path="/doctors/:id"><AdminRoute component={DoctorProfilePage} /></Route>
      <Route path="/templates"><AdminRoute component={() => <StubPage title="قوالب الموافقة" subtitle="رفع وإدارة قوالب PDF لكل طبيب — قادم قريباً." />} /></Route>
      <Route path="/field-mapping"><AdminRoute component={() => <StubPage title="ربط الحقول" subtitle="رسم موضع الحقول على قالب PDF بصرياً — قادم قريباً." />} /></Route>
      <Route path="/archive"><AdminRoute component={() => <StubPage title="الأرشيف" subtitle="جميع الموافقات المكتملة — قادم قريباً." />} /></Route>
      <Route path="/users"><AdminRoute component={UsersPage} requiredPermission="manage_users" /></Route>
      <Route path="/settings"><AdminRoute component={() => <StubPage title="الإعدادات" />} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
