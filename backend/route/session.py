from fastapi import APIRouter
from controller.session import clear_session

router = APIRouter()

@router.post("/clear-session")
async def clear_session_endpoint(request: dict):
    return await clear_session(request)
