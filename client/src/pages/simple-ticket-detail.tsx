import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, User, Clock, MessageSquare } from 'lucide-react';

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-sky-100 text-sky-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const statusColors = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

export default function TicketDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user, token } = useAuth();
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['/api/tickets', id],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch ticket');
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
    enabled: user?.role === 'AGENT' || user?.role === 'ADMIN',
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/tickets/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', id] });
      setNewComment('');
      toast({
        title: 'Comentário adicionado!',
        description: 'Seu comentário foi publicado.',
      });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/tickets/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', id] });
      toast({
        title: 'Chamado atualizado!',
        description: 'As alterações foram salvas.',
      });
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateTicketMutation.mutate({ status: newStatus });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateTicketMutation.mutate({ 
      assigneeId: assigneeId === 'unassigned' ? null : assigneeId 
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Chamado não encontrado</h1>
          <Button onClick={() => navigate('/tickets')}>Voltar aos Chamados</Button>
        </div>
      </div>
    );
  }

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/tickets')}
              className="mr-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Chamado #{ticket?.id?.slice(0, 8)}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Ticket Details */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl pr-4" data-testid="ticket-title">
                    {ticket?.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={priorityColors[ticket?.priority as keyof typeof priorityColors]} data-testid="ticket-priority">
                      {ticket?.priority}
                    </Badge>
                    <Badge className={statusColors[ticket?.status as keyof typeof statusColors]} data-testid="ticket-status">
                      {ticket?.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap" data-testid="ticket-description">
                    {ticket?.description}
                  </p>
                </div>
                
                <div className="mt-6 flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Criado por: <span className="font-medium">{ticket?.requester?.name}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(ticket?.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comentários ({ticket?.comments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket?.comments?.map((comment: any) => (
                  <div key={comment.id} className="border rounded-lg p-4" data-testid={`comment-${comment.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.user?.name}</span>
                        {comment.user?.id === user?.id && (
                          <Badge variant="secondary" className="text-xs">Você</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))}

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="mt-6">
                  <Textarea
                    placeholder="Adicione um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    data-testid="textarea-comment"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="submit"
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      data-testid="button-add-comment"
                    >
                      {addCommentMutation.isPending ? (
                        'Enviando...'
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Comentar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Update */}
            {(user?.role === 'AGENT' || user?.role === 'ADMIN') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Atualizar Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={ticket?.status} onValueChange={handleStatusChange}>
                    <SelectTrigger data-testid="select-status">
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
                    value={ticket?.assigneeId || 'unassigned'} 
                    onValueChange={handleAssigneeChange}
                  >
                    <SelectTrigger data-testid="select-assignee">
                      <SelectValue placeholder="Atribuir a..." />
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
                </CardContent>
              </Card>
            )}

            {/* Assignment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Solicitante:</span>
                  <p className="font-medium">{ticket?.requester?.name}</p>
                  <p className="text-gray-500">{ticket?.requester?.email}</p>
                </div>
                
                {ticket?.assignee && (
                  <div>
                    <span className="text-gray-600">Responsável:</span>
                    <p className="font-medium">{ticket?.assignee?.name}</p>
                    <p className="text-gray-500">{ticket?.assignee?.email}</p>
                  </div>
                )}
                
                <div>
                  <span className="text-gray-600">Criado em:</span>
                  <p>{new Date(ticket?.createdAt).toLocaleString()}</p>
                </div>
                
                <div>
                  <span className="text-gray-600">Última atualização:</span>
                  <p>{new Date(ticket?.updatedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}