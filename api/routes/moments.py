from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
import hashlib
from api.database import get_db
from api.auth import get_current_user


def compute_passage_key(book_id: str, passage: str) -> str:
    """Stable hash for matching the same passage across users."""
    text_key = str(book_id) + "|" + passage[:200].lower().strip()
    return hashlib.sha256(text_key.encode()).hexdigest()[:32]

router = APIRouter(prefix="/moments", tags=["moments"])


def row_to_dict(row):
    return {k: str(v) if hasattr(v, 'hex') else v for k, v in dict(row).items()}


class CreateMomentRequest(BaseModel):
    passage: str
    book_title: str
    chapter: Optional[str] = None
    page_num: Optional[int] = None
    interpretation: Optional[str] = None


class UpdateMomentRequest(BaseModel):
    interpretation: str


async def get_or_create_book(db: AsyncSession, title: str) -> str:
    """Look up book by title; create a stub if not found. Returns book_id as str."""
    result = await db.execute(
        text("SELECT id FROM books WHERE lower(title) = lower(:title)"),
        {"title": title}
    )
    row = result.mappings().fetchone()
    if row:
        return str(row["id"])
    # Create stub book
    result = await db.execute(
        text("INSERT INTO books (title, author) VALUES (:title, 'Unknown') RETURNING id"),
        {"title": title}
    )
    await db.commit()
    return str(result.mappings().fetchone()["id"])


@router.get("")
async def get_moments(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns all non-deleted moments for the current user."""
    result = await db.execute(
        text("""
            SELECT m.id, m.passage, m.chapter, m.page_num, m.interpretation,
                   m.created_at, b.title as book_title
            FROM moments m
            JOIN books b ON b.id = m.book_id
            JOIN users u ON u.id = m.user_id
            WHERE u.firebase_uid = :uid AND m.is_deleted = false
            ORDER BY m.created_at DESC
        """),
        {"uid": current_user["uid"]}
    )
    rows = result.mappings().fetchall()
    return [row_to_dict(r) for r in rows]


@router.post("")
async def create_moment(
    body: CreateMomentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a snipped moment to the DB."""
    # Get user_id
    result = await db.execute(
        text("SELECT id FROM users WHERE firebase_uid = :uid"),
        {"uid": current_user["uid"]}
    )
    user_row = result.mappings().fetchone()
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = str(user_row["id"])

    book_id = await get_or_create_book(db, body.book_title)

    passage_key = compute_passage_key(book_id, body.passage)

    result = await db.execute(
        text("""
            INSERT INTO moments (user_id, book_id, passage, chapter, page_num, interpretation, passage_key)
            VALUES (:user_id, :book_id, :passage, :chapter, :page_num, :interpretation, :passage_key)
            RETURNING id, passage, chapter, page_num, interpretation, created_at
        """),
        {
            "user_id": user_id,
            "book_id": book_id,
            "passage": body.passage,
            "chapter": body.chapter,
            "page_num": body.page_num,
            "interpretation": body.interpretation,
            "passage_key": passage_key,
        }
    )
    await db.commit()
    row = result.mappings().fetchone()
    return {**row_to_dict(row), "book_title": body.book_title}


@router.patch("/{moment_id}")
async def update_moment(
    moment_id: str,
    body: UpdateMomentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the interpretation of a moment."""
    result = await db.execute(
        text("""
            UPDATE moments SET interpretation = :interp, interpretation_updated_at = now()
            WHERE id = :moment_id
              AND user_id = (SELECT id FROM users WHERE firebase_uid = :uid)
              AND is_deleted = false
            RETURNING id
        """),
        {"interp": body.interpretation, "moment_id": moment_id, "uid": current_user["uid"]}
    )
    await db.commit()
    if not result.mappings().fetchone():
        raise HTTPException(status_code=404, detail="Moment not found")
    return {"ok": True}


@router.delete("/{moment_id}")
async def delete_moment(
    moment_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a moment."""
    result = await db.execute(
        text("""
            UPDATE moments SET is_deleted = true
            WHERE id = :moment_id
              AND user_id = (SELECT id FROM users WHERE firebase_uid = :uid)
            RETURNING id
        """),
        {"moment_id": moment_id, "uid": current_user["uid"]}
    )
    await db.commit()
    if not result.mappings().fetchone():
        raise HTTPException(status_code=404, detail="Moment not found")
    return {"ok": True}
