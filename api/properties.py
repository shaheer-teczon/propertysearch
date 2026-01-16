from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib.config import property_metadata, logger


def get_all_properties(params: dict) -> dict:
    """Get all properties with filtering and pagination"""
    try:
        page = int(params.get('page', [1])[0])
        limit = int(params.get('limit', [12])[0])
        search = params.get('search', [None])[0]
        price_min = params.get('price_min', [None])[0]
        price_max = params.get('price_max', [None])[0]
        bedrooms = params.get('bedrooms', [None])[0]
        bathrooms = params.get('bathrooms', [None])[0]
        location = params.get('location', [None])[0]
        property_type = params.get('property_type', [None])[0]
        transaction_type = params.get('transaction_type', [None])[0]

        if price_min:
            price_min = float(price_min)
        if price_max:
            price_max = float(price_max)
        if bedrooms:
            bedrooms = int(bedrooms)
        if bathrooms:
            bathrooms = int(bathrooms)

        filtered_properties = list(property_metadata)

        if search:
            search_lower = search.lower()
            filtered_properties = [
                prop for prop in filtered_properties
                if (search_lower in prop.get('name', '').lower() or
                    search_lower in prop.get('fullAddress', '').lower() or
                    search_lower in prop.get('description', '').lower())
            ]

        if price_min is not None:
            filtered_properties = [
                prop for prop in filtered_properties
                if prop.get('salesPrice') and float(prop.get('salesPrice', 0)) >= price_min
            ]

        if price_max is not None:
            filtered_properties = [
                prop for prop in filtered_properties
                if prop.get('salesPrice') and float(prop.get('salesPrice', 0)) <= price_max
            ]

        if bedrooms is not None:
            filtered_properties = [
                prop for prop in filtered_properties
                if prop.get('bedroomCount') == bedrooms
            ]

        if bathrooms is not None:
            filtered_properties = [
                prop for prop in filtered_properties
                if prop.get('bathCount') == bathrooms
            ]

        if location:
            location_lower = location.lower()
            filtered_properties = [
                prop for prop in filtered_properties
                if (location_lower in prop.get('fullAddress', '').lower() or
                    location_lower in (prop.get('city') or '').lower() or
                    location_lower in (prop.get('neighborhood') or '').lower())
            ]

        if property_type:
            type_lower = property_type.lower()
            filtered_properties = [
                prop for prop in filtered_properties
                if type_lower in prop.get('propertyType', '').lower()
            ]

        if transaction_type:
            if transaction_type.lower() == 'buy':
                filtered_properties = [
                    prop for prop in filtered_properties
                    if prop.get('salesPrice') is not None and prop.get('salesPrice') != 0
                ]
            elif transaction_type.lower() == 'rent':
                filtered_properties = [
                    prop for prop in filtered_properties
                    if prop.get('salesPrice') is None or prop.get('salesPrice') == 0
                ]

        total = len(filtered_properties)
        total_pages = (total + limit - 1) // limit
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_properties = filtered_properties[start_idx:end_idx]

        formatted_properties = []
        for prop in paginated_properties:
            formatted_prop = {
                "id": prop.get("id", ""),
                "name": prop.get("name", ""),
                "description": prop.get("description", ""),
                "salesPrice": prop.get("salesPrice"),
                "fullAddress": prop.get("fullAddress", ""),
                "location": prop.get("fullAddress", ""),
                "bedroomCount": prop.get("bedroomCount"),
                "bathCount": prop.get("bathCount"),
                "squareFeet": prop.get("livingSpaceSize"),
                "livingSpaceSize": prop.get("livingSpaceSize"),
                "image": prop.get("media", []),
                "media": prop.get("media", []),
                "slug": prop.get("slug", "")
            }
            formatted_properties.append(formatted_prop)

        return {
            "properties": formatted_properties,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages,
                "hasNext": page < total_pages,
                "hasPrev": page > 1
            }
        }

    except Exception as e:
        logger.error(f"Error in get_all_properties: {str(e)}")
        return {"error": "Internal server error", "status_code": 500}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed_url = urlparse(self.path)
            params = parse_qs(parsed_url.query)

            result = get_all_properties(params)

            if result.get("error"):
                self.send_response(result.get("status_code", 500))
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

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
