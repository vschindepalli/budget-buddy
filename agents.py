from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel, Field
import aiohttp
import google.generativeai as genai
import os
import json
from typing import List, Dict, Any, Optional

# Assuming these are in the same directory or accessible via Python path
from models import Expense #models.py
from mcp_tools import fetch_cost_of_living #mcp_tools.py
# Ensure add_tracked_goal is imported from your latest database.py
from database import add_expense, get_expenses, add_tracked_goal

router_agents = APIRouter(prefix="/agent", tags=["Agent Endpoints"])
router_api = APIRouter(prefix="/api", tags=["General API Endpoints"])


# --- Pydantic Models ---
class TrackGoalPayload(BaseModel):
    tip_id: str
    tip_text: str

class JsonRpcRequest(BaseModel):
    jsonrpc: str = "2.0"
    method: str
    params: dict
    id: int

class JsonRpcResponseResult(BaseModel):
    recommendations: Optional[List[str]] = None
    savingsTips: Optional[List[Dict[str, str]]] = Field(default_factory=list)

class JsonRpcResponse(BaseModel):
    jsonrpc: str = "2.0"
    result: Optional[JsonRpcResponseResult] = None
    error: Optional[Dict[str, Any]] = None
    id: int

class ProcessExpenseResponse(BaseModel):
    message: str
    recommendation: Optional[JsonRpcResponseResult] = None


# --- Gemini Client Dependency ---
async def get_gemini_client():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_API_KEY environment variable not set")
        raise HTTPException(status_code=500, detail="API key configuration error.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash-preview-05-20")

# --- Helper for Internal Agent Calls ---
async def send_jsonrpc_request(url: str, method: str, params: dict, request_id: int) -> Optional[Dict[str, Any]]:
    async with aiohttp.ClientSession() as session:
        payload = JsonRpcRequest(method=method, params=params, id=request_id).model_dump()
        try:
            async with session.post(url, json=payload, timeout=30) as response:
                if response.status != 200:
                    error_detail = await response.text()
                    print(f"Agent communication failed (to {url}). Status: {response.status}, Detail: {error_detail}")
                    return {"error": {"code": response.status, "message": f"Agent communication failed: {error_detail}"}}
                
                try:
                    data = await response.json()
                    if "jsonrpc" in data and "id" in data:
                        return data 
                    else:
                        print(f"Received unexpected JSON-RPC response structure from {url}: {data}")
                        return {"error": {"code": -32001, "message": "Invalid JSON-RPC response structure from dependent agent"}}
                except json.JSONDecodeError:
                    text_response = await response.text()
                    print(f"Failed to decode JSON from agent response ({url}). Response text: {text_response}")
                    return {"error": {"code": -32002, "message": "Failed to decode JSON from dependent agent response"}}
        except aiohttp.ClientError as e:
            print(f"AIOHTTP client error calling {url}: {e}")
            return {"error": {"code": -32003, "message": f"Network error calling dependent agent: {e}"}}


# --- Budget Recommendation Agent Logic ---
@router_agents.post("/recommendation/generate", response_model=JsonRpcResponse)
async def generate_budget_recommendation(request: JsonRpcRequest, gemini_client: genai.GenerativeModel = Depends(get_gemini_client)):
    try:
        if request.method != "generate_recommendation":
            return JsonRpcResponse(id=request.id, error={"code": -32601, "message": "Method not found"})
        
        summary = request.params.get("summary", {})
        category = summary.get("category", "unknown")
        total_expenses_so_far = summary.get("total_expenses", 0) 
        current_expense_amount = summary.get("current_expense_amount", 0)
        city = summary.get("city", "Seattle")
        
        cost_data = await fetch_cost_of_living(city)
        grocery_index = cost_data.grocery_index if cost_data else 100
        
        prompt = f"""
        You are a concise budget advisor. A user just spent ${current_expense_amount:.2f} on '{category}' in {city}.
        Their overall total expenses recorded so far are ${total_expenses_so_far:.2f}.
        The grocery cost index in {city} is {grocery_index} (where 100 is average).
        Provide 1-2 brief, actionable budget recommendations based on this recent expense and their overall spending context.
        Return ONLY a valid JSON object with a single key "recommendations", which must be a list of strings.
        Do not include any markdown, code block formatting (```), or any text outside this JSON object.

        Example: {{"recommendations": ["Track spending in '{category}' closely for a week.", "Look for alternatives if '{category}' spending is consistently high."]}}
        """
        
        response = await gemini_client.generate_content_async(prompt)
        
        if not response.candidates or not response.candidates[0].content.parts:
             print(f"Gemini (budget_recommendation) response issue. Feedback: {response.prompt_feedback}")
             return JsonRpcResponse(id=request.id, error={"code": -32000, "message": "Gemini error (budget recommendations)."})

        response_text = response.text.strip()
        print(f"Gemini raw response (budget_recommendation): {response_text}")
        
        parsed_data: dict
        try:
            parsed_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"JSON parse error (budget_recommendation): {str(e)}. Response: '{response_text}'")
            return JsonRpcResponse(id=request.id, error={"code": -32000, "message": "Invalid JSON from Gemini (budget_recommendation)."})
        
        if not isinstance(parsed_data, dict) or "recommendations" not in parsed_data or \
           not isinstance(parsed_data["recommendations"], list) or \
           not all(isinstance(item, str) for item in parsed_data["recommendations"]):
            print(f"Validation failed (budget_recommendation): Response '{parsed_data}' invalid structure.")
            return JsonRpcResponse(id=request.id, error={"code": -32000, "message": "Gemini response structure invalid (budget_recommendation)."})
        
        return JsonRpcResponse(id=request.id, result=JsonRpcResponseResult(recommendations=parsed_data["recommendations"]))

    except HTTPException: # Specifically re-raise HTTPExceptions
        raise
    except Exception as e: # Catch other unexpected errors
        import traceback
        print(f"Error in generate_budget_recommendation: {str(e)}\n{traceback.format_exc()}")
        return JsonRpcResponse(id=request.id, error={"code": -32000, "message": f"Server error in budget recommendations: {str(e)}"})

