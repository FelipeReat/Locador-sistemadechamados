
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";

// Pages
import Dashboard from "./pages/dashboard-simple";
import TicketsIndex from "./pages/tickets/index";
import TicketDetail from "./pages/tickets/detail";
import CreateTicket from "./pages/tickets/create";
import Catalog from "./pages/catalog";
import KnowledgeBase from "./pages/knowledge-base";
import AdminUsers from "./pages/admin/users";
import AdminTeams from "./pages/admin/teams";
import AdminAutomations from "./pages/admin/automations";
import AdminSLA from "./pages/admin/sla";
import CSATSurvey from "./pages/csat-survey";
import Reports from "./pages/reports";
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
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/tickets" component={TicketsIndex} />
        <Route path="/tickets/new" component={CreateTicket} />
        <Route path="/tickets/:id" component={TicketDetail} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/knowledge" component={KnowledgeBase} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/teams" component={AdminTeams} />
        <Route path="/admin/automations" component={AdminAutomations} />
        <Route path="/admin/sla" component={AdminSLA} />
        <Route path="/reports" component={Reports} />
        <Route path="/csat-survey" component={CSATSurvey} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthenticatedApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
