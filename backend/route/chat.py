from fastapi import APIRouter
from controller.chat import handle_chat
from schema.chat import ChatRequest

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    return await handle_chat(request)
