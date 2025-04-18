import uuid
from utils.db import run_query_fetch, run_query_fetchrow


async def create_short_url_record(slug, url, user_id):
    short_id = str(uuid.uuid4())
    return await run_query_fetchrow(
        """
        INSERT INTO shortened_urls (id, slug, url, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, slug, url, user_id
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

async def get_short_url_record(long_url=None, slug=None):
    if slug:
        return await run_query_fetchrow(
            """
            SELECT id, slug, url, user_id
            FROM shortened_urls
            WHERE slug = $1
            """,
            slug
        )
    
    if long_url:
        return await run_query_fetchrow(
            """
            SELECT id, slug, url, user_id
            FROM shortened_urls
            WHERE url = $1
            """,
            long_url
        )

async def update_long_url(slug, new_url, new_slug=None):
    if new_slug:
        return await run_query_fetchrow(
            """
            UPDATE shortened_urls
            SET url = $1, slug = $2
            WHERE slug = $3
            RETURNING id, slug, url, user_id
            """,
            new_url, new_slug, slug
        )
    else:
        return await run_query_fetchrow(
            """
            UPDATE shortened_urls
            SET url = $1
            WHERE slug = $2
            RETURNING id, slug, url, user_id
            """,
            new_url, slug
        )

async def delete_short_url(slug):
    return await run_query_fetchrow(
        """
        DELETE FROM shortened_urls
        WHERE slug = $1
        RETURNING id, slug, url, user_id
        """,
        slug
    )
