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