# --- Savings Tip Agent Logic ---
@router_agents.post("/savings/generate", response_model=JsonRpcResponse)
async def generate_savings_tips_agent(request: JsonRpcRequest, gemini_client: genai.GenerativeModel = Depends(get_gemini_client)):
    try:
        if request.method != "generate_savings_tips":
            return JsonRpcResponse(id=request.id, error={"code": -32601, "message": "Method not found for savings tips"})

        params = request.params
        category = params.get("category", "unknown")
        current_expense_amount = params.get("current_expense_amount", 0)
        city = params.get("city", "Seattle")
        grocery_index = params.get("grocery_index", 100)
        budget_recommendations = params.get("budget_recommendations", [])

        prompt = f"""
        You are a friendly financial coach. A user just spent ${current_expense_amount:.2f} on '{category}' in {city}.
        The grocery cost index in {city} is {grocery_index}.
        They recently received these budget recommendations: {json.dumps(budget_recommendations)}.

        Based on this specific expense and their budget advice, provide 2-3 actionable and personalized savings tips.
        Each tip should be a practical suggestion they can implement.
        Return ONLY a valid JSON object with a single key "savingsTips".
        The value of "savingsTips" should be a list of objects, where each object has an 'id' (a unique string like 'st_category_1', 'st_general_2') and a 'text' (the savings tip string).
        Ensure IDs are somewhat descriptive or unique.
        Do not include any markdown, code block formatting (```), or any text outside this JSON object.

        Example: {{"savingsTips": [
            {{"id": "st_dining_1", "text": "Since you spent on '{category}', try packing lunch twice this week to save."}},
            {{"id": "st_general_1", "text": "Review your subscriptions and cancel any unused ones to free up funds."}}
        ]}}
        """

        response = await gemini_client.generate_content_async(prompt)

        if not response.candidates or not response.candidates[0].content.parts:
             print(f"Gemini (savings_tips) response issue. Feedback: {response.prompt_feedback}")
             return JsonRpcResponse(id=request.id, error={"code": -32000, "message": "Gemini error (savings tips)."})

        response_text = response.text.strip()
        print(f"Gemini raw response (savings_tips): {response_text}")

        parsed_data: dict
        try:
            parsed_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"JSON parse error (savings_tips): {str(e)}. Response: '{response_text}'")
            return JsonRpcResponse(id=request.id, error={"code": -32000, "message": "Invalid JSON from Gemini (savings_tips)."})

        if not isinstance(parsed_data, dict) or "savingsTips" not in parsed_data or \
           not isinstance(parsed_data["savingsTips"], list) or \
           not all(isinstance(item, dict) and "id" in item and "text" in item for item in parsed_data["savingsTips"]):
            print(f"Validation failed (savings_tips): Response '{parsed_data}' invalid structure.")
            return JsonRpcResponse(id=request.id, error={"code": -32000, "message": "Gemini response structure invalid (savings_tips)."})
        
        return JsonRpcResponse(id=request.id, result=JsonRpcResponseResult(savingsTips=parsed_data["savingsTips"]))

    except HTTPException: # Specifically re-raise HTTPExceptions
        raise
    except Exception as e: # Catch other unexpected errors
        import traceback
        print(f"Error in generate_savings_tips_agent: {str(e)}\n{traceback.format_exc()}")
        return JsonRpcResponse(id=request.id, error={"code": -32000, "message": f"Server error in savings tips: {str(e)}"})


