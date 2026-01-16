from typing import List, Dict, Any, Optional
import json

from langchain_core.output_parsers import JsonOutputParser

from .config import get_llm, logger


def extract_parsed_filters(message: str, history: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    """Extract parsed filters for frontend filter updates"""
    recent_context = ""
    for msg in history[-3:]:
        if msg.get('content'):
            recent_context += f"{msg.get('role', 'user')}: {msg.get('content')} "

    extraction_prompt = f"""
    Analyze this conversation to extract specific property filters for the frontend:

    Recent context: {recent_context}
    Current message: {message}

    Extract filters that can be used in a property search interface:

    Return a JSON object with these exact keys (use null for missing values):
    {{
        "transaction_type": "buy" or "rent" or null,
        "property_type": "apartment" or "house" or "condo" or "studio" or null,
        "bedrooms": number or null,
        "bathrooms": number or null,
        "location": "specific city/neighborhood name" or null,
        "price_min": number or null,
        "price_max": number or null
    }}

    Examples:
    "3 bedroom family home with good schools for buy" → {{"transaction_type": "buy", "property_type": "house", "bedrooms": 3, "bathrooms": null, "location": null, "price_min": null, "price_max": null}}
    "Looking for apartments under $4000 in Manhattan" → {{"transaction_type": null, "property_type": "apartment", "bedrooms": null, "bathrooms": null, "location": "Manhattan", "price_min": null, "price_max": 4000}}
    "2 bedroom condo for rent in Brooklyn" → {{"transaction_type": "rent", "property_type": "condo", "bedrooms": 2, "bathrooms": null, "location": "Brooklyn", "price_min": null, "price_max": null}}
    "studio apartment" → {{"transaction_type": null, "property_type": "studio", "bedrooms": 0, "bathrooms": null, "location": null, "price_min": null, "price_max": null}}

    Important mapping rules:
    - "home" or "family home" → "house"
    - "apt" → "apartment"
    - "studio" → "studio" (and bedrooms should be 0)
    - "for buy", "buying", "purchase" → "buy"
    - "for rent", "rental", "renting" → "rent"
    - Extract price numbers: "under $4000" → price_max: 4000
    - Extract price ranges: "$3000 to $4000" → price_min: 3000, price_max: 4000
    """

    try:
        response = get_llm().invoke(extraction_prompt).content
        parser = JsonOutputParser()
        parsed_filters = parser.parse(response)
        clean_filters = {k: v for k, v in parsed_filters.items() if v is not None and v != "null"}

        return clean_filters if clean_filters else None
    except Exception as e:
        logger.error(f"Error extracting parsed filters: {str(e)}")
        return None


def extract_user_preferences(message: str, history: List[Dict[str, str]], conversation_state: Dict[str, Any]) -> Dict[str, Any]:
    """Extract and update user preferences from current message and conversation history"""
    recent_context = ""
    for msg in history[-3:]:
        if msg.get('content'):
            recent_context += f"{msg.get('role', 'user')}: {msg.get('content')} "

    extraction_prompt = f"""
    Analyze this conversation to extract user preferences:

    Recent context: {recent_context}
    Current message: {message}

    Extract any mentioned preferences:

    Return a JSON object:
    {{
        "transaction_type": "buy"/"rent"/null,
        "location": "specific location mentioned or null",
        "property_type": "apartment"/"house"/"condo"/"townhouse"/null,
        "bedrooms": number or null,
        "min_price": number or null,
        "max_price": number or null,
        "size": "size information or null",
        "schools_important": true/false,
        "amenities_important": true/false
    }}

    Examples:
    "I want to buy apartments" → {{"transaction_type": "buy", "property_type": "apartment", "location": null, "bedrooms": null, "min_price": null, "max_price": null, "size": null, "schools_important": false, "amenities_important": false}}
    "Looking in Manhattan" → {{"transaction_type": null, "location": "Manhattan", "property_type": null, "bedrooms": null, "min_price": null, "max_price": null, "size": null, "schools_important": false, "amenities_important": false}}
    "3 bedrooms under 500k" → {{"transaction_type": null, "location": null, "property_type": null, "bedrooms": 3, "min_price": null, "max_price": 500000, "size": null, "schools_important": false, "amenities_important": false}}
    "apartments between $2000 to $4000" → {{"transaction_type": null, "location": null, "property_type": "apartment", "bedrooms": null, "min_price": 2000, "max_price": 4000, "size": null, "schools_important": false, "amenities_important": false}}
    "near good schools" → {{"transaction_type": null, "location": null, "property_type": null, "bedrooms": null, "min_price": null, "max_price": null, "size": null, "schools_important": true, "amenities_important": false}}
    "close to parks and shopping" → {{"transaction_type": null, "location": null, "property_type": null, "bedrooms": null, "min_price": null, "max_price": null, "size": null, "schools_important": false, "amenities_important": true}}
    """

    try:
        response = get_llm().invoke(extraction_prompt).content
        parser = JsonOutputParser()
        extracted = parser.parse(response)

        prefs = conversation_state["user_preferences"]
        for key, value in extracted.items():
            if value is not None and value != "null":
                prefs[key] = value
                if key not in prefs["gathered_criteria"]:
                    prefs["gathered_criteria"].append(key)

        return extracted
    except Exception as e:
        logger.error(f"Error extracting preferences: {str(e)}")
        return {}


def generate_smart_clarification(message: str, conversation_state: Dict[str, Any]) -> str:
    """Generate contextual clarification questions with location suggestions"""
    from .location import get_available_locations

    prefs = conversation_state["user_preferences"]
    gathered = prefs["gathered_criteria"]
    available_locations = get_available_locations()[:6]
    missing_important = []

    if "transaction_type" not in gathered and not prefs["transaction_type"]:
        missing_important.append("transaction_type")
    if "location" not in gathered and not prefs["location"]:
        missing_important.append("location")
    if "bedrooms" not in gathered and not prefs["bedrooms"]:
        missing_important.append("bedrooms")
    if ("min_price" not in gathered and "max_price" not in gathered and
            not prefs["min_price"] and not prefs["max_price"]):
        missing_important.append("price")

    if "transaction_type" in missing_important:
        prompt_context = "Need to know if they want to buy or rent"
    elif "location" in missing_important:
        prompt_context = f"Need location preference. Available areas: {', '.join(available_locations)}"
    elif "bedrooms" in missing_important:
        prompt_context = "Need bedroom count preference"
    elif "price" in missing_important:
        prompt_context = "Need budget/price range"
    else:
        prompt_context = "Need additional criteria"

    clarification_prompt = f"""
    You are a professional real estate agent having a conversation with a client.

    Client's current message: "{message}"
    What you already know: {prefs}
    Context: {prompt_context}

    Generate a natural, conversational response that:
    1. Acknowledges their request positively
    2. Asks for ONE missing piece of information
    3. If asking about location, mention 2-3 available areas as examples
    4. Keep it friendly and not like a form to fill out

    Examples:
    - If missing transaction type: "I'd love to help you find the perfect property! Are you looking to buy or rent?"
    - If missing location: "Great! I have properties in several areas including {', '.join(available_locations[:3])}. Which area interests you most?"
    - If missing bedrooms: "Perfect! How many bedrooms are you looking for?"
    - If missing price: "Excellent! What's your budget range for this search?"

    Response (2-3 sentences maximum):
    """

    try:
        response = get_llm().invoke(clarification_prompt).content.strip()
        return response
    except Exception as e:
        logger.error(f"Error generating clarification: {str(e)}")
        return "I'd be happy to help you find properties! Could you tell me a bit more about what you're looking for?"


def validate_search_criteria(query: str) -> Dict[str, Any]:
    """Validate if the query contains sufficient search criteria"""

    validation_prompt = f"""
    Analyze this property search query: "{query}"

    Check if the query contains specific information for these key criteria:

    1. TRANSACTION_TYPE: Does it mention buy, rent, purchase, lease, etc.?
    2. LOCATION: Does it mention a specific area, neighborhood, city, or location?
    3. PROPERTY_TYPE: Does it mention apartment, house, condo, townhouse, etc.?
    4. BEDROOMS: Does it specify number of bedrooms?
    5. PRICE_RANGE: Does it mention budget, price range, or specific amount?
    6. SIZE: Does it mention square footage or size requirements?

    Return a JSON object:
    {{
        "has_transaction_type": true/false,
        "has_location": true/false,
        "has_property_type": true/false,
        "has_bedrooms": true/false,
        "has_price": true/false,
        "has_size": true/false,
        "specificity_score": 0-6,
        "missing_criteria": ["list of missing important criteria"],
        "is_sufficient": true/false
    }}

    Consider the query sufficient (is_sufficient: true) if it has:
    - Transaction type (buy/rent) AND
    - At least 2 other specific criteria (location, property type, bedrooms, price, or size)

    Examples:
    "Show me apartments" → {{"has_transaction_type": false, "has_location": false, "has_property_type": true, "has_bedrooms": false, "has_price": false, "has_size": false, "specificity_score": 1, "missing_criteria": ["transaction_type", "location", "bedrooms", "price"], "is_sufficient": false}}

    "I want to buy 3-bedroom apartments in Manhattan under $800k" → {{"has_transaction_type": true, "has_location": true, "has_property_type": true, "has_bedrooms": true, "has_price": true, "has_size": false, "specificity_score": 5, "missing_criteria": [], "is_sufficient": true}}
    """

    try:
        response = get_llm().invoke(validation_prompt).content
        parser = JsonOutputParser()
        return parser.parse(response)
    except Exception as e:
        logger.error(f"Error validating search criteria: {str(e)}")
        return {"is_sufficient": False, "missing_criteria": ["transaction_type", "location", "bedrooms", "price"]}


def detect_unified_intent(context, query: str) -> Dict[str, Any]:
    """Detect intent with unified categories and extract relevant information"""

    location_keywords = ["schools", "school", "near", "nearby", "close to", "around", "attractions", "attraction",
                         "what's near", "what's around", "distance", "miles", "radius", "hospitals", "hospital",
                         "parks", "park", "restaurants", "restaurant"]
    property_keywords = ["house", "home", "property", "properties", "apartment", "condo", "family home", "show me",
                         "find", "looking for", "search", "buy", "rent", "sale", "bedroom", "bathroom", "garden",
                         "yard", "listing", "listings"]
    query_lower = query.lower()

    has_property_keywords = any(keyword in query_lower for keyword in property_keywords)
    has_location_keywords = any(keyword in query_lower for keyword in location_keywords)

    if has_location_keywords and not has_property_keywords:
        return {
            "intent": "LOCATION_QUERY",
            "transaction_type": "unknown",
            "property_name": ""
        }
    elif has_property_keywords:
        transaction_type = "unknown"
        if any(word in query_lower for word in ["buy", "purchase", "sale", "for sale", "buying"]):
            transaction_type = "buy"
        elif any(word in query_lower for word in ["rent", "rental", "lease", "renting"]):
            transaction_type = "rent"

        return {
            "intent": "PROPERTY_QUERY",
            "transaction_type": transaction_type,
            "property_name": ""
        }

    gpt_input = f"""
    Context: {context}
    User Query: {query}

    Classify this query into EXACTLY ONE of these categories. Pay special attention to location queries:

    1. PROPERTY_QUERY: A new search request for properties with specific criteria
    2. FOLLOWUP_QUERY: A question about previously shown properties WITHOUT new search criteria
    3. PROPERTY_INTEREST: The user expresses interest in a specific property or likes a property
    4. PROPERTY_REJECTION: The user explicitly states disinterest in a shown property
    5. INITIAL_INQUIRY: An initial broad inquiry about looking for a property
    6. LOCATION_QUERY: ANY question asking about schools, amenities, attractions, facilities, businesses, or services near a specific address, property, or location. This includes questions with words like: "schools", "attractions", "near", "close to", "around", "nearby", "what's around", "what's near"
    7. CONVERSATIONAL_QUERY: General conversation not related to specific properties

    IMPORTANT: If the user asks about anything "near", "around", or "close to" an address, always classify as LOCATION_QUERY.

    For transaction type, look for these indicators:
    - BUY: "buy", "purchase", "for sale", "buying", "own", "purchase price", "sale price", "invest", "investment"
    - RENT: "rent", "rental", "lease", "renting", "monthly", "per month", "tenant", "lease price"
    - UNKNOWN: If neither buy nor rent terms are clearly mentioned

    Return a JSON object with these fields:
    - intent: One of the seven categories above
    - transaction_type: "rent", "buy", or "unknown"
    - property_name: Name of specific property mentioned (if any)

    CRITICAL: Before choosing CONVERSATIONAL_QUERY, check if the query contains location-related keywords like "schools", "near", "around", "close to", "attractions", "nearby". If it does, choose LOCATION_QUERY instead.

    Examples:
    "Show me 3-bedroom apartments under $500,000" → {{"intent": "PROPERTY_QUERY", "transaction_type": "unknown", "property_name": ""}}
    "I want to buy a house" → {{"intent": "INITIAL_INQUIRY", "transaction_type": "buy", "property_name": ""}}
    "Looking for apartments to rent in Manhattan" → {{"intent": "PROPERTY_QUERY", "transaction_type": "rent", "property_name": ""}}
    "Which schools are near 164 Old Montauk?" → {{"intent": "LOCATION_QUERY", "transaction_type": "unknown", "property_name": ""}}
    "What attractions are close to the downtown property?" → {{"intent": "LOCATION_QUERY", "transaction_type": "unknown", "property_name": ""}}
    "Schools near this address?" → {{"intent": "LOCATION_QUERY", "transaction_type": "unknown", "property_name": ""}}
    "What's around 123 Main Street?" → {{"intent": "LOCATION_QUERY", "transaction_type": "unknown", "property_name": ""}}
    """

    parser = JsonOutputParser()
    try:
        response = get_llm().invoke(gpt_input).content
        return parser.parse(response)
    except Exception as e:
        logger.error(f"Error detecting intent: {str(e)}")
        return {"intent": "CONVERSATIONAL_QUERY", "transaction_type": "unknown", "property_name": ""}


def get_gpt_response(query: str, results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate a conversational response about property search results"""

    gpt_input = f"""
    You are Serhant, a professional AI real estate agent.

    User Query: {query}
    Results: {json.dumps(results, indent=4)}

    Provide a well-formatted, conversational response acknowledging the user's query.

    Format your response using markdown for better readability:
    - Use bullet points for listing multiple properties
    - Include key details like price, location, and standout features
    - If properties have nearby_schools or nearby_attractions data, mention the best ones with distances
    - Keep it concise but informative (2-3 sentences + property list)
    - End with a helpful question to engage the user

    Example format without amenities:
    "Great rental options I found for you:

    - **East Hampton Chic Home** - $75K/month with pool and luxury amenities
    - **Hampton Bays Renovated House** - $42K/month, recently updated

    Which of these catches your interest, or would you like more details on any specific property?"

    Example format with schools/attractions:
    "Perfect family homes near excellent schools:

    - **Family Home in Westchester** - $650K, 3BR/2BA near Roosevelt Elementary (0.5 mi, highly rated) and Central Park (1.2 mi)
    - **Modern Townhouse** - $750K, 4BR/3BA close to Lincoln High School (0.8 mi, excellent STEM programs) and Village Shopping Center (0.3 mi)

    Would you like to know more about the school districts or schedule a tour?"
    """

    natural_text = get_llm().invoke(gpt_input).content
    property_ids = [prop.get("id") for prop in results if "id" in prop]

    return {"text": natural_text, "property_ids": property_ids}
