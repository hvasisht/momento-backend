import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.auth import get_current_user
from core.database import get_db
from core.hashing import compute_passage_key
import sqlalchemy

router = APIRouter()


class CreateMomentRequest(BaseModel):
    book_id: str
    book_title: str
    passage: str
    interpretation: Optional[str] = None
    chapter: Optional[str] = None
    page: Optional[int] = None


class UpdateMomentRequest(BaseModel):
    interpretation: Optional[str] = None


@router.post("/moments", status_code=201)
async def create_moment(
    body: CreateMomentRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    firebase_uid = user["uid"]
    bare_book_id = body.book_id.replace("gut_", "")
    passage_key = compute_passage_key(bare_book_id, body.passage)
    moment_id = str(uuid.uuid4())
    try:
        db.execute(
            sqlalchemy.text("""
                INSERT INTO moments
                    (id, firebase_uid, book_id, book_title, passage, passage_key,
                     interpretation, chapter, page, is_deleted, created_at)
                VALUES
                    (:id, :uid, :book_id, :book_title, :passage, :passage_key,
                     :interpretation, :chapter, :page, false, NOW())
            """),
            {
                "id": moment_id,
                "uid": firebase_uid,
                "book_id": body.book_id,
                "book_title": body.book_title,
                "passage": body.passage,
                "passage_key": passage_key,
                "interpretation": body.interpretation,
                "chapter": body.chapter,
                "page": body.page,
            },
        )
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"id": moment_id, "passage_key": passage_key}


@router.get("/moments")
async def get_moments(user=Depends(get_current_user), db=Depends(get_db)):
    firebase_uid = user["uid"]
    results = db.execute(
        sqlalchemy.text("""
            SELECT * FROM moments
            WHERE firebase_uid = :uid AND is_deleted = false
            ORDER BY created_at DESC
        """),
        {"uid": firebase_uid},
    ).fetchall()
    return [dict(r._mapping) for r in results]


@router.patch("/moments/{moment_id}")
async def update_moment(
    moment_id: str,
    body: UpdateMomentRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    firebase_uid = user["uid"]
    if body.interpretation is not None:
        db.execute(
            sqlalchemy.text("""
                UPDATE moments SET interpretation = :interpretation
                WHERE id = :id AND firebase_uid = :uid AND is_deleted = false
            """),
            {"interpretation": body.interpretation, "id": moment_id, "uid": firebase_uid},
        )
        db.commit()
    return {"status": "ok"}


@router.delete("/moments/{moment_id}")
async def delete_moment(
    moment_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    firebase_uid = user["uid"]
    db.execute(
        sqlalchemy.text("""
            UPDATE moments SET is_deleted = true
            WHERE id = :id AND firebase_uid = :uid
        """),
        {"id": moment_id, "uid": firebase_uid},
    )
    db.commit()
    return {"status": "ok"}