# --- Main Expense Processing Flow (Endpoint called by Frontend) ---
@router_agents.post("/expense/process", response_model=ProcessExpenseResponse)
async def process_expense(expense: Expense, gemini_client: genai.GenerativeModel = Depends(get_gemini_client)):
    try:
        add_expense(expense) 
        all_expenses = get_expenses()
        total_expenses_value = sum(exp['amount'] for exp in all_expenses)
        
        city_for_context = "Seattle" 
        summary_for_budget = {
            "category": expense.category,
            "current_expense_amount": expense.amount,
            "total_expenses": total_expenses_value,
            "city": city_for_context 
        }
        
        budget_agent_url = "http://localhost:8000/agent/recommendation/generate"
        budget_req_id = 1 
        budget_response_full = await send_jsonrpc_request(
            url=budget_agent_url,
            method="generate_recommendation",
            params={"summary": summary_for_budget},
            request_id=budget_req_id
        )

        budget_recommendations_list: List[str] = []
        if budget_response_full and not budget_response_full.get("error"):
            parsed_budget_response = JsonRpcResponse(**budget_response_full)
            if parsed_budget_response.result and parsed_budget_response.result.recommendations:
                budget_recommendations_list = parsed_budget_response.result.recommendations
        elif budget_response_full and budget_response_full.get("error"):
             print(f"Error from budget recommendation agent: {budget_response_full.get('error')}")


        cost_data = await fetch_cost_of_living(city_for_context)
        grocery_index_value = cost_data.grocery_index if cost_data else 100

        summary_for_savings = {
            "category": expense.category,
            "current_expense_amount": expense.amount,
            "city": city_for_context,
            "grocery_index": grocery_index_value,
            "budget_recommendations": budget_recommendations_list
        }

        savings_agent_url = "http://localhost:8000/agent/savings/generate"
        savings_req_id = budget_req_id + 1
        
        savings_response_full = await send_jsonrpc_request(
            url=savings_agent_url,
            method="generate_savings_tips",
            params=summary_for_savings,
            request_id=savings_req_id
        )

        savings_tips_list: List[Dict[str, str]] = []
        if savings_response_full and not savings_response_full.get("error"):
            parsed_savings_response = JsonRpcResponse(**savings_response_full)
            if parsed_savings_response.result and parsed_savings_response.result.savingsTips:
                savings_tips_list = parsed_savings_response.result.savingsTips
        elif savings_response_full and savings_response_full.get("error"):
            print(f"Error from savings tips agent: {savings_response_full.get('error')}")
        
        final_combined_result = JsonRpcResponseResult(
            recommendations=budget_recommendations_list,
            savingsTips=savings_tips_list
        )
        
        return ProcessExpenseResponse(
            message="Expense processed. Check recommendations and tips.", 
            recommendation=final_combined_result
        )

    except HTTPException: # Specifically re-raise HTTPExceptions
        raise 
    except Exception as e: # Catch other unexpected errors
        import traceback
        print(f"Error in process_expense: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error in expense processing: {str(e)}")


# --- Endpoint to Track a Savings Goal ---
@router_api.post("/track_goal", status_code=201)
async def track_savings_goal(payload: TrackGoalPayload):
    try:
        success = add_tracked_goal(tip_id=payload.tip_id, tip_text=payload.tip_text)
        if success:
            return {"message": "Savings goal is now being tracked."}
        else:
            # This specific condition (duplicate or DB error handled by add_tracked_goal returning False)
            # should result in a 409.
            raise HTTPException(status_code=409, detail="Goal may already be tracked or a database error occurred preventing tracking.")
    except HTTPException: # ADDED: Specifically catch and re-raise HTTPExceptions
        raise
    except Exception as e: # Catch other, truly unexpected errors
        print(f"Unexpected error tracking savings goal: {str(e)}")
        import traceback
        traceback.print_exc() # This will print the full traceback for unexpected errors
        raise HTTPException(status_code=500, detail="An unexpected server error occurred while trying to track the goal.")

# Note for main.py:
# You will need to import and include both routers if you use this structure:
# from agents import router_agents, router_api
# app.include_router(router_agents)
# app.include_router(router_api)

