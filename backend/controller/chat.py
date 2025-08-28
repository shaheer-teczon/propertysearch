
from schema.chat import ChatRequest
from config.config import llm, logger
from datetime import datetime, timezone
from utils import *
from fastapi import HTTPException




async def handle_chat(request: ChatRequest):
    """Main endpoint to handle chat interactions with intelligent broker-like behavior"""
    start_time = datetime.now(timezone.utc)
    session_id, session_data = get_or_create_session(request.session_id)
    latest_property_results = session_data["latest_property_results"]
    conversation_state = session_data["conversation_state"]
    
    try:
        
        message = request.message.strip()
        if not message:
            logger.warning("Empty message received")
            raise HTTPException(status_code=400, detail="Empty message received")
        if not any(msg.get('role') == 'system' for msg in request.history):

            request.history.insert(
                0, {"role": "system", "content": system_message})
        context_messages = []
        for msg in request.history[-5:]:
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

        tour_state = conversation_state.get(
            "tour_scheduling", {}).get("status")

        if tour_state in ["awaiting_time", "awaiting_date", "awaiting_name", "awaiting_email"]:

            date_time_result = extract_date_time(message)
            name_email_result = extract_name_email(message)
            if name_email_result.get("name"):
                conversation_state["tour_scheduling"]["name"] = name_email_result.get(
                    "name")

            if name_email_result.get("email"):
                conversation_state["tour_scheduling"]["email"] = name_email_result.get(
                    "email")

            if date_time_result.get("has_both", False):

                extracted_date = date_time_result.get("date", "")
                extracted_time = date_time_result.get("time", "")
                conversation_state["tour_scheduling"]["date"] = extracted_date
                conversation_state["tour_scheduling"]["time"] = extracted_time
            else:

                tour_result = handle_tour_scheduling(message, request.history, conversation_state)
                assistant_message = {
                    "role": "assistant",
                    "content": tour_result["response"]
                }
                request.history.append(assistant_message)

                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=tour_result["response"],
                    results=[]
                )

            if (conversation_state["tour_scheduling"]["name"] and
                conversation_state["tour_scheduling"]["email"] and
                conversation_state["tour_scheduling"]["date"] and
                    conversation_state["tour_scheduling"]["time"]):

                conversation_state["tour_scheduling"]["status"] = "confirmed"
                try:
                    send_tour_confirmation_email(
                        conversation_state["tour_scheduling"]["email"],
                        conversation_state["tour_scheduling"]["name"],
                        conversation_state["tour_scheduling"]["property"].get(
                            "name", "the property"),
                        conversation_state["tour_scheduling"]["date"],
                        conversation_state["tour_scheduling"]["time"]
                    )
                    conversation_state["tour_scheduling"]["email_sent"] = True
                except Exception as e:
                    logger.error("Error sending confirmation email", error=str(e))
                property_name = conversation_state["tour_scheduling"]["property"].get(
                    "name", "the property")
                confirmation_prompt = f"""
                system: {system_message}
                
                user: The user has scheduled a tour for {property_name} on {conversation_state["tour_scheduling"]["date"]} at {conversation_state["tour_scheduling"]["time"]}. Their name is {conversation_state["tour_scheduling"]["name"]} and their email is {conversation_state["tour_scheduling"]["email"]}.
                
                assistant: [Create a concise response (2-3 sentences) confirming the tour details, mentioning that a confirmation email has been sent to their email, and asking if they have any questions about the property before the tour.]
                """

                try:
                    confirmation_response = llm.invoke(
                        confirmation_prompt).content.strip()
                except Exception as e:
                    logger.error("Error generating confirmation", error=str(e))
                    confirmation_response = f"Great! I've scheduled your tour for {property_name} on {conversation_state['tour_scheduling']['date']} at {conversation_state['tour_scheduling']['time']}. A confirmation email has been sent to {conversation_state['tour_scheduling']['email']}. Is there anything specific you'd like to know about the property before the tour?"
                assistant_message = {
                    "role": "assistant",
                    "content": confirmation_response
                }
                request.history.append(assistant_message)

                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=confirmation_response,
                    results=[]
                )
            else:

                if not conversation_state["tour_scheduling"]["name"]:
                    conversation_state["tour_scheduling"]["status"] = "awaiting_name"
                elif not conversation_state["tour_scheduling"]["email"]:
                    conversation_state["tour_scheduling"]["status"] = "awaiting_email"
                elif not conversation_state["tour_scheduling"]["date"]:
                    conversation_state["tour_scheduling"]["status"] = "awaiting_date"
                elif not conversation_state["tour_scheduling"]["time"]:
                    conversation_state["tour_scheduling"]["status"] = "awaiting_time"
                tour_result = handle_tour_scheduling(message, request.history, conversation_state)
                assistant_message = {
                    "role": "assistant",
                    "content": tour_result["response"]
                }
                request.history.append(assistant_message)

                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=tour_result["response"],
                    results=[]
                )
        if conversation_state.get("awaiting_tour_confirmation"):
            tour_interest_prompt = f"""
            Analyze this message: "{message}"
            Is the user expressing interest in scheduling a tour or viewing the property? Look for phrases like "I would love to", "yes", "sure", "of course", etc.
            Return only "yes" or "no".
            """

            wants_tour = llm.invoke(
                tour_interest_prompt).content.strip().lower() == "yes"

            if wants_tour:

                if "tour_scheduling" not in conversation_state:
                    conversation_state["tour_scheduling"] = {
                        "status": None,
                        "property": None,
                        "time": None,
                        "date": None,
                        "email_sent": False
                    }

                conversation_state["tour_scheduling"]["status"] = "awaiting_time"
                conversation_state["tour_scheduling"]["property"] = conversation_state.get(
                    "property_of_interest")

                property_name_safe = conversation_state.get(
                    "property_of_interest", {}).get("name", "the property")

                tour_prompt = f"""
                system: {system_message}
                
                user: The user wants to schedule a tour for {property_name_safe}
                
                assistant: [Create a concise response (2-3 sentences) confirming their interest and asking about their availability. Ask specifically about what date and time works for them.]
                """

                tour_response = llm.invoke(tour_prompt).content.strip()
                assistant_message = {
                    "role": "assistant",
                    "content": tour_response
                }
                request.history.append(assistant_message)
                conversation_state["awaiting_tour_confirmation"] = False

                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=tour_response,
                    results=[]
                )
        if intent == "INITIAL_INQUIRY":

            prompt = f"""
            system: {system_message}
            
            conversation context: {context}
            
            user: {message}
            
            assistant: [Respond like a professional real estate broker to this initial inquiry. Ask 1 specific qualifying question about preferences. Be conversational but very concise (2-3 sentences maximum).]
            """

            response_text = llm.invoke(prompt).content.strip()
            assistant_message = {
                "role": "assistant",
                "content": response_text
            }
            request.history.append(assistant_message)

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

            wants_tour = llm.invoke(
                tour_intent_prompt).content.strip().lower() == "yes"
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
                if not property_found and conversation_state.get("potential_property"):
                    conversation_state["property_of_interest"] = conversation_state["potential_property"]
                    property_found = True
                if not property_found and conversation_state.get("last_shown_properties"):
                    conversation_state["property_of_interest"] = conversation_state["last_shown_properties"][0]
                    property_found = True
                if property_found and conversation_state.get("property_of_interest"):

                    if "tour_scheduling" not in conversation_state:
                        conversation_state["tour_scheduling"] = {
                            "status": None,
                            "property": None,
                            "time": None,
                            "date": None,
                            "email_sent": False
                        }

                    conversation_state["tour_scheduling"]["status"] = "awaiting_time"
                    conversation_state["tour_scheduling"]["property"] = conversation_state["property_of_interest"]

                    property_name_safe = conversation_state["property_of_interest"].get(
                        "name", "the property")

                    tour_prompt = f"""
                    system: {system_message}
                    
                    user: The user wants to schedule a tour for {property_name_safe}
                    
                    assistant: [Create a concise response (2-3 sentences) confirming their interest and asking about their availability. Ask specifically about what date and time works for them.]
                    """

                    tour_response = llm.invoke(tour_prompt).content.strip()
                    assistant_message = {
                        "role": "assistant",
                        "content": tour_response
                    }

                    request.history.append(assistant_message)

                    return create_chat_response(
                        session_id, latest_property_results, conversation_state,
                        response=tour_response,
                        results=[]
                    )
                else:

                    prompt = f"""
                    system: {system_message}
                    
                    conversation context: {context}
                    
                    user: I want to schedule a tour but I'm not sure which property.
                    
                    assistant: [Create a concise response (2-3 sentences) asking which specific property they'd like to tour. If appropriate, remind them of the most recently discussed property.]
                    """

                    response_text = llm.invoke(prompt).content.strip()
                    assistant_message = {
                        "role": "assistant",
                        "content": response_text
                    }
                    request.history.append(assistant_message)

                    return create_chat_response(
                        session_id, latest_property_results, conversation_state,
                        response=response_text,
                        results=latest_property_results if latest_property_results else []
                    )
            if not property_name or property_name == "":
                if conversation_state.get("last_shown_properties"):

                    if len(conversation_state["last_shown_properties"]) == 1:
                        property_details = conversation_state["last_shown_properties"][0]
                        conversation_state["awaiting_tour_confirmation"] = True
                        conversation_state["property_of_interest"] = property_details
                        interest_prompt = f"""
                        system: {system_message}
                        
                        user: The user is interested in {property_details.get('name', 'this property')}
                        
                        assistant: [Create a concise response (2-3 sentences) confirming their interest in this property and asking if they'd like to schedule a tour.]
                        """

                        interest_response = llm.invoke(
                            interest_prompt).content.strip()
                        assistant_message = {
                            "role": "assistant",
                            "content": interest_response
                        }
                        request.history.append(assistant_message)

                        return create_chat_response(
                            session_id, latest_property_results, conversation_state,
                            response=interest_response,
                            results=[property_details]
                        )
                    else:

                        property_list = ", ".join(
                            [f"\"{p.get('name', '')}\"" for p in conversation_state["last_shown_properties"][:3]])

                        prompt = f"""
                        system: {system_message}
                        
                        conversation context: {context}
                        
                        user: I'm interested in one of these properties.
                        
                        assistant: [Create a concise response (2-3 sentences) asking which specific property they're interested in from among {property_list}.]
                        """

                        response_text = llm.invoke(prompt).content.strip()
                        assistant_message = {
                            "role": "assistant",
                            "content": response_text
                        }
                        request.history.append(assistant_message)

                        return create_chat_response(
                            session_id, latest_property_results, conversation_state,
                            response=response_text,
                            results=conversation_state["last_shown_properties"]
                        )
                elif latest_property_results:

                    if len(latest_property_results) == 1:
                        property_details = latest_property_results[0]
                        conversation_state["awaiting_tour_confirmation"] = True
                        conversation_state["property_of_interest"] = property_details
                        interest_prompt = f"""
                        system: {system_message}
                        
                        user: The user is interested in {property_details.get('name', 'this property')}
                        
                        assistant: [Create a concise response (2-3 sentences) confirming their interest in this property and asking if they'd like to schedule a tour.]
                        """

                        interest_response = llm.invoke(
                            interest_prompt).content.strip()
                        assistant_message = {
                            "role": "assistant",
                            "content": interest_response
                        }
                        request.history.append(assistant_message)

                        return create_chat_response(
                            session_id, latest_property_results, conversation_state,
                            response=interest_response,
                            results=[property_details]
                        )
                else:

                    prompt = f"""
                    system: {system_message}
                    
                    conversation context: {context}
                    
                    user: I'm interested in a property.
                    
                    assistant: [Respond like a professional real estate broker who needs more information. Keep it very concise (2-3 sentences) asking what type of property they're interested in.]
                    """

                    response_text = llm.invoke(prompt).content.strip()
                    assistant_message = {
                        "role": "assistant",
                        "content": response_text
                    }
                    request.history.append(assistant_message)

                    return create_chat_response(
                        session_id, latest_property_results, conversation_state,
                        response=response_text,
                        results=[]
                    )
            interest_result = improved_handle_property_interest(
                property_name, latest_property_results, request.history, conversation_state)
            if interest_result["found"]:
                prompt = f"""
                system: {system_message}
                
                conversation context: {context}
                
                information: The user has expressed interest in {property_name}. Here is the original response:
                "{interest_result["response"]}"
                
                assistant: [Rewrite this to be much more concise (3-4 sentences maximum). Keep the key information and ask just one follow-up question about their interest.]
                """

                enhanced_response = llm.invoke(prompt).content.strip()
                interest_result["response"] = enhanced_response
            assistant_message = {
                "role": "assistant",
                "content": interest_result["response"]
            }
            request.history.append(assistant_message)

            return create_chat_response(
                session_id, latest_property_results, conversation_state,
                response=interest_result["response"],
                results=[interest_result["property"]
                         ] if interest_result["found"] else []
            )
        elif intent == "PROPERTY_QUERY" or intent == "PROPERTY_REJECTION":

            parsed_filters = extract_parsed_filters(message, request.history)
            extract_user_preferences(message, request.history, conversation_state)
            prefs = conversation_state["user_preferences"]
            has_transaction = prefs["transaction_type"] is not None
            has_location = prefs["location"] is not None
            has_specifics = (prefs["bedrooms"] is not None or 
                           prefs["min_price"] is not None or prefs["max_price"] is not None or
                           prefs["property_type"] is not None)
            
            if not (has_transaction):

                clarification_response = generate_smart_clarification(message, conversation_state)
                assistant_message = {
                    "role": "assistant", 
                    "content": clarification_response
                }
                request.history.append(assistant_message)
                
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
                    filtered_results = [
                        r for r in results if r.get('id') in property_ids]
                    latest_property_results = filtered_results
                prompt = f"""
                system: You are a real estate agent who gives extremely brief responses. Never use more than 2-3 short sentences total.
                
                user: Summarize these property results in 2-3 short sentences maximum. End with ONE very brief question:
                {natural_text}
                
                assistant:
                """
                enhanced_response = llm.invoke(prompt).content.strip()
                assistant_message = {
                    "role": "assistant",
                    "content": enhanced_response
                }
                request.history.append(assistant_message)

                return create_chat_response(session_id, latest_property_results, conversation_state, response=enhanced_response, results=filtered_results, parsed_filters=parsed_filters)
            else:

                location_prefs = prefs.get("location", "")
                bedroom_prefs = prefs.get("bedrooms", "")
                relaxed_results = []
                if location_prefs:

                    location_lower = location_prefs.lower()
                    location_matches = [
                        prop for prop in property_metadata 
                        if (location_lower in prop.get("city", "").lower() or
                            location_lower in prop.get("fullAddress", "").lower())
                    ]
                    
                    if location_matches:

                        if prefs.get("transaction_type") == "rent":
                            relaxed_results = [p for p in location_matches if p.get("leaseProperty")]
                        elif prefs.get("transaction_type") == "buy":
                            relaxed_results = [p for p in location_matches if p.get("salesPrice")]
                        else:
                            relaxed_results = location_matches
                        relaxed_results = relaxed_results[:3]
                
                if relaxed_results:
                    no_results_prompt = f"""
                    system: You are a real estate agent. Be helpful and specific about alternatives.
                    
                    user: No exact matches found for {bedroom_prefs} bedroom properties in {location_prefs}. 
                    We have {len(relaxed_results)} similar properties available. 
                    Suggest they could adjust bedroom count or location to see more options.
                    
                    assistant:
                    """
                else:
                    no_results_prompt = f"""
                    system: You are a real estate agent who gives brief responses. Keep under 25 words.
                    
                    user: Write a brief message saying no properties match the search criteria. Ask one short question to refine the search.
                    
                    assistant:
                    """

                response_text = llm.invoke(no_results_prompt).content.strip()
                assistant_message = {
                    "role": "assistant",
                    "content": response_text
                }
                request.history.append(assistant_message)

                return create_chat_response(
                    session_id, latest_property_results, conversation_state,
                    response=response_text,
                    results=[],
                    parsed_filters=parsed_filters
                )
        elif intent == "FOLLOWUP_QUERY":

            parsed_filters = extract_parsed_filters(message, request.history)

            extract_user_preferences(message, request.history, conversation_state)
            prefs = conversation_state["user_preferences"]
            has_transaction = prefs["transaction_type"] is not None
            has_location = prefs["location"] is not None
            has_specifics = (prefs["bedrooms"] is not None or 
                           prefs["min_price"] is not None or prefs["max_price"] is not None or
                           prefs["property_type"] is not None)
            
            if has_transaction and (has_location or has_specifics):
                query_parts = []
                if prefs["transaction_type"]:
                    query_parts.append(f"for {prefs['transaction_type']}")
                if prefs["property_type"]:
                    query_parts.append(prefs["property_type"])
                if prefs["bedrooms"]:
                    query_parts.append(f"{prefs['bedrooms']}-bedroom")
                if prefs["location"]:
                    query_parts.append(f"in {prefs['location']}")
                if prefs["min_price"] or prefs["max_price"]:
                    if prefs["min_price"] and prefs["max_price"]:
                        query_parts.append(f"${prefs['min_price']} to ${prefs['max_price']}")
                    elif prefs["min_price"]:
                        query_parts.append(f"over ${prefs['min_price']}")
                    elif prefs["max_price"]:
                        query_parts.append(f"under ${prefs['max_price']}")
                
                constructed_query = " ".join(query_parts)
                results = search_properties(context, constructed_query, conversation_state)
                
                if results:

                    latest_property_results = results
                    gpt_result = get_gpt_response(constructed_query, results)
                    natural_text = gpt_result["text"]
                    prompt = f"""
                    system: You are a real estate agent who gives extremely brief responses. Never use more than 2-3 short sentences total.
                    
                    user: Show these property results based on the user's preferences: {prefs}
                    Results: {natural_text}
                    
                    assistant:
                    """
                    
                    enhanced_response = llm.invoke(prompt).content.strip()
                    assistant_message = {
                        "role": "assistant",
                        "content": enhanced_response
                    }
                    request.history.append(assistant_message)
                    
                    return create_chat_response(session_id, latest_property_results, conversation_state, response=enhanced_response, results=results, parsed_filters=parsed_filters)
                else:

                    no_results_prompt = f"""
                    system: You are a real estate agent who gives extremely brief responses.
                    
                    user: No properties found matching these criteria: {prefs}. Suggest adjusting requirements.
                    
                    assistant:
                    """
                    
                    response_text = llm.invoke(no_results_prompt).content.strip()
                    assistant_message = {
                        "role": "assistant",
                        "content": response_text
                    }
                    request.history.append(assistant_message)
                    
                    return create_chat_response(session_id, latest_property_results, conversation_state, response=response_text, results=[], parsed_filters=parsed_filters)
            else:

                clarification_response = generate_smart_clarification(message, conversation_state)
                assistant_message = {
                    "role": "assistant",
                    "content": clarification_response
                }
                request.history.append(assistant_message)
                
                return create_chat_response(session_id, latest_property_results, conversation_state, response=clarification_response, results=[], parsed_filters=parsed_filters)
            criteria_response_check = f"""
            Analyze this message: "{message}"
            
            Is the user providing additional search criteria in response to a request for more information?
            Look for responses that include any of:
            - Transaction type: "buy", "rent", "purchase", "lease"
            - Location: neighborhood names, city names, areas
            - Property details: bedrooms, bathrooms, price ranges, property types
            - Specific requirements or preferences
            
            Return a JSON object:
            {{"is_criteria_response": true/false, "appears_complete": true/false}}
            """
            
            try:
                response = llm.invoke(criteria_response_check).content
                parser = JsonOutputParser()
                criteria_result = parser.parse(response)
                
                if criteria_result.get("is_criteria_response", False):
                    combined_query = ""
                    for msg in request.history[-3:]:
                        if msg.get('role') == 'user' and any(keyword in msg.get('content', '').lower() 
                            for keyword in ['bedroom', 'apartment', 'house', 'property', 'home', '$', 'show', 'find', 'looking']):
                            combined_query = msg.get('content', '') + " " + message
                            break
                    if not combined_query:
                        combined_query = message
                    combined_validation = validate_search_criteria(combined_query)
                    
                    if combined_validation.get("is_sufficient", False):

                        results = search_properties(context, combined_query, conversation_state)
                        
                        if results:

                            latest_property_results = results
                            gpt_result = get_gpt_response(combined_query, results)
                            natural_text = gpt_result["text"]
                            prompt = f"""
                            system: You are a real estate agent who gives extremely brief responses. Never use more than 2-3 short sentences total.
                            
                            user: The user provided additional criteria. Show these property results in 2-3 short sentences maximum. End with ONE very brief question:
                            {natural_text}
                            
                            assistant:
                            """
                            
                            enhanced_response = llm.invoke(prompt).content.strip()
                            assistant_message = {
                                "role": "assistant",
                                "content": enhanced_response
                            }
                            request.history.append(assistant_message)
                            
                            return create_chat_response(session_id, latest_property_results, conversation_state, response=enhanced_response, results=results, parsed_filters=parsed_filters)
                        else:

                            no_results_prompt = f"""
                            system: You are a real estate agent who gives extremely brief responses.
                            
                            user: No properties found matching the criteria. Write a brief message and ask if they'd like to adjust their requirements.
                            
                            assistant:
                            """
                            
                            response_text = llm.invoke(no_results_prompt).content.strip()
                            assistant_message = {
                                "role": "assistant",
                                "content": response_text
                            }
                            request.history.append(assistant_message)
                            
                            return create_chat_response(session_id, latest_property_results, conversation_state, response=response_text, results=[], parsed_filters=parsed_filters)
                    else:

                        missing_criteria = combined_validation.get("missing_criteria", [])
                        
                        still_missing_prompt = f"""
                        system: You are a professional real estate agent who needs complete search criteria.
                        
                        user: The user provided additional information but is still missing: {', '.join(missing_criteria)}
                        
                        assistant: [Create a brief, helpful response (2 sentences) asking for the remaining missing information. Be specific but natural.]
                        """
                        
                        response_text = llm.invoke(still_missing_prompt).content.strip()
                        assistant_message = {
                            "role": "assistant",
                            "content": response_text
                        }
                        request.history.append(assistant_message)
                        
                        return create_chat_response(session_id, latest_property_results, conversation_state, response=response_text, results=[], parsed_filters=parsed_filters)
                        
            except Exception as e:
                logger.error("Error in criteria response detection", error=str(e))
            more_properties_check = f"""
            Analyze this message: "{message}"
            Is the user asking for more property options or new listings rather than asking about details of previously shown properties?
            Return only "yes" or "no".
            """

            wants_more = llm.invoke(
                more_properties_check).content.strip().lower() == "yes"

            if wants_more:
                results = search_properties(context, "more properties", conversation_state)
                filtered_results = results

                if results:

                    gpt_result = get_gpt_response(
                        "Show me more properties", results)
                    natural_text = gpt_result["text"]
                    property_ids = gpt_result.get("property_ids", [])

                    if property_ids:
                        filtered_results = [
                            r for r in results if r.get('id') in property_ids]
                        latest_property_results = filtered_results
                    prompt = f"""
                    system: You are a real estate agent who gives extremely brief responses. Never use more than 2-3 short sentences total.
                    
                    user: Introduce these additional property options in 2-3 short sentences maximum. End with ONE very brief question:
                    {natural_text}
                    
                    assistant:
                    """
                    enhanced_response = llm.invoke(prompt).content.strip()
                    assistant_message = {
                        "role": "assistant",
                        "content": enhanced_response
                    }
                    request.history.append(assistant_message)

                    return create_chat_response(session_id, latest_property_results, conversation_state, response=enhanced_response, results=filtered_results, parsed_filters=parsed_filters)
                else:

                    no_results_prompt = f"""
                    system: You are a real estate agent who gives extremely brief responses. Keep all responses under 25 words.
                    
                    user: Write a very brief message saying no additional properties found. Ask for more specific preferences to help with the search.
                    
                    assistant:
                    """

                    response_text = llm.invoke(
                        no_results_prompt).content.strip()
                    assistant_message = {
                        "role": "assistant",
                        "content": response_text
                    }
                    request.history.append(assistant_message)

                    return create_chat_response(
                        session_id, latest_property_results, conversation_state,
                        response=response_text,
                        results=[]
                    )
            elif latest_property_results:
                follow_up_prompt = f"""
                system: {system_message}
                
                conversation context: {context}
                
                user: {message}
                
                information: These are the properties from the previous search results: {json.dumps(latest_property_results[:3], indent=4)}
                
                assistant: [Respond very concisely (2-3 sentences maximum) about the properties. Answer their question directly and ask one brief follow-up.]
                """

                follow_up_response = llm.invoke(follow_up_prompt).content
                assistant_message = {
                    "role": "assistant",
                    "content": follow_up_response
                }
                request.history.append(assistant_message)

                return create_chat_response(session_id, latest_property_results, conversation_state, response=follow_up_response, results=[])
        elif intent == "LOCATION_QUERY":

            address_extraction_prompt = f"""
            Extract the address, location, or landmark from this message: "{message}"
            
            Look for:
            - Full addresses like "164 Old Montauk Highway"
            - Landmarks like "Times Square", "Central Park", "Brooklyn Bridge"
            - Neighborhoods like "Manhattan", "Brooklyn", "Queens"
            - Property names
            - Street names or numbers
            - City names
            
            Return only the extracted location/address/landmark, or "NONE" if no specific location is found.
            
            Examples:
            "What hospitals are near Times Square?" → "Times Square"
            "Schools around Central Park" → "Central Park"
            "Restaurants near 123 Main St" → "123 Main St"
            """
            
            try:
                extracted_address = llm.invoke(address_extraction_prompt).content.strip()
                logger.debug("Extracted address", address=extracted_address)
                if not extracted_address or extracted_address.upper() == "NONE":
                    import re

                    near_pattern = r'(?:near|around|close to|at)\s+([A-Za-z\s,]+?)(?:\s*[?.]|$)'
                    match = re.search(near_pattern, message, re.IGNORECASE)
                    if match:
                        extracted_address = match.group(1).strip()
                        logger.debug("Fallback extracted address", address=extracted_address)
                
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
                                    response_parts.append(f"• **{poi['name']}** - {distance_str}")
                                response_parts.append("")
                        else:

                            poi_type_display = poi_type.replace("_", " ").title()
                            response_parts = [f"Here are the {poi_type_display.lower()} near {extracted_address}:\n"]
                            
                            if nearby_pois:
                                for poi in nearby_pois[:5]:
                                    distance_str = f"{poi['distance']} miles"
                                    response_parts.append(f"• **{poi['name']}** - {distance_str}")
                                response_parts.append("")
                            else:
                                response_parts.append(f"I couldn't find any {poi_type_display.lower()} in this area.\n")
                        
                        if not nearby_pois:
                            response_parts.append(f"\nI couldn't find any {poi_type} in this area.")
                        
                        response_parts.append("\nWould you like me to help you find properties in this area?")
                        
                        response_text = "\n".join(response_parts)
                    else:
                        response_text = f"I couldn't find location information for '{extracted_address}'. Could you provide a more specific address or check the spelling?"
                else:

                    if conversation_state.get("last_shown_properties"):

                        poi_type = extract_poi_type_from_query(message)
                        poi_display = poi_type.replace("_", " ").title() if poi_type != "all" else "amenities"
                        response_parts = [f"Here are the {poi_display.lower()} near the properties I showed you:"]
                        
                        for i, prop in enumerate(conversation_state["last_shown_properties"][:3]):
                            prop_name = prop.get("name", f"Property {i+1}")
                            prop_address = prop.get("fullAddress", "")
                            
                            if prop_address:

                                prop_coordinates = get_coordinates_from_address(prop_address)
                                
                                if prop_coordinates:
                                    lat, lng = prop_coordinates
                                    try:
                                        if poi_type == "schools":
                                            nearby_pois = find_nearby_schools((lat, lng), prop_address)
                                        else:
                                            nearby_pois = find_nearby_pois((lat, lng), prop_address, poi_type)
                                        
                                        response_parts.append(f"\n**{prop_name}** ({prop_address}):")
                                        
                                        if nearby_pois:
                                            for poi in nearby_pois[:2]:
                                                distance_str = f"{poi['distance']:.1f} miles" if poi.get('distance') else "distance unknown"
                                                rating_str = f" (Rating: {poi['rating']}/5)" if poi.get('rating') else ""
                                                response_parts.append(f"• **{poi['name']}** - {distance_str}{rating_str}")
                                        else:
                                            response_parts.append(f"• No {poi_display.lower()} found nearby")
                                    except Exception as e:
                                        logger.error("Error getting POI data", poi_type=poi_display.lower(), property=prop_name, error=str(e))
                                        response_parts.append(f"• Unable to retrieve {poi_display.lower()} information")
                            else:
                                response_parts.append(f"\n**{prop_name}**: No address available")
                        
                        response_parts.append(f"\nWould you like more details about any specific {poi_display.lower()} or property?")
                        response_text = "\n".join(response_parts)
                    else:
                        response_text = "I couldn't identify a specific address in your message. Could you provide the full address you're asking about?"
                
            except Exception as e:
                logger.error("Error processing location query", error=str(e))
                response_text = "I'm having trouble processing that location query. Could you try rephrasing your question?"
            assistant_message = {
                "role": "assistant",
                "content": response_text
            }
            request.history.append(assistant_message)
            
            return create_chat_response(session_id, latest_property_results, conversation_state, response=response_text, results=[])
        else:

            gpt_input = f"""
            system: {system_message}
            
            conversation context: {context}
            
            user: {message}
            
            assistant: [Respond very concisely (2-3 sentences maximum) to this conversational query. Keep it focused on real estate and be helpful but brief.]
            """
            response = llm.invoke(gpt_input).content
            assistant_message = {
                "role": "assistant",
                "content": response
            }
            request.history.append(assistant_message)

            return create_chat_response(
                session_id, latest_property_results, conversation_state,
                response=response,
                results=[]
            )

    except Exception as e:
        execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        logger.error("Chat endpoint error", error=str(e), message=request.message, 
                     execution_time_ms=execution_time)
        prompt = f"""
        system: {system_message}
        
        user: [The user sent a message that caused a technical error]
        
        assistant: [Respond very concisely (1-2 sentences) asking the client to rephrase their question.]
        """

        try:
            response_text = llm.invoke(prompt).content.strip()
        except:
            response_text = "I'm sorry, I'm having trouble understanding. Could you rephrase your question about what you're looking for?"
        assistant_message = {
            "role": "assistant",
            "content": response_text
        }
        try:
            request.history.append({"role": "user", "content": message})
            request.history.append(assistant_message)
        except:
            pass

        return create_chat_response(
            session_id, latest_property_results, conversation_state,
            response=response_text,
            response_type="error",
            intent="error_recovery",
            results=[],
            metadata={
                "execution_time_ms": execution_time,
                "error": "Internal server error",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
