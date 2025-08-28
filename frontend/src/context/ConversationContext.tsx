import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatbotService } from '../utils/ChatbotService';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  properties?: any[];
}

interface ConversationContextType {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearConversation: () => void;
  hasSearched: boolean;
  setHasSearched: (searched: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  persistConversation: () => void;
  restoreConversation: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

interface ConversationProviderProps {
  children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const welcomeMessage: Message = {
    id: "welcome",
    content: `Welcome to Property Search Assistant! I'm your intelligent real estate assistant. Ask me anything about properties - I can help you find homes by location, price, bedrooms, or any specific criteria you have in mind.`,
    isUser: false,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([welcomeMessage]);
    }
  }, []);

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const clearConversation = () => {
    setMessages([welcomeMessage]);
    setHasSearched(false);
    localStorage.removeItem('real_estate_conversation');
    localStorage.removeItem('real_estate_has_searched');
    ChatbotService.resetSession();
  };

  const persistConversation = () => {
    try {
      localStorage.setItem('real_estate_conversation', JSON.stringify(messages));
      localStorage.setItem('real_estate_has_searched', JSON.stringify(hasSearched));
    } catch (error) {
      console.warn('Failed to persist conversation:', error);
    }
  };

  const restoreConversation = () => {
    try {
      const savedMessages = localStorage.getItem('real_estate_conversation');
      const savedHasSearched = localStorage.getItem('real_estate_has_searched');
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      }
      
      if (savedHasSearched) {
        setHasSearched(JSON.parse(savedHasSearched));
      }
    } catch (error) {
      console.warn('Failed to restore conversation:', error);
    }
  };

  useEffect(() => {
    if (messages.length > 1) {
      persistConversation();
    }
  }, [messages, hasSearched]);

  const value: ConversationContextType = {
    messages,
    setMessages,
    addMessage,
    clearConversation,
    hasSearched,
    setHasSearched,
    isLoading,
    setIsLoading,
    persistConversation,
    restoreConversation,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};