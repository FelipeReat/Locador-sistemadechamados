import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Users, Clock, CheckCircle, User, ArrowRight, Menu, Settings, UserPlus, BarChart3, FileText, Shield, Bell } from 'lucide-react';

const priorityColors = {
  LOW: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200',
};

const statusConfig = {
  OPEN: { label: 'Abertos', color: 'text-blue-600', icon: Ticket },
  IN_PROGRESS: { label: 'Em Andamento', color: 'text-purple-600', icon: Clock },
  RESOLVED: { label: 'Resolvidos', color: 'text-green-600', icon: CheckCircle },
  CLOSED: { label: 'Fechados', color: 'text-gray-600', icon: CheckCircle },
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
      if (!response.ok) throw new Error('Failed to fetch tickets');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              {/* Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Análises</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Auditoria</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Automações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Gerenciar Usuários</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Relatórios</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard de Suporte</h1>
                  <p className="text-gray-600">Gerenciamento de chamados</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                <User className="h-3 w-3 mr-1" />
                {user?.role}
              </Badge>
              <span className="text-sm text-gray-600">
                {user?.name}
              </span>
              <Button variant="outline" onClick={logout} data-testid="button-logout">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ticket className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ticket className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Abertos</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolvidos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const statusTickets = getTicketsByStatus(status);
            const Icon = config.icon;
            
            return (
              <div key={status} className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 ${config.color} mr-2`} />
                      <h3 className="font-semibold text-gray-900">{config.label}</h3>
                    </div>
                    <Badge variant="secondary">{statusTickets.length}</Badge>
                  </div>
                </div>
                
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {statusTickets.map((ticket: any) => (
                    <Card key={ticket.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm text-gray-900 truncate pr-2" data-testid={`kanban-ticket-${ticket.id}`}>
                              {ticket.title}
                            </h4>
                            <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {ticket.description}
                          </p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <User className="h-3 w-3 mr-1" />
                              {ticket.requester?.name}
                            </div>
                            
                            {ticket.assignee && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Avatar className="h-5 w-5 mr-2">
                                  <AvatarFallback className="text-xs">
                                    {ticket.assignee.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                {ticket.assignee.name}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Select
                              value={ticket.status}
                              onValueChange={(newStatus) => handleStatusChange(ticket.id, newStatus)}
                            >
                              <SelectTrigger className="h-8 text-xs" data-testid={`select-status-${ticket.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OPEN">Aberto</SelectItem>
                                <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                                <SelectItem value="RESOLVED">Resolvido</SelectItem>
                                <SelectItem value="CLOSED">Fechado</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select
                              value={ticket.assigneeId || 'unassigned'}
                              onValueChange={(assigneeId) => handleAssigneeChange(ticket.id, assigneeId)}
                            >
                              <SelectTrigger className="h-8 text-xs" data-testid={`select-assignee-${ticket.id}`}>
                                <SelectValue placeholder="Atribuir..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Não atribuído</SelectItem>
                                {agents?.map((agent: any) => (
                                  <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/tickets/${ticket.id}`, '_blank')}
                              className="h-6 px-2 text-xs"
                              data-testid={`button-view-${ticket.id}`}
                            >
                              Ver <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {statusTickets.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Nenhum chamado nesta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}