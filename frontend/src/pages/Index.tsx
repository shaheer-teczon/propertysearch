import { useState, useEffect, useRef } from "react";
import { 
  Building, 
  Info, 
  Search, 
  Filter,
  Grid,
  List,
  MapPin,
  Sparkles,
  MessageCircle,
  X,
  Code,
  HelpCircle,
  SlidersHorizontal
} from "lucide-react";
import { Link } from "react-router-dom";
import { ChatMessage } from "@/components/ChatMessage";
import { ModernPropertyCard } from "@/components/ModernPropertyCard";
import { ChatInput } from "@/components/ChatInput";
import { DemoGuide } from "@/components/DemoGuide";
import { DemoAlert } from "@/components/DemoAlert";
import { TourBookingModal } from "@/components/TourBookingModal";
import { PropertyFilters } from "@/components/FilterSidebar";
import { ChatbotService, Property } from "@/utils/ChatbotService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useConversation } from "@/context/ConversationContext";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  properties?: Property[];
}

const Index = () => {
  const { 
    messages, 
    addMessage, 
    clearConversation, 
    hasSearched, 
    setHasSearched, 
    isLoading, 
    setIsLoading,
    restoreConversation 
  } = useConversation();
  
  const [showDemoGuide, setShowDemoGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [expectingProperties, setExpectingProperties] = useState(false);
  const [transactionType, setTransactionType] = useState<'buy' | 'rent'>('buy');
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [showFilters, setShowFilters] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    restoreConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, overrideTransactionType?: 'buy' | 'rent') => {
    if (isLoading) return;

    const propertyKeywords = ['find', 'show', 'search', 'properties', 'house', 'apartment', 'condo', 'home', 'bedroom', 'bath', 'price', 'location', 'under', 'over', 'sqft', 'square feet', 'luxury', 'modern'];
    const expectProperties = propertyKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
    const currentTransactionType = overrideTransactionType || transactionType;
    let enhancedContent = content;
    if (expectProperties && !content.toLowerCase().includes('buy') && !content.toLowerCase().includes('rent') && !content.toLowerCase().includes('sale')) {
      enhancedContent = `${content} for ${currentTransactionType}`;
    }

    const userMessage = {
      id: Date.now().toString(),
      content: enhancedContent,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    addMessage(userMessage);
    setIsLoading(true);
    setExpectingProperties(expectProperties);

    try {
      const history = messages.slice(1).map((message) => ({
        role: message.isUser ? "user" : "assistant",
        content: message.content,
      }));

      const historyWithUserMessage = [
        ...history,
        { role: "user", content: enhancedContent },
      ];

      const { response, results, parsed_filters } = await ChatbotService.sendMessage(
        enhancedContent,
        historyWithUserMessage
      );



      if (parsed_filters) {
        const backendFilters = {
          propertyType: parsed_filters.property_type,
          bedrooms: parsed_filters.bedrooms,
          bathrooms: parsed_filters.bathrooms,
          location: parsed_filters.location,
          transactionType: parsed_filters.transaction_type as 'buy' | 'rent',
          priceMin: parsed_filters.price_min,
          priceMax: parsed_filters.price_max,
        };
        
        const cleanFilters = Object.fromEntries(
          Object.entries(backendFilters).filter(([_, value]) => value !== undefined)
        );
        
        setFilters(prev => ({ ...prev, ...cleanFilters }));
        if (parsed_filters.transaction_type) {
          setTransactionType(parsed_filters.transaction_type as 'buy' | 'rent');
        }
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        content: response || "No matching properties found.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        properties: results && Array.isArray(results) && results.length > 0 ? results : undefined,
      };

      addMessage(botMessage);
      setHasSearched(true);
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error while searching for properties. Please try again.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      
      addMessage(errorMessage);
      setHasSearched(true);
      
      toast({
        title: "Error",
        description: "Failed to get a response from the real estate assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setExpectingProperties(false);
    }
  };

  const handleBookingConfirmed = async (message: string) => {
    await handleSendMessage(message);
  };

  const handleBookingClick = (property: Property) => {
    setSelectedProperty(property);
    setShowBookingModal(true);
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    
    const enhancedQuery = enhanceNeighborhoodQuery(query);
    handleSendMessage(enhancedQuery, transactionType);
    setShowFilters(true);
  };

  const enhanceNeighborhoodQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase().trim();
    
    const neighborhoods = [
      'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island',
      'upper east side', 'upper west side', 'midtown', 'downtown',
      'soho', 'tribeca', 'chelsea', 'greenwich village', 'east village',
      'williamsburg', 'park slope', 'dumbo', 'carroll gardens',
      'red hook', 'prospect heights', 'fort greene', 'cobble hill'
    ];

    const isJustNeighborhood = neighborhoods.some(neighborhood => 
      lowerQuery === neighborhood || lowerQuery === neighborhood.replace(/\s+/g, '')
    );

    if (isJustNeighborhood) {
      return `Show me properties in ${query}`;
    }

    return query;
  };

  const handleSuggestedQuery = (query: string) => {
    handleSendMessage(query, transactionType);
  };

  const suggestedQueries = [
    "2 bedroom condo",
    "studio apartment",
    "3 bedroom family home with good schools",
    "luxury apartment with gym",
    "Brooklyn apartment",
    "apartment with parking",
    "waterfront apartment",
    "apartments under $4000"
  ];

  const handleClearChat = () => {
    clearConversation();
    setSearchQuery('');
    setFilters({});
    setShowFilters(true);
  };

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
  };

  const handleFilterChange = (key: keyof PropertyFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleApplyFilters = () => {
    const filterParts = [];
    
    if (filters.search) filterParts.push(filters.search);
    if (filters.propertyType) filterParts.push(filters.propertyType);
    if (filters.bedrooms !== undefined) {
      filterParts.push(filters.bedrooms === 0 ? 'studio' : `${filters.bedrooms} bedroom`);
    }
    if (filters.location) filterParts.push(`in ${filters.location}`);
    if (filters.priceMin || filters.priceMax) {
      if (filters.priceMin && filters.priceMax) {
        filterParts.push(`$${filters.priceMin} to $${filters.priceMax}`);
      } else if (filters.priceMin) {
        filterParts.push(`over $${filters.priceMin}`);
      } else if (filters.priceMax) {
        filterParts.push(`under $${filters.priceMax}`);
      }
    }
    
    const query = filterParts.length > 0 
      ? `Show me ${filterParts.join(' ')}`
      : 'Show me available properties';
    
    handleSendMessage(query, filters.transactionType);
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <DemoAlert />
      
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-emerald-600 animate-pulse shadow-lg">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 animate-pulse"></div>
          </div>
        </div>
      )}
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 pt-12 sm:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="bg-emerald-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <Building className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  Property Search Assistant
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Find your perfect property with AI
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Link to="/all-properties">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  <span className="hidden sm:inline">All Properties</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDemoGuide(true)}
                className="flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Guide</span>
              </Button>
              {hasSearched && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearChat}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">New Search</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-2 sm:px-4 py-8">
        {!hasSearched && (
          <div className="text-center py-8 sm:py-16 px-4 max-w-4xl mx-auto">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-emerald-100 p-3 sm:p-4 rounded-full">
                <Search className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Find Your Dream Property
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              Use our AI-powered search to discover the perfect home. Simply describe what you're looking for.
            </p>
            
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => {
                    setTransactionType('buy');
                    setFilters(prev => ({ ...prev, transactionType: 'buy' }));
                  }}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    transactionType === 'buy'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                  disabled={isLoading}
                >
                  Buy
                </button>
                <button
                  onClick={() => {
                    setTransactionType('rent');
                    setFilters(prev => ({ ...prev, transactionType: 'rent' }));
                  }}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    transactionType === 'rent'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                  disabled={isLoading}
                >
                  Rent
                </button>
              </div>
            </div>
            
            <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={isLoading ? "Searching..." : "Try: 3br apartment in Manhattan"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoading}
                  className={`pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-200 focus:border-emerald-500 rounded-xl transition-all duration-200 ${
                    isLoading ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  onKeyPress={(e) => e.key === 'Enter' && searchQuery && !isLoading && handleQuickSearch(searchQuery)}
                />
                {searchQuery && (
                  <Button
                    onClick={() => handleQuickSearch(searchQuery)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base px-3 sm:px-4 transition-all duration-200"
                    disabled={isLoading}
                    size="sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 border-2 border-white border-t-transparent" />
                        <span className="hidden sm:inline">Searching...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Search</span>
                        <span className="sm:hidden">Go</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {suggestedQueries.map((query, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 cursor-pointer hover:bg-emerald-100 hover:text-emerald-700 transition-all duration-200 text-xs sm:text-sm transform hover:scale-105 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => !isLoading && handleQuickSearch(query)}
                >
                  {query}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {hasSearched && (
          <div className="max-w-7xl mx-auto">
            {showFilters && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Filter Properties</h3>
                    <div className="flex items-center gap-2">
                      {activeFiltersCount > 0 && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear All
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction Type
                      </label>
                      <Select value={filters.transactionType || "any"} onValueChange={(value) => handleFilterChange('transactionType', value && value !== "any" ? value : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="buy">For Sale</SelectItem>
                          <SelectItem value="rent">For Rent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Type
                      </label>
                      <Select value={filters.propertyType || "any"} onValueChange={(value) => handleFilterChange('propertyType', value && value !== "any" ? value : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="condo">Condo</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <Select value={filters.location || "any"} onValueChange={(value) => handleFilterChange('location', value && value !== "any" ? value : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="Brooklyn">Brooklyn</SelectItem>
                          <SelectItem value="New York City">New York City</SelectItem>
                          <SelectItem value="New York">New York</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Property name..."
                          value={filters.search || ''}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Price Range
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.priceMin || ''}
                          onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.priceMax || ''}
                          onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bedrooms
                      </label>
                      <Select value={filters.bedrooms?.toString() || "any"} onValueChange={(value) => handleFilterChange('bedrooms', value && value !== "any" ? Number(value) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="0">Studio</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bathrooms
                      </label>
                      <Select value={filters.bathrooms?.toString() || "any"} onValueChange={(value) => handleFilterChange('bathrooms', value && value !== "any" ? Number(value) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      onClick={handleApplyFilters}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4 min-h-0 max-h-[calc(100vh-200px)]">
              <div className="w-1/3 flex flex-col min-h-0">
                <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col min-h-0">
                  <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-semibold">Search Conversation</h3>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-full">
                          <ChatMessage
                            content={message.content}
                            isUser={message.isUser}
                            timestamp={message.timestamp}
                          />
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-200"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <div className="p-4 border-t border-gray-200 flex-shrink-0">
                    <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
                  </div>
                </div>
              </div>

              <div className="w-2/3 flex flex-col min-h-0">
                <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col min-h-0">
                  <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-emerald-600" />
                        <h3 className="font-semibold">Properties</h3>
                        {(() => {
                          const messageWithProperties = [...messages].reverse().find(m => m.properties?.length);
                          const currentCount = messageWithProperties?.properties?.length || 0;
                          return currentCount > 0 ? (
                            <span className="text-sm text-gray-500">
                              ({currentCount} found)
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    {(() => {
                      const messageWithProperties = [...messages].reverse().find(m => m.properties?.length);
                      const currentProperties = messageWithProperties?.properties || [];
                      
                      return currentProperties.length > 0 ? (
                        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                          {currentProperties.map((property, index) => {
                            if (!property || !property.name) return null;
                            
                            return (
                              <div
                                key={`${messageWithProperties?.id}-property-${index}`}
                                className="animate-scale-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                              >
                                <ModernPropertyCard
                                  id={property.id}
                                  name={property.name}
                                  salesPrice={property.salesPrice?.toString()}
                                  location={property.fullAddress || property.location || ''}
                                  bedroomCount={property.bedroomCount}
                                  bathCount={property.bathCount}
                                  squareFeet={property.livingSpaceSize ? parseInt(property.livingSpaceSize) : property.squareFeet}
                                  image={property.media || property.image}
                                  slug={property.slug || ''}
                                  description={property.description || ''}
                                  onBookingClick={handleBookingClick}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>Start searching to see properties here</p>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {isLoading && expectingProperties && (
                      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 max-w-full">
                        {[1, 2, 3, 4, 5, 6].map((index) => (
                          <div key={index} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden animate-pulse w-full">
                            <div className="aspect-[4/3] bg-gray-200 w-full"></div>
                            <div className="p-4 space-y-3">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              <div className="flex gap-4">
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                              </div>
                              <div className="flex gap-2">
                                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>


      {showDemoGuide && (
        <DemoGuide onClose={() => setShowDemoGuide(false)} />
      )}
      
      <TourBookingModal
        property={selectedProperty}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSubmit={handleBookingConfirmed}
      />

      <Link 
        to="/technical-spec"
        className="fixed bottom-6 right-6 z-50 bg-slate-700 hover:bg-slate-800 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 group"
        title="View Technical Specification"
      >
        <Code className="h-5 w-5" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Technical Spec
        </span>
      </Link>
    </div>
  );
};

export default Index;
