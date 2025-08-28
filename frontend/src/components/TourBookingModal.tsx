import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Clock, User, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Property } from "@/utils/ChatbotService";

interface TourBookingModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: any) => void;
}

export function TourBookingModal({ property, isOpen, onClose, onSubmit }: TourBookingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: undefined as Date | undefined,
    time: "",
    message: "",
    tourType: "in-person"
  });

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.date || !formData.time) {
      const missingFields = [];
      if (!formData.name) missingFields.push('Name');
      if (!formData.email) missingFields.push('Email');
      if (!formData.date) missingFields.push('Date');
      if (!formData.time) missingFields.push('Time');
      
      return;
    }

    const bookingMessage = `I'd like to schedule a ${formData.tourType} tour for "${property?.name}" on ${format(formData.date, "MMMM do, yyyy")} at ${formData.time}. My name is ${formData.name}, email: ${formData.email}${formData.phone ? `, phone: ${formData.phone}` : ''}${formData.message ? `. Additional notes: ${formData.message}` : ''}.`;
    
    onSubmit(bookingMessage);
    
    setFormData({
      name: "",
      email: "",
      phone: "",
      date: undefined,
      time: "",
      message: "",
      tourType: "in-person"
    });
    onClose();
  };

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 mx-4">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="bg-white/20 p-2 rounded-lg">
                <CalendarIcon className="h-5 w-5" />
              </div>
              Schedule a Tour
            </DialogTitle>
            <p className="text-emerald-100 mt-2 text-sm">
              Book a viewing for <span className="font-medium text-white">{property.name}</span>
            </p>
          </DialogHeader>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Contact Information
              </h3>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone (Optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-emerald-600" />
                Tour Details
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tour Type</Label>
                  <Select value={formData.tourType} onValueChange={(value) => setFormData({ ...formData, tourType: value })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select tour type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          In-Person Tour
                        </div>
                      </SelectItem>
                      <SelectItem value="virtual">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Virtual Tour
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Preferred Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          {formData.date ? (
                            format(formData.date, "MMM dd, yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => setFormData({ ...formData, date })}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Preferred Time *
                    </Label>
                    <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {time}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Any specific questions or requirements? e.g., accessibility needs, specific areas of interest..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                disabled={!formData.name || !formData.email || !formData.date || !formData.time}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Tour
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}