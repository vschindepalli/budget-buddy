from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
import mcp_tools

app = FastAPI(title="Budget Buddy Backend")

# Allow CORS for frontend (to be updated with frontend URL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update to specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()  # Initialize SQLite database on startup

@app.get("/health")
async def health_check():
    return {"status": "OK", "message": "Backend is running"}

# Include MCP tools
app.include_router(mcp_tools.router)