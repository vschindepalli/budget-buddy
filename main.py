from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import init_db
import mcp_tools # This imports mcp_tools.py, and you use mcp_tools.router

# Updated import from agents.py to get both routers
from agents import router_agents, router_api 

load_dotenv()

app = FastAPI(title="Budget Buddy Backend")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update to specific frontend URL in production (e.g., "http://localhost:5173")
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()  # Initialize SQLite database
    print("Database initialization complete.")

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "OK", "message": "Backend is running"}

# Include routers
app.include_router(mcp_tools.router) # For /mcp/... routes
app.include_router(router_agents)    # For /agent/... routes
app.include_router(router_api)       # For /api/... routes (e.g., /api/track_goal)

# To run this app:
# 1. Ensure your venv is activated.
# 2. Run: uvicorn main:app --reload
