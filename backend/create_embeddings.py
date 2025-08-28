#!/usr/bin/env python3
"""
Script to create embeddings for properties using OpenAI API
"""

import json
import os
import requests
from dotenv import load_dotenv
from config.config import logger

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_URL = "https://api.openai.com/v1/embeddings"

if not OPENAI_API_KEY:
    logger.error("Error: OPENAI_API_KEY environment variable is required")
    exit(1)

def create_property_text(property_data):
    """Create comprehensive text representation for embedding"""
    text_parts = [
        property_data.get("name", ""),
        property_data.get("description", ""),
        f"{property_data.get('propertyType', 'apartment')} property",
        f"{property_data.get('bedroomCount', 0)} bedrooms {property_data.get('bathCount', 1)} bathrooms",
        f"in {property_data.get('city', 'New York')}, NY",
        f"Located at {property_data.get('fullAddress', '')}",
    ]
    
    amenities = property_data.get("amenities", [])
    if amenities:
        text_parts.append(f"Features: {', '.join(amenities)}")
    
    if property_data.get("leaseProperty"):
        text_parts.append("Available for rent")
        if property_data.get("leasePrice"):
            text_parts.append(f"Rent: ${property_data.get('leasePrice')}/month")
    else:
        text_parts.append("Available for purchase")
        if property_data.get("salesPrice"):
            text_parts.append(f"Price: ${property_data.get('salesPrice')}")
    
    schools = property_data.get("nearby_schools", [])
    if schools:
        school_names = [school.get("name", "") for school in schools[:3]]
        text_parts.append(f"Near schools: {', '.join(school_names)}")
    
    return " ".join(text_parts)

def create_embedding_with_curl(text, property_id):
    """Create embedding using curl-like request"""
    url = EMBEDDING_URL
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "input": text,
        "model": "text-embedding-ada-002"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        embedding = result["data"][0]["embedding"]
        
        logger.info("Created embedding", property_id=property_id, dimension=len(embedding))
        return embedding
        
    except requests.exceptions.RequestException as e:
        logger.error("Error creating embedding", property_id=property_id, error=str(e))
        return None

def main():
    try:
        with open("data.json", "r", encoding="utf-8") as file:
            properties = json.load(file)
    except FileNotFoundError:
        logger.error("Error: data.json file not found")
        return
    except json.JSONDecodeError as e:
        logger.error("Error: Invalid JSON in data.json", error=str(e))
        return
    
    logger.info("Processing properties", count=len(properties))
    
    properties_with_embeddings = []
    
    for prop in properties:
        property_id = prop.get("id", "unknown")
        logger.info("Processing property", property_id=property_id)
        
        property_text = create_property_text(prop)
        logger.debug("Property text", text_preview=property_text[:100])
        
        embedding = create_embedding_with_curl(property_text, property_id)
        
        if embedding:
            prop_with_embedding = prop.copy()
            prop_with_embedding["embedding"] = embedding
            prop_with_embedding["embedding_text"] = property_text
            properties_with_embeddings.append(prop_with_embedding)
        else:
            properties_with_embeddings.append(prop)
    
    output_file = "data_with_embeddings.json"
    try:
        with open(output_file, "w", encoding="utf-8") as file:
            json.dump(properties_with_embeddings, file, indent=2, ensure_ascii=False)
        
        logger.info("Saved properties with embeddings", count=len(properties_with_embeddings), output_file=output_file)
        
        embedded_count = sum(1 for p in properties_with_embeddings if "embedding" in p)
        logger.info("Successfully created embeddings", embedded_count=embedded_count, total_count=len(properties))
        
    except Exception as e:
        logger.error("Error saving embeddings", error=str(e))

if __name__ == "__main__":
    main()