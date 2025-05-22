from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import aiohttp
import google.generativeai as genai
from models import Expense
from mcp_tools import fetch_cost_of_living
from database import add_expense, get_expenses
from dependencies import get_gemini_client

router = APIRouter(prefix="/agent", tags=["agents"])

# JSON-RPC models
class JsonRpcRequest(BaseModel):
    jsonrpc: str = "2.0"
    method: str
    params: dict
    id: int

class JsonRpcResponse(BaseModel):
    jsonrpc: str = "2.0"
    result: dict | None = None
    error: dict | None = None
    id: int

async def send_jsonrpc_request(url: str, method: str, params: dict, request_id: int) -> dict:
    async with aiohttp.ClientSession() as session:
        payload = JsonRpcRequest(method=method, params=params, id=request_id).dict()
        async with session.post(url, json=payload) as response:
            if response.status != 200:
                raise HTTPException(status_code=response.status, detail="Agent communication failed")
            data = await response.json()
            return JsonRpcResponse(**data).result

@router.post("/expense/process")
async def process_expense(expense: Expense):
    try:
        # Store expense
        add_expense(expense)
        expenses = get_expenses()
        
        # Calculate summary
        total_expenses = sum(exp['amount'] for exp in expenses)
        summary = {
            "category": expense.category,
            "total_expenses": total_expenses,
            "city": "Seattle"  # Mocked city, update as needed
        }
        
        # Send to Recommendation Agent
        result = await send_jsonrpc_request(
            url="http://localhost:8000/agent/recommendation/generate",
            method="generate_recommendation",
            params={"summary": summary},
            request_id=1
        )
        return {"message": "Expense processed", "recommendation": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendation/generate")
async def generate_recommendation(request: JsonRpcRequest, gemini_client=Depends(get_gemini_client)):
    try:
        if request.method != "generate_recommendation":
            return JsonRpcResponse(
                id=request.id,
                error={"code": -32601, "message": "Method not found"}
            )
        
        summary = request.params.get("summary", {})
        category = summary.get("category", "unknown")
        total_expenses = summary.get("total_expenses", 0)
        city = summary.get("city", "Seattle")
        
        # Fetch cost of living
        cost_data = await fetch_cost_of_living(city)
        grocery_index = cost_data.grocery_index
        
        # Prepare prompt for Gemini
        prompt = f"""
        You are a budget advisor. A user has spent ${total_expenses:.2f} on {category} in {city}, where the grocery cost index is {grocery_index} (100 = average). Provide 1-2 concise budget recommendations to optimize their spending, considering the cost of living. Return a JSON object with a "recommendations" key containing a list of strings.

        Example:
        ```json
        {"recommendations": ["Reduce grocery spending by 10% to align with local costs", "Consider bulk buying to save on frequent purchases"]}
        ```
        """
        
        # Call Gemini
        response = gemini_client.generate_content(prompt)
        response_text = response.text.strip()
        if response_text.startswith("```json") and response_text.endswith("```"):
            response_text = response_text[7:-3].strip()  # Remove ```json and ```
        import json
        recommendations = json.loads(response_text)
        
        return JsonRpcResponse(
            id=request.id,
            result=recommendations
        )
    except Exception as e:
        return JsonRpcResponse(
            id=request.id,
            error={"code": -32000, "message": str(e)}
        )