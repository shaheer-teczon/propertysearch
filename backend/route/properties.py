from fastapi import APIRouter
from controller.properties import get_all_properties, get_property_by_id

router = APIRouter()

@router.get("/properties")
async def properties_endpoint(
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
    return await get_all_properties(
        page=page,
        limit=limit,
        search=search,
        price_min=price_min,
        price_max=price_max,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        location=location,
        property_type=property_type,
        transaction_type=transaction_type
    )

@router.get("/properties/{property_id}")
async def property_by_id_endpoint(property_id: str):
    return await get_property_by_id(property_id)
