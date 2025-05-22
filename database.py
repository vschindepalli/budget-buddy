import sqlite3
from contextlib import contextmanager
from models import Expense

def get_db_connection():
    conn = sqlite3.connect("budget_buddy.db")
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def db_cursor():
    conn = get_db_connection()
    try:
        yield conn.cursor()
        conn.commit()
    finally:
        conn.close()

def init_db():
    with db_cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL
            )
        """)

def add_expense(expense: Expense):
    with db_cursor() as cursor:
        cursor.execute(
            "INSERT INTO expenses (category, amount, date) VALUES (?, ?, ?)",
            (expense.category, expense.amount, expense.date)
        )

def get_expenses():
    with db_cursor() as cursor:
        cursor.execute("SELECT id, category, amount, date FROM expenses")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]