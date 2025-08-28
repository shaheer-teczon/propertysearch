from typing import List, Dict, Any
from config.config import (
    embeddings_model, embedding_cache, CACHE_SIZE_LIMIT,
    property_metadata, logger
)
import numpy as np
import json


def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))


def find_property_by_name(property_name: str) -> Dict[str, Any]:
    """Find a property in the metadata by its name or full address."""
    property_name = property_name.lower()
    
    for prop in property_metadata:
        name = prop.get("name")
        if isinstance(name, str) and name.lower() == property_name:
            return prop
    
    for prop in property_metadata:
        full_address = prop.get("fullAddress")
        if isinstance(full_address, str) and full_address.lower() == property_name:
            return prop
    
    return {}


def extract_property_name_from_results(property_id: str) -> str:
    """Get the property name from the ID using the metadata"""
    for prop in property_metadata:
        if prop.get("id") == property_id:
            return prop.get("name", "")
    return ""


def search_properties(context, query: str, conversation_state: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
    """Search for properties based on user query and intent"""
    from .nlp import detect_unified_intent  
    
    
    intent_data = detect_unified_intent(context, query)
    intent = intent_data.get("intent", "CONVERSATIONAL_QUERY")
    transaction_type = intent_data.get("transaction_type", "unknown")
    property_name = intent_data.get("property_name", "")
    prefs = conversation_state.get("user_preferences", {})
    
    
    try:
        if len(property_metadata) == 0:
            return []
    except Exception as e:
        return []
    
    
    if transaction_type == "rent" or prefs.get("transaction_type") == "rent":
        filtered_properties = [
            prop for prop in property_metadata if prop.get("leaseProperty")]
    elif transaction_type == "buy" or prefs.get("transaction_type") == "buy":
        filtered_properties = [
            prop for prop in property_metadata if prop.get("salesPrice")]
    else:
        filtered_properties = property_metadata
    
    if filtered_properties is None:
        filtered_properties = []
    
    if prefs.get("bedrooms"):
        filtered_properties = [
            prop for prop in filtered_properties 
            if prop.get("bedroomCount") == prefs["bedrooms"]
        ]
    
    if prefs.get("bathrooms"):
        filtered_properties = [
            prop for prop in filtered_properties 
            if prop.get("bathCount") == prefs["bathrooms"]
        ]
    
    if prefs.get("location") and prefs["location"] is not None:
        location_lower = prefs["location"].lower()
        
        def safe_string_lower(value):
            """Safely convert value to lowercase string"""
            if isinstance(value, str):
                return value.lower()
            elif value is None:
                return ""
            else:
                return str(value).lower()
        
        filtered_properties = [
            prop for prop in filtered_properties
            if (location_lower in safe_string_lower(prop.get("fullAddress", "")) or
                location_lower in safe_string_lower(prop.get("city")) or
                location_lower in safe_string_lower(prop.get("neighborhood")))
        ]
    
    if prefs.get("property_type"):
        type_lower = prefs["property_type"].lower()
        filtered_properties = [
            prop for prop in filtered_properties
            if type_lower in prop.get("propertyType", "").lower()
        ]
    
    if prefs.get("min_price") or prefs.get("max_price"):
        
        if prefs.get("min_price"):
            min_price = prefs["min_price"]
            filtered_properties = [
                prop for prop in filtered_properties
                if ((prop.get("salesPrice") and int(prop.get("salesPrice", 0)) >= min_price) or
                    (prop.get("leaseProperty") and int(prop.get("monthlyRent", 0)) >= min_price))
            ]
        
        if prefs.get("max_price"):
            max_price = prefs["max_price"]
            filtered_properties = [
                prop for prop in filtered_properties
                if ((prop.get("salesPrice") and int(prop.get("salesPrice", 0)) <= max_price) or
                    (prop.get("leaseProperty") and int(prop.get("monthlyRent", 0)) <= max_price))
            ]

    if intent == "PROPERTY_INTEREST" and property_name:
        property_match = find_property_by_name(property_name)
        if property_match:
            excluded_keys = {"embedding", "seoDescription"}
            return [{k: v for k, v in property_match.items() if k not in excluded_keys}]
    
    if not filtered_properties:
        return []
    
    query_hash = hash(query.lower().strip())
    if query_hash in embedding_cache:
        query_embedding = embedding_cache[query_hash]
        logger.debug("Using cached embedding for query", query=query)
    else:
        query_embedding = embeddings_model.embed_query(query)
        if len(embedding_cache) >= CACHE_SIZE_LIMIT:
            oldest_key = next(iter(embedding_cache))
            del embedding_cache[oldest_key]
        
        embedding_cache[query_hash] = query_embedding

    similarities = [
        (prop, cosine_similarity(query_embedding, np.array(prop["embedding"])))
        for prop in filtered_properties
    ]
    top_matches = sorted(
        similarities, key=lambda x: x[1], reverse=True)[:top_k]
    
    excluded_keys = {"embedding", "seoDescription"}
    final_results = [
        {k: v for k, v in match[0].items() if k not in excluded_keys}
        for match in top_matches
    ]
    
    return final_results