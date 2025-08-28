import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function DemoAlert() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <div className="text-xs sm:text-sm font-medium min-w-0">
              <span className="font-bold">DEMO ONLY:</span>
              <span className="hidden sm:inline"> All property listings, prices, and data shown are fictional and for demonstration purposes only. This is not a real real estate platform.</span>
              <span className="sm:hidden"> All data is fictional for demo purposes only.</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-white hover:bg-white/20 p-1 h-auto flex-shrink-0"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}