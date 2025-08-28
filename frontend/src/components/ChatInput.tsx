
import { useState, FormEvent } from "react";
import { Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me about properties... (e.g., 'luxury apartment with gym and doorman')"
          className="pl-10 pr-4 py-6 bg-background focus-visible:ring-estate-primary"
          disabled={isLoading}
          title="Demo tip: Try queries like '3 bedroom house', 'studio for rent in Manhattan', or 'luxury apartment with gym'!"
        />
      </div>
      <Button 
        type="submit" 
        size="icon" 
        className="h-12 w-12 rounded-full bg-estate-primary hover:bg-estate-secondary"
        disabled={isLoading || !message.trim()}
      >
        <Send className="h-5 w-5" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
