import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MetricCard from "@/components/dashboard/metric-card";
import RecentTickets from "@/components/dashboard/recent-tickets";
import { 
  TicketIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  StarIcon,
  LaptopIcon,
  KeyIcon,
  DownloadIcon,
  TriangleAlert,
  ArrowRightIcon
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuthenticatedQuery } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";


export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useAuthenticatedQuery(
    ['dashboard-metrics'],
    '/dashboard/metrics'
  );

  const { data: ticketsByStatus, isLoading: statusLoading } = useAuthenticatedQuery(
    ['dashboard-tickets-by-status'],
    '/dashboard/tickets-by-status'
  );

  const { data: recentTickets, isLoading: ticketsLoading } = useAuthenticatedQuery(
    ['dashboard-recent-tickets'],
    '/dashboard/recent-tickets'
  );

  const statusData = Array.isArray(ticketsByStatus) ? ticketsByStatus.reduce((acc: Record<string, number>, item: { status: string; count: number }) => {
    acc[item.status] = item.count;
    return acc;
  }, {}) : {};

  const totalTickets = Object.values(statusData).reduce((sum: number, count: unknown) => sum + (count as number), 0);

  const [, setLocation] = useLocation();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Sistema Operacional
          </Badge>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Chamados Abertos"
          value={metricsLoading ? "..." : ((metrics as any)?.openTickets?.toString() || "0")}
          change="-12% vs. semana passada"
          changeType="positive"
          icon={TicketIcon}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100 dark:bg-blue-900"
        />

        <MetricCard
          title="SLA em Risco"
          value={metricsLoading ? "..." : ((metrics as any)?.slaAtRisk?.toString() || "0")}
          change="+5% vs. semana passada"
          changeType="negative"
          icon={AlertTriangleIcon}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100 dark:bg-orange-900"
        />

        <MetricCard
          title="Resolvidos Hoje"
          value={metricsLoading ? "..." : ((metrics as any)?.resolvedToday?.toString() || "0")}
          change="+18% vs. ontem"
          changeType="positive"
          icon={CheckCircleIcon}
          iconColor="text-green-600"
          iconBgColor="bg-green-100 dark:bg-green-900"
        />

        <MetricCard
          title="CSAT Médio"
          value={metricsLoading ? "..." : ((metrics as any)?.avgCSAT?.toFixed(1) || "0.0")}
          change="+0.3 vs. mês passado"
          changeType="positive"
          icon={StarIcon}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100 dark:bg-purple-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Queue Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Fila de Chamados por Status</CardTitle>
                <div className="flex space-x-2 text-sm">
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Hoje</button>
                  <button className="text-primary-600 font-medium">Semana</button>
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Mês</button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { status: 'NEW', label: 'Novo', count: statusData.NEW || 0, color: 'bg-red-500' },
                { status: 'IN_PROGRESS', label: 'Em Andamento', count: statusData.IN_PROGRESS || 0, color: 'bg-yellow-500' },
                { status: 'WAITING_CUSTOMER', label: 'Aguardando Cliente', count: statusData.WAITING_CUSTOMER || 0, color: 'bg-blue-500' },
                { status: 'WAITING_APPROVAL', label: 'Aguardando Aprovação', count: statusData.WAITING_APPROVAL || 0, color: 'bg-purple-500' },
              ].map(({ status, label, count, color }) => {
                const percentage = (totalTickets as number) > 0 ? (count / (totalTickets as number)) * 100 : 0;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${color}`}></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{count}</span>
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className={`${color} h-2 rounded-full`} style={{width: `${percentage}%`}}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <div>
          <RecentTickets tickets={Array.isArray(recentTickets) ? recentTickets : []} />
        </div>
      </div>

      {/* Quick Actions */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => setLocation("/tickets/new?category=access")}
              >
                <LaptopIcon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Solicitar Acesso</div>
                  <div className="text-sm text-gray-500">Sistemas e aplicações</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => setLocation("/tickets/new?category=password")}
              >
                <KeyIcon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Reset de Senha</div>
                  <div className="text-sm text-gray-500">Redefinir credenciais</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => setLocation("/tickets/new?category=software")}
              >
                <DownloadIcon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Instalar Software</div>
                  <div className="text-sm text-gray-500">Aplicações corporativas</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

      {/* Service Catalog Preview */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Catálogo de Serviços</CardTitle>
            <Link href="/catalog">
              <button className="text-sm text-primary-600 hover:text-primary-500 font-medium flex items-center">
                Ver todos <ArrowRightIcon className="ml-1 w-4 h-4" />
              </button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/tickets/new?category=Hardware">
              <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 hover:shadow-sm text-left transition-all duration-200 w-full">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <LaptopIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Hardware</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Equipamentos</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Solicitações de equipamentos, manutenção e substituição
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tempo médio: 2h
                </p>
              </button>
            </Link>

            <Link href="/tickets/new?category=Acesso">
              <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 hover:shadow-sm text-left transition-all duration-200 w-full">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <KeyIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Acesso a Sistemas</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Segurança</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Liberação de acesso, criação de usuários e permissões
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tempo médio: 1h
                </p>
              </button>
            </Link>

            <Link href="/tickets/new?category=Software">
              <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 hover:shadow-sm text-left transition-all duration-200 w-full">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <DownloadIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Software</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Aplicações</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Instalação, atualização e licenciamento de software
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tempo médio: 30min
                </p>
              </button>
            </Link>

            <Link href="/tickets/new?category=Incidente">
              <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 hover:shadow-sm text-left transition-all duration-200 w-full">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <TriangleAlert className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Incidentes</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Suporte</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Reportar problemas e incidentes no sistema
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tempo médio: 4h
                </p>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}