
import { Route, Switch, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Pages
import LoginPage from '@/pages/simple-login';
import TicketsPage from '@/pages/simple-tickets';
import CreateTicketPage from '@/pages/simple-create-ticket';
import TicketDetailPage from '@/pages/simple-ticket-detail';
import SupportDashboardPage from '@/pages/support-dashboard';

const queryClient = new QueryClient();

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to={user.role === 'USER' ? '/tickets' : '/support'} /> : <LoginPage />}
      </Route>
      
      <Route path="/tickets" nest>
        {!user ? (
          <Redirect to="/login" />
        ) : (
          <Switch>
            <Route path="/" component={TicketsPage} />
            <Route path="/create" component={CreateTicketPage} />
            <Route path="/:id" component={TicketDetailPage} />
          </Switch>
        )}
      </Route>

      <Route path="/support">
        {!user ? (
          <Redirect to="/login" />
        ) : user.role === 'USER' ? (
          <Redirect to="/tickets" />
        ) : (
          <SupportDashboardPage />
        )}
      </Route>

      <Route path="/">
        {user ? (
          <Redirect to={user.role === 'USER' ? '/tickets' : '/support'} />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
    </Switch>
  );
}

function App() {
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

export default App;
