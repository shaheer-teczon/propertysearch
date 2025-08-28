import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Bed, Bath, Home, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type MediaType = {
  smallUrl: string;
  mediumUrl: string;
  largeUrl: string;
  xLargeUrl: string;
  xxLargeUrl: string;
  height: number;
  width: number;
};

interface PropertyCardProps {
  name: string;
  description: string;
  salesPrice?: string;
  location?: string;
  bedroomCount?: number;
  bathCount?: number;
  squareFeet?: number;
  media?: MediaType[];
  slug: string;
  onBookingConfirmed?: (message: string) => void;
}

export function PropertyCard({
  id,
  name,
  salesPrice,
  location,
  bedroomCount,
  bathCount,
  media,
  slug,
  onBookingConfirmed,
}: PropertyCardProps) {
  const navigate = useNavigate();
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState("");
  const [open, setOpen] = useState(false);

  const handleConfirmBooking = () => {
    if (!bookingName || !bookingEmail || !bookingDate || !bookingTime) {
      return;
    }

    const formattedDate = bookingDate
      ? format(bookingDate, "MMMM do, yyyy")
      : "";
    const confirmationMessage = `I want to confirm a tour for "${name}" at ${formattedDate} ${bookingTime}. My name is ${bookingName} and my email is ${bookingEmail}.`;

    if (onBookingConfirmed) {
      onBookingConfirmed(confirmationMessage);
    }

    setBookingName("");
    setBookingEmail("");
    setBookingDate(undefined);
    setBookingTime("");
    setOpen(false);
  };

  return (
    <Card className="property-card animate-fade-in w-full">
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={media?.[0]?.smallUrl || "/placeholder.svg"}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {salesPrice && (
          <Badge className="absolute top-2 right-2 bg-estate-primary hover:bg-estate-secondary">
            ${salesPrice}
          </Badge>
        )}
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-xl text-estate-dark line-clamp-1">
          {name}
        </CardTitle>
        {location && (
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{location}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-sm">
          {bedroomCount && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4 text-estate-primary" />
              <span>
                {bedroomCount} {bedroomCount === 1 ? "Bed" : "Beds"}
              </span>
            </div>
          )}
          {bathCount && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4 text-estate-primary" />
              <span>
                {bathCount} {bathCount === 1 ? "Bath" : "Baths"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">

        <Button
          className="w-full gap-2 bg-estate-primary hover:bg-estate-secondary"
          onClick={() => navigate(`/property/${id}`)}
        >
          View Property
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
