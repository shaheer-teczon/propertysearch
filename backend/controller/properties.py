
from config.config import property_metadata, logger
from utils import enhance_property_with_location_data
from fastapi import HTTPException


async def get_all_properties(
    page: int = 1,
    limit: int = 12,
    search: str = None,
    price_min: float = None,
    price_max: float = None,
    bedrooms: int = None,
    bathrooms: int = None,
    location: str = None,
    property_type: str = None,
    transaction_type: str = None
):
    """Get all properties with filtering and pagination"""
    try:

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
        logger.error("Error in get_all_properties", error=str(e))
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_property_by_id(property_id: str):
    """Get a specific property by its ID"""
    try:
        logger.info("Property detail request", property_id=property_id)
        property_detail = None
        for prop in property_metadata:
            if prop.get("id") == property_id:
                property_detail = prop.copy()
                break
        
        if not property_detail:
            logger.warning("Property not found", property_id=property_id)
            raise HTTPException(status_code=404, detail=f"Property {property_id} not found")
        excluded_keys = {"embedding", "seoDescription"}
        cleaned_property = {
            key: value for key, value in property_detail.items() 
            if key not in excluded_keys
        }
        enhanced_property = enhance_property_with_location_data(cleaned_property)
        
        logger.info("Property detail served successfully", property_id=property_id)
        return enhanced_property
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting property detail", property_id=property_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")
