import sqlite3
from contextlib import contextmanager
# Assuming your models.py defines Expense.
# We might need a new Pydantic model for TrackedGoal if we pass structured data.
from models import Expense

DB_NAME = "budget_buddy.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def db_cursor(commit=False): # Added commit flag
    conn = get_db_connection()
    try:
        yield conn.cursor()
        if commit:
            conn.commit()
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        # conn.rollback() # Rollback on error if commit was intended
        raise # Re-raise the exception so the caller can handle it
    finally:
        conn.close()

def init_db():
    with db_cursor(commit=True) as cursor:
        # Expenses table (existing)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL
            )
        """)
        # NEW: Tracked Savings Goals table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tracked_savings_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tip_id TEXT UNIQUE NOT NULL, -- The unique ID from the AI-generated tip
                tip_text TEXT NOT NULL,
                status TEXT DEFAULT 'tracking', -- e.g., 'tracking', 'achieved', 'cancelled'
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
                -- user_id INTEGER, -- For future multi-user support, link to a users table
                -- FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        print("Database initialized: expenses and tracked_savings_goals tables ensured.")


def add_expense(expense: Expense):
    with db_cursor(commit=True) as cursor:
        cursor.execute(
            "INSERT INTO expenses (category, amount, date) VALUES (?, ?, ?)",
            (expense.category, expense.amount, expense.date)
        )

def get_expenses() -> list[dict]:
    with db_cursor() as cursor:
        cursor.execute("SELECT id, category, amount, date FROM expenses ORDER BY date DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

# NEW: Function to add a tracked savings goal
def add_tracked_goal(tip_id: str, tip_text: str):
    try:
        with db_cursor(commit=True) as cursor:
            cursor.execute(
                "INSERT INTO tracked_savings_goals (tip_id, tip_text) VALUES (?, ?)",
                (tip_id, tip_text)
            )
            print(f"Tracked goal added to DB: ID {tip_id}")
            return True
    except sqlite3.IntegrityError:
        # This likely means the tip_id (which is UNIQUE) already exists.
        # You might want to handle this case, e.g., update status or just ignore.
        print(f"Goal with tip_id {tip_id} already exists or another integrity error.")
        return False # Indicate failure or already exists
    except Exception as e:
        print(f"Error adding tracked goal {tip_id} to DB: {e}")
        return False


# Optional: Function to get tracked goals (for future use, e.g., display on dashboard)
def get_tracked_goals() -> list[dict]:
    with db_cursor() as cursor:
        cursor.execute("SELECT id, tip_id, tip_text, status, created_at FROM tracked_savings_goals ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

