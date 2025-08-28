from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from route.chat import router as chat_router
from route.properties import router as properties_router
from route.session import router as session_router
from route.health import router as health_router

from config.config import logger
load_dotenv()

gmaps = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Real Estate AI Assistant")
    yield
    logger.info("Shutting down Real Estate AI Assistant")

app = FastAPI(
    title="Real Estate AI Assistant",
    description="Advanced conversational property search with semantic understanding",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




app.include_router(chat_router)
app.include_router(properties_router)
app.include_router(session_router)
app.include_router(health_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
