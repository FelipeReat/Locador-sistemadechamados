import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS, formatRelativeTime } from "@/lib/constants";
import { ArrowRightIcon, TicketIcon } from "lucide-react";

interface RecentTicketsProps {
  tickets: any[];
}

export default function RecentTickets({ tickets }: RecentTicketsProps) {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chamados Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <TicketIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum chamado recente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Chamados Recentes</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-gray-200 dark:divide-gray-700">
        {tickets.slice(0, 5).map((ticket) => (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
            <div className="py-4 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-6 px-6 cursor-pointer transition-colors">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Badge className={`text-xs ${PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS]}`}>
                    {ticket.priority}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {ticket.subject}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {ticket.requester?.name} • {formatRelativeTime(new Date(ticket.createdAt))}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge className={`text-xs ${STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS]}`}>
                    {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS]}
                  </Badge>
                </div>
              </div>
            </div>
          </Link>
        ))}
        
        <div className="pt-4">
          <Link href="/tickets">
            <button className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center">
              Ver todos os chamados
              <ArrowRightIcon className="ml-1 w-4 h-4" />
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
