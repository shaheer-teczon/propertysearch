
from config.config import sessions

def clear_session(request: dict):
    """Clear a specific session"""
    session_id = request.get("session_id")
    if session_id and session_id in sessions:
        del sessions[session_id]
        return {"status": "cleared", "session_id": session_id}
    return {"status": "not_found", "session_id": session_id}
