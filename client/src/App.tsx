import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { authService } from "./lib/auth";
import ProtectedRoute from "./components/auth/protected-route";

// Pages
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import TicketsIndex from "./pages/tickets/index";
import TicketDetail from "./pages/tickets/detail";
import CreateTicket from "./pages/tickets/create";
import Catalog from "./pages/catalog";
import KnowledgeBase from "./pages/knowledge-base";
import AdminUsers from "./pages/admin/users";
import AdminTeams from "./pages/admin/teams";
import AdminAutomations from "./pages/admin/automations";
import AdminSLA from "./pages/admin/sla";
import NotFound from "./pages/not-found";

// Layout
import Sidebar from "./components/layout/sidebar";
import Header from "./components/layout/header";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  const [location] = useLocation();
  
  // Don't show layout for login page
  if (location === "/login") {
    return <Login />;
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/tickets" component={TicketsIndex} />
          <Route path="/tickets/new" component={CreateTicket} />
          <Route path="/tickets/:id" component={TicketDetail} />
          <Route path="/catalog" component={Catalog} />
          <Route path="/knowledge" component={KnowledgeBase} />
          <Route path="/admin/users">
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <AdminUsers />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/teams">
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <AdminTeams />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/automations">
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <AdminAutomations />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/sla">
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <AdminSLA />
            </ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </ProtectedRoute>
  );
}

function Router() {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
