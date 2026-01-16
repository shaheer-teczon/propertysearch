import os
import json
from pathlib import Path
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# Load property data (always needed)
data_file_path = Path(__file__).parent / "data_with_embeddings.json"
try:
    with open(data_file_path, "r", encoding="utf-8") as file:
        property_metadata = json.load(file)
except (FileNotFoundError, json.JSONDecodeError) as e:
    raise RuntimeError(f"Failed to load property data: {e}")

# Caches
embedding_cache = {}
location_cache = {}
CACHE_SIZE_LIMIT = 1000

# Lazy-loaded instances
_llm = None
_embeddings_model = None
_geolocator = None


def get_llm():
    """Lazy load LLM instance"""
    global _llm
    if _llm is None:
        from langchain_openai import ChatOpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        _llm = ChatOpenAI(temperature=0, model_name="gpt-4o", api_key=api_key)
    return _llm


def get_embeddings_model():
    """Lazy load embeddings model"""
    global _embeddings_model
    if _embeddings_model is None:
        from langchain_openai import OpenAIEmbeddings
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        model = os.getenv("EMBEDDINGS_MODEL", "text-embedding-ada-002")
        _embeddings_model = OpenAIEmbeddings(model=model, api_key=api_key)
    return _embeddings_model


def get_geolocator():
    """Lazy load geolocator"""
    global _geolocator
    if _geolocator is None:
        from geopy.geocoders import Nominatim
        _geolocator = Nominatim(user_agent="ai-broker-app")
    return _geolocator
