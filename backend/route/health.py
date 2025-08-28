from fastapi import APIRouter
from controller.health import health_check

router = APIRouter()

@router.get("/health")
async def health_check_endpoint():
    return await health_check()
