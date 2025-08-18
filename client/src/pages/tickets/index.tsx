import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  User,
  Calendar,
  Download
} from "lucide-react";
import { useAuthenticatedQuery, useAuthenticatedMutation } from "@/hooks/use-api";
import { formatDateTime, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";

// Status colors mapping
const STATUS_COLORS = {
  'NEW': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'RESOLVED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'CLOSED': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

// Priority colors mapping  
const PRIORITY_COLORS = {
  'P1': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'P2': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', 
  'P3': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'P4': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'P5': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
// Removed Next.js Link import - using wouter's Link instead

export default function TicketsIndexPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: tickets = [], isLoading } = useAuthenticatedQuery(
    ['tickets'],
    '/tickets'
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getPriorityColor = (priority: string) => {
    const colors = {
      'P1': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'P2': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', 
      'P3': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'P4': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'P5': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[priority as keyof typeof colors] || colors.P3;
  };

  const takeTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return apiRequest("PATCH", `/api/tickets/${ticketId}/take`, {});
    },
    onSuccess: () => {
      toast({
        title: "Chamado atribuído",
        description: "O chamado foi atribuído a você com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atribuir chamado",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleTakeTicket = (ticketId: string) => {
    takeTicketMutation.mutate(ticketId);
  };

  const handleExportTickets = () => {
    toast({
      title: "Exportando chamados",
      description: "A lista de chamados será exportada em alguns instantes.",
    });

    // Simulate export
    const exportData = {
      tickets: filteredTickets.length,
      exported_at: new Date().toISOString(),
      filters: {
        search: searchTerm,
        status: statusFilter,
        priority: priorityFilter,
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `chamados-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Chamados
        </h1>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setLocation("/tickets/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Chamado
          </Button>
          <Button variant="outline" onClick={handleExportTickets}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="NEW">Novo</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="RESOLVED">Resolvido</SelectItem>
                  <SelectItem value="CLOSED">Fechado</SelectItem>
                </SelectContent>
              </Select>

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
                  setStatusFilter("all");
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

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando chamados...
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum chamado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket: any) => (
                  <TableRow key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="font-mono text-sm">
                      #{ticket.id?.substring(0, 8) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.subject || 'Sem título'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ticket.category || 'Sem categoria'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
                        {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS] || ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(ticket.priority as keyof typeof PRIORITY_COLORS) || 'bg-gray-100 text-gray-800'}>
                        {PRIORITY_LABELS[ticket.priority as keyof typeof PRIORITY_LABELS] || ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{ticket.requester?.name || ticket.requesterName || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLocation(`/tickets/${ticket.id}`)}
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTakeTicket(ticket.id)}
                          className="ml-2"
                          title="Assumir chamado"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Assumir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}