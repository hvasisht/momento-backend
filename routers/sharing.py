import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.auth import get_current_user
from core.database import get_db
import sqlalchemy

router = APIRouter()


# ── Close Readers ────────────────────────────────────────────────────────────

@router.get("/sharing/close-readers")
async def get_close_readers(user=Depends(get_current_user), db=Depends(get_db)):
    firebase_uid = user["uid"]
    results = db.execute(
        sqlalchemy.text("""
            SELECT cr.*, u.first_name, u.last_name, u.readername, u.email
            FROM close_readers cr
            JOIN users u ON u.firebase_uid = cr.reader_firebase_uid
            WHERE cr.firebase_uid = :uid
            ORDER BY cr.created_at DESC
        """),
        {"uid": firebase_uid},
    ).fetchall()
    return [dict(r._mapping) for r in results]


# ── Waves ─────────────────────────────────────────────────────────────────────

class WaveRequest(BaseModel):
    target_firebase_uid: str


@router.post("/sharing/waves", status_code=201)
async def wave_to_reader(
    body: WaveRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    firebase_uid = user["uid"]
    wave_id = str(uuid.uuid4())
    try:
        db.execute(
            sqlalchemy.text("""
                INSERT INTO reader_waves (id, from_firebase_uid, to_firebase_uid, created_at)
                VALUES (:id, :from_uid, :to_uid, NOW())
                ON CONFLICT DO NOTHING
            """),
            {"id": wave_id, "from_uid": firebase_uid, "to_uid": body.target_firebase_uid},
        )
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"id": wave_id, "status": "ok"}


# ── Whisper Threads ───────────────────────────────────────────────────────────

class CreateThreadRequest(BaseModel):
    target_firebase_uid: str


@router.get("/sharing/threads")
async def get_threads(user=Depends(get_current_user), db=Depends(get_db)):
    firebase_uid = user["uid"]
    results = db.execute(
        sqlalchemy.text("""
            SELECT
                wt.id,
                wt.created_at,
                wt.updated_at,
                u.firebase_uid  AS other_uid,
                u.first_name,
                u.last_name,
                u.readername,
                (
                    SELECT COUNT(*) FROM whisper_messages wm
                    WHERE wm.thread_id = wt.id
                      AND wm.is_read   = false
                      AND wm.sender_firebase_uid != :uid
                ) AS unread_count,
                (
                    SELECT content FROM whisper_messages wm
                    WHERE wm.thread_id = wt.id
                    ORDER BY wm.created_at DESC LIMIT 1
                ) AS last_message
            FROM whisper_threads wt
            JOIN users u ON u.firebase_uid =
                CASE WHEN wt.user_a_firebase_uid = :uid
                     THEN wt.user_b_firebase_uid
                     ELSE wt.user_a_firebase_uid END
            WHERE wt.user_a_firebase_uid = :uid
               OR wt.user_b_firebase_uid = :uid
            ORDER BY wt.updated_at DESC
        """),
        {"uid": firebase_uid},
    ).fetchall()
    return [dict(r._mapping) for r in results]


@router.post("/sharing/threads", status_code=201)
async def create_thread(
    body: CreateThreadRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    firebase_uid = user["uid"]
    # Return existing thread if one already exists between these two users
    existing = db.execute(
        sqlalchemy.text("""
            SELECT id FROM whisper_threads
            WHERE (user_a_firebase_uid = :uid AND user_b_firebase_uid = :target)
               OR (user_a_firebase_uid = :target AND user_b_firebase_uid = :uid)
        """),
        {"uid": firebase_uid, "target": body.target_firebase_uid},
    ).fetchone()
    if existing:
        return {"id": existing.id, "status": "existing"}

    thread_id = str(uuid.uuid4())
    db.execute(
        sqlalchemy.text("""
            INSERT INTO whisper_threads
                (id, user_a_firebase_uid, user_b_firebase_uid, created_at, updated_at)
            VALUES (:id, :uid, :target, NOW(), NOW())
        """),
        {"id": thread_id, "uid": firebase_uid, "target": body.target_firebase_uid},
    )
    db.commit()
    return {"id": thread_id, "status": "created"}


# ── Messages ──────────────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    content: str
    moment_id: Optional[str] = None


@router.get("/sharing/threads/{thread_id}/messages")
async def get_messages(
    thread_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    firebase_uid = user["uid"]
    thread = db.execute(
        sqlalchemy.text("""
            SELECT id FROM whisper_threads
            WHERE id = :id
              AND (user_a_firebase_uid = :uid OR user_b_firebase_uid = :uid)
        """),
        {"id": thread_id, "uid": firebase_uid},
    ).fetchone()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    messages = db.execute(
        sqlalchemy.text("""
            SELECT wm.*, u.first_name, u.last_name, u.readername
            FROM whisper_messages wm
            JOIN users u ON u.firebase_uid = wm.sender_firebase_uid
            WHERE wm.thread_id = :thread_id
            ORDER BY wm.created_at ASC
        """),
        {"thread_id": thread_id},
    ).fetchall()

    # Mark messages from the other user as read
    db.execute(
        sqlalchemy.text("""
            UPDATE whisper_messages
            SET is_read = true
            WHERE thread_id = :thread_id
              AND sender_firebase_uid != :uid
              AND is_read = false
        """),
        {"thread_id": thread_id, "uid": firebase_uid},
    )
    db.commit()

    return [dict(m._mapping) for m in messages]


@router.post("/sharing/threads/{thread_id}/messages", status_code=201)
async def send_message(
    thread_id: str,
    body: SendMessageRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    firebase_uid = user["uid"]
    thread = db.execute(
        sqlalchemy.text("""
            SELECT id FROM whisper_threads
            WHERE id = :id
              AND (user_a_firebase_uid = :uid OR user_b_firebase_uid = :uid)
        """),
        {"id": thread_id, "uid": firebase_uid},
    ).fetchone()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    message_id = str(uuid.uuid4())
    db.execute(
        sqlalchemy.text("""
            INSERT INTO whisper_messages
                (id, thread_id, sender_firebase_uid, content, moment_id, is_read, created_at)
            VALUES
                (:id, :thread_id, :sender, :content, :moment_id, false, NOW())
        """),
        {
            "id": message_id,
            "thread_id": thread_id,
            "sender": firebase_uid,
            "content": body.content,
            "moment_id": body.moment_id,
        },
    )
    db.execute(
        sqlalchemy.text("UPDATE whisper_threads SET updated_at = NOW() WHERE id = :id"),
        {"id": thread_id},
    )
    db.commit()
    return {"id": message_id, "status": "sent"}
