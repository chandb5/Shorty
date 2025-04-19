import uuid
from utils.db import run_query_fetch, run_query_fetchrow, run_query_execute


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
    short_url = await get_short_url_record(slug=slug)
    if not short_url:
        return None
    
    await run_query_execute(
        """
        DELETE FROM url_visits
        WHERE shortened_url_id = $1
        """,
        short_url["id"]
    )
    
    deleted_url = await run_query_fetchrow(
        """
        DELETE FROM shortened_urls
        WHERE slug = $1
        RETURNING id, slug, url, user_id
        """,
        slug
    )
    return deleted_url

async def create_url_visit(slug):
    shortened_url = await get_short_url_record(slug=slug)
    if not shortened_url:
        raise ValueError("Shortened URL not found")
    
    return await run_query_execute(
        """
        INSERT INTO url_visits (id, shortened_url_id, visit_time)
        VALUES ($1, $2, NOW())
        """,
        str(uuid.uuid4()), shortened_url["id"]
    )

async def get_url_visits(slug):
    shortened_url = await get_short_url_record(slug=slug)
    if not shortened_url:
        raise ValueError("Shortened URL not found")
    
    return await run_query_fetch(
        """
        SELECT id, shortened_url_id, visit_time
        FROM url_visits
        WHERE shortened_url_id = $1
        """,
        shortened_url["id"]
    )

async def get_url_visits_by_user(user_id):
    return await run_query_fetch(
        """
        SELECT visits.* FROM url_visits AS visits LEFT JOIN shortened_urls AS urls
        ON visits.shortened_url_id = urls.id
        WHERE urls.user_id = $1
        """,
        user_id
    )