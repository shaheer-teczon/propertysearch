import axios from "axios";
import { API_URL } from "./baseUrl";

interface ChatbotResponse {
  response: string;
  results: Property[];
  session_id?: string;
  parsed_filters?: {
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
    location?: string;
    transaction_type?: string;
    price_min?: number;
    price_max?: number;
  };
}

type MediaType = {
  smallUrl: string;
  mediumUrl: string;
  largeUrl: string;
  xLargeUrl: string;
  xxLargeUrl: string;
  height: number;
  width: number;
};

export interface Property {
  id?: string;
  name: string;
  description: string;
  salesPrice?: number | string;
  fullAddress?: string;
  location?: string;
  bedroomCount?: number;
  bathCount?: number;
  squareFeet?: number;
  livingSpaceSize?: string;
  image?: MediaType[];
  media?: MediaType[];
  slug: string;
}

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export class ChatbotService {
  private static API_URL = `${API_URL}/chat`;
  private static sessionId: string | null = null;

  private static isValidRole(role: string): role is "user" | "assistant" {
    return role === "user" || role === "assistant";
  }

  private static getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  static resetSession(): void {
    const oldSessionId = this.sessionId;
    this.sessionId = null;
    
    localStorage.removeItem('chat_session_id');
    
    if (oldSessionId) {
      this.clearBackendSession(oldSessionId);
    }
  }

  private static async clearBackendSession(sessionId: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/clear-session`, { session_id: sessionId });
    } catch (error) {
      console.warn("Failed to clear backend session:", error);
    }
  }

  static async sendMessage(
    userQuery: string,
    history: { role: string; content: string }[]
  ): Promise<ChatbotResponse> {
    const chatHistory: ChatMessage[] = history.map((message) => {
      if (!this.isValidRole(message.role)) {
        throw new Error(`Invalid role: ${message.role}`);
      }
      return { role: message.role, content: message.content };
    });

    const payload = {
      message: userQuery,
      history: chatHistory,
      session_id: this.getSessionId(),
    };

    try {
      const response = await axios.post<ChatbotResponse>(this.API_URL, payload);
      
      if (response.data.session_id) {
        this.sessionId = response.data.session_id;
      }
      
      return response.data;
    } catch (error) {
      console.error("Error in sendMessage:", error);
      throw new Error("Backend communication failed.");
    }
  }
}
