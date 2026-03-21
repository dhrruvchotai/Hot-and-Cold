import sqlite3
import json
import os

DB_PATH = "./cached_model/rankings_cache.db"
_conn = None

def get_conn():
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    return _conn

def init_db():
    os.makedirs("./cached_model", exist_ok=True)
    get_conn().execute("""
        CREATE TABLE IF NOT EXISTS rankings (
            word TEXT PRIMARY KEY,
            data TEXT NOT NULL
        )
    """)
    get_conn().commit()

def get_cached_rankings(word: str):
    row = get_conn().execute(
        "SELECT data FROM rankings WHERE word = ?", (word,)
    ).fetchone()
    if row:
        data = json.loads(row[0])
        return data["rank_map"], data["score_map"]
    return None, None

def save_rankings(word: str, rank_map: dict, score_map: dict):
    get_conn().execute(
        "INSERT OR REPLACE INTO rankings (word, data) VALUES (?, ?)",
        (word, json.dumps({"rank_map": rank_map, "score_map": score_map}))
    )
    get_conn().commit()