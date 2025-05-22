from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import aiohttp
import google.generativeai as genai # Using the google-generativeai library
import os
import json
from models import Expense # Assuming models.py is in the same directory or accessible
from mcp_tools import fetch_cost_of_living # Assuming mcp_tools.py is accessible
from database import add_expense, get_expenses # Assuming database.py is accessible

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

# Gemini client dependency
async def get_gemini_client():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        # In a real app, you might raise an HTTPException or handle this more gracefully
        raise ValueError("GOOGLE_API_KEY environment variable not set")
    genai.configure(api_key=api_key)
    # Use the precise model name you found in the documentation
    return genai.GenerativeModel("gemini-2.5-flash-preview-05-20")

async def send_jsonrpc_request(url: str, method: str, params: dict, request_id: int) -> dict | None:
    async with aiohttp.ClientSession() as session:
        payload = JsonRpcRequest(method=method, params=params, id=request_id).model_dump() # Use model_dump() for Pydantic v2
        async with session.post(url, json=payload) as response:
            if response.status != 200:
                # Log the error or handle it more specifically
                error_detail = await response.text()
                print(f"Agent communication failed. Status: {response.status}, Detail: {error_detail}")
                raise HTTPException(status_code=response.status, detail=f"Agent communication failed: {error_detail}")
            
            try:
                data = await response.json()
                # Ensure the response structure matches JsonRpcResponse before parsing
                # This is a basic check; more robust validation might be needed
                if "jsonrpc" in data and "id" in data:
                    # Check if 'result' or 'error' key exists before accessing
                    return JsonRpcResponse(**data).result if data.get("result") is not None else None
                else:
                    print(f"Received unexpected JSON-RPC response structure: {data}")
                    raise HTTPException(status_code=500, detail="Invalid JSON-RPC response structure from agent")
            except json.JSONDecodeError:
                text_response = await response.text()
                print(f"Failed to decode JSON from agent response. Response text: {text_response}")
                raise HTTPException(status_code=500, detail="Failed to decode JSON from agent response")


@router.post("/expense/process")
async def process_expense(expense: Expense):
    try:
        # Store expense
        add_expense(expense) # This function should handle its own DB exceptions
        expenses = get_expenses() # This function should handle its own DB exceptions
        
        # Calculate summary
        total_expenses = sum(exp['amount'] for exp in expenses)
        summary = {
            "category": expense.category,
            "total_expenses": total_expenses,
            "city": "Seattle"  # Mocked city, update as needed for dynamic input
        }
        
        # Send to Recommendation Agent
        # Ensure the URL is correct for your local setup or deployed environment
        recommendation_agent_url = "http://localhost:8000/agent/recommendation/generate"
        result = await send_jsonrpc_request(
            url=recommendation_agent_url,
            method="generate_recommendation",
            params={"summary": summary},
            request_id=1 # Consider making request_id dynamic if needed
        )
        return {"message": "Expense processed successfully", "recommendation": result}
    except HTTPException:
        raise # Re-raise HTTPException to let FastAPI handle it
    except Exception as e:
        print(f"Error in process_expense: {str(e)}") # Log the exception
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.post("/recommendation/generate")
async def generate_recommendation(request: JsonRpcRequest, gemini_client: genai.GenerativeModel = Depends(get_gemini_client)):
    try:
        if request.method != "generate_recommendation":
            return JsonRpcResponse(
                id=request.id,
                error={"code": -32601, "message": "Method not found"}
            )
        
        summary = request.params.get("summary", {})
        category = summary.get("category", "unknown")
        total_expenses = summary.get("total_expenses", 0)
        city = summary.get("city", "Seattle") # Default city if not provided
        
        # Fetch cost of living
        cost_data = await fetch_cost_of_living(city)
        grocery_index = cost_data.grocery_index if cost_data else 100 # Default if cost_data is None
        
        # Prepare prompt for Gemini
        # This prompt is crucial. Ensure it consistently asks for the desired JSON format.
        prompt = f"""
        You are a budget advisor. A user has spent ${total_expenses:.2f} on {category} in {city}.
        The grocery cost index in {city} is {grocery_index} (where 100 is average, like New York City).
        Provide 1 to 2 concise budget recommendations to help optimize their spending, considering these details.
        Return ONLY a valid JSON object with a single key "recommendations", which should be a list of strings.
        Do not include any markdown, code block formatting (```), or any text outside this JSON object.
        The entire response must be parseable by Python's json.loads().

        Example of the exact expected output format:
        {{"recommendations": ["Consider reducing discretionary spending by 10% to save more effectively.", "Explore local markets for groceries to potentially lower costs compared to the city's average."]}}
        """
        
        # Call Gemini
        # Consider adding generation_config for more control if needed
        # e.g., generation_config=genai.types.GenerationConfig(response_mime_type="application/json")
        # However, ensure this is compatible with your library version and model.
        response = await gemini_client.generate_content_async(prompt) # Use async version
        
        # It's good practice to access response.text after checking if the response was successful
        # and if prompt_feedback indicates any issues (e.g., blocked content).
        if not response.candidates or not response.candidates[0].content.parts:
             print(f"Gemini response issue: No candidates or parts. Feedback: {response.prompt_feedback}")
             return JsonRpcResponse(
                id=request.id,
                error={"code": -32000, "message": "Failed to get valid response from Gemini model."}
            )

        response_text = response.text.strip()
        
        # Debug: Log Gemini's raw response
        print(f"Gemini raw response: {response_text}")
        
        parsed_recommendations: dict
        try:
            parsed_recommendations = json.loads(response_text)
            print(f"Parsed JSON from Gemini: {parsed_recommendations}")
        except json.JSONDecodeError as e:
            print(f"JSON parse error from Gemini response: {str(e)}. Response was: '{response_text}'")
            # Fallback or error handling if Gemini doesn't return perfect JSON
            # For now, we'll return an error. More sophisticated parsing/fixing could be added.
            return JsonRpcResponse(
                id=request.id,
                error={"code": -32000, "message": f"Invalid JSON response from Gemini: {response_text}"}
            )
        
        # Validate recommendations structure
        if not isinstance(parsed_recommendations, dict) or "recommendations" not in parsed_recommendations or \
           not isinstance(parsed_recommendations["recommendations"], list) or \
           not all(isinstance(item, str) for item in parsed_recommendations["recommendations"]):
            print(f"Validation failed: Gemini response '{parsed_recommendations}' does not match expected structure {{'recommendations': ['str', ...]}}")
            return JsonRpcResponse(
                id=request.id,
                error={"code": -32000, "message": "Gemini response structure is invalid."}
            )
        
        print(f"Final recommendations to be sent: {parsed_recommendations}")
        return JsonRpcResponse(
            id=request.id,
            result=parsed_recommendations # Send the successfully parsed and validated dict
        )
    except Exception as e:
        # Log the full exception for debugging
        import traceback
        print(f"General error in generate_recommendation: {str(e)}\n{traceback.format_exc()}")
        return JsonRpcResponse(
            id=request.id,
            error={"code": -32000, "message": f"An unexpected server error occurred: {str(e)}"}
        )
