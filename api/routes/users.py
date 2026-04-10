from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
from firebase_admin import auth as firebase_auth
from api.database import get_db
from api.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


def row_to_dict(row):
    """Convert a DB row to dict, casting UUIDs to strings."""
    return {k: str(v) if hasattr(v, 'hex') else v for k, v in dict(row).items()}


class CreateUserRequest(BaseModel):
    first_name: str
    last_name: str
    readername: str
    email: str


class UserResponse(BaseModel):
    id: str
    firebase_uid: str
    first_name: str
    last_name: str
    email: str
    readername: str
    bio: Optional[str]
    photo_url: Optional[str]
    dark_mode: bool
    moments_layout_mode: str
    passage_first: bool
    onboarding_complete: bool
    consent_given: bool
    consent_at: Optional[str] = None
    last_hero_gut_id: Optional[str] = None
    guide_book_gut_id: Optional[str] = None
    reading_state: Optional[Dict[str, Any]] = {}
    last_captured_type: Optional[str] = None
    last_captured_shelf_id: Optional[str] = None
    shelf: Optional[list] = []


class UpdatePreferencesRequest(BaseModel):
    last_hero_gut_id: Optional[str] = None
    guide_book_gut_id: Optional[str] = None
    reading_state_update: Optional[Dict[str, Any]] = None  # {gut_id: {scroll_top, pg}}
    consent_given: Optional[bool] = None
    consent_at: Optional[str] = None  # UTC ISO 8601 e.g. 2026-04-01T14:30:00Z
    last_captured_type: Optional[str] = None
    last_captured_shelf_id: Optional[str] = None


class ShelfBookRequest(BaseModel):
    gut_id: str
    title: str
    author: Optional[str] = None
    cover_url: Optional[str] = None


async def get_user_shelf(db: AsyncSession, user_id: str) -> list:
    result = await db.execute(
        text("SELECT gut_id, title, author, cover_url FROM user_shelf WHERE user_id = :uid ORDER BY added_at ASC"),
        {"uid": user_id}
    )
    return [dict(r) for r in result.mappings().fetchall()]


