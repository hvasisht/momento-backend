import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

if not firebase_admin._apps:
    firebase_admin.initialize_app(options={
        'projectId': os.getenv('FIREBASE_PROJECT_ID')
    })

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
