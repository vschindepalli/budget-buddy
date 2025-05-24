from pydantic import BaseModel

class Expense(BaseModel):
    category: str
    amount: float
    date: str  #format: YYYY-MM-DD

class CostOfLiving(BaseModel):
    city: str
    grocery_index: float