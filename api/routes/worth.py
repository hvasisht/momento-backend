import asyncio
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from google.cloud import bigquery
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from api.auth import get_current_user
from api.database import get_db
from api.bigquery import BQ_PROJECT, BQ_DATASET, BQ_TABLE_COMPAT, BQ_TABLE_USERS, get_bq_client
from api.hashing import make_user_id

PIPELINE_BASE = os.getenv("PIPELINE_BASE_URL", "https://moment-pipeline-329431711809.us-central1.run.app")

router = APIRouter()


@router.get("/worth/matches")
async def get_worth_matches(
    book_id: str = Query(None, description="Filter by book name"),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT id, first_name, last_name FROM users WHERE firebase_uid = :uid"),
        {"uid": user["uid"]},
    )
    row = result.mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    user_uuid = str(row["id"])

    compat_table = f"`{BQ_PROJECT}.{BQ_DATASET}.{BQ_TABLE_COMPAT}`"
    users_table  = f"`{BQ_PROJECT}.{BQ_DATASET}.{BQ_TABLE_USERS}`"
    book_filter  = "AND c.book_id = @book_id" if book_id else ""

    # user_b = Cloud SQL UUID (STRING), user_a = matched synthetic user (INT64 farmhash)
    compat_query = f"""
        SELECT
            c.user_a AS matched_user_id,
            c.book_id,
            c.passage_id,
            c.confidence,
            c.verdict,
            c.dominant_think,
            c.think_D,
            c.think_C,
            c.think_R,
            c.dominant_feel,
            c.feel_D,
            c.feel_C,
            c.feel_R,
            c.think_rationale,
            c.feel_rationale
        FROM {compat_table} c
        WHERE c.user_b = @user_uuid
        {book_filter}
        ORDER BY c.confidence DESC
        LIMIT 50
    """

    # Fetch all synthetic user profiles for Python-side join
    users_query = f"""
        SELECT user_id, first_name, last_name, gender, readername
        FROM {users_table}
    """

    params = [bigquery.ScalarQueryParameter("user_uuid", "STRING", user_uuid)]
    if book_id:
        params.append(bigquery.ScalarQueryParameter("book_id", "STRING", book_id))

    client = get_bq_client()

    try:
        compat_rows, user_rows = await asyncio.gather(
            asyncio.to_thread(
                lambda: list(client.query(compat_query, job_config=bigquery.QueryJobConfig(query_parameters=params)).result())
            ),
            asyncio.to_thread(
                lambda: list(client.query(users_query).result())
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BigQuery error: {str(e)}")

    # Build farmhash → profile lookup (user_a INT64 = make_user_id(first_name + last_name))
    profile_by_hash = {}
    for u in user_rows:
        name = f"{u['first_name']} {u['last_name']}"
        h = make_user_id(name)
        profile_by_hash[h] = dict(u.items())

    results = []
    for r in compat_rows:
        row_dict = dict(r.items())
        matched_id = row_dict.get("matched_user_id")
        profile = profile_by_hash.get(matched_id, {})
        row_dict["character_name"] = f"{profile.get('first_name', 'Unknown')} {profile.get('last_name', '')}".strip()
        row_dict["gender"] = profile.get("gender")
        row_dict["age"] = None
        row_dict["profession"] = profile.get("readername")
        results.append(row_dict)

    return results


@router.get("/worth/profile/{bq_user_id}")
async def get_worth_profile(
    bq_user_id: int,
    user=Depends(get_current_user),
):
    users_table = f"`{BQ_PROJECT}.{BQ_DATASET}.{BQ_TABLE_USERS}`"
    query = f"SELECT * FROM {users_table} WHERE user_id = @user_id LIMIT 1"

    client = get_bq_client()
    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter("user_id", "INT64", bq_user_id)]
    )

    try:
        rows = await asyncio.to_thread(
            lambda: list(client.query(query, job_config=job_config).result())
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BigQuery error: {str(e)}")

    if not rows:
        raise HTTPException(status_code=404, detail="Profile not found")

    return dict(rows[0].items())


@router.get("/worth/rankings")
async def get_worth_rankings(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch ranked compatible readers from the pipeline (triggers BT model refit for this user)."""
    result = await db.execute(
        text("SELECT id FROM users WHERE firebase_uid = :uid"),
        {"uid": user["uid"]},
    )
    row = result.mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    user_uuid = str(row["id"])

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{PIPELINE_BASE}/rankings/{user_uuid}")
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Rankings unavailable: {str(e)}")
