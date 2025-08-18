import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Zap, Terminal, Clock, CheckCircle, User, ArrowRight, Menu, Settings, UserPlus, BarChart3, FileText, Shield, Bell, Power, Activity, Users } from 'lucide-react';

const priorityColors = {
  LOW: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200',
};

const statusConfig = {
  OPEN: { label: 'Abertos', color: 'text-neon-cyan', icon: Zap },
  IN_PROGRESS: { label: 'Em Andamento', color: 'text-neon-yellow', icon: Clock },
  RESOLVED: { label: 'Resolvidos', color: 'text-neon-green', icon: CheckCircle },
  CLOSED: { label: 'Fechados', color: 'text-muted-foreground', icon: CheckCircle },
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto neon-border"></div>
          <p className="mt-4 font-cyber text-primary">CARREGANDO DASHBOARD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cyberpunk Header */}
      <header className="cyber-card border-b-2 border-primary/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-6">
              {/* Revolutionary Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 w-12 p-0 neon-border bg-primary/10 hover:bg-primary/20">
                    <Terminal className="h-5 w-5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 cyber-card border-primary/30">
                  <DropdownMenuItem className="cursor-pointer font-cyber text-neon-cyan">
                    <BarChart3 className="mr-3 h-4 w-4" />
                    <span>ANALYTICS</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer font-cyber text-neon-yellow">
                    <Shield className="mr-3 h-4 w-4" />
                    <span>SECURITY AUDIT</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer font-cyber text-neon-green">
                    <Bell className="mr-3 h-4 w-4" />
                    <span>AUTO SYSTEMS</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-primary/30" />
                  <DropdownMenuItem className="cursor-pointer font-cyber">
                    <Settings className="mr-3 h-4 w-4" />
                    <span>CONFIG</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer font-cyber">
                    <UserPlus className="mr-3 h-4 w-4" />
                    <span>USER MGMT</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Relatórios</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center">
                <div className="neon-border rounded-full p-3 bg-primary/10 mr-4">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-display neon-text" data-text="NEXUS CONTROL">NEXUS CONTROL</h1>
                  <p className="font-cyber text-muted-foreground">// Sistema de Comando Central //</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Badge className="bg-primary/20 text-primary border-primary font-cyber px-3 py-2">
                <Shield className="h-4 w-4 mr-2" />
                {user?.role}
              </Badge>
              <span className="font-cyber text-foreground text-lg">
                {user?.name}
              </span>
              <Button 
                variant="outline" 
                onClick={logout} 
                data-testid="button-logout"
                className="neon-button font-cyber bg-danger/20 border-danger hover:bg-danger/30"
              >
                <Power className="h-4 w-4 mr-2" />
                LOGOUT
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="cyber-card border-2 border-primary/30 hover:border-primary/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="neon-border rounded-full p-3 bg-primary/10">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-6">
                  <p className="text-sm font-cyber text-muted-foreground">TOTAL TICKETS</p>
                  <p className="text-3xl font-display neon-text">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cyber-card border-2 border-neon-cyan/30 hover:border-neon-cyan/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="neon-border rounded-full p-3 bg-neon-cyan/10">
                  <Zap className="h-8 w-8 text-neon-cyan" />
                </div>
                <div className="ml-6">
                  <p className="text-sm font-cyber text-muted-foreground">ACTIVE</p>
                  <p className="text-3xl font-display text-neon-cyan">{stats.open}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card border-2 border-neon-yellow/30 hover:border-neon-yellow/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="neon-border rounded-full p-3 bg-neon-yellow/10">
                  <Clock className="h-8 w-8 text-neon-yellow" />
                </div>
                <div className="ml-6">
                  <p className="text-sm font-cyber text-muted-foreground">IN PROGRESS</p>
                  <p className="text-3xl font-display text-neon-yellow">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card border-2 border-neon-green/30 hover:border-neon-green/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="neon-border rounded-full p-3 bg-neon-green/10">
                  <CheckCircle className="h-8 w-8 text-neon-green" />
                </div>
                <div className="ml-6">
                  <p className="text-sm font-cyber text-muted-foreground">RESOLVED</p>
                  <p className="text-3xl font-display text-neon-green">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revolutionary Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const statusTickets = getTicketsByStatus(status);
            const Icon = config.icon;
            
            return (
              <div key={status} className="cyber-card border-2 border-primary/30 hover:border-primary/50 transition-all duration-300">
                <div className="p-4 border-b border-primary/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className={`h-6 w-6 ${config.color} mr-3`} />
                      <h3 className="font-cyber text-foreground text-lg">{config.label}</h3>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary font-cyber">{statusTickets.length}</Badge>
                  </div>
                </div>
                
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {statusTickets.map((ticket: any) => (
                    <Card key={ticket.id} className="cyber-card border-l-4 border-l-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-cyber text-foreground text-sm truncate pr-2" data-testid={`kanban-ticket-${ticket.id}`}>
                              {ticket.title}
                            </h4>
                            <Badge className={`priority-${ticket.priority.toLowerCase()}`}>
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