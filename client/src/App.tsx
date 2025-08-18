
import { Router, Switch, Route, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';

// Simple pages
import LoginPage from './pages/simple-login';
import TicketsPage from './pages/simple-tickets';
import CreateTicketPage from './pages/simple-create-ticket';
import TicketDetailPage from './pages/simple-ticket-detail';
import SupportDashboard from './pages/support-dashboard';

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
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <Router>
      <Switch>
        <Route path="/login">
          {user ? <Redirect to={user.role === 'ADMIN' || user.role === 'AGENT' ? '/support' : '/tickets'} /> : <LoginPage />}
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
           (user.role === 'ADMIN' || user.role === 'AGENT') ? <SupportDashboard /> : <Redirect to="/tickets" />}
        </Route>

        <Route>
          {!user ? <Redirect to="/login" /> : <Redirect to={user.role === 'ADMIN' || user.role === 'AGENT' ? '/support' : '/tickets'} />}
        </Route>
      </Switch>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <AppContent />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
