# cache.py
import sqlite3
import json
import os

DB_PATH = "./cached_model/rankings_cache.db" 

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS rankings (
            word TEXT PRIMARY KEY,
            data TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def get_cached_rankings(word: str):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT data FROM rankings WHERE word = ?", (word,)
    ).fetchone()
    conn.close()
    return json.loads(row[0]) if row else None

def save_rankings(word: str, rankings: list):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT OR REPLACE INTO rankings (word, data) VALUES (?, ?)",
        (word, json.dumps(rankings))
    )
    conn.commit()
    conn.close()
