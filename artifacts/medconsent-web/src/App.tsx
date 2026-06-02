import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { UsersPage } from "@/pages/UsersPage";
import { DoctorsPage } from "@/pages/DoctorsPage";
import { DoctorProfilePage } from "@/pages/DoctorProfilePage";
import { AppShell } from "@/components/layout/AppShell";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const StubPage = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
      <span className="text-5xl text-muted-foreground opacity-30">🚧</span>
    </div>
    <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
    <p className="text-muted-foreground max-w-md">
      {subtitle || "هذه الصفحة قيد التطوير وستكون متاحة قريباً."}
    </p>
  </div>
);

function ProtectedRoute({ component: Component, requiredPermission }: { component: any, requiredPermission?: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-background"><span className="loader">جاري التحميل...</span></div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-background"><span className="loader">جاري التحميل...</span></div>;
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <LoginPage />}
      </Route>

      <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
      <Route path="/users"><ProtectedRoute component={UsersPage} requiredPermission="manage_users" /></Route>

      <Route path="/doctors"><ProtectedRoute component={DoctorsPage} /></Route>
      <Route path="/doctors/:id"><ProtectedRoute component={DoctorProfilePage} /></Route>

      <Route path="/templates"><ProtectedRoute component={() => <StubPage title="قوالب الموافقة" subtitle="إدارة قوالب PDF ورسم موضع الحقول قادم قريباً." />} /></Route>
      <Route path="/fill-consent"><ProtectedRoute component={() => <StubPage title="تعبئة موافقة" subtitle="تعبئة نماذج الموافقة وتوقيع المريض قادم قريباً." />} /></Route>
      <Route path="/archive"><ProtectedRoute component={() => <StubPage title="الأرشيف" subtitle="بحث وتحميل ومشاركة الموافقات المكتملة قادم قريباً." />} /></Route>
      <Route path="/settings"><ProtectedRoute component={() => <StubPage title="الإعدادات" />} /></Route>

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
