import axios from "axios";
import { API_URL } from "./baseUrl";
import { Property } from "./ChatbotService";

interface PropertyFilters {
  search?: string;
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  property_type?: string;
  transaction_type?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
}

interface PropertiesResponse {
  properties: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class PropertyService {
  private static API_URL = `${API_URL}/properties`;

  static async getAllProperties(
    pagination: PaginationParams,
    filters: PropertyFilters = {}
  ): Promise<PropertiesResponse> {
    try {
      const params = new URLSearchParams();
      
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const url = `${this.API_URL}?${params.toString()}`;

      const response = await axios.get<PropertiesResponse>(url);
      
      return response.data;
    } catch (error) {
      console.error("Error fetching properties:", error);
      console.error("Error details:", error.response?.data || error.message);
      throw new Error("Failed to fetch properties");
    }
  }
}