import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Ticket, User, Clock, AlertCircle } from 'lucide-react';

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const statusColors = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

export default function TicketList() {
  const { user, logout, token } = useAuth();
  const [, navigate] = useLocation();

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['/api/tickets'],
    queryFn: async () => {
      const response = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    },
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar chamados</h1>
          <p className="text-gray-600">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Ticket className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Service Desk</h1>
            </div>
            <div className="flex items-center gap-4">
              {(user?.role === 'AGENT' || user?.role === 'ADMIN') && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/support')}
                  data-testid="button-support-dashboard"
                >
                  Dashboard Suporte
                </Button>
              )}
              <span className="text-sm text-gray-600">
                Olá, <span className="font-medium">{user?.role === 'AGENT' ? 'Agente Suporte' : user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</span> {user?.name}
              </span>
              <Button variant="outline" onClick={logout} data-testid="button-logout">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Meus Chamados</h2>
          <Button onClick={() => navigate('/create-ticket')} data-testid="button-create-ticket">
            <Plus className="h-4 w-4 mr-2" />
            Novo Chamado
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tickets?.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum chamado encontrado</h3>
              <p className="text-gray-600 mb-4">Crie seu primeiro chamado para começar.</p>
              <Button onClick={() => navigate('/create-ticket')} data-testid="button-create-first-ticket">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Chamado
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tickets?.map((ticket: any) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <Link href={`/tickets/${ticket.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg truncate pr-2" data-testid={`ticket-title-${ticket.id}`}>
                        {ticket.title}
                      </CardTitle>
                      <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]} data-testid={`ticket-priority-${ticket.id}`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[ticket.status as keyof typeof statusColors]} data-testid={`ticket-status-${ticket.id}`}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{ticket.requester?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {ticket.assignee && (
                      <div className="mt-2 text-xs text-gray-500">
                        Atribuído: <span className="font-medium">{ticket.assignee.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}