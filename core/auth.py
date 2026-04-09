import os
import firebase_admin
from firebase_admin import auth
from fastapi import HTTPException, Header

if not firebase_admin._apps:
    firebase_admin.initialize_app()


async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid auth header")
    token = authorization[7:]
    try:
        return auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
