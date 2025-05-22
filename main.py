from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from database import init_db
import mcp_tools
import agents
from dependencies import get_gemini_client

load_dotenv()

app = FastAPI(title="Budget Buddy Backend")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update to specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()  # Initialize SQLite database

@app.get("/health")
async def health_check():
    return {"status": "OK", "message": "Backend is running"}

# Include routers
app.include_router(mcp_tools.router)
app.include_router(agents.router)

# Add agent endpoints with Gemini dependency
app.add_api_route(
    "/agent/recommendation/generate",
    agents.generate_recommendation,
    methods=["POST"],
    dependencies=[Depends(get_gemini_client)]
)