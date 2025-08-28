import os
from dotenv import load_dotenv
import json
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from geopy.geocoders import Nominatim
import structlog
import logging
import sys
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDINGS_MODEL = os.getenv("EMBEDDINGS_MODEL", "text-embedding-ada-002")
DATA_FILE = os.getenv("DATA_FILE", "data_with_embeddings.json")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

llm = ChatOpenAI(temperature=0, model_name="gpt-4o")
embeddings_model = OpenAIEmbeddings(model=EMBEDDINGS_MODEL)

embedding_cache = {}
location_cache = {}
CACHE_SIZE_LIMIT = 1000

try:
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        property_metadata = json.load(file)
except (FileNotFoundError, json.JSONDecodeError) as e:
    raise RuntimeError(f"Failed to load property data: {e}")

sessions = {}
geolocator = Nominatim(user_agent="ai-broker-app")



logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    stream=sys.stdout,
)

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()