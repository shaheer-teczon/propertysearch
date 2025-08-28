from typing import Dict, Any, Optional, Tuple
from uuid import uuid4
from schema.chat import ChatResponse
from config.config import sessions


def get_or_create_session(session_id: Optional[str] = None) -> Tuple[str, Dict]:
    """Get existing session or create new one"""
    
    if session_id and session_id in sessions:
        return session_id, sessions[session_id]
    
    new_session_id = session_id or str(uuid4())
    sessions[new_session_id] = {
        "latest_property_results": [],
        "conversation_state": {
            "awaiting_tour_confirmation": False,
            "awaiting_property_confirmation": False,
            "potential_property": None,
            "property_of_interest": None,
            "partial_tour_info": {},
            "tour_scheduling": {
                "status": None,
                "property": None,
                "time": None,
                "date": None,
                "name": None,
                "email": None,
                "email_sent": False
            },
            "last_shown_properties": [],
            "user_preferences": {
                "transaction_type": None,
                "location": None,
                "property_type": None,
                "bedrooms": None,
                "min_price": None,
                "max_price": None,
                "size": None,
                "gathered_criteria": []
            }
        }
    }
    return new_session_id, sessions[new_session_id]


def save_session_data(session_id: str, latest_property_results: list, conversation_state: dict):
    """Save session data back to the sessions dictionary"""
    if session_id in sessions:
        sessions[session_id]["latest_property_results"] = latest_property_results
        sessions[session_id]["conversation_state"] = conversation_state


def create_chat_response(session_id: str, latest_property_results: list, conversation_state: dict, **response_data) -> ChatResponse:
    """Create ChatResponse with session management"""
    save_session_data(session_id, latest_property_results, conversation_state)
    response_data["session_id"] = session_id
    
    return ChatResponse(**response_data)