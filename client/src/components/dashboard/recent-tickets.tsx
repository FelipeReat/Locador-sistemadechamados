import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthenticatedQuery } from "@/hooks/use-api";
import { Link } from "wouter";
import { STATUS_LABELS, PRIORITY_LABELS, formatRelativeTime } from "@/lib/constants";
import { ArrowRightIcon, TicketIcon, ClockIcon, UserIcon } from "lucide-react";

export function RecentTickets() {
  const { data: tickets, isLoading } = useAuthenticatedQuery<any[]>(
    ['recent-tickets'],
    '/tickets/recent?limit=5'
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'LOW': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'WAITING_CUSTOMER': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CLOSED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center mr-3">
              <TicketIcon className="w-4 h-4 text-violet-600" />
            </div>
            Chamados Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse p-3 bg-gray-50 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center mr-3">
              <TicketIcon className="w-4 h-4 text-violet-600" />
            </div>
            Chamados Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TicketIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium">Nenhum chamado recente</p>
            <p className="text-xs text-gray-400 mt-1">Os chamados aparecerão aqui quando criados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-gray-800 flex items-center">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center mr-3">
            <TicketIcon className="w-4 h-4 text-violet-600" />
          </div>
          Chamados Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.slice(0, 5).map((ticket, index) => (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
            <div className="group p-4 rounded-lg hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 border border-transparent hover:border-violet-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-start justify-between space-x-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={`text-xs ${getPriorityColor(ticket.priority)} border`}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(ticket.status)} border`}>
                      {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS] || ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-violet-700 transition-colors">
                    {ticket.title || ticket.subject}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <UserIcon className="w-3 h-3" />
                      <span>{ticket.requester?.name || 'Usuário'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-3 h-3" />
                      <span>{formatRelativeTime(new Date(ticket.createdAt))}</span>
                    </div>
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-violet-500 transition-colors">
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        ))}
        
        <div className="pt-3 border-t border-gray-100">
          <Link href="/tickets">
            <button className="w-full p-3 text-center text-violet-600 hover:text-violet-700 font-medium text-sm bg-violet-50 hover:bg-violet-100 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
              <span>Ver Todos os Chamados</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}