import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { DemoGuide } from "@/components/DemoGuide";
import { Code, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const [showDemoGuide, setShowDemoGuide] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        <div className="flex items-center justify-center gap-4">
          <a href="/" className="text-blue-500 hover:text-blue-700 underline">
            Return to Home
          </a>
          <Button
            variant="outline"
            onClick={() => setShowDemoGuide(true)}
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            View Guide
          </Button>
        </div>
      </div>

      {showDemoGuide && (
        <DemoGuide onClose={() => setShowDemoGuide(false)} />
      )}

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

export default NotFound;
