import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/constants";
import { 
  PlusIcon, 
  UserIcon, 
  ArrowRightIcon, 
  MessageSquareIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";

interface TicketTimelineProps {
  events: any[];
}

export default function TicketTimeline({ events }: TicketTimelineProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'CREATED':
        return <PlusIcon className="w-3 h-3" />;
      case 'ASSIGNED':
        return <UserIcon className="w-3 h-3" />;
      case 'STATUS_CHANGED':
        return <ArrowRightIcon className="w-3 h-3" />;
      case 'COMMENT_ADDED':
        return <MessageSquareIcon className="w-3 h-3" />;
      case 'ESCALATED':
        return <AlertTriangleIcon className="w-3 h-3" />;
      case 'RESOLVED':
        return <CheckCircleIcon className="w-3 h-3" />;
      case 'CLOSED':
        return <XCircleIcon className="w-3 h-3" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-300"></div>;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'CREATED':
        return 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'ASSIGNED':
        return 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'STATUS_CHANGED':
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300';
      case 'COMMENT_ADDED':
        return 'bg-indigo-50 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200';
      case 'ESCALATED':
        return 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200';
      case 'CLOSED':
        return 'bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300';
    }
  };

  const getEventDescription = (event: any) => {
    switch (event.eventType) {
      case 'CREATED':
        return 'criou o chamado';
      case 'ASSIGNED':
        return `atribuiu para ${event.newValue}`;
      case 'STATUS_CHANGED':
        return `alterou status de ${event.oldValue} para ${event.newValue}`;
      case 'COMMENT_ADDED':
        return 'adicionou um comentário';
      case 'ESCALATED':
        return 'escalou o chamado';
      case 'RESOLVED':
        return 'resolveu o chamado';
      case 'CLOSED':
        return 'fechou o chamado';
      default:
        return event.description || 'atualizou o chamado';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>Nenhum evento encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(event.eventType)}`}>
              {getEventIcon(event.eventType)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {event.actorId ? "Usuário" : "Sistema"}
              </p>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getEventDescription(event)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatRelativeTime(new Date(event.createdAt))}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
