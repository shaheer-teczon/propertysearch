from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime, timezone
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib import (
    get_or_create_session,
    create_chat_response,
    system_message,
    detect_unified_intent,
    extract_parsed_filters,
    extract_user_preferences,
    generate_smart_clarification,
    search_properties,
    get_gpt_response,
    get_coordinates_from_address,
    extract_poi_type_from_query,
    find_nearby_pois,
    find_nearby_schools,
    send_tour_confirmation_email,
)
from _lib.config import get_llm, logger, property_metadata


def extract_date_time(message: str) -> dict:
    """Extract date and time from message"""
    result = {"date": "", "time": "", "has_both": False}

    date_patterns = [
        r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',
        r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4}\b',
        r'\b(tomorrow|today|next\s+\w+day)\b',
    ]

    time_patterns = [
        r'\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b',
        r'\b(\d{1,2}\s*(?:am|pm))\b',
    ]

    for pattern in date_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            result["date"] = match.group(0)
            break

    for pattern in time_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            result["time"] = match.group(0)
            break

    result["has_both"] = bool(result["date"] and result["time"])
    return result


def extract_name_email(message: str) -> dict:
    """Extract name and email from message"""
    result = {"name": "", "email": ""}

    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, message)
    if email_match:
        result["email"] = email_match.group(0)

    name_patterns = [
        r"(?:my name is|i'm|i am|name's|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
        r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$",
    ]

    for pattern in name_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            result["name"] = match.group(1).strip()
            break

    return result


def handle_tour_scheduling(message: str, history: list, conversation_state: dict) -> dict:
    """Handle tour scheduling conversation flow"""
    tour_state = conversation_state.get("tour_scheduling", {})
    status = tour_state.get("status", "")

    if status == "awaiting_time":
        prompt = f"""
        system: {system_message}

        user: The user is scheduling a tour and needs to provide a date and time. Their message: "{message}"

        assistant: [Ask for their preferred date and time for the tour. Be helpful and suggest flexible options. Keep response to 2-3 sentences.]
        """
    elif status == "awaiting_date":
        prompt = f"""
        system: {system_message}

        user: The user provided a time but still needs to provide a date. Their message: "{message}"

        assistant: [Acknowledge the time and ask for their preferred date. Keep response to 2 sentences.]
        """
    elif status == "awaiting_name":
        prompt = f"""
        system: {system_message}

        user: The user needs to provide their name for the tour booking. Their message: "{message}"

        assistant: [Ask for their name to complete the booking. Keep it brief and friendly.]
        """
    elif status == "awaiting_email":
        prompt = f"""
        system: {system_message}

        user: The user needs to provide their email for the tour confirmation. Their message: "{message}"

        assistant: [Ask for their email address so you can send the confirmation. Keep it brief.]
        """
    else:
        prompt = f"""
        system: {system_message}

        user: The user is in the tour scheduling process. Their message: "{message}"

        assistant: [Help them continue with the tour scheduling. Ask for any missing information.]
        """

    try:
        response = get_llm().invoke(prompt).content.strip()
    except Exception as e:
        logger.error(f"Error in tour scheduling: {str(e)}")
        response = "I'd be happy to help schedule your tour. Could you tell me your preferred date and time?"

    return {"response": response}


def improved_handle_property_interest(property_name: str, latest_results: list, history: list, conversation_state: dict) -> dict:
    """Handle when user expresses interest in a specific property"""
    found_property = None

    if latest_results:
        for prop in latest_results:
            if property_name.lower() in prop.get("name", "").lower():
                found_property = prop
                break

    if not found_property:
        for prop in property_metadata:
            if property_name.lower() in prop.get("name", "").lower():
                found_property = prop
                break

    if found_property:
        conversation_state["property_of_interest"] = found_property
        conversation_state["awaiting_tour_confirmation"] = True

        prompt = f"""
        system: {system_message}

        user: The user is interested in {found_property.get('name', 'this property')}.
        Property details: {json.dumps(found_property, indent=2)}

        assistant: [Provide a brief, enthusiastic response about this property highlighting key features. Ask if they'd like to schedule a tour. Keep to 3-4 sentences.]
        """

        try:
            response = get_llm().invoke(prompt).content.strip()
        except Exception:
            response = f"Great choice! {found_property.get('name')} is a wonderful property. Would you like to schedule a tour?"

        return {"found": True, "property": found_property, "response": response}
    else:
        return {
            "found": False,
            "property": None,
            "response": f"I couldn't find a property named '{property_name}'. Could you clarify which property you're interested in?"
        }


