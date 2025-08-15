import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/constants";
import { MessageSquareIcon, LockIcon } from "lucide-react";

interface TicketCommentsProps {
  comments: any[];
}

export default function TicketComments({ comments }: TicketCommentsProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <MessageSquareIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum comentário ainda</p>
        <p className="text-sm">Seja o primeiro a comentar neste chamado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-200 text-xs">
                  {comment.author ? getInitials(comment.author.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {comment.author?.name || "Usuário desconhecido"}
              </span>
              <Badge 
                variant={comment.visibility === "INTERNAL" ? "destructive" : "secondary"}
                className="text-xs"
              >
                {comment.visibility === "INTERNAL" ? (
                  <>
                    <LockIcon className="w-3 h-3 mr-1" />
                    Interno
                  </>
                ) : (
                  "Público"
                )}
              </Badge>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(new Date(comment.createdAt))}
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {comment.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
