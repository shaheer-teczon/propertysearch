from typing import List, Dict, Any, Optional, Tuple
import geopy.distance
import requests
import os

from .config import property_metadata, location_cache, get_geolocator, logger

OVERPASS_URL = os.getenv("OVERPASS_URL", "http://overpass-api.de/api/interpreter")


def get_available_locations() -> List[str]:
    """Get list of available locations from property metadata"""
    locations = set()
    for prop in property_metadata:
        if prop.get("fullAddress"):
            address_parts = prop["fullAddress"].split(",")
            if len(address_parts) > 1:
                city_part = address_parts[-2].strip()
                if city_part and len(city_part) > 2:
                    locations.add(city_part)

        neighborhood = prop.get("neighborhood")
        if neighborhood:
            if isinstance(neighborhood, str):
                locations.add(neighborhood)
            elif isinstance(neighborhood, dict) and neighborhood.get("name"):
                locations.add(neighborhood["name"])

        city = prop.get("city")
        if city:
            if isinstance(city, str):
                locations.add(city)
            elif isinstance(city, dict) and city.get("name"):
                locations.add(city["name"])
    return sorted([loc for loc in locations if loc and len(loc) > 2 and loc != "None"])


def get_coordinates_from_address(address: str) -> Optional[Tuple[float, float]]:
    """Get latitude and longitude from an address using geocoding"""
    try:
        geolocator = get_geolocator()
        location = geolocator.geocode(address, timeout=10)
        if location:
            return (location.latitude, location.longitude)
        return None
    except Exception as e:
        logger.error(f"Geocoding error for {address}: {str(e)}")
        return None


def find_nearby_schools(property_coords: Tuple[float, float], property_address: str) -> List[Dict[str, Any]]:
    """Find nearby schools using Overpass API (OpenStreetMap data)"""
    try:
        lat, lng = property_coords
        overpass_url = OVERPASS_URL
        radius = 3000
        query = f"""
        [out:json][timeout:25];
        (
          node["amenity"="school"](around:{radius},{lat},{lng});
          way["amenity"="school"](around:{radius},{lat},{lng});
          relation["amenity"="school"](around:{radius},{lat},{lng});
        );
        out center tags;
        """

        response = requests.post(overpass_url, data=query, timeout=15)
        response.raise_for_status()
        data = response.json()

        schools = []
        for element in data.get('elements', []):
            if element['type'] == 'node':
                school_lat, school_lng = element['lat'], element['lon']
            elif 'center' in element:
                school_lat, school_lng = element['center']['lat'], element['center']['lon']
            else:
                continue

            distance_km = geopy.distance.distance((lat, lng), (school_lat, school_lng)).kilometers
            distance_miles = distance_km * 0.621371
            tags = element.get('tags', {})
            name = tags.get('name', 'Unnamed School')
            school_type = "School"

            if 'school:type' in tags:
                school_type = tags['school:type'].title() + " School"
            elif 'isced:level' in tags:
                level = tags['isced:level']
                if '0' in level or '1' in level:
                    school_type = "Elementary School"
                elif '2' in level:
                    school_type = "Middle School"
                elif '3' in level:
                    school_type = "High School"

            if distance_miles > 5:
                continue

            schools.append({
                "name": name,
                "type": school_type,
                "distance": round(distance_miles, 2),
                "rating": None,
                "description": f"{school_type} in the area"
            })

        schools.sort(key=lambda x: x['distance'])
        return schools[:5]

    except Exception as e:
        logger.error(f"Error finding nearby schools: {str(e)}")
        return []


