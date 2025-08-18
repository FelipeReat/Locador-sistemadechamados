import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthenticatedQuery } from "@/hooks/use-api";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Calendar, Clock, AlertCircle, MessageSquare, Settings, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  'NEW': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'TRIAGE': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'IN_PROGRESS': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'WAITING_APPROVAL': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'WAITING_CUSTOMER': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'ON_HOLD': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'RESOLVED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'CLOSED': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'CANCELED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusLabels = {
  'NEW': 'Novo',
  'TRIAGE': 'Triagem',
  'IN_PROGRESS': 'Em Andamento',
  'WAITING_APPROVAL': 'Aguardando Aprovação',
  'WAITING_CUSTOMER': 'Aguardando Cliente',
  'ON_HOLD': 'Em Espera',
  'RESOLVED': 'Resolvido',
  'CLOSED': 'Fechado',
  'CANCELED': 'Cancelado',
};

const priorityColors = {
  'P1': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'P2': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'P3': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'P4': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'P5': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export default function TicketDetail() {
  const [match] = useRoute("/tickets/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const ticketId = match?.id;

  const { data: ticket, isLoading } = useAuthenticatedQuery(
    ['ticket', ticketId],
    `/tickets/${ticketId}`,
    { enabled: !!ticketId }
  );

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/tickets/${ticketId}/comments`, {
        body: newComment,
        visibility: "PUBLIC",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setNewComment("");
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado ao chamado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar comentário",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/tickets/${ticketId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast({
        title: "Status atualizado",
        description: "O status do chamado foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/tickets/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast({
        title: "Chamado atualizado",
        description: "O status do chamado foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar chamado",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const submitComment = () => {
    if (newComment.trim()) {
      setIsSubmittingComment(true);
      addCommentMutation.mutate(undefined, {
        onSettled: () => setIsSubmittingComment(false),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Chamado não encontrado
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          O chamado solicitado não existe ou você não tem permissão para visualizá-lo.
        </p>
        <Button onClick={() => setLocation("/tickets")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Chamados
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setLocation("/tickets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              #{ticket.number || ticket.id?.slice(0, 8)} - {ticket.title || 'Chamado sem título'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Criado em {ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data desconhecida'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={statusColors[ticket.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
            {statusLabels[ticket.status as keyof typeof statusLabels] || ticket.status}
          </Badge>
          <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}>
            {ticket.priority}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ticket.description || 'Nenhuma descrição fornecida.'}
              </p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Comentários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Comments */}
              {ticket.comments && ticket.comments.length > 0 ? (
                <div className="space-y-4">
                  {ticket.comments.map((comment: any, index: number) => (
                    <div key={index} className="flex space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {comment.createdBy?.name || 'Usuário desconhecido'}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {comment.createdAt ? format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : ''}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
              )}

              {/* Add Comment */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Textarea
                  placeholder="Adicionar comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={() => addCommentMutation.mutate()}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  className="w-full"
                >
                  {addCommentMutation.isPending ? 'Adicionando...' : 'Adicionar Comentário'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Solicitante
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {ticket.createdBy?.name || 'Usuário desconhecido'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Responsável
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {ticket.assignedTo?.name || 'Não atribuído'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </label>
                <Select 
                  value={ticket.status} 
                  onValueChange={(value) => updateStatusMutation.mutate(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Novo</SelectItem>
                    <SelectItem value="TRIAGE">Triagem</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                    <SelectItem value="WAITING_CUSTOMER">Aguardando Cliente</SelectItem>
                    <SelectItem value="WAITING_APPROVAL">Aguardando Aprovação</SelectItem>
                    <SelectItem value="ON_HOLD">Em Espera</SelectItem>
                    <SelectItem value="RESOLVED">Resolvido</SelectItem>
                    <SelectItem value="CLOSED">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Categoria
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {ticket.category || 'Não categorizado'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Data de Criação
                </label>
                <p className="text-sm text-gray-900 dark:text-white flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Desconhecida'}
                </p>
              </div>

              {ticket.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Última Atualização
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(ticket.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações do Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsEditingTicket(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAddingComment(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Adicionar Comentário
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsChangingStatus(true)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Alterar Status
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Change Dialog */}
          {isChangingStatus && (
            <Card className="mt-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
              <CardHeader>
                <CardTitle className="text-lg">Alterar Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o novo status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">Novo</SelectItem>
                      <SelectItem value="TRIAGE">Triagem</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                      <SelectItem value="WAITING_CUSTOMER">Aguardando Cliente</SelectItem>
                      <SelectItem value="ON_HOLD">Em Espera</SelectItem>
                      <SelectItem value="RESOLVED">Resolvido</SelectItem>
                      <SelectItem value="CLOSED">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={async () => {
                        if (selectedStatus && ticket) {
                          try {
                            await updateTicket.mutateAsync({
                              id: ticket.id,
                              status: selectedStatus
                            });
                            setIsChangingStatus(false);
                            setSelectedStatus("");
                          } catch (error) {
                            console.error('Error updating status:', error);
                          }
                        }
                      }}
                      disabled={!selectedStatus}
                    >
                      Confirmar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsChangingStatus(false);
                        setSelectedStatus("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Comment Section */}
          {isAddingComment && (
            <Card className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Comentário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Digite seu comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                  />
                  <div className="flex space-x-2">
                    <Button 
                      onClick={submitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                    >
                      {isSubmittingComment ? "Enviando..." : "Enviar Comentário"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsAddingComment(false);
                        setNewComment("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}