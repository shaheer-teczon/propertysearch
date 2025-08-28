import { useState, useEffect } from "react";
import { 
  Building, 
  Search, 
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Code,
  HelpCircle
} from "lucide-react";
import { ModernPropertyCard } from "@/components/ModernPropertyCard";
import { TourBookingModal } from "@/components/TourBookingModal";
import { DemoGuide } from "@/components/DemoGuide";
import { Property } from "@/utils/ChatbotService";
import { PropertyService } from "@/utils/PropertyService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

interface PropertyFilters {
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  propertyType?: string;
  transactionType?: string;
  search?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AllProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDemoGuide, setShowDemoGuide] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const { toast } = useToast();

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [pagination.page, debouncedFilters]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const filterParams = {
        search: debouncedFilters.search,
        price_min: debouncedFilters.priceMin,
        price_max: debouncedFilters.priceMax,
        bedrooms: debouncedFilters.bedrooms,
        bathrooms: debouncedFilters.bathrooms,
        location: debouncedFilters.location,
        property_type: debouncedFilters.propertyType,
        transaction_type: debouncedFilters.transactionType
      };


      const response = await PropertyService.getAllProperties(
        { page: pagination.page, limit: pagination.limit },
        filterParams
      );

      setProperties(response.properties || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
      toast({
        title: "Error", 
        description: "Failed to fetch properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PropertyFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleBookingClick = (property: Property) => {
    setSelectedProperty(property);
    setShowBookingModal(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="bg-emerald-600 p-2 rounded-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">All Properties</h1>
                  <p className="text-sm text-gray-600">Browse all available listings</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDemoGuide(true)}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Guide</span>
              </Button>
              
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
              
              <div className="flex items-center border border-gray-200 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-emerald-600" />
            <span className="text-lg font-semibold">
              {loading ? 'Loading...' : `${pagination.total} Properties Found`}
            </span>
          </div>
          
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex gap-4">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {properties.map((property, index) => (
              <div
                key={property.id || index}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ModernPropertyCard
                  id={property.id}
                  name={property.name}
                  salesPrice={property.salesPrice?.toString()}
                  location={property.fullAddress || property.location || ''}
                  bedroomCount={property.bedroomCount}
                  bathCount={property.bathCount}
                  squareFeet={property.squareFeet}
                  image={property.media || property.image}
                  slug={property.slug}
                  description={property.description}
                  onBookingClick={handleBookingClick}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        )}

        {properties.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(pagination.totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                const isCurrentPage = pageNumber === pagination.page;
                
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.totalPages ||
                  (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
                ) {
                  return (
                    <Button
                      key={pageNumber}
                      variant={isCurrentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      className="w-10"
                    >
                      {pageNumber}
                    </Button>
                  );
                } else if (
                  pageNumber === pagination.page - 2 ||
                  pageNumber === pagination.page + 2
                ) {
                  return <span key={pageNumber} className="px-2 text-gray-500">...</span>;
                }
                return null;
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
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
        onSubmit={(message) => {
        }}
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

export default AllProperties;