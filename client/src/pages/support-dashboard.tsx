import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Home, Ticket, Clock, CheckCircle, User, BarChart3, Settings, FileText, Users } from 'lucide-react';

const priorityColors = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-sky-50 text-sky-700 border-sky-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  URGENT: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusConfig = {
  OPEN: { label: 'Abertos' },
  IN_PROGRESS: { label: 'Em Andamento' },
  RESOLVED: { label: 'Resolvidos' },
  CLOSED: { label: 'Fechados' },
};

export default function SupportDashboard() {
  const { user, logout, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['/api/tickets/all'],
    queryFn: async () => {
      const response = await fetch('/api/tickets/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: agents } = useQuery({
    queryKey: ['/api/users/agents'],
    queryFn: async () => {
      const response = await fetch('/api/users/agents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: any }) => {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/all'] });
      toast({
        title: 'Chamado atualizado!',
        description: 'As alterações foram salvas.',
      });
    },
  });

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    updateTicketMutation.mutate({ ticketId, updates: { status: newStatus } });
  };

  const handleAssigneeChange = (ticketId: string, assigneeId: string) => {
    updateTicketMutation.mutate({ 
      ticketId, 
      updates: { assigneeId: assigneeId === 'unassigned' ? null : assigneeId } 
    });
  };

  const getTicketsByStatus = (status: string) => {
    return tickets?.filter((ticket: any) => ticket.status === status) || [];
  };

  const stats = tickets ? {
    total: tickets.length,
    open: tickets.filter((t: any) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t: any) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t: any) => t.status === 'RESOLVED').length,
  } : { total: 0, open: 0, inProgress: 0, resolved: 0 };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-blue-600 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-semibold">Controle de Atendimento</h1>
          <p className="text-blue-100 text-sm mt-1">Painel</p>
        </div>
        
        <nav className="flex-1 px-4">
          <ul className="space-y-1">
            <li>
              <div className="flex items-center px-3 py-2 text-sm bg-blue-500 rounded">
                <Home className="w-4 h-4 mr-3" />
                Geral
              </div>
            </li>
            <li>
              <div className="flex items-center px-3 py-2 text-sm text-blue-100 hover:bg-blue-500 rounded cursor-pointer">
                <Ticket className="w-4 h-4 mr-3" />
                Requisições
              </div>
            </li>
            <li>
              <div className="flex items-center px-3 py-2 text-sm text-blue-100 hover:bg-blue-500 rounded cursor-pointer">
                <BarChart3 className="w-4 h-4 mr-3" />
                Relatórios
              </div>
            </li>
            <li>
              <div className="flex items-center px-3 py-2 text-sm text-blue-100 hover:bg-blue-500 rounded cursor-pointer">
                <Users className="w-4 h-4 mr-3" />
                Usuários
              </div>
            </li>
            <li>
              <div className="flex items-center px-3 py-2 text-sm text-blue-100 hover:bg-blue-500 rounded cursor-pointer">
                <Settings className="w-4 h-4 mr-3" />
                Configurações
              </div>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-500">
          <div className="flex items-center text-sm">
            <User className="w-4 h-4 mr-2" />
            <span>{user?.name}</span>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full mt-2 text-blue-100 hover:bg-blue-500" 
            onClick={logout} 
            data-testid="button-logout"
          >
            Sair do Sistema
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Painel</h2>
            <div className="text-sm text-gray-500">
              Vista geral das requisições de atendimento
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <Card className="card-elevated bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Requisições</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-500 mt-1">Total • Primeira categoria</p>
                  </div>
                  <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Requisições Pendentes</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.open}</p>
                    <p className="text-sm text-gray-500 mt-1">Aguardando aprovação • Alta relevância</p>
                  </div>
                  <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-sky-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Requisições Aprovadas</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
                    <p className="text-sm text-gray-500 mt-1">Fim mês • Disponível com sucesso</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status Ativo</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
                    <p className="text-sm text-gray-500 mt-1">Total enviados • Primeira atualização</p>
                  </div>
                  <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-rose-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="card-elevated bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 cursor-pointer transition-all">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Nova Requisição</h3>
                    <p className="text-violet-100 text-sm">Criar solicitação de atendimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated bg-gradient-to-r from-sky-50 to-cyan-50 hover:from-sky-100 hover:to-cyan-100 cursor-pointer transition-all border-sky-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mr-4">
                    <FileText className="w-6 h-6 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Ver Requisições</h3>
                    <p className="text-gray-600 text-sm">Gerenciar solicitações</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 cursor-pointer transition-all border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mr-4">
                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Geração de Ficha</h3>
                    <p className="text-gray-600 text-sm">Gerar fichas técnicas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requisições Recentes */}
          <Card className="card-elevated">
            <CardContent className="p-0">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-violet-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Requisições Recentes</h3>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 hover:border-violet-300"
                  >
                    Ver todos
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">SOLICITANTE</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">FORNECEDORES</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">TIPO DE COMBUSTÍVEL</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">QUANTIDADE</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">STATUS</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">DATA</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">AÇÕES</th>
                      </tr>
                    </thead>
                  <tbody>
                    {tickets?.slice(0, 5).map((ticket: any) => (
                      <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50" data-testid={`table-ticket-${ticket.id}`}>
                        <td className="py-3 px-4 text-sm">{ticket.id}</td>
                        <td className="py-3 px-4 text-sm">{ticket.requester?.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">-</td>
                        <td className="py-3 px-4 text-sm">{ticket.title}</td>
                        <td className="py-3 px-4 text-sm">-</td>
                        <td className="py-3 px-4">
                          <Badge 
                            className={`${
                              ticket.status === 'OPEN' ? 'bg-sky-100 text-sky-800' :
                              ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {statusConfig[ticket.status as keyof typeof statusConfig]?.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Select
                              value={ticket.status}
                              onValueChange={(newStatus) => handleStatusChange(ticket.id, newStatus)}
                            >
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OPEN">Aberto</SelectItem>
                                <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                                <SelectItem value="RESOLVED">Resolvido</SelectItem>
                                <SelectItem value="CLOSED">Fechado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-500">
                          Nenhuma requisição encontrada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}