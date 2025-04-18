from ..db import run_query_fetchrow

import uuid

async def get_user_by_id(user_id):
    return await run_query_fetchrow(
        "SELECT id, email, password_hash, salt FROM users WHERE id = $1", user_id
    )

async def get_user_by_email(email):
    return await run_query_fetchrow(
        "SELECT id, email, password_hash, salt FROM users WHERE email = $1", email
    )

async def create_user(user_data):
    unique_id = str(uuid.uuid4())
    row = await run_query_fetchrow("""
        INSERT INTO users (id, email, password_hash, salt, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    """, unique_id, user_data['email'], user_data['password_hash'],
         user_data['salt'], user_data['created_at'])
    return row['id']
