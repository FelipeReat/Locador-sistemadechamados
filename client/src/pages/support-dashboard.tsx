import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
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
    <div className="min-h-screen bg-gray-100">
      {/* Header Simples */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-medium">Dashboard de Suporte</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm">{user?.name}</span>
            <Button size="sm" onClick={logout} data-testid="button-logout">
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Simples */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded border">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded border">
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            <div className="text-sm text-gray-600">Abertos</div>
          </div>
          <div className="bg-white p-4 rounded border">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">Em Andamento</div>
          </div>
          <div className="bg-white p-4 rounded border">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-600">Resolvidos</div>
          </div>
        </div>

        {/* Lista de Chamados */}
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const statusTickets = getTicketsByStatus(status);
            
            return (
              <div key={status} className="bg-white rounded border">
                <div className="p-3 border-b">
                  <h3 className="font-medium">{config.label} ({statusTickets.length})</h3>
                </div>
                
                <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                  {statusTickets.map((ticket: any) => (
                    <div key={ticket.id} className="p-3 border rounded" data-testid={`kanban-ticket-${ticket.id}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">{ticket.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded ${priorityColors[ticket.priority as keyof typeof priorityColors]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-3">{ticket.description}</p>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <User className="h-3 w-3 mr-1" />
                        {ticket.requester?.name}
                      </div>
                      
                      <div className="space-y-2">
                        <Select
                          value={ticket.status}
                          onValueChange={(newStatus) => handleStatusChange(ticket.id, newStatus)}
                        >
                          <SelectTrigger className="h-8 text-xs">
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
                          <SelectTrigger className="h-8 text-xs">
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
                      
                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}