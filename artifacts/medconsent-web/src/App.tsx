import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { HomePage } from "@/pages/HomePage";
import { ConsentTemplatesPage } from "@/pages/ConsentTemplatesPage";
import { FieldMappingPage } from "@/pages/FieldMappingPage";
import { CreateConsentPage } from "@/pages/CreateConsentPage";
import { PreviousConsentsPage } from "@/pages/PreviousConsentsPage";
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
      <Route path="/new-consent"><AuthRoute component={CreateConsentPage} /></Route>
      <Route path="/previous-consents"><AuthRoute component={PreviousConsentsPage} /></Route>
      <Route path="/consent-templates"><AuthRoute component={ConsentTemplatesPage} /></Route>
      <Route path="/consent-templates/:templateId/fields"><AuthRoute component={FieldMappingPage} /></Route>

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
