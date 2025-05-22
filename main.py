from fastapi import FastAPI

app = FastAPI(title="Budget Buddy Backend")

@app.get("/health")
async def health_check():
    return {"status": "OK", "message": "Backend is running"}