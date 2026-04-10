import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query
from google.cloud import bigquery
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from api.auth import get_current_user
from api.database import get_db
from api.bigquery import BQ_PROJECT, BQ_DATASET, BQ_TABLE_COMPAT, BQ_TABLE_USERS, get_bq_client
from api.hashing import make_user_id

router = APIRouter()


@router.get("/worth/matches")
async def get_worth_matches(
    book_id: str = Query(None, description="Filter by book name"),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT first_name, last_name FROM users WHERE firebase_uid = :uid"),
        {"uid": user["uid"]},
    )
    row = result.mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    bq_user_id = make_user_id(row["first_name"] + " " + row["last_name"])

    compat_table = f"`{BQ_PROJECT}.{BQ_DATASET}.{BQ_TABLE_COMPAT}`"
    users_table  = f"`{BQ_PROJECT}.{BQ_DATASET}.{BQ_TABLE_USERS}`"
    book_filter  = "AND c.book_id = @book_id" if book_id else ""

    query = f"""
        WITH matches AS (
            SELECT
                CASE WHEN c.user_a = @user_id THEN c.user_b ELSE c.user_a END AS matched_user_id,
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
            WHERE (c.user_a = @user_id OR c.user_b = @user_id)
            {book_filter}
        )
        SELECT
            m.*,
            u.character_name,
            u.gender,
            u.age,
            u.profession
        FROM matches m
        LEFT JOIN {users_table} u ON u.user_id = m.matched_user_id
        ORDER BY m.confidence DESC
        LIMIT 50
    """

    params = [bigquery.ScalarQueryParameter("user_id", "INT64", bq_user_id)]
    if book_id:
        params.append(bigquery.ScalarQueryParameter("book_id", "STRING", book_id))

    client = get_bq_client()
    job_config = bigquery.QueryJobConfig(query_parameters=params)

    try:
        rows = await asyncio.to_thread(
            lambda: list(client.query(query, job_config=job_config).result())
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BigQuery error: {str(e)}")

    return [dict(r.items()) for r in rows]


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
