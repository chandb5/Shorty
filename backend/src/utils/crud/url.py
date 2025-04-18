import uuid
from utils.db import run_query_fetch, run_query_execute


async def create_short_url_record(slug, url, user_id):
    short_id = str(uuid.uuid4())
    return await run_query_execute(
        """
        INSERT INTO shortened_urls (id, slug, url, user_id)
        VALUES ($1, $2, $3, $4)
        """,
        short_id, slug, url, user_id
    )


async def list_short_urls(user_id):
    return await run_query_fetch(
        """
        SELECT id, slug, url, user_id
        FROM shortened_urls
        WHERE user_id = $1
        """,
        user_id
    )
