import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch, Redirect } from 'wouter';
import { Toaster } from '@/components/ui/toaster';

// Import pages
import LoginPage from '@/pages/simple-login';
import TicketsPage from '@/pages/simple-tickets';
import CreateTicketPage from '@/pages/simple-create-ticket';
import TicketDetailPage from '@/pages/simple-ticket-detail';
import SupportDashboard from '@/pages/support-dashboard';

// Import context
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Switch>
          <Route path="/login">
            {user ? <Redirect to={user.role === 'AGENT' || user.role === 'ADMIN' ? '/support' : '/tickets'} /> : <LoginPage />}
          </Route>

          <Route path="/tickets">
            {!user ? <Redirect to="/login" /> : <TicketsPage />}
          </Route>

          <Route path="/tickets/create">
            {!user ? <Redirect to="/login" /> : <CreateTicketPage />}
          </Route>

          <Route path="/tickets/:id">
            {!user ? <Redirect to="/login" /> : <TicketDetailPage />}
          </Route>

          <Route path="/support">
            {!user ? <Redirect to="/login" /> : 
             (user.role === 'AGENT' || user.role === 'ADMIN') ? 
             <SupportDashboard /> : <Redirect to="/tickets" />}
          </Route>

          <Route path="/">
            {!user ? <Redirect to="/login" /> : 
             (user.role === 'AGENT' || user.role === 'ADMIN') ? 
             <Redirect to="/support" /> : <Redirect to="/tickets" />}
          </Route>
        </Switch>
      </Router>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}