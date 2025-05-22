from pydantic import BaseModel

class Expense(BaseModel):
    category: str
    amount: float
    date: str  # Format: YYYY-MM-DD

class CostOfLiving(BaseModel):
    city: str
    grocery_index: float