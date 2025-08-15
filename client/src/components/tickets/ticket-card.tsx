import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS, formatRelativeTime } from "@/lib/constants";
import { CalendarIcon, UserIcon, UsersIcon } from "lucide-react";

interface TicketCardProps {
  ticket: any;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary-500">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {ticket.code}
                </span>
                <Badge className={`text-xs ${PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS]}`}>
                  {ticket.priority}
                </Badge>
                <Badge className={`text-xs ${STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS]}`}>
                  {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS]}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {ticket.subject}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                {ticket.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              {ticket.requester && (
                <div className="flex items-center space-x-1">
                  <UserIcon className="h-3 w-3" />
                  <span>{ticket.requester.name}</span>
                </div>
              )}
              
              {ticket.assignee && (
                <div className="flex items-center space-x-1">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="bg-primary-100 text-primary-600 text-xs">
                      {getInitials(ticket.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{ticket.assignee.name}</span>
                </div>
              )}

              {ticket.team && (
                <div className="flex items-center space-x-1">
                  <UsersIcon className="h-3 w-3" />
                  <span>{ticket.team.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3" />
              <span>{formatRelativeTime(new Date(ticket.createdAt))}</span>
            </div>
          </div>

          {ticket.dueAt && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">SLA:</span>
                <span className={`font-medium ${
                  new Date(ticket.dueAt) < new Date() 
                    ? "text-red-600 dark:text-red-400" 
                    : "text-gray-700 dark:text-gray-300"
                }`}>
                  {new Date(ticket.dueAt) < new Date() 
                    ? `Vencido ${formatRelativeTime(new Date(ticket.dueAt))}`
                    : `Vence ${formatRelativeTime(new Date(ticket.dueAt))}`
                  }
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
