import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from api.auth import get_current_user
from api.database import get_db

router = APIRouter()


# ── Close Readers ─────────────────────────────────────────────────────────────

@router.get("/sharing/close-readers")
async def get_close_readers(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT
                cr.id, cr.created_at,
                u_other.firebase_uid AS reader_firebase_uid,
                u_other.first_name, u_other.last_name,
                u_other.readername, u_other.email
            FROM close_readers cr
            JOIN users u_me ON (cr.user_id_a = u_me.id OR cr.user_id_b = u_me.id)
            JOIN users u_other ON (
                CASE WHEN cr.user_id_a = u_me.id THEN cr.user_id_b ELSE cr.user_id_a END
                = u_other.id
            )
            WHERE u_me.firebase_uid = :uid
            ORDER BY cr.created_at DESC
        """),
        {"uid": user["uid"]},
    )
    return [dict(r._mapping) for r in result.fetchall()]


# ── Waves ──────────────────────────────────────────────────────────────────────

class WaveRequest(BaseModel):
    target_firebase_uid: str


@router.post("/sharing/waves", status_code=201)
async def wave_to_reader(
    body: WaveRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT id, firebase_uid FROM users WHERE firebase_uid IN (:uid, :target)"),
        {"uid": user["uid"], "target": body.target_firebase_uid},
    )
    rows = {r._mapping["firebase_uid"]: str(r._mapping["id"]) for r in result.fetchall()}
    from_id = rows.get(user["uid"])
    to_id   = rows.get(body.target_firebase_uid)
    if not from_id or not to_id:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        await db.execute(
            text("""
                INSERT INTO reader_waves (id, from_user_id, to_user_id, waved_at)
                VALUES (:id, :from_id, :to_id, NOW())
                ON CONFLICT DO NOTHING
            """),
            {"id": str(uuid.uuid4()), "from_id": from_id, "to_id": to_id},
        )
        await db.commit()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "ok"}


# ── Whisper Threads ────────────────────────────────────────────────────────────

class CreateThreadRequest(BaseModel):
    target_firebase_uid: str


@router.get("/sharing/threads")
async def get_threads(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT
                wt.id,
                wt.created_at,
                wt.last_message_at AS updated_at,
                u_other.firebase_uid AS other_uid,
                u_other.first_name,
                u_other.last_name,
                u_other.readername,
                (
                    SELECT COUNT(*) FROM whisper_messages wm
                    WHERE wm.thread_id = wt.id
                      AND wm.sender_id != u_me.id
                      AND wm.read_at IS NULL
                ) AS unread_count,
                (
                    SELECT wm.body FROM whisper_messages wm
                    WHERE wm.thread_id = wt.id AND wm.type = 'whisper'
                    ORDER BY wm.created_at DESC LIMIT 1
                ) AS last_message
            FROM whisper_threads wt
            JOIN users u_me ON (wt.user_id_a = u_me.id OR wt.user_id_b = u_me.id)
            JOIN users u_other ON (
                CASE WHEN wt.user_id_a = u_me.id THEN wt.user_id_b ELSE wt.user_id_a END
                = u_other.id
            )
            WHERE u_me.firebase_uid = :uid
            ORDER BY wt.last_message_at DESC NULLS LAST
        """),
        {"uid": user["uid"]},
    )
    return [dict(r._mapping) for r in result.fetchall()]


