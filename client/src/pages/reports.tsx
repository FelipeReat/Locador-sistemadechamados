
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar as CalendarIcon,
  Download,
  Filter
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuthenticatedQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface DateRange {
  from: Date;
  to: Date;
}

const QUICK_RANGES = [
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 },
];

export default function ReportsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date()),
  });

  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Fetch data
  const { data: dashboardMetrics, isLoading: dashboardLoading } = useAuthenticatedQuery(
    ['reports-dashboard', dateRange.from.toISOString(), dateRange.to.toISOString()],
    `/reports/dashboard?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
  );

  const { data: slaReport, isLoading: slaLoading } = useAuthenticatedQuery(
    ['reports-sla', dateRange.from.toISOString(), dateRange.to.toISOString()],
    `/reports/sla?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
  );

  const { data: volumeReport, isLoading: volumeLoading } = useAuthenticatedQuery(
    ['reports-volume', dateRange.from.toISOString(), dateRange.to.toISOString()],
    `/reports/volume?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
  );

  const { data: teams } = useAuthenticatedQuery('teams', '/teams');
  const { data: users } = useAuthenticatedQuery('users', '/users');

  const handleQuickRange = (days: number) => {
    setDateRange({
      from: startOfDay(subDays(new Date(), days)),
      to: endOfDay(new Date()),
    });
  };

  const isLoading = dashboardLoading || slaLoading || volumeLoading;

  const handleExportReport = () => {
    toast({
      title: "Exportando relatório",
      description: "O relatório será baixado em alguns instantes.",
    });
    
    // Simulate report generation
    const reportData = {
      period: `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`,
      totalTickets: dashboardMetrics?.totalTickets || 0,
      openTickets: dashboardMetrics?.openTickets || 0,
      avgResolutionTime: dashboardMetrics?.avgResolutionTime || 0,
      slaBreaches: dashboardMetrics?.slaBreaches || 0,
      csatScore: dashboardMetrics?.csatScore || 0,
      generatedAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `relatorio-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Análise detalhada do desempenho do service desk
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportReport}>
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Período:</span>
              <div className="flex gap-2">
                {QUICK_RANGES.map(range => (
                  <Button
                    key={range.days}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickRange(range.days)}
                    className={
                      dateRange.from.getTime() === startOfDay(subDays(new Date(), range.days)).getTime()
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({
                          from: startOfDay(range.from),
                          to: endOfDay(range.to),
                        });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="csat">Satisfação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Chamados</CardTitle>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics?.totalTickets || 0}</div>
                <p className="text-xs text-gray-600">
                  {dashboardMetrics?.openTickets || 0} em aberto
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio de Resolução</CardTitle>
                <Clock className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardMetrics?.avgResolutionTime 
                    ? `${Math.round(dashboardMetrics.avgResolutionTime)}h`
                    : "0h"
                  }
                </div>
                <p className="text-xs text-gray-600">
                  Últimos {dashboardMetrics?.resolvedTickets || 0} resolvidos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Violações de SLA</CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics?.slaBreaches || 0}</div>
                <p className="text-xs text-gray-600">
                  {dashboardMetrics?.totalTickets > 0 
                    ? `${Math.round((dashboardMetrics.slaBreaches / dashboardMetrics.totalTickets) * 100)}%`
                    : "0%"
                  } do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfação (CSAT)</CardTitle>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardMetrics?.csatScore 
                    ? `${dashboardMetrics.csatScore.toFixed(1)}/5`
                    : "N/A"
                  }
                </div>
                <p className="text-xs text-gray-600">
                  Baseado nas avaliações
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Principais Categorias</CardTitle>
                <CardDescription>
                  Categorias com mais chamados no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardMetrics?.topCategories?.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <span className="text-sm text-gray-600">{category.count} chamados</span>
                    </div>
                  ))}
                  {(!dashboardMetrics?.topCategories?.length) && (
                    <p className="text-sm text-gray-600">Nenhuma categoria encontrada</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance dos Agentes</CardTitle>
                <CardDescription>
                  Desempenho dos agentes no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardMetrics?.agentPerformance?.slice(0, 5).map((agent, index) => (
                    <div key={agent.agentId} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{agent.agentName}</div>
                        <div className="text-sm text-gray-600">
                          {agent.resolvedTickets}/{agent.assignedTickets} resolvidos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {agent.avgResolutionTime > 0 ? `${Math.round(agent.avgResolutionTime)}h` : "N/A"}
                        </div>
                        <div className="text-xs text-gray-600">tempo médio</div>
                      </div>
                    </div>
                  ))}
                  {(!dashboardMetrics?.agentPerformance?.length) && (
                    <p className="text-sm text-gray-600">Nenhum agente encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sla" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Conformidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {slaReport?.complianceRate?.toFixed(1) || 0}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {slaReport?.slaCompliant || 0} de {slaReport?.totalTickets || 0} tickets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Violações Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {slaReport?.slaBreached || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Tickets que violaram o SLA
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tickets em Risco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {dashboardMetrics?.slaBreaches || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Tickets próximos ao vencimento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* SLA by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Violações por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(slaReport?.breachesByPriority || {}).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <Badge variant={
                      priority === 'P1' ? 'destructive' :
                      priority === 'P2' ? 'secondary' :
                      'outline'
                    }>
                      {priority}
                    </Badge>
                    <span>{count} violações</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tickets por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {volumeReport?.ticketsByStatus?.map(item => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="font-medium">{item.status}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tickets por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {volumeReport?.ticketsByPriority?.map(item => (
                    <div key={item.priority} className="flex items-center justify-between">
                      <Badge variant={
                        item.priority === 'P1' ? 'destructive' :
                        item.priority === 'P2' ? 'secondary' :
                        'outline'
                      }>
                        {item.priority}
                      </Badge>
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Detalhada dos Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardMetrics?.agentPerformance?.map((agent) => (
                  <div key={agent.agentId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{agent.agentName}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {agent.resolvedTickets}/{agent.assignedTickets}
                        </Badge>
                        <Badge variant="secondary">
                          {agent.avgResolutionTime > 0 ? `${Math.round(agent.avgResolutionTime)}h` : "N/A"}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Atribuídos:</span>
                        <div className="font-medium">{agent.assignedTickets}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Resolvidos:</span>
                        <div className="font-medium">{agent.resolvedTickets}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Taxa de Resolução:</span>
                        <div className="font-medium">
                          {agent.assignedTickets > 0 
                            ? `${Math.round((agent.resolvedTickets / agent.assignedTickets) * 100)}%`
                            : "0%"
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csat" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pontuação Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">
                  {dashboardMetrics?.csatScore?.toFixed(1) || "N/A"}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  De 5.0 pontos possíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxa de Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">
                  N/A%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Pesquisas respondidas
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
