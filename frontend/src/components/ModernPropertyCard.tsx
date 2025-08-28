import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Home, 
  ExternalLink, 
  Heart,
  Share2,
  Calendar,
  Square
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Property } from "@/utils/ChatbotService";

interface ModernPropertyCardProps extends Property {
  onBookingClick?: (property: Property) => void;
  className?: string;
}

export function ModernPropertyCard({ 
  id,
  name, 
  salesPrice, 
  location, 
  bedroomCount, 
  bathCount, 
  squareFeet,
  image,
  slug,
  description,
  onBookingClick,
  className = "" 
}: ModernPropertyCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  
  const propertyData = {
    name,
    salesPrice,
    location,
    bedroomCount,
    bathCount,
    squareFeet,
    image,
    slug,
    description
  };

  const formatPrice = (price: string | undefined) => {
    if (!price) return null;
    const numericPrice = price.replace(/[^\d.,]/g, '');
    const num = parseFloat(numericPrice.replace(/,/g, ''));
    
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${numericPrice}`;
  };

  const imageUrl = image?.[0]?.mediumUrl || 
                   image?.[0]?.smallUrl || 
                   `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center&auto=format&q=75`;

  return (
    <div className={`group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden ${className}`}>
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center&auto=format&q=75`;
          }}
        />
        
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <Home className="h-8 w-8 text-gray-400" />
          </div>
        )}

        {/* Overlay Actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              navigator.share?.({ title: name, url: window.location.href });
            }}
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Price Badge */}
        {salesPrice && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1">
              {formatPrice(salesPrice)}
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            Available
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title and Location */}
        <div className="space-y-1">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {name}
          </h3>
          {location && (
            <div className="flex items-center gap-1 text-gray-600">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-sm line-clamp-1">{location}</span>
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {bedroomCount && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{bedroomCount} bed{bedroomCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {bathCount && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{bathCount} bath{bathCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {squareFeet && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span>{squareFeet.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {description.replace(/<[^>]*>/g, '').substring(0, 100)}...
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-3"
            onClick={() => onBookingClick?.(propertyData)}
            title="Schedule Tour"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 min-w-0"
            onClick={() => navigate(`/property/${id}`)}
          >
            <span className="truncate">View Details</span>
            <ExternalLink className="h-4 w-4 ml-1 flex-shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}