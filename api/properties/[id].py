from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import urlparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from _lib.config import property_metadata, logger
from _lib.location import enhance_property_with_location_data


def get_property_by_id(property_id: str) -> dict:
    """Get a specific property by its ID"""
    try:
        logger.info(f"Property detail request: {property_id}")
        property_detail = None

        for prop in property_metadata:
            if prop.get("id") == property_id:
                property_detail = prop.copy()
                break

        if not property_detail:
            logger.warning(f"Property not found: {property_id}")
            return {"error": f"Property {property_id} not found", "status_code": 404}

        excluded_keys = {"embedding", "seoDescription"}
        cleaned_property = {
            key: value for key, value in property_detail.items()
            if key not in excluded_keys
        }

        enhanced_property = enhance_property_with_location_data(cleaned_property)

        logger.info(f"Property detail served successfully: {property_id}")
        return enhanced_property

    except Exception as e:
        logger.error(f"Error getting property detail: {property_id}, {str(e)}")
        return {"error": "Internal server error", "status_code": 500}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed_url = urlparse(self.path)
            path_parts = parsed_url.path.strip('/').split('/')

            property_id = path_parts[-1] if path_parts else None

            if not property_id:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Property ID required"}).encode())
                return

            result = get_property_by_id(property_id)

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
