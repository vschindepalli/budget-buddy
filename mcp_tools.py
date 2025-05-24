from fastapi import APIRouter
from pydantic import BaseModel
import aiohttp
from models import Expense, CostOfLiving
from database import add_expense, get_expenses

router = APIRouter(prefix="/mcp", tags=["mcp"])

class MCPResponse(BaseModel):
    result: dict
    error: str | None = None

async def fetch_cost_of_living(city: str) -> CostOfLiving:
    #mock Numbeo API call (replace with real API if key available)
    async with aiohttp.ClientSession() as session:
        #example: Replace with actual Numbeo API endpoint
        return CostOfLiving(city=city, grocery_index=75.0)  # Mock data

@router.post("/add_expense", response_model=MCPResponse)
async def mcp_add_expense(expense: Expense):
    try:
        add_expense(expense)
        return MCPResponse(result={"message": "Expense added"})
    except Exception as e:
        return MCPResponse(result={}, error=str(e))

@router.get("/get_expenses", response_model=MCPResponse)
async def mcp_get_expenses():
    try:
        expenses = get_expenses()
        return MCPResponse(result={"expenses": expenses})
    except Exception as e:
        return MCPResponse(result={}, error=str(e))

@router.get("/fetch_cost_of_living", response_model=MCPResponse)
async def mcp_fetch_cost_of_living(city: str):
    try:
        cost = await fetch_cost_of_living(city)
        return MCPResponse(result=cost.dict())
    except Exception as e:
        return MCPResponse(result={}, error=str(e))