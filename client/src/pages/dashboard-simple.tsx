import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TicketIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  TrendingUpIcon,
  ArrowRightIcon
} from "lucide-react";
import { Link } from "wouter";
import { useMockApi } from "@/hooks/use-mock-api";

export default function Dashboard() {
  const mockData = useMockApi();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Abastecimento</h1>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Sistema Operacional
          </Badge>
        </div>
        
        <Link href="/tickets/new">
          <Button className="bg-primary hover:bg-primary/90">
            <TicketIcon className="h-4 w-4 mr-2" />
            Novo Chamado
          </Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <TicketIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {mockData.metrics.totalTickets}
                </p>
                <p className="text-sm text-muted-foreground">Total de Requisições</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangleIcon className="h-6 w-6" style={{ color: 'hsl(35, 91%, 58%)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {mockData.metrics.openTickets}
                </p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockData.metrics.resolvedTickets}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Resolvidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockData.metrics.avgResolutionTime}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tempo Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Chamados Recentes</CardTitle>
            <Link href="/tickets">
              <Button variant="ghost" size="sm">
                Ver todos
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      ticket.status === 'OPEN' ? 'bg-red-500' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-violet-500' :
                      'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{ticket.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {ticket.requester.name} • {ticket.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    ticket.priority === 'HIGH' ? 'destructive' :
                    ticket.priority === 'MEDIUM' ? 'default' : 
                    'secondary'
                  }>
                    {ticket.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Chart */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Status dos Chamados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.ticketsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.status === 'OPEN' ? 'Aberto' :
                       item.status === 'IN_PROGRESS' ? 'Em Progresso' :
                       item.status === 'RESOLVED' ? 'Resolvido' : 'Fechado'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/tickets/new">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <TicketIcon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Criar Chamado</div>
                  <div className="text-sm text-gray-500">Solicitar suporte técnico</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/catalog">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <TrendingUpIcon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Catálogo de Serviços</div>
                  <div className="text-sm text-gray-500">Explorar serviços disponíveis</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/knowledge">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <UserIcon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Base de Conhecimento</div>
                  <div className="text-sm text-gray-500">Encontrar soluções</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}