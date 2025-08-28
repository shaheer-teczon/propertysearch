import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
}

export function ChatMessage({ content, isUser, timestamp }: ChatMessageProps) {
  return (
    <div className={cn("flex items-start gap-2 mb-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-emerald-700 text-white flex items-center justify-center">
          <Bot className="h-4 w-4" />
        </Avatar>
      )}
      <div className="flex flex-col">
        <div className={cn(
          "max-w-2xl",
          isUser ? "message-bubble-user animate-slide-up" : "message-bubble-bot animate-slide-up"
        )}>
          <div className="prose prose-sm max-w-none prose-emerald">
            <ReactMarkdown 
              components={{
                ul: ({children}) => <ul className="my-2 ml-4 space-y-1 list-disc">{children}</ul>,
                li: ({children}) => <li className="text-sm leading-relaxed">{children}</li>,
                strong: ({children}) => <strong className="font-semibold text-emerald-700">{children}</strong>,
                p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
        {timestamp && (
          <span className="text-xs text-muted-foreground mt-1">
            {timestamp}
          </span>
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 bg-emerald-700 text-white flex items-center justify-center">
          <User className="h-4 w-4" />
        </Avatar>
      )}
    </div>
  );
}
