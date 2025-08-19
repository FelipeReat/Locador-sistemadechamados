
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthenticatedQuery, useAuthenticatedMutation } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { STATUS_LABELS, PRIORITY_LABELS, formatRelativeTime } from "@/lib/constants";
import { 
  Plus, 
  User, 
  Clock, 
  AlertCircle,
  Filter,
  Search
} from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KANBAN_COLUMNS = [
  { id: 'NEW', title: 'Novos', color: 'bg-blue-50 border-blue-200' },
  { id: 'TRIAGE', title: 'Triagem', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'IN_PROGRESS', title: 'Em Progresso', color: 'bg-purple-50 border-purple-200' },
  { id: 'WAITING_CUSTOMER', title: 'Aguardando Cliente', color: 'bg-orange-50 border-orange-200' },
  { id: 'RESOLVED', title: 'Resolvidos', color: 'bg-green-50 border-green-200' },
  { id: 'CLOSED', title: 'Fechados', color: 'bg-gray-50 border-gray-200' },
];

const PRIORITY_COLORS = {
  'P1': 'bg-red-100 text-red-700 border-red-200',
  'P2': 'bg-red-100 text-red-700 border-red-200',
  'P3': 'bg-blue-100 text-blue-700 border-blue-200',
  'P4': 'bg-blue-100 text-blue-700 border-blue-200',
  'P5': 'bg-gray-100 text-gray-700 border-gray-200',
};

interface TicketCard {
  id: string;
  code: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  requester?: { name: string };
  assignee?: { name: string };
  dueAt?: string;
}

export default function KanbanPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tickets, setTickets] = useState<TicketCard[]>([]);
  const { toast } = useToast();

  const { data: ticketsData = [], isLoading, refetch } = useAuthenticatedQuery(
    ['tickets'],
    '/tickets'
  );

  const updateTicketMutation = useAuthenticatedMutation({
    onSuccess: () => {
      toast({
        title: "Chamado atualizado",
        description: "O status do chamado foi atualizado com sucesso.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar chamado",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (ticketsData) {
      setTickets(ticketsData);
    }
  }, [ticketsData]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const ticketId = draggableId;

    // Atualizar localmente primeiro para feedback imediato
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus }
          : ticket
      )
    );

    // Atualizar no servidor
    try {
      await updateTicketMutation.mutateAsync({
        method: 'PATCH',
        endpoint: `/tickets/${ticketId}`,
        data: { status: newStatus }
      });
    } catch (error) {
      // Reverter mudança local em caso de erro
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status: source.droppableId }
            : ticket
        )
      );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => {
      const matchesStatus = ticket.status === status;
      const matchesSearch = searchTerm === "" || 
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      
      return matchesStatus && matchesSearch && matchesPriority;
    });
  };

  const isOverdue = (dueAt?: string) => {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando chamados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Kanban - Chamados
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize e gerencie chamados arrastando entre colunas
          </p>
        </div>
        <Button onClick={() => setLocation("/tickets/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Chamado
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar chamados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  <SelectItem value="P1">P1 - Crítica</SelectItem>
                  <SelectItem value="P2">P2 - Alta</SelectItem>
                  <SelectItem value="P3">P3 - Média</SelectItem>
                  <SelectItem value="P4">P4 - Baixa</SelectItem>
                  <SelectItem value="P5">P5 - Planejamento</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setSearchTerm("");
                  setPriorityFilter("all");
                }}
                title="Limpar filtros"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnTickets = getTicketsByStatus(column.id);
            
            return (
              <div key={column.id} className="flex flex-col">
                <div className={`rounded-lg border-2 ${column.color} p-4 mb-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {column.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnTickets.length}
                    </Badge>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'bg-blue-50 border-2 border-blue-200 border-dashed' 
                          : 'bg-gray-50/50'
                      }`}
                      style={{ minHeight: '200px' }}
                    >
                      {columnTickets.map((ticket, index) => (
                        <Draggable
                          key={ticket.id}
                          draggableId={ticket.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-transform ${
                                snapshot.isDragging ? 'rotate-3 scale-105' : ''
                              }`}
                            >
                              <Card 
                                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary-500"
                                onClick={() => setLocation(`/tickets/${ticket.id}`)}
                              >
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-mono text-xs text-gray-500">
                                          {ticket.code}
                                        </span>
                                        {isOverdue(ticket.dueAt) && (
                                          <AlertCircle className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <Badge className={`text-xs ${PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS]}`}>
                                        {ticket.priority}
                                      </Badge>
                                    </div>

                                    {/* Title */}
                                    <h4 className="font-medium text-sm line-clamp-2 text-gray-900 dark:text-white">
                                      {ticket.subject}
                                    </h4>

                                    {/* Description */}
                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                      {ticket.description}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        {ticket.assignee && (
                                          <Avatar className="h-6 w-6">
                                            <AvatarFallback className="bg-primary-100 text-primary-600 text-xs">
                                              {getInitials(ticket.assignee.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        {!ticket.assignee && (
                                          <User className="h-4 w-4 text-gray-400" />
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatRelativeTime(new Date(ticket.createdAt))}</span>
                                      </div>
                                    </div>

                                    {/* SLA Warning */}
                                    {ticket.dueAt && (
                                      <div className={`text-xs px-2 py-1 rounded ${
                                        isOverdue(ticket.dueAt)
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                      }`}>
                                        {isOverdue(ticket.dueAt) 
                                          ? `Vencido ${formatRelativeTime(new Date(ticket.dueAt))}`
                                          : `Vence ${formatRelativeTime(new Date(ticket.dueAt))}`
                                        }
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {columnTickets.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <div className="text-4xl mb-2">📋</div>
                          <p className="text-sm">Nenhum chamado</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
