from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import init_db
import mcp_tools #this imports mcp_tools.py, and you use mcp_tools.router

# updated import from agents.py to get both routers
from agents import router_agents, router_api 

load_dotenv()

app = FastAPI(title="Budget Buddy Backend")

#allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  #update to specific frontend URL in production (e.g., "http://localhost:5173")
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()  #initialize SQLite database
    print("Database initialization complete.")

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "OK", "message": "Backend is running"}

# Include routers
app.include_router(mcp_tools.router) #for /mcp/... routes
app.include_router(router_agents)    #for /agent/... routes
app.include_router(router_api)       #for /api/... routes (e.g., /api/track_goal)

# To run this app:
# 1. Ensure your venv is activated.
# 2. Run: uvicorn main:app --reload
