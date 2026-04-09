from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.auth import get_current_user
from core.database import get_db
import sqlalchemy

router = APIRouter()


class CreateUserRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    readername: str


@router.post("/users/me", status_code=201)
async def create_user(
    body: CreateUserRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    firebase_uid = user["uid"]
    try:
        db.execute(
            sqlalchemy.text("""
                INSERT INTO users (firebase_uid, first_name, last_name, email, readername)
                VALUES (:uid, :first_name, :last_name, :email, :readername)
                ON CONFLICT (firebase_uid) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name  = EXCLUDED.last_name,
                    email      = EXCLUDED.email,
                    readername = EXCLUDED.readername
            """),
            {
                "uid": firebase_uid,
                "first_name": body.first_name,
                "last_name": body.last_name,
                "email": body.email,
                "readername": body.readername,
            },
        )
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "ok"}


@router.get("/users/me")
async def get_user(user=Depends(get_current_user), db=Depends(get_db)):
    firebase_uid = user["uid"]
    result = db.execute(
        sqlalchemy.text("""
            SELECT
                u.firebase_uid,
                u.first_name,
                u.last_name,
                u.email,
                u.readername,
                u.created_at,
                (cl.created_at IS NOT NULL) AS consent_given,
                cl.created_at AS consent_at
            FROM users u
            LEFT JOIN LATERAL (
                SELECT created_at FROM consent_logs
                WHERE firebase_uid = u.firebase_uid
                ORDER BY created_at DESC
                LIMIT 1
            ) cl ON true
            WHERE u.firebase_uid = :uid
        """),
        {"uid": firebase_uid},
    ).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(result._mapping)


@router.post("/users/consent", status_code=201)
async def log_consent(user=Depends(get_current_user), db=Depends(get_db)):
    firebase_uid = user["uid"]
    db.execute(
        sqlalchemy.text("""
            INSERT INTO consent_logs (firebase_uid, created_at)
            VALUES (:uid, NOW())
        """),
        {"uid": firebase_uid},
    )
    db.commit()
    return {"status": "ok"}


@router.get("/users/readername/{name}/available")
async def check_readername(name: str, db=Depends(get_db)):
    """Public endpoint — no auth required."""
    result = db.execute(
        sqlalchemy.text("SELECT 1 FROM users WHERE readername = :name"),
        {"name": name},
    ).fetchone()
    return {"available": result is None}
