import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { useAuthenticatedQuery } from "@/hooks/use-api";
import { 
  TicketIcon, 
  AlertTriangleIcon, 
  CheckCircleIcon, 
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
  ClockIcon
} from "lucide-react";

interface Metrics {
  openTickets: number;
  slaAtRisk: number;
  resolvedToday: number;
  avgCSAT: number;
  totalTickets: number;
  activeAgents: number;
  avgResponseTime: number;
}

interface StatusData {
  NEW: number;
  IN_PROGRESS: number;
  WAITING_CUSTOMER: number;
  WAITING_APPROVAL: number;
  RESOLVED: number;
  CLOSED: number;
}

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useAuthenticatedQuery<Metrics>(
    ['metrics'],
    '/metrics'
  );

  const { data: statusData, isLoading: statusLoading } = useAuthenticatedQuery<StatusData>(
    ['status-data'],
    '/tickets/status-counts'
  );

  const totalTickets = statusData ? Object.values(statusData).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent">
              Service Desk Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Bem-vindo de volta! Aqui está o resumo do seu sistema.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
              Sistema Online
            </Badge>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Chamados Abertos"
            value={metricsLoading ? "..." : (metrics?.openTickets?.toString() || "0")}
            change="-12% vs. semana passada"
            changeType="positive"
            icon={TicketIcon}
            iconColor="text-violet-600"
            iconBgColor="bg-violet-100"
            gradient="from-violet-500/10 to-purple-500/10"
          />

          <MetricCard
            title="SLA em Risco"
            value={metricsLoading ? "..." : (metrics?.slaAtRisk?.toString() || "0")}
            change="+5% vs. semana passada"
            changeType="negative"
            icon={AlertTriangleIcon}
            iconColor="text-rose-600"
            iconBgColor="bg-rose-100"
            gradient="from-rose-500/10 to-orange-500/10"
          />

          <MetricCard
            title="Resolvidos Hoje"
            value={metricsLoading ? "..." : (metrics?.resolvedToday?.toString() || "0")}
            change="+18% vs. ontem"
            changeType="positive"
            icon={CheckCircleIcon}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
            gradient="from-emerald-500/10 to-green-500/10"
          />

          <MetricCard
            title="CSAT Médio"
            value={metricsLoading ? "..." : (metrics?.avgCSAT?.toFixed(1) || "0.0")}
            change="+0.3 vs. mês passado"
            changeType="positive"
            icon={StarIcon}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
            gradient="from-amber-500/10 to-orange-500/10"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sky-700">Total de Chamados</p>
                  <p className="text-2xl font-bold text-sky-900">{totalTickets}</p>
                </div>
                <div className="p-3 bg-sky-100 rounded-full">
                  <TrendingUpIcon className="w-6 h-6 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700">Agentes Ativos</p>
                  <p className="text-2xl font-bold text-indigo-900">{metrics?.activeAgents || 0}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full">
                  <UsersIcon className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-700">Tempo Médio Resposta</p>
                  <p className="text-2xl font-bold text-teal-900">{metrics?.avgResponseTime || 0}min</p>
                </div>
                <div className="p-3 bg-teal-100 rounded-full">
                  <ClockIcon className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Status Distribution Chart */}
          <div className="lg:col-span-2">
            <Card className="card-elevated">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-800 flex items-center">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center mr-3">
                    <TicketIcon className="w-4 h-4 text-violet-600" />
                  </div>
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {statusLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-6 bg-gray-100 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { status: 'NEW', label: 'Novos', count: statusData?.NEW || 0, color: 'bg-violet-400', bgColor: 'bg-violet-50' },
                      { status: 'IN_PROGRESS', label: 'Em Andamento', count: statusData?.IN_PROGRESS || 0, color: 'bg-blue-400', bgColor: 'bg-blue-50' },
                      { status: 'WAITING_CUSTOMER', label: 'Aguardando Cliente', count: statusData?.WAITING_CUSTOMER || 0, color: 'bg-amber-400', bgColor: 'bg-amber-50' },
                      { status: 'RESOLVED', label: 'Resolvidos', count: statusData?.RESOLVED || 0, color: 'bg-emerald-400', bgColor: 'bg-emerald-50' },
                    ].map(({ status, label, count, color, bgColor }) => {
                      const percentage = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
                      return (
                        <div key={status} className={`p-4 rounded-xl ${bgColor} border border-opacity-20`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-gray-800">{label}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-gray-900">{count}</span>
                              <span className="text-sm text-gray-600">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Tickets */}
          <div className="space-y-6">
            <RecentTickets />
            
            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-violet-800">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full p-3 bg-white/80 hover:bg-white text-violet-700 rounded-lg font-medium transition-all duration-200 hover:shadow-sm border border-violet-200/50">
                  + Novo Chamado
                </button>
                <button className="w-full p-3 bg-emerald-100/80 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium transition-all duration-200 hover:shadow-sm border border-emerald-200/50">
                  📋 Ver Relatórios
                </button>
                <button className="w-full p-3 bg-sky-100/80 hover:bg-sky-100 text-sky-700 rounded-lg font-medium transition-all duration-200 hover:shadow-sm border border-sky-200/50">
                  🔧 Configurações
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}