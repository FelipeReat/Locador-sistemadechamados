import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch, Redirect } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/simple-login';
import TicketList from './pages/simple-tickets';
import TicketDetail from './pages/simple-ticket-detail';
import CreateTicket from './pages/simple-create-ticket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
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
            {user ? <Redirect to="/tickets" /> : <LoginPage />}
          </Route>
          
          <Route path="/tickets">
            {user ? <TicketList /> : <Redirect to="/login" />}
          </Route>
          <Route path="/tickets/:id">
            {user ? <TicketDetail /> : <Redirect to="/login" />}
          </Route>
          <Route path="/create-ticket">
            {user ? <CreateTicket /> : <Redirect to="/login" />}
          </Route>
          
          <Route path="/">
            {user ? <Redirect to="/tickets" /> : <Redirect to="/login" />}
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