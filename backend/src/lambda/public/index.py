import asyncio
import asyncpg
import boto3

import os
import json
from typing import Dict, Optional

EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME")
_eventbridge_client: Optional[boto3.client] = None

async def get_db_conn():
    return await asyncpg.connect(
        user=os.environ.get('DB_USER'),
        password=os.environ.get('DB_PASSWORD'),
        database=os.environ.get('DB_NAME'),
        host=os.environ.get('DB_HOST'),
        port=os.environ.get('DB_PORT')
    )

async def run_query_fetchrow(query, *args):
    conn = await get_db_conn()
    try:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None
    finally:
        await conn.close()

async def get_short_url_record(slug=None):
    if slug:
        return await run_query_fetchrow(
            """
            SELECT id, slug, url, user_id
            FROM shortened_urls
            WHERE slug = $1
            """,
            slug
        )

def put_event_to_eventbus(detail: Dict, detail_type: str, source: str):
    def get_eventbridge_client():
        global _eventbridge_client
        if _eventbridge_client is None:
            _eventbridge_client = boto3.client(
                service_name="events",
            )
        return _eventbridge_client


    client = get_eventbridge_client()
    response = client.put_events(
        Entries=[{
            "Source": source,
            "DetailType": detail_type,
            "Detail": json.dumps(detail),
            "EventBusName": EVENT_BUS_NAME
        }]
    )

    if response.get("FailedEntryCount", 0) > 0:
        raise Exception(f"Failed to put event: {response['Entries']}")

    return response

async def async_handler(event, context):
    """
    AWS Lambda function to handle public events.
    """
    print(f"Received event: {event}")

    method = event.get("requestContext", {}).get("http", {}).get("method")
    path = event.get("requestContext", {}).get("http", {}).get("path")
    path = path[:-1] if path.endswith("/") else path
    slug = path.split("/")[-1]

    if not (method == "GET" and path == f"/{slug}") or not slug:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Invalid request"})
        }

    existing_record = await get_short_url_record(slug=slug)

    if existing_record:
        put_event_to_eventbus(
            detail={"slug": slug, "event": event, "long_url": existing_record["url"] if existing_record else None},
            detail_type="public",
            source="public-lambda",
        )
        return {
            "statusCode": 301,
            "headers": { "Location": existing_record["url"] },
            "body": ""
        }

    return {
        "statusCode": 404,
        "body": json.dumps({"message": "URL not found"})
    }

def handler(event, context):
    return asyncio.run(async_handler(event, context))
