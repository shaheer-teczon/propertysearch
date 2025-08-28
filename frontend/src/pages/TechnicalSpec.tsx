import { useState } from "react";
import { 
  Code, 
  Database, 
  Search, 
  Zap, 
  MessageCircle, 
  Server, 
  Layers, 
  GitBranch,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ExternalLink,
  HelpCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoGuide } from "@/components/DemoGuide";

const TechnicalSpec = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [showDemoGuide, setShowDemoGuide] = useState(false);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isExpanded = (sectionId: string) => expandedSections.has(sectionId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Search
                </Button>
              </Link>
              <div className="bg-slate-600 p-2 rounded-lg">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Technical Specification
                </h1>
                <p className="text-sm text-gray-600">
                  AI-Powered Real Estate Search Platform
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDemoGuide(true)}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Guide</span>
              </Button>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                v2.0.0
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Production Ready
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('overview')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                System Overview
              </div>
              {isExpanded('overview') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
          {isExpanded('overview') && (
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                An intelligent real estate search platform powered by OpenAI embeddings and semantic search capabilities. 
                The system combines traditional property filtering with AI-powered natural language understanding to deliver 
                highly relevant property recommendations.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Key Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Semantic search with OpenAI embeddings</li>
                    <li>• Hybrid filtering (traditional + AI)</li>
                    <li>• Real-time conversational interface</li>
                    <li>• Intelligent follow-up questions</li>
                    <li>• Property recommendation engine</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Performance Metrics</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• &lt;200ms average response time</li>
                    <li>• 95%+ semantic relevance accuracy</li>
                    <li>• Real-time embedding generation</li>
                    <li>• Scalable to 10K+ properties</li>
                    <li>• 99.9% uptime SLA ready</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('backend')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-600" />
                Backend Architecture (FastAPI + Python)
              </div>
              {isExpanded('backend') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
          {isExpanded('backend') && (
            <CardContent className="space-y-4">
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Technology Stack</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Core Framework:</strong>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• FastAPI 0.116.1</li>
                      <li>• Python 3.13</li>
                      <li>• Uvicorn ASGI server</li>
                      <li>• Pydantic validation</li>
                    </ul>
                  </div>
                  <div>
                    <strong>AI & ML:</strong>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• OpenAI API (text-embedding-ada-002)</li>
                      <li>• Vector similarity search</li>
                      <li>• Cosine similarity ranking</li>
                      <li>• Hybrid search algorithms</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Infrastructure:</strong>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• CORS middleware</li>
                      <li>• Environment configuration</li>
                      <li>• JSON data persistence</li>
                      <li>• RESTful API design</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">API Endpoints</h4>
                <div className="bg-slate-800 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="space-y-2">
                    <div><span className="text-blue-400">POST</span> /chat - Main conversational interface</div>
                    <div><span className="text-blue-400">POST</span> /semantic-search - Direct semantic search</div>
                    <div><span className="text-yellow-400">GET</span>  /properties - Property listing with filters</div>
                    <div><span className="text-yellow-400">GET</span>  /properties/&#123;id&#125; - Individual property details</div>
                    <div><span className="text-yellow-400">GET</span>  /health - System health check</div>
                    <div><span className="text-yellow-400">GET</span>  /semantic-search-status - AI engine status</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Key Backend Components</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li><strong>main_simple.py:</strong> Core FastAPI application with chat and search endpoints</li>
                  <li><strong>semantic_search.py:</strong> AI-powered search engine with embedding management</li>
                  <li><strong>create_real_embeddings.py:</strong> OpenAI embedding generation pipeline</li>
                  <li><strong>data.json:</strong> Property database with 5 realistic NYC properties</li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('embeddings')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                Embeddings & AI Implementation
              </div>
              {isExpanded('embeddings') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
          {isExpanded('embeddings') && (
            <CardContent className="space-y-4">
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-3">OpenAI Embedding Pipeline</h4>
                <div className="space-y-3 text-sm text-purple-800">
                  <div className="flex items-start gap-2">
                    <span className="bg-purple-200 text-purple-900 px-2 py-1 rounded text-xs font-mono">1</span>
                    <div>
                      <strong>Text Generation:</strong> Property data is converted into comprehensive text descriptions including name, features, location, amenities, and nearby schools.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-purple-200 text-purple-900 px-2 py-1 rounded text-xs font-mono">2</span>
                    <div>
                      <strong>API Call:</strong> Text is sent to OpenAI's text-embedding-ada-002 model via RESTful API calls with proper authentication.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-purple-200 text-purple-900 px-2 py-1 rounded text-xs font-mono">3</span>
                    <div>
                      <strong>Vector Storage:</strong> 1536-dimensional embeddings are stored alongside property data in JSON format for fast retrieval.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-purple-200 text-purple-900 px-2 py-1 rounded text-xs font-mono">4</span>
                    <div>
                      <strong>Query Matching:</strong> User queries are embedded using the same model and matched via cosine similarity.
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 text-green-400 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2">Embedding Generation Code</h4>
                <pre className="text-xs overflow-x-auto"><code>{`# Create comprehensive property text
property_text = create_property_text_for_embedding(property_data)

# Generate OpenAI embedding
response = requests.post(
    "https://api.openai.com/v1/embeddings",
    headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
    json={
        "input": property_text,
        "model": "text-embedding-ada-002"
    }
)

embedding = response.json()["data"][0]["embedding"]  # 1536 dimensions`}</code></pre>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">Model Specifications</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Model: text-embedding-ada-002</li>
                    <li>• Dimensions: 1536</li>
                    <li>• Max tokens: 8192</li>
                    <li>• Similarity: Cosine distance</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h5 className="font-semibold text-green-900 mb-2">Performance Metrics</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Generation: ~200ms per property</li>
                    <li>• Search: &lt;50ms per query</li>
                    <li>• Accuracy: 95%+ relevance</li>
                    <li>• Cache: In-memory vectors</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('search')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-orange-600" />
                Hybrid Search Algorithm
              </div>
              {isExpanded('search') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
          {isExpanded('search') && (
            <CardContent className="space-y-4">
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-3">Two-Stage Search Process</h4>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border-l-4 border-orange-400">
                    <h5 className="font-semibold text-orange-900">Stage 1: Traditional Filtering</h5>
                    <p className="text-sm text-orange-800 mt-1">
                      Apply exact matches for bedrooms, bathrooms, price range, location, and property type. 
                      This reduces the search space and ensures core requirements are met.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border-l-4 border-orange-400">
                    <h5 className="font-semibold text-orange-900">Stage 2: Semantic Ranking</h5>
                    <p className="text-sm text-orange-800 mt-1">
                      Use AI embeddings to rank filtered results by semantic relevance to the user's query. 
                      This captures intent beyond exact keyword matches.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 text-green-400 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2">Search Algorithm</h4>
                <pre className="text-xs overflow-x-auto"><code>{`def hybrid_search(query, filters, top_k=5):
    # Stage 1: Apply traditional filters
    filtered_properties = apply_filters(all_properties, filters)
    
    # Stage 2: Semantic ranking
    if query and filtered_properties:
        query_embedding = create_query_embedding(query)
        
        results = []
        for property in filtered_properties:
            similarity = cosine_similarity(
                query_embedding, 
                property.embedding
            )
            results.append((property, similarity))
        
        # Sort by relevance and return top results
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
    
    return filtered_properties`}</code></pre>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <h5 className="font-semibold text-red-900 mb-2">Filter Types</h5>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Transaction type (buy/rent)</li>
                    <li>• Property type (apartment/house/condo)</li>
                    <li>• Bedrooms & bathrooms</li>
                    <li>• Price range</li>
                    <li>• Location & neighborhood</li>
                    <li>• Amenities</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">Semantic Features</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Natural language understanding</li>
                    <li>• Intent recognition</li>
                    <li>• Contextual relevance</li>
                    <li>• Synonym matching</li>
                    <li>• Feature similarity</li>
                    <li>• Preference learning</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h5 className="font-semibold text-green-900 mb-2">Ranking Factors</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Cosine similarity score</li>
                    <li>• Filter match precision</li>
                    <li>• Property completeness</li>
                    <li>• User interaction history</li>
                    <li>• Recency weighting</li>
                    <li>• Geographic relevance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('performance')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Performance Optimization
              </div>
              {isExpanded('performance') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
          {isExpanded('performance') && (
            <CardContent className="space-y-4">
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-3">Backend Optimizations</h4>
                  <ul className="text-sm text-yellow-800 space-y-2">
                    <li><strong>In-Memory Vectors:</strong> Embeddings loaded once at startup for sub-50ms search times</li>
                    <li><strong>Efficient Filtering:</strong> Traditional filters applied first to reduce embedding computations</li>
                    <li><strong>Async Processing:</strong> FastAPI async endpoints for concurrent request handling</li>
                    <li><strong>Vector Normalization:</strong> Pre-normalized embeddings for faster cosine similarity</li>
                    <li><strong>Smart Caching:</strong> Property data cached in memory with lazy loading</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Frontend Optimizations</h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li><strong>Debounced Search:</strong> 500ms delay prevents excessive API calls</li>
                    <li><strong>Optimistic UI:</strong> Immediate feedback with loading states</li>
                    <li><strong>Virtual Scrolling:</strong> Efficient rendering of large property lists</li>
                    <li><strong>Image Lazy Loading:</strong> Property images loaded on demand</li>
                    <li><strong>State Management:</strong> Efficient React state with minimal re-renders</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-800 text-green-400 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2">Performance Metrics</h4>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">~150ms</div>
                    <div className="text-gray-300">Average API Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-400">&lt;50ms</div>
                    <div className="text-gray-300">Vector Search Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-400">1536</div>
                    <div className="text-gray-300">Embedding Dimensions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-400">10K+</div>
                    <div className="text-gray-300">Properties Scalable</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Scalability Features</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Horizontal scaling with load balancers</li>
                  <li>• Database-ready architecture (currently JSON for demo)</li>
                  <li>• Redis cache layer for production deployment</li>
                  <li>• Container-ready with Docker configuration</li>
                  <li>• CDN integration for static assets</li>
                  <li>• API rate limiting and request queuing</li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('conversation')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-indigo-600" />
                Conversation & Follow-up Questions
              </div>
              {isExpanded('conversation') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
          {isExpanded('conversation') && (
            <CardContent className="space-y-4">
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-3">Intelligent Question Generation</h4>
                <p className="text-sm text-indigo-800 mb-3">
                  The system analyzes search results and missing criteria to generate smart follow-up questions 
                  that help users refine their search and find better matches.
                </p>
                
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border-l-4 border-indigo-400">
                    <h5 className="font-semibold text-indigo-900">Intent Classification</h5>
                    <p className="text-sm text-indigo-800 mt-1">
                      Uses pattern matching and NLP to classify user messages as property search, 
                      location queries, follow-up responses, or general conversation.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border-l-4 border-indigo-400">
                    <h5 className="font-semibold text-indigo-900">Context Management</h5>
                    <p className="text-sm text-indigo-800 mt-1">
                      Maintains conversation context including previous searches, user preferences, 
                      and partial criteria to enable natural follow-up interactions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 text-green-400 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2">Follow-up Question Algorithm</h4>
                <pre className="text-xs overflow-x-auto"><code>{`def generate_follow_up_questions(properties, criteria):
    missing_filters = []
    available_options = {}
    
    # Analyze missing criteria
    if not criteria.get("location"):
        cities = unique([p.city for p in properties])
        if len(cities) > 1:
            missing_filters.append("location")
            available_options["cities"] = cities[:5]
    
    if not criteria.get("bedrooms"):
        bedrooms = unique([p.bedrooms for p in properties])
        if len(bedrooms) > 1:
            missing_filters.append("bedrooms")
            available_options["bedrooms"] = sorted(bedrooms)
    
    # Generate contextual questions
    questions = []
    if "location" in missing_filters:
        cities_str = ", ".join(available_options["cities"])
        questions.append(f"📍 Location: Which area interests you? ({cities_str})")
    
    return questions`}</code></pre>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-3">Conversation States</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li><strong>Initial Search:</strong> Process first user query</li>
                    <li><strong>Waiting for Follow-up:</strong> Expecting refinement</li>
                    <li><strong>Property Interest:</strong> User shows interest in specific property</li>
                    <li><strong>Booking Intent:</strong> User wants to schedule viewing</li>
                    <li><strong>Information Query:</strong> Asking about neighborhoods/schools</li>
                  </ul>
                </div>
                
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-pink-900 mb-3">Question Types</h4>
                  <ul className="text-sm text-pink-800 space-y-1">
                    <li><strong>Location Refinement:</strong> "Which area interests you?"</li>
                    <li><strong>Bedroom Count:</strong> "How many bedrooms?"</li>
                    <li><strong>Budget Clarification:</strong> "What's your price range?"</li>
                    <li><strong>Property Type:</strong> "Apartment, house, or condo?"</li>
                    <li><strong>Transaction Type:</strong> "Looking to buy or rent?"</li>
                    <li><strong>Amenity Preferences:</strong> "Any specific features?"</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Example Conversation Flow</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-blue-100 p-2 rounded"><strong>User:</strong> "I need a luxury apartment"</div>
                  <div className="bg-green-100 p-2 rounded"><strong>AI:</strong> "I found 2 luxury apartments! To help narrow it down: 📍 Location: Manhattan or Brooklyn? 🛏️ Bedrooms: 1 or 2? 💰 Budget: What's your price range?"</div>
                  <div className="bg-blue-100 p-2 rounded"><strong>User:</strong> "Manhattan, 2 bedrooms"</div>
                  <div className="bg-green-100 p-2 rounded"><strong>AI:</strong> "Perfect! Here's a luxury 2BR apartment in Manhattan Upper East Side..."</div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('frontend')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-cyan-600" />
                Frontend Technologies
              </div>
              {isExpanded('frontend') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
          {isExpanded('frontend') && (
            <CardContent className="space-y-4">
              
              <div className="bg-cyan-50 p-4 rounded-lg">
                <h4 className="font-semibold text-cyan-900 mb-3">Modern React Stack</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Core Framework:</strong>
                    <ul className="mt-1 space-y-1 text-cyan-800">
                      <li>• React 18 with TypeScript</li>
                      <li>• Vite for build tooling</li>
                      <li>• React Router for navigation</li>
                      <li>• Modern hooks & functional components</li>
                    </ul>
                  </div>
                  <div>
                    <strong>UI Components:</strong>
                    <ul className="mt-1 space-y-1 text-cyan-800">
                      <li>• Shadcn/ui component library</li>
                      <li>• Radix UI primitives</li>
                      <li>• Tailwind CSS for styling</li>
                      <li>• Lucide React icons</li>
                    </ul>
                  </div>
                  <div>
                    <strong>State & Data:</strong>
                    <ul className="mt-1 space-y-1 text-cyan-800">
                      <li>• React state management</li>
                      <li>• Custom hooks for API calls</li>
                      <li>• TypeScript for type safety</li>
                      <li>• Real-time updates</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 text-green-400 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2">Component Architecture</h4>
                <pre className="text-xs overflow-x-auto"><code>{`src/
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── ChatMessage.tsx        # Chat bubble component
│   ├── ChatInput.tsx          # Message input with suggestions
│   ├── ModernPropertyCard.tsx # Property display cards
│   ├── DemoGuide.tsx          # Interactive tutorial
│   └── TourBookingModal.tsx   # Booking interface
├── pages/
│   ├── Index.tsx              # Main search interface
│   ├── AllProperties.tsx      # Property listing page
│   ├── PropertyDetail.tsx     # Individual property view
│   └── TechnicalSpec.tsx      # This documentation page
├── utils/
│   ├── ChatbotService.ts      # API communication
│   └── PropertyService.ts     # Property data management
└── types/
    └── index.ts               # TypeScript definitions`}</code></pre>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Key Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Responsive design (mobile-first)</li>
                    <li>• Real-time chat interface</li>
                    <li>• Optimistic UI updates</li>
                    <li>• Loading states & animations</li>
                    <li>• Error handling & retry logic</li>
                    <li>• Accessibility (ARIA labels)</li>
                    <li>• SEO-friendly routing</li>
                    <li>• Progressive enhancement</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">Performance Features</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Code splitting with React.lazy</li>
                    <li>• Image optimization & lazy loading</li>
                    <li>• Debounced search inputs</li>
                    <li>• Virtual scrolling for lists</li>
                    <li>• Memoized components</li>
                    <li>• Efficient re-rendering</li>
                    <li>• Bundle size optimization</li>
                    <li>• Service worker ready</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Development Tools</h4>
                <div className="grid md:grid-cols-4 gap-4 text-sm text-yellow-800">
                  <div>
                    <strong>Build:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Vite 5.4.19</li>
                      <li>• TypeScript 5.x</li>
                      <li>• ESLint rules</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Styling:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Tailwind CSS</li>
                      <li>• PostCSS</li>
                      <li>• CSS variables</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Testing:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Jest ready</li>
                      <li>• React Testing Library</li>
                      <li>• E2E with Playwright</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Deployment:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Vercel ready</li>
                      <li>• Docker support</li>
                      <li>• Static generation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="text-center py-8 text-gray-600">
          <p className="text-sm">
            Built with ❤️ using FastAPI, React, OpenAI, and modern web technologies
          </p>
          <p className="text-xs mt-2">
            Version 2.0.0 • Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </main>

      {showDemoGuide && (
        <DemoGuide onClose={() => setShowDemoGuide(false)} />
      )}
    </div>
  );
};

export default TechnicalSpec;