from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]
    session_id: Optional[str] = None
    
class ChatResponse(BaseModel):
    response: str
    response_type: str = "general"
    intent: str = "general"
    results: List[Dict[str, Any]] = []
    suggestions: List[str] = []
    metadata: Dict[str, Any] = {}
    parsed_filters: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None