import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TicketTimeline from "@/components/tickets/ticket-timeline";
import TicketComments from "@/components/tickets/ticket-comments";
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS, formatDateTime, formatRelativeTime } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftIcon, UserIcon, CalendarIcon, ClockIcon } from "lucide-react";
import { Link } from "wouter";

export default function TicketDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [commentVisibility, setCommentVisibility] = useState<"PUBLIC" | "INTERNAL">("PUBLIC");

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["/api/tickets", id],
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest("PATCH", `/api/tickets/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
      toast({
        title: "Chamado atualizado",
        description: "As alterações foram salvas com sucesso.",
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

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/tickets/${id}/comments`, {
        body: newComment,
        visibility: commentVisibility,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
      setNewComment("");
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso.",
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Chamado não encontrado</p>
      </div>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    updateTicketMutation.mutate({ status: newStatus });
  };

  const handlePriorityChange = (newPriority: string) => {
    updateTicketMutation.mutate({ priority: newPriority });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate();
  };

  const getSLAStatus = () => {
    if (!ticket.dueAt) return null;
    const now = new Date();
    const dueDate = new Date(ticket.dueAt);
    const timeLeft = dueDate.getTime() - now.getTime();
    const hoursLeft = timeLeft / (1000 * 60 * 60);

    if (timeLeft < 0) {
      return { status: "breached", label: "SLA Violado", color: "bg-red-100 text-red-800 border-red-200" };
    } else if (hoursLeft < 2) {
      return { status: "at-risk", label: "SLA em Risco", color: "bg-orange-100 text-orange-800 border-orange-200" };
    } else {
      return { status: "ok", label: "SLA OK", color: "bg-green-100 text-green-800 border-green-200" };
    }
  };

  const slaStatus = getSLAStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/tickets">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{ticket.code}</h1>
          <Badge className={`${PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS]}`}>
            {ticket.priority} - {PRIORITY_LABELS[ticket.priority as keyof typeof PRIORITY_LABELS]}
          </Badge>
          <Badge className={`${STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS]}`}>
            {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS]}
          </Badge>
        </div>
      </div>

      <h2 className="text-lg text-gray-900 dark:text-white">{ticket.subject}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketTimeline events={ticket.events || []} />
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Comentários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TicketComments comments={ticket.comments || []} />

              {/* Add Comment */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="visibility" 
                      value="PUBLIC"
                      checked={commentVisibility === "PUBLIC"}
                      onChange={(e) => setCommentVisibility(e.target.value as "PUBLIC" | "INTERNAL")}
                      className="form-radio text-primary-600" 
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Público</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="visibility" 
                      value="INTERNAL"
                      checked={commentVisibility === "INTERNAL"}
                      onChange={(e) => setCommentVisibility(e.target.value as "PUBLIC" | "INTERNAL")}
                      className="form-radio text-primary-600" 
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Interno</span>
                  </label>
                </div>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicionar comentário..."
                  rows={3}
                />
                <div className="flex justify-end mt-3">
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                  >
                    {addCommentMutation.isPending ? "Enviando..." : "Comentar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Solicitante</dt>
                <dd className="text-sm text-gray-900 dark:text-white flex items-center mt-1">
                  <UserIcon className="w-4 h-4 mr-2" />
                  {ticket.requester?.name}
                </dd>
              </div>
              
              {ticket.assignee && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Atribuído para</dt>
                  <dd className="text-sm text-gray-900 dark:text-white flex items-center mt-1">
                    <UserIcon className="w-4 h-4 mr-2" />
                    {ticket.assignee.name}
                  </dd>
                </div>
              )}

              {ticket.team && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Equipe</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{ticket.team.name}</dd>
                </div>
              )}

              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Criado em</dt>
                <dd className="text-sm text-gray-900 dark:text-white flex items-center mt-1">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {formatDateTime(new Date(ticket.createdAt))}
                </dd>
              </div>

              {ticket.dueAt && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Prazo SLA</dt>
                  <dd className="text-sm text-gray-900 dark:text-white flex items-center mt-1">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    {formatDateTime(new Date(ticket.dueAt))}
                  </dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA Status */}
          {slaStatus && (
            <Card className={`border-2 ${slaStatus.color}`}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Status SLA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">{slaStatus.label}</div>
                  {ticket.dueAt && (
                    <div className="text-sm">
                      {slaStatus.status === "breached" 
                        ? `Violado ${formatRelativeTime(new Date(ticket.dueAt))}`
                        : `${formatRelativeTime(new Date(ticket.dueAt))} para vencer`
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Status</label>
                <Select value={ticket.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Prioridade</label>
                <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleStatusChange('RESOLVED')}
                disabled={ticket.status === 'RESOLVED'}
              >
                Marcar como Resolvido
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