@router.post("/sharing/threads", status_code=201)
async def create_thread(
    body: CreateThreadRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT id, firebase_uid FROM users WHERE firebase_uid IN (:uid, :target)"),
        {"uid": user["uid"], "target": body.target_firebase_uid},
    )
    rows = {r._mapping["firebase_uid"]: str(r._mapping["id"]) for r in result.fetchall()}
    my_id    = rows.get(user["uid"])
    other_id = rows.get(body.target_firebase_uid)
    if not my_id or not other_id:
        raise HTTPException(status_code=404, detail="User not found")

    # Canonical ordering (CHECK constraint requires user_id_a < user_id_b)
    id_a, id_b = (my_id, other_id) if my_id < other_id else (other_id, my_id)

    existing = await db.execute(
        text("SELECT id FROM whisper_threads WHERE user_id_a = :a AND user_id_b = :b"),
        {"a": id_a, "b": id_b},
    )
    row = existing.mappings().fetchone()
    if row:
        return {"id": str(row["id"]), "status": "existing"}

    thread_id = str(uuid.uuid4())
    await db.execute(
        text("INSERT INTO whisper_threads (id, user_id_a, user_id_b, created_at) VALUES (:id, :a, :b, NOW())"),
        {"id": thread_id, "a": id_a, "b": id_b},
    )
    await db.commit()
    return {"id": thread_id, "status": "created"}


# ── Messages ───────────────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    content: str
    moment_id: Optional[str] = None


@router.get("/sharing/threads/{thread_id}/messages")
async def get_messages(
    thread_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    me = await db.execute(
        text("SELECT id FROM users WHERE firebase_uid = :uid"), {"uid": user["uid"]}
    )
    me_row = me.mappings().fetchone()
    if not me_row:
        raise HTTPException(status_code=404, detail="User not found")
    me_id = str(me_row["id"])

    thread = await db.execute(
        text("SELECT id FROM whisper_threads WHERE id = :id AND (user_id_a = :me OR user_id_b = :me)"),
        {"id": thread_id, "me": me_id},
    )
    if not thread.mappings().fetchone():
        raise HTTPException(status_code=404, detail="Thread not found")

    messages = await db.execute(
        text("""
            SELECT wm.id, wm.thread_id, wm.type,
                   wm.body AS content, wm.moment_id,
                   wm.read_at, wm.created_at,
                   u.firebase_uid AS sender_firebase_uid,
                   u.first_name, u.last_name, u.readername
            FROM whisper_messages wm
            JOIN users u ON u.id = wm.sender_id
            WHERE wm.thread_id = :thread_id
            ORDER BY wm.created_at ASC
        """),
        {"thread_id": thread_id},
    )
    rows = messages.fetchall()

    await db.execute(
        text("UPDATE whisper_messages SET read_at = NOW() WHERE thread_id = :tid AND sender_id != :me AND read_at IS NULL"),
        {"tid": thread_id, "me": me_id},
    )
    await db.commit()

    return [dict(m._mapping) for m in rows]


@router.post("/sharing/threads/{thread_id}/messages", status_code=201)
async def send_message(
    thread_id: str,
    body: SendMessageRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    me = await db.execute(
        text("SELECT id FROM users WHERE firebase_uid = :uid"), {"uid": user["uid"]}
    )
    me_row = me.mappings().fetchone()
    if not me_row:
        raise HTTPException(status_code=404, detail="User not found")
    me_id = str(me_row["id"])

    thread = await db.execute(
        text("SELECT id FROM whisper_threads WHERE id = :id AND (user_id_a = :me OR user_id_b = :me)"),
        {"id": thread_id, "me": me_id},
    )
    if not thread.mappings().fetchone():
        raise HTTPException(status_code=404, detail="Thread not found")

    message_id = str(uuid.uuid4())
    msg_type = "moment" if body.moment_id else "whisper"
    await db.execute(
        text("""
            INSERT INTO whisper_messages (id, thread_id, sender_id, type, body, moment_id, created_at)
            VALUES (:id, :thread_id, :sender, :type, :body, :moment_id, NOW())
        """),
        {
            "id": message_id, "thread_id": thread_id, "sender": me_id,
            "type": msg_type,
            "body": body.content if msg_type == "whisper" else None,
            "moment_id": body.moment_id if msg_type == "moment" else None,
        },
    )
    await db.execute(
        text("UPDATE whisper_threads SET last_message_at = NOW() WHERE id = :id"),
        {"id": thread_id},
    )
    await db.commit()
    return {"id": message_id, "status": "sent"}
