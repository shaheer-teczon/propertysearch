import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Bed, Bath, Square, DollarSign, School, Car, Waves, Dumbbell, Shield, Flame, Code, HelpCircle } from 'lucide-react';
import { DemoGuide } from "@/components/DemoGuide";
import { TourBookingModal } from "@/components/TourBookingModal";
import { Link } from 'react-router-dom';
import { API_URL } from '@/utils/baseUrl';

interface Property {
  id: string;
  name: string;
  description: string;
  salesPrice?: number;
  fullAddress?: string;
  bedroomCount?: number;
  bathCount?: number;
  squareFeet?: number;
  propertyType?: string;
  amenities?: string[];
  city?: string;
  nearby_schools?: Array<{
    name: string;
    distance: number;
    rating: number;
  }>;
  media?: Array<{
    mediumUrl: string;
    largeUrl: string;
  }>;
}

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDemoGuide, setShowDemoGuide] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPropertyDetails(id);
    }
  }, [id]);

  const fetchPropertyDetails = async (propertyId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/properties/${propertyId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error('Property not found:', propertyId);
          setProperty(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const propertyData = await response.json();
      
      setProperty(propertyData);
    } catch (error) {
      console.error('Error fetching property:', error);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'pool':
        return <Waves className="w-4 h-4" />;
      case 'gym':
      case 'fitness':
        return <Dumbbell className="w-4 h-4" />;
      case 'parking':
        return <Car className="w-4 h-4" />;
      case 'doorman':
      case 'concierge':
        return <Shield className="w-4 h-4" />;
      case 'fireplace':
        return <Flame className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    } else {
      return `$${price.toLocaleString()}`;
    }
  };

  const handleBookingClick = () => {
    setShowBookingModal(true);
  };

  const handleBookingConfirmed = async (message: string) => {
    setShowBookingModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Property Not Found</h1>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDemoGuide(true)}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Guide</span>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                {property.fullAddress || property.city}
              </div>
              <Badge variant="secondary" className="text-sm">
                {property.propertyType || 'Property'}
              </Badge>
            </div>
            
            {property.salesPrice && (
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-600">
                  {formatPrice(property.salesPrice)}
                </div>
                <div className="text-sm text-gray-500">Sale Price</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {property.media && property.media.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="relative h-96 overflow-hidden rounded-lg">
                    <img
                      src={property.media[currentImageIndex]?.largeUrl || property.media[currentImageIndex]?.mediumUrl}
                      alt={property.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/800/400?random=${property.id}`;
                      }}
                    />
                    
                    {property.media.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                        <div className="flex space-x-2">
                          {property.media.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-3 h-3 rounded-full transition-colors ${
                                index === currentImageIndex
                                  ? 'bg-white'
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>About This Property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </CardContent>
            </Card>

            {property.nearby_schools && property.nearby_schools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <School className="w-5 h-5 mr-2" />
                    Nearby Schools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {property.nearby_schools.map((school, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{school.name}</div>
                          <div className="text-sm text-gray-500">{school.distance} miles away</div>
                        </div>
                        <Badge variant="outline">
                          {school.rating}/10
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.bedroomCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bed className="w-4 h-4 mr-2 text-gray-500" />
                      Bedrooms
                    </div>
                    <span className="font-medium">{property.bedroomCount || 'Studio'}</span>
                  </div>
                )}
                
                {property.bathCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bath className="w-4 h-4 mr-2 text-gray-500" />
                      Bathrooms
                    </div>
                    <span className="font-medium">{property.bathCount}</span>
                  </div>
                )}
                
                {property.squareFeet && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Square className="w-4 h-4 mr-2 text-gray-500" />
                      Square Feet
                    </div>
                    <span className="font-medium">{property.squareFeet.toLocaleString()} sq ft</span>
                  </div>
                )}
                
                {property.salesPrice && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                        Price
                      </div>
                      <span className="font-bold text-emerald-600">
                        ${property.salesPrice.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                        {getAmenityIcon(amenity)}
                        <span className="ml-2 capitalize">{amenity.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Interested?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleBookingClick}
                >
                  Schedule a Tour
                </Button>
                <Button variant="outline" className="w-full">
                  Save Property
                </Button>
                <Button variant="outline" className="w-full">
                  Share Property
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showDemoGuide && (
        <DemoGuide onClose={() => setShowDemoGuide(false)} />
      )}

      <TourBookingModal
        property={property}
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

export default PropertyDetail;