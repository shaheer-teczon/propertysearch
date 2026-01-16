from typing import Dict, Any, Optional, Tuple
from uuid import uuid4


def get_default_conversation_state() -> Dict[str, Any]:
    """Return default conversation state structure"""
    return {
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


def get_or_create_session(session_id: Optional[str] = None, conversation_state: Optional[Dict] = None) -> Tuple[str, Dict]:
    """Get session data or create new one - stateless version"""
    new_session_id = session_id or str(uuid4())

    if conversation_state:
        session_data = {
            "latest_property_results": conversation_state.get("latest_property_results", []),
            "conversation_state": conversation_state.get("conversation_state", get_default_conversation_state())
        }
    else:
        session_data = {
            "latest_property_results": [],
            "conversation_state": get_default_conversation_state()
        }

    return new_session_id, session_data


def create_chat_response(session_id: str, latest_property_results: list, conversation_state: dict, **response_data) -> Dict[str, Any]:
    """Create response with session data for stateless operation"""
    response_data["session_id"] = session_id
    response_data["conversation_state"] = {
        "latest_property_results": latest_property_results,
        "conversation_state": conversation_state
    }

    return response_data