def handle_chat(request_data: dict) -> dict:
    """Main handler for chat interactions"""
    start_time = datetime.now(timezone.utc)

    message = request_data.get("message", "").strip()
    history = request_data.get("history", [])
    session_id = request_data.get("session_id")
    client_conversation_state = request_data.get("conversation_state")

    session_id, session_data = get_or_create_session(session_id, client_conversation_state)
    latest_property_results = session_data["latest_property_results"]
    conversation_state = session_data["conversation_state"]

    try:
        if not message:
            return {"error": "Empty message received", "status_code": 400}

        if not any(msg.get('role') == 'system' for msg in history):
            history.insert(0, {"role": "system", "content": system_message})

        context_messages = []
        for msg in history[-5:]:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            context_messages.append(f"{role}: {content}")
        context_messages.append(f"user: {message}")
        context = "\n".join(context_messages)

        intent_data = detect_unified_intent(context, message)
        intent = intent_data.get("intent", "CONVERSATIONAL_QUERY")
        transaction_type = intent_data.get("transaction_type", "unknown")
        property_name = intent_data.get("property_name", "")

        if intent != "PROPERTY_INTEREST" and intent != "FOLLOWUP_QUERY":
            conversation_state["tour_scheduling"] = {
                "status": "",
                "time": "",
                "date": "",
                "name": "",
                "email": ""
            }

        tour_state = conversation_state.get("tour_scheduling", {}).get("status")

        if tour_state in ["awaiting_time", "awaiting_date", "awaiting_name", "awaiting_email"]:
            date_time_result = extract_date_time(message)
            name_email_result = extract_name_email(message)

            if name_email_result.get("name"):
                conversation_state["tour_scheduling"]["name"] = name_email_result.get("name")
            if name_email_result.get("email"):
                conversation_state["tour_scheduling"]["email"] = name_email_result.get("email")

            if date_time_result.get("has_both", False):
                conversation_state["tour_scheduling"]["date"] = date_time_result.get("date", "")
                conversation_state["tour_scheduling"]["time"] = date_time_result.get("time", "")
            else:
                tour_result = handle_tour_scheduling(message, history, conversation_state)
                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=tour_result["response"],
                    results=[]
                )

            ts = conversation_state["tour_scheduling"]
            if ts["name"] and ts["email"] and ts["date"] and ts["time"]:
                conversation_state["tour_scheduling"]["status"] = "confirmed"
                try:
                    prop_name = ts.get("property", {}).get("name", "the property")
                    send_tour_confirmation_email(ts["email"], ts["name"], prop_name, ts["date"], ts["time"])
                    conversation_state["tour_scheduling"]["email_sent"] = True
                except Exception as e:
                    logger.error(f"Error sending confirmation email: {str(e)}")

                confirmation_response = f"Great! I've scheduled your tour for {prop_name} on {ts['date']} at {ts['time']}. A confirmation email has been sent to {ts['email']}. Is there anything specific you'd like to know about the property before the tour?"

                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=confirmation_response,
                    results=[]
                )
            else:
                if not ts["name"]:
                    conversation_state["tour_scheduling"]["status"] = "awaiting_name"
                elif not ts["email"]:
                    conversation_state["tour_scheduling"]["status"] = "awaiting_email"
                elif not ts["date"]:
                    conversation_state["tour_scheduling"]["status"] = "awaiting_date"
                elif not ts["time"]:
                    conversation_state["tour_scheduling"]["status"] = "awaiting_time"

                tour_result = handle_tour_scheduling(message, history, conversation_state)
                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=tour_result["response"],
                    results=[]
                )

        if intent == "INITIAL_INQUIRY":
            prompt = f"""
            system: {system_message}

            conversation context: {context}

            user: {message}

            assistant: [Respond like a professional real estate broker to this initial inquiry. Ask 1 specific qualifying question about preferences. Be conversational but very concise (2-3 sentences maximum).]
            """
            response_text = get_llm().invoke(prompt).content.strip()

            return create_chat_response(
                session_id, latest_property_results, conversation_state,
                response=response_text,
                results=[]
            )

        elif intent == "PROPERTY_INTEREST":
            property_name = intent_data.get("property_name", "")

            tour_intent_prompt = f"""
            Analyze this message: "{message}"
            Does the user want to schedule a tour or visit a property? Look for phrases indicating interest in touring or seeing the property in person.
            Return only "yes" or "no".
            """
            wants_tour = get_llm().invoke(tour_intent_prompt).content.strip().lower() == "yes"

            if wants_tour:
                property_found = False
                if property_name and latest_property_results:
                    for prop in latest_property_results:
                        if property_name.lower() in prop.get("name", "").lower():
                            conversation_state["property_of_interest"] = prop
                            property_found = True
                            break

                if not property_found and latest_property_results and len(latest_property_results) == 1:
                    conversation_state["property_of_interest"] = latest_property_results[0]
                    property_found = True

                if property_found and conversation_state.get("property_of_interest"):
                    conversation_state["tour_scheduling"] = {
                        "status": "awaiting_time",
                        "property": conversation_state["property_of_interest"],
                        "time": None,
                        "date": None,
                        "name": None,
                        "email": None,
                        "email_sent": False
                    }

                    prop_name = conversation_state["property_of_interest"].get("name", "the property")
                    tour_response = f"I'd be happy to arrange a tour of {prop_name} for you! What date and time work best for you?"

                    return create_chat_response(
                        session_id, latest_property_results, conversation_state,
                        response=tour_response,
                        results=[]
                    )

            if not property_name:
                if conversation_state.get("last_shown_properties") and len(conversation_state["last_shown_properties"]) == 1:
                    property_details = conversation_state["last_shown_properties"][0]
                    conversation_state["awaiting_tour_confirmation"] = True
                    conversation_state["property_of_interest"] = property_details

                    interest_response = f"Great choice! {property_details.get('name', 'This property')} is an excellent option. Would you like to schedule a tour?"

                    return create_chat_response(
                        session_id, latest_property_results, conversation_state,
                        response=interest_response,
                        results=[property_details]
                    )

            interest_result = improved_handle_property_interest(
                property_name, latest_property_results, history, conversation_state)

            return create_chat_response(
                session_id, latest_property_results, conversation_state,
                response=interest_result["response"],
                results=[interest_result["property"]] if interest_result["found"] else []
            )

        elif intent == "PROPERTY_QUERY" or intent == "PROPERTY_REJECTION":
            parsed_filters = extract_parsed_filters(message, history)
            extract_user_preferences(message, history, conversation_state)
            prefs = conversation_state["user_preferences"]
            has_transaction = prefs["transaction_type"] is not None

            if not has_transaction:
                clarification_response = generate_smart_clarification(message, conversation_state)

                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=clarification_response,
                    results=[],
                    parsed_filters=parsed_filters
                )

            results = search_properties(context, message, conversation_state)
            filtered_results = results

            if results:
                gpt_result = get_gpt_response(message, results)
                natural_text = gpt_result["text"]
                property_ids = gpt_result.get("property_ids", [])

                if property_ids:
                    filtered_results = [r for r in results if r.get('id') in property_ids]
                    latest_property_results = filtered_results

                conversation_state["last_shown_properties"] = filtered_results

                prompt = f"""
                system: You are a real estate agent who gives extremely brief responses. Never use more than 2-3 short sentences total.

                user: Summarize these property results in 2-3 short sentences maximum. End with ONE very brief question:
                {natural_text}

                assistant:
                """
                enhanced_response = get_llm().invoke(prompt).content.strip()

                return create_chat_response(
                    session_id, filtered_results, conversation_state,
                    response=enhanced_response,
                    results=filtered_results,
                    parsed_filters=parsed_filters
                )
            else:
                no_results_response = "I couldn't find properties matching those criteria. Could you try adjusting your requirements, such as the location or price range?"

                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=no_results_response,
                    results=[],
                    parsed_filters=parsed_filters
                )

        elif intent == "FOLLOWUP_QUERY":
            parsed_filters = extract_parsed_filters(message, history)
            extract_user_preferences(message, history, conversation_state)
            prefs = conversation_state["user_preferences"]

            if latest_property_results:
                follow_up_prompt = f"""
                system: {system_message}

                conversation context: {context}

                user: {message}

                information: These are the properties from the previous search results: {json.dumps(latest_property_results[:3], indent=4)}

                assistant: [Respond very concisely (2-3 sentences maximum) about the properties. Answer their question directly and ask one brief follow-up.]
                """
                follow_up_response = get_llm().invoke(follow_up_prompt).content

                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=follow_up_response,
                    results=[],
                    parsed_filters=parsed_filters
                )
            else:
                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response="I don't have any previous property results to reference. What kind of property are you looking for?",
                    results=[],
                    parsed_filters=parsed_filters
                )

        elif intent == "LOCATION_QUERY":
            address_extraction_prompt = f"""
            Extract the address, location, or landmark from this message: "{message}"
            Return only the extracted location/address/landmark, or "NONE" if no specific location is found.
            """

            try:
                extracted_address = get_llm().invoke(address_extraction_prompt).content.strip()

                if not extracted_address or extracted_address.upper() == "NONE":
                    near_pattern = r'(?:near|around|close to|at)\s+([A-Za-z\s,]+?)(?:\s*[?.]|$)'
                    match = re.search(near_pattern, message, re.IGNORECASE)
                    if match:
                        extracted_address = match.group(1).strip()

                if extracted_address and extracted_address.upper() != "NONE":
                    coordinates = get_coordinates_from_address(extracted_address)

                    if coordinates:
                        lat, lng = coordinates
                        poi_type = extract_poi_type_from_query(message)
                        nearby_pois = find_nearby_pois((lat, lng), extracted_address, poi_type)

                        if poi_type == "all":
                            poi_groups = {}
                            for poi in nearby_pois:
                                poi_category = poi['type']
                                if poi_category not in poi_groups:
                                    poi_groups[poi_category] = []
                                poi_groups[poi_category].append(poi)

                            response_parts = [f"Here's what I found near {extracted_address}:\n"]
                            for category, pois in poi_groups.items():
                                response_parts.append(f"**{category}:**")
                                for poi in pois[:2]:
                                    distance_str = f"{poi['distance']} miles"
                                    response_parts.append(f"- **{poi['name']}** - {distance_str}")
                                response_parts.append("")
                        else:
                            poi_type_display = poi_type.replace("_", " ").title()
                            response_parts = [f"Here are the {poi_type_display.lower()} near {extracted_address}:\n"]

                            if nearby_pois:
                                for poi in nearby_pois[:5]:
                                    distance_str = f"{poi['distance']} miles"
                                    response_parts.append(f"- **{poi['name']}** - {distance_str}")
                            else:
                                response_parts.append(f"I couldn't find any {poi_type_display.lower()} in this area.")

                        if not nearby_pois:
                            response_parts.append(f"\nI couldn't find any {poi_type} in this area.")

                        response_parts.append("\nWould you like me to help you find properties in this area?")
                        response_text = "\n".join(response_parts)
                    else:
                        response_text = f"I couldn't find location information for '{extracted_address}'. Could you provide a more specific address?"
                else:
                    response_text = "I couldn't identify a specific address in your message. Could you provide the full address you're asking about?"

            except Exception as e:
                logger.error(f"Error processing location query: {str(e)}")
                response_text = "I'm having trouble processing that location query. Could you try rephrasing your question?"

            return create_chat_response(
                session_id, latest_property_results, conversation_state,
                response=response_text,
                results=[]
            )

        else:
            gpt_input = f"""
            system: {system_message}

            conversation context: {context}

            user: {message}

            assistant: [Respond very concisely (2-3 sentences maximum) to this conversational query. Keep it focused on real estate and be helpful but brief.]
            """
            response = get_llm().invoke(gpt_input).content

            return create_chat_response(
                session_id, latest_property_results, conversation_state,
                response=response,
                results=[]
            )

    except Exception as e:
        execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        logger.error(f"Chat endpoint error: {str(e)}")

        return create_chat_response(
            session_id, latest_property_results, conversation_state,
            response="I'm sorry, I'm having trouble understanding. Could you rephrase your question about what you're looking for?",
            response_type="error",
            intent="error_recovery",
            results=[]
        )


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        try:
            request_data = json.loads(post_data.decode('utf-8'))
            result = handle_chat(request_data)

            if result.get("error"):
                self.send_response(result.get("status_code", 400))
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": result["error"]}).encode())
            else:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())

        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Invalid JSON"}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
