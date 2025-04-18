import asyncpg
import os


async def get_db_conn():
    return await asyncpg.connect(
        user=os.environ.get('DB_USER'),
        password=os.environ.get('DB_PASSWORD'),
        database=os.environ.get('DB_NAME'),
        host=os.environ.get('DB_HOST'),
        port=os.environ.get('DB_PORT')
    )

async def run_query_fetch(query, *args):
    conn = await get_db_conn()
    try:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]
    finally:
        await conn.close()

async def run_query_fetchrow(query, *args):
    conn = await get_db_conn()
    try:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None
    finally:
        await conn.close()

async def run_query_execute(query, *args):
    conn = await get_db_conn()
    try:
        return await conn.execute(query, *args)
    finally:
        await conn.close()
