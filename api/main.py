from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import text
import os

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from api.routes import users, moments, worth, sharing
from api.database import engine


async def run_migrations():
    """Add columns that were missing from the initial schema (best-effort, requires table owner)."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS guide_book_gut_id TEXT"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_hero_gut_id TEXT"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reading_state JSONB DEFAULT '{}'"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_captured_type TEXT"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_captured_shelf_id TEXT"))
        print("Migrations applied successfully")
    except Exception as e:
        print(f"Migration skipped (run as table owner to apply): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_migrations()
    yield


app = FastAPI(title="Momento API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(moments.router)
app.include_router(worth.router)
app.include_router(sharing.router)

@app.get("/")
async def root():
    return {"status": "Momento API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}