def find_nearby_pois(property_coords: Tuple[float, float], property_address: str, poi_type: str = "all") -> List[Dict[str, Any]]:
    """Find nearby POIs of specific type using Overpass API (OpenStreetMap data)"""
    try:
        lat, lng = property_coords
        overpass_url = OVERPASS_URL
        poi_queries = {
            "hospitals": 'node["amenity"="hospital"]',
            "schools": 'node["amenity"="school"]',
            "parks": 'node["leisure"="park"]',
            "restaurants": 'node["amenity"~"^(restaurant|cafe|fast_food)$"]',
            "shopping": 'node["shop"]',
            "banks": 'node["amenity"="bank"]',
            "pharmacies": 'node["amenity"="pharmacy"]',
            "gas_stations": 'node["amenity"="fuel"]',
            "attractions": 'node["tourism"~"^(attraction|museum|gallery)$"]; node["amenity"~"^(restaurant|cafe|hospital|pharmacy|bank|shopping|supermarket)$"]; node["leisure"~"^(park|playground|sports_centre|swimming_pool)$"]',
            "all": 'node["amenity"~"^(restaurant|cafe|hospital|pharmacy|bank|shopping|supermarket|school)$"]; node["leisure"~"^(park|playground|sports_centre|swimming_pool)$"]; node["shop"~"^(supermarket|mall)$"]; node["tourism"~"^(attraction|museum|gallery)$"]'
        }
        poi_query = poi_queries.get(poi_type.lower(), poi_queries["all"])
        radius = 3000
        query = f"""
        [out:json][timeout:25];
        (
          {poi_query}(around:{radius},{lat},{lng});
        );
        out center tags;
        """

        response = requests.post(overpass_url, data=query, timeout=15)
        response.raise_for_status()
        data = response.json()

        pois = []
        for element in data.get('elements', []):
            if element['type'] == 'node':
                poi_lat, poi_lng = element['lat'], element['lon']
            elif 'center' in element:
                poi_lat, poi_lng = element['center']['lat'], element['center']['lon']
            else:
                continue

            distance_km = geopy.distance.distance((lat, lng), (poi_lat, poi_lng)).kilometers
            distance_miles = distance_km * 0.621371
            tags = element.get('tags', {})
            name = tags.get('name', 'Unnamed Location')
            poi_category = "Point of Interest"
            description = "Location in the area"

            if 'amenity' in tags:
                amenity = tags['amenity']
                if amenity == 'hospital':
                    poi_category = "Hospital"
                    description = "Medical facility"
                elif amenity == 'school':
                    poi_category = "School"
                    description = "Educational institution"
                elif amenity in ['restaurant', 'cafe', 'fast_food']:
                    poi_category = "Restaurant/Dining"
                    description = "Dining establishment"
                elif amenity == 'pharmacy':
                    poi_category = "Pharmacy"
                    description = "Pharmacy/Drugstore"
                elif amenity == 'bank':
                    poi_category = "Bank"
                    description = "Banking services"
                elif amenity == 'fuel':
                    poi_category = "Gas Station"
                    description = "Fuel station"
                elif amenity == 'park':
                    poi_category = "Park"
                    description = "Public park"
            elif 'leisure' in tags:
                leisure = tags['leisure']
                if leisure in ['park', 'playground', 'garden']:
                    poi_category = "Park/Recreation"
                    description = "Recreational area"
                elif leisure in ['sports_centre', 'swimming_pool']:
                    poi_category = "Sports/Fitness"
                    description = "Sports facility"
            elif 'shop' in tags:
                poi_category = "Shopping"
                description = "Retail establishment"
            elif 'tourism' in tags:
                poi_category = "Tourism/Culture"
                description = "Tourist attraction"

            if distance_miles > 5:
                continue

            pois.append({
                "name": name,
                "type": poi_category,
                "distance": round(distance_miles, 2),
                "description": description
            })

        pois.sort(key=lambda x: x['distance'])
        return pois[:10]

    except Exception as e:
        logger.error(f"Error finding nearby POIs: {str(e)}")
        return []


def find_nearby_attractions(property_coords: Tuple[float, float], property_address: str) -> List[Dict[str, Any]]:
    """Find nearby attractions and amenities using Overpass API (OpenStreetMap data)"""
    try:
        lat, lng = property_coords
        overpass_url = OVERPASS_URL
        radius = 2000
        query = f"""
        [out:json][timeout:25];
        (
          node["amenity"~"^(restaurant|cafe|hospital|pharmacy|bank|shopping|supermarket|park)$"](around:{radius},{lat},{lng});
          node["leisure"~"^(park|playground|sports_centre|swimming_pool)$"](around:{radius},{lat},{lng});
          node["shop"~"^(supermarket|mall|shopping_centre)$"](around:{radius},{lat},{lng});
          node["tourism"~"^(attraction|museum|gallery)$"](around:{radius},{lat},{lng});
          way["amenity"~"^(restaurant|cafe|hospital|pharmacy|bank|shopping|supermarket)$"](around:{radius},{lat},{lng});
          way["leisure"~"^(park|playground|sports_centre|swimming_pool)$"](around:{radius},{lat},{lng});
        );
        out center tags;
        """

        response = requests.post(overpass_url, data=query, timeout=15)
        response.raise_for_status()
        data = response.json()

        attractions = []
        for element in data.get('elements', []):
            if element['type'] == 'node':
                attr_lat, attr_lng = element['lat'], element['lon']
            elif 'center' in element:
                attr_lat, attr_lng = element['center']['lat'], element['center']['lon']
            else:
                continue

            distance_km = geopy.distance.distance((lat, lng), (attr_lat, attr_lng)).kilometers
            distance_miles = distance_km * 0.621371
            tags = element.get('tags', {})
            name = tags.get('name', 'Unnamed Location')
            attr_type = "Point of Interest"

            if 'amenity' in tags:
                amenity = tags['amenity']
                if amenity in ['restaurant', 'cafe']:
                    attr_type = "Restaurant/Dining"
                elif amenity in ['hospital', 'pharmacy']:
                    attr_type = "Healthcare"
                elif amenity in ['bank']:
                    attr_type = "Banking"
                elif amenity in ['supermarket', 'shopping']:
                    attr_type = "Shopping"
            elif 'leisure' in tags:
                leisure = tags['leisure']
                if leisure in ['park', 'playground']:
                    attr_type = "Park/Recreation"
                elif leisure in ['sports_centre', 'swimming_pool']:
                    attr_type = "Sports/Fitness"
            elif 'shop' in tags:
                attr_type = "Shopping"
            elif 'tourism' in tags:
                attr_type = "Tourism/Culture"

            if distance_miles > 3:
                continue

            attractions.append({
                "name": name,
                "type": attr_type,
                "distance": round(distance_miles, 2),
                "description": f"{attr_type} in the area"
            })

        attractions.sort(key=lambda x: x['distance'])
        return attractions[:8]

    except Exception as e:
        logger.error(f"Error finding nearby attractions: {str(e)}")
        return []


def enhance_property_with_location_data(property_data: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance property data with nearby schools and attractions"""
    try:
        address = property_data.get("fullAddress", "")
        if not address:
            return property_data

        address_hash = hash(address)
        if address_hash in location_cache:
            cached_data = location_cache[address_hash]
            enhanced_property = property_data.copy()
            enhanced_property.update(cached_data)
            return enhanced_property

        coords = get_coordinates_from_address(address)
        if not coords:
            return property_data

        schools = []
        attractions = []
        try:
            schools = find_nearby_schools(coords, address)
        except Exception as e:
            logger.warning(f"Failed to fetch schools for {address}: {str(e)}")

        try:
            attractions = find_nearby_attractions(coords, address)
        except Exception as e:
            logger.warning(f"Failed to fetch attractions for {address}: {str(e)}")

        location_data = {
            "coordinates": {"lat": coords[0], "lng": coords[1]},
            "nearby_schools": schools,
            "nearby_attractions": attractions
        }
        location_cache[address_hash] = location_data
        enhanced_property = property_data.copy()
        enhanced_property.update(location_data)

        return enhanced_property

    except Exception as e:
        logger.error(f"Error enhancing property with location data: {str(e)}")
        return property_data


def extract_poi_type_from_query(query: str) -> str:
    """Extract the POI type from user query"""
    query_lower = query.lower()
    poi_keywords = {
        "hospitals": ["hospital", "hospitals", "medical", "healthcare", "clinic", "clinics"],
        "schools": ["school", "schools", "education", "educational", "university", "universities", "college", "colleges"],
        "parks": ["park", "parks", "recreation", "recreational", "playground", "playgrounds", "garden", "gardens"],
        "restaurants": ["restaurant", "restaurants", "dining", "food", "cafe", "cafes", "coffee"],
        "shopping": ["shopping", "shop", "shops", "store", "stores", "mall", "malls", "retail"],
        "banks": ["bank", "banks", "atm", "banking", "financial"],
        "pharmacies": ["pharmacy", "pharmacies", "drugstore", "medicine", "prescription"],
        "gas_stations": ["gas", "fuel", "station", "stations", "gasoline", "petrol"],
        "attractions": ["attraction", "attractions", "tourist", "tourism", "museum", "museums", "gallery", "galleries"]
    }

    for poi_type, keywords in poi_keywords.items():
        if any(keyword in query_lower for keyword in keywords):
            return poi_type
    return "all"
