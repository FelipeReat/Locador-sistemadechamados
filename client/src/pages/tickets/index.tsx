import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TicketCard from "@/components/tickets/ticket-card";
import { PlusIcon, SearchIcon, FilterIcon } from "lucide-react";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";

export default function TicketsIndex() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["/api/tickets", { search, status: statusFilter, priority: priorityFilter }],
  });

  const statusCounts = tickets.reduce((acc: Record<string, number>, ticket: any) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {});

  const openTickets = tickets.filter((t: any) => !['RESOLVED', 'CLOSED', 'CANCELED'].includes(t.status));
  const myTickets = tickets.filter((t: any) => t.assigneeId); // Would filter by current user in real app
  const newTickets = tickets.filter((t: any) => t.status === 'NEW');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Chamados</h1>
        <Link href="/tickets/new">
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Novo Chamado
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar chamados..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as prioridades</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <span>Todos</span>
            <Badge variant="secondary" className="ml-1">{tickets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="open" className="flex items-center space-x-2">
            <span>Abertos</span>
            <Badge variant="secondary" className="ml-1">{openTickets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex items-center space-x-2">
            <span>Meus</span>
            <Badge variant="secondary" className="ml-1">{myTickets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center space-x-2">
            <span>Novos</span>
            <Badge variant="secondary" className="ml-1">{newTickets.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TicketsList tickets={tickets} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          <TicketsList tickets={openTickets} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="mine" className="space-y-4">
          <TicketsList tickets={myTickets} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <TicketsList tickets={newTickets} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TicketsList({ tickets, isLoading }: { tickets: any[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">Nenhum chamado encontrado</p>
            <p>Tente ajustar os filtros ou criar um novo chamado.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
import { useState } from "react";
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
  Clock,
  User,
  Calendar
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuthenticatedQuery } from "@/hooks/use-api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  'NEW': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'WAITING_APPROVAL': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'WAITING_CUSTOMER': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'RESOLVED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'CLOSED': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const statusLabels = {
  'NEW': 'Novo',
  'IN_PROGRESS': 'Em Andamento',
  'WAITING_APPROVAL': 'Aguardando Aprovação',
  'WAITING_CUSTOMER': 'Aguardando Cliente',
  'RESOLVED': 'Resolvido',
  'CLOSED': 'Fechado',
};

const priorityColors = {
  'P1': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'P2': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'P3': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'P4': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'P5': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export default function TicketsIndex() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: tickets = [], isLoading } = useAuthenticatedQuery(
    ['tickets'],
    '/tickets'
  );

  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
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
        <Button onClick={() => setLocation("/tickets/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Chamado
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar chamados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="NEW">Novo</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                <SelectItem value="WAITING_APPROVAL">Aguardando Aprovação</SelectItem>
                <SelectItem value="WAITING_CUSTOMER">Aguardando Cliente</SelectItem>
                <SelectItem value="RESOLVED">Resolvido</SelectItem>
                <SelectItem value="CLOSED">Fechado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="P1">P1 - Crítica</SelectItem>
                <SelectItem value="P2">P2 - Alta</SelectItem>
                <SelectItem value="P3">P3 - Média</SelectItem>
                <SelectItem value="P4">P4 - Baixa</SelectItem>
                <SelectItem value="P5">P5 - Muito Baixa</SelectItem>
              </SelectContent>
            </Select>
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
                      #{ticket.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ticket.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                        {statusLabels[ticket.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{ticket.requester?.name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/tickets/${ticket.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
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
