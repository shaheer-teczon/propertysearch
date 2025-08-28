import { useState, useEffect } from "react";
import { X, MessageCircle, Search, Home, Sparkles, Brain, Zap, Building, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoGuideProps {
  onClose: () => void;
}

export function DemoGuide({ onClose }: DemoGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to AI-Powered Real Estate Demo",
      icon: <Home className="h-8 w-8 text-emerald-600" />,
      content: "Experience the future of property search! This intelligent AI assistant leverages cutting-edge technology including OpenAI embeddings, semantic search, and natural language processing to revolutionize how you discover real estate. Our platform understands context, learns preferences, and provides personalized recommendations.",
      highlight: "🚀 Next-generation real estate technology powered by artificial intelligence!"
    },
    {
      title: "Advanced Semantic Search Engine",
      icon: <Brain className="h-8 w-8 text-blue-600" />,
      content: "Our AI doesn't just match keywords - it understands meaning and context. Powered by OpenAI's text-embedding-ada-002 model, the system creates 1536-dimensional vector representations of properties. This enables sophisticated matching beyond traditional filters, understanding requests like 'luxury apartment with gym and doorman' or 'family home near good schools'.",
      highlight: "🧠 Semantic understanding vs simple keyword matching - see the difference!"
    },
    {
      title: "Hybrid Search & Smart Recommendations",
      icon: <Zap className="h-8 w-8 text-purple-600" />,
      content: "Our hybrid algorithm combines traditional property filters (price, bedrooms, location) with AI-powered semantic ranking. The system generates intelligent follow-up questions, learns from your preferences, and provides contextual recommendations. Real-time property matching with <200ms response times.",
      highlight: "⚡ Lightning-fast intelligent property discovery with personalized recommendations!"
    },
    {
      title: "Modern Technology Stack",
      icon: <Building className="h-8 w-8 text-orange-600" />,
      content: "Built with FastAPI Python backend, React TypeScript frontend, and modern web technologies. Features real-time conversational interface, property booking system, and comprehensive technical architecture. Explore 5 realistic NYC properties across Manhattan, Brooklyn, and Queens with full amenities and neighborhood details.",
      highlight: "🏗️ Production-ready architecture with enterprise-grade performance!"
    },
    {
      title: "Experience the Demo",
      icon: <Sparkles className="h-8 w-8 text-yellow-600" />,
      content: "Try natural language queries like 'luxury apartment with gym and doorman', 'studio for rent in Manhattan', or '3 bedroom house'. Explore the property cards, book virtual tours, and see how AI enhances every interaction. Check the Technical Specification page (bottom-right) for implementation details.",
      highlight: "✨ Start exploring - experience AI-powered real estate search in action!"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Header with Progress Bar */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-600 p-8 text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white/80">Progress</span>
              <span className="text-sm font-medium text-white/80">{currentStep + 1} of {steps.length}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              {steps[currentStep].icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{steps[currentStep].title}</h2>
              <p className="text-white/80 text-sm">Step {currentStep + 1} of {steps.length}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-6">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {steps[currentStep].content}
            </p>
            
            {/* Highlight Box */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 border border-blue-200/50 p-6 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-800 leading-relaxed">
                  {steps[currentStep].highlight}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 border-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {/* Step Indicators */}
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-125' 
                      : index < currentStep 
                        ? 'bg-emerald-400' 
                        : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 hover:from-blue-700 hover:via-purple-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Play className="h-4 w-4" />
                  Start Demo!
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}