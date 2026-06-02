import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { HomePage } from "@/pages/HomePage";
import { AppShell } from "@/components/layout/AppShell";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">جاري التحميل...</span>
      </div>
    </div>
  );
}

const StubPage = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
    <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
      <span className="text-4xl">🚧</span>
    </div>
    <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
    <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
      {subtitle || "هذه الصفحة قيد التطوير وستكون متاحة قريباً."}
    </p>
  </div>
);

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}

function GuestRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (user) return <Redirect to="/home" />;
  return <Component />;
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return <Redirect to={user ? "/home" : "/login"} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login"><GuestRoute component={LoginPage} /></Route>
      <Route path="/register"><GuestRoute component={RegisterPage} /></Route>

      <Route path="/home"><AuthRoute component={HomePage} /></Route>
      <Route path="/new-consent">
        <AuthRoute component={() => <StubPage title="موافقة جديدة" subtitle="اختر قالب الموافقة وابدأ ملء النموذج — قادم قريباً في المرحلة الرابعة." />} />
      </Route>
      <Route path="/previous-consents">
        <AuthRoute component={() => <StubPage title="الموافقات السابقة" subtitle="عرض وتنزيل جميع الموافقات المكتملة — قادم قريباً." />} />
      </Route>
      <Route path="/patients">
        <AuthRoute component={() => <StubPage title="المرضى" subtitle="قائمة المرضى مع موافقاتهم — قادم قريباً." />} />
      </Route>
      <Route path="/consent-templates">
        <AuthRoute component={() => <StubPage title="قوالب الموافقة" subtitle="رفع وإدارة قوالب PDF — قادم قريباً في المرحلة الثانية." />} />
      </Route>

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