@router.get("/readername/{name}/available")
async def check_readername_available(name: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint — no auth required. Check readername availability before account creation."""
    result = await db.execute(
        text("SELECT 1 FROM users WHERE lower(readername) = lower(:name)"),
        {"name": name}
    )
    taken = result.fetchone() is not None
    return {"available": not taken}


@router.post("/me", response_model=UserResponse)
async def create_or_get_user(
    body: CreateUserRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Called after Firebase sign-in. Creates user if new, returns existing if not."""
    firebase_uid = current_user["uid"]
    email = current_user.get("email", body.email)

    result = await db.execute(
        text("SELECT * FROM users WHERE firebase_uid = :uid"),
        {"uid": firebase_uid}
    )
    row = result.mappings().fetchone()
    if row:
        d = row_to_dict(row)
        d["shelf"] = await get_user_shelf(db, d["id"])
        return d

    result = await db.execute(
        text("SELECT * FROM users WHERE email = :email"),
        {"email": email}
    )
    row = result.mappings().fetchone()
    if row:
        result = await db.execute(
            text("UPDATE users SET firebase_uid = :uid WHERE email = :email RETURNING *"),
            {"uid": firebase_uid, "email": email}
        )
        await db.commit()
        d = row_to_dict(result.mappings().fetchone())
        d["shelf"] = await get_user_shelf(db, d["id"])
        return d

    try:
        result = await db.execute(
            text("""
                INSERT INTO users (firebase_uid, first_name, last_name, email, readername)
                VALUES (:uid, :first_name, :last_name, :email, :readername)
                RETURNING *
            """),
            {
                "uid": firebase_uid,
                "first_name": body.first_name,
                "last_name": body.last_name,
                "email": email,
                "readername": body.readername,
            }
        )
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        if "readername" in str(e.orig):
            raise HTTPException(status_code=409, detail="Readername already taken")
        if "email" in str(e.orig):
            raise HTTPException(status_code=409, detail="Email already registered")
        raise HTTPException(status_code=409, detail="Account already exists")
    d = row_to_dict(result.mappings().fetchone())
    d["shelf"] = []
    return d


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the current authenticated user's profile including preferences and shelf."""
    firebase_uid = current_user["uid"]
    result = await db.execute(
        text("SELECT * FROM users WHERE firebase_uid = :uid"),
        {"uid": firebase_uid}
    )
    row = result.mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    d = row_to_dict(row)
    d["shelf"] = await get_user_shelf(db, d["id"])
    return d


@router.patch("/me/preferences")
async def update_preferences(
    body: UpdatePreferencesRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update hero book, guide book, or scroll position for a specific book."""
    result = await db.execute(
        text("SELECT id, reading_state FROM users WHERE firebase_uid = :uid"),
        {"uid": current_user["uid"]}
    )
    row = result.mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = str(row["id"])

    updates = {}
    params = {"uid": current_user["uid"]}

    if body.last_hero_gut_id is not None:
        updates["last_hero_gut_id = :hero"] = None
        params["hero"] = body.last_hero_gut_id

    if body.guide_book_gut_id is not None:
        updates["guide_book_gut_id = :guide"] = None
        params["guide"] = body.guide_book_gut_id

    if body.reading_state_update is not None:
        # Merge new scroll entry into existing reading_state
        current_state = row["reading_state"] or {}
        if isinstance(current_state, str):
            current_state = json.loads(current_state)
        current_state.update(body.reading_state_update)
        updates["reading_state = :rstate"] = None
        params["rstate"] = json.dumps(current_state)

    if body.consent_given is not None:
        updates["consent_given = :consent"] = None
        params["consent"] = body.consent_given

    if body.consent_at is not None:
        updates["consent_at = :consent_at"] = None
        params["consent_at"] = body.consent_at

    if body.last_captured_type is not None:
        updates["last_captured_type = :lct"] = None
        params["lct"] = body.last_captured_type

    if body.last_captured_shelf_id is not None:
        updates["last_captured_shelf_id = :lcsid"] = None
        params["lcsid"] = body.last_captured_shelf_id

    if updates:
        set_clause = ", ".join(updates.keys())
        try:
            await db.execute(
                text(f"UPDATE users SET {set_clause} WHERE firebase_uid = :uid"),
                params
            )
            await db.commit()
        except Exception as e:
            await db.rollback()
            # If a column doesn't exist yet, fall back to only the known-safe columns
            safe_keys = [k for k in updates.keys() if any(
                k.startswith(c) for c in ("consent_given", "consent_at")
            )]
            if safe_keys:
                safe_params = {k: v for k, v in params.items()
                               if k in ("uid", "consent", "consent_at")}
                await db.execute(
                    text(f"UPDATE users SET {', '.join(safe_keys)} WHERE firebase_uid = :uid"),
                    safe_params
                )
                await db.commit()

    return {"ok": True}


@router.get("/me/shelf")
async def get_shelf(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's custom shelf books."""
    result = await db.execute(
        text("SELECT id FROM users WHERE firebase_uid = :uid"),
        {"uid": current_user["uid"]}
    )
    row = result.mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return await get_user_shelf(db, str(row["id"]))


@router.post("/me/shelf")
async def add_to_shelf(
    body: ShelfBookRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a book to the user's custom shelf (max 2)."""
    result = await db.execute(
        text("SELECT id FROM users WHERE firebase_uid = :uid"),
        {"uid": current_user["uid"]}
    )
    row = result.mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = str(row["id"])

    # Check limit
    count_result = await db.execute(
        text("SELECT COUNT(*) as cnt FROM user_shelf WHERE user_id = :uid"),
        {"uid": user_id}
    )
    if count_result.mappings().fetchone()["cnt"] >= 2:
        raise HTTPException(status_code=400, detail="Shelf limit reached")

    await db.execute(
        text("""
            INSERT INTO user_shelf (user_id, gut_id, title, author, cover_url)
            VALUES (:uid, :gut_id, :title, :author, :cover_url)
            ON CONFLICT (user_id, gut_id) DO NOTHING
        """),
        {"uid": user_id, "gut_id": body.gut_id, "title": body.title,
         "author": body.author, "cover_url": body.cover_url}
    )
    await db.commit()
    return {"ok": True}


@router.delete("/me/shelf/{gut_id}")
async def remove_from_shelf(
    gut_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a book from the user's custom shelf."""
    result = await db.execute(
        text("SELECT id FROM users WHERE firebase_uid = :uid"),
        {"uid": current_user["uid"]}
    )
    row = result.mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = str(row["id"])

    await db.execute(
        text("DELETE FROM user_shelf WHERE user_id = :uid AND gut_id = :gut_id"),
        {"uid": user_id, "gut_id": gut_id}
    )
    await db.commit()
    return {"ok": True}


@router.delete("/me")
async def delete_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete user account from Cloud SQL and Firebase (GDPR right to erasure)."""
    firebase_uid = current_user["uid"]
    # Delete from Cloud SQL — cascades to moments, user_shelf, etc.
    await db.execute(
        text("DELETE FROM users WHERE firebase_uid = :uid"),
        {"uid": firebase_uid}
    )
    await db.commit()
    # Delete from Firebase Auth
    try:
        firebase_auth.delete_user(firebase_uid)
    except Exception:
        pass  # Firebase deletion best-effort — DB row is already gone
    return {"ok": True}
