import json
import random
import boto3
import asyncio

from utils.config import VALID_CHARS, MIN_LENGTH
from utils.helper import create_response, parse_body, verify_jwt_token
from utils.crud.url import (
    create_short_url_record,
    delete_short_url,
    get_short_url_record,
    list_short_urls,
    update_long_url
)
from typing import Dict, Optional

_eventbridge_client: Optional[boto3.client] = None

def put_event_to_eventbus(detail: Dict, detail_type: str, source: str, event_bus_name: str):
    def get_eventbridge_client():
        global _eventbridge_client
        if _eventbridge_client is None:
            _eventbridge_client = boto3.client("events")
        return _eventbridge_client

    client = get_eventbridge_client()
    response = client.put_events(
        Entries=[{
            "Source": source,
            "DetailType": detail_type,
            "Detail": json.dumps(detail),
            "EventBusName": event_bus_name
        }]
    )

    if response.get("FailedEntryCount", 0) > 0:
        raise Exception(f"Failed to put event: {response['Entries']}")

    return response


async def handle_create_short_url(body, user_id):
    if not body or not isinstance(body, dict):
        raise ValueError("Invalid request body")

    url = body.get("url")
    if not url:
        raise ValueError("Missing URL in request body")

    attempts = 5
    minimum_length = MIN_LENGTH
    while attempts > 0:
        attempts -= 1
        if attempts < 3:
            minimum_length += 1

        slug = "".join(random.choices(VALID_CHARS, k=minimum_length))
        existing_record = await get_short_url_record(slug=slug)
        if not existing_record or len(existing_record) == 0:
            break
    else:
        raise ValueError("Failed to generate a unique slug after multiple attempts")

    return await create_short_url_record(slug, url, user_id)


def middleware(event, context):
    auth_header = event.get("headers", {}).get("Authorization") or event.get("headers", {}).get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return create_response(401, {"message": "Missing or invalid Authorization header"})

    token = auth_header.split(" ", 1)[1]
    payload, error = verify_jwt_token(token)
    if error:
        return create_response(401, {"message": error})

    event["token_payload"] = payload
    return event


async def async_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method")
    path = event.get("requestContext", {}).get("http", {}).get("path", "").replace("/shorten", "")

    user_id = event.get("token_payload", {}).get("sub")
    if not user_id:
        return create_response(401, {"message": "Missing user ID in token payload"})

    if method == "GET" and path == "/":
        urls = await list_short_urls(user_id)
        return create_response(200, {"short_urls": urls})

    if method == "POST" and path == "/":
        body = parse_body(event)
        url = body.get("url")

        if not url or not isinstance(url, str) or len(url.strip()) == 0:
            return create_response(400, {"error": "URL is required"})
        if not url.startswith(("http://", "https://")):
            return create_response(400, {"error": "URL must start with http:// or https://"})

        existing_record = await get_short_url_record(long_url=url)
        if not existing_record or len(existing_record) == 0:
            try:
                record = await handle_create_short_url(body, user_id)
                return create_response(201, {"message": "Short URL created successfully!", "data": record})
            except ValueError as e:
                return create_response(400, {"error": str(e)})
        else:
            return create_response(200, {"message": "Short URL already exists!", "data": existing_record})

    if method == "PUT" and path == "/":
        body = parse_body(event)

        existing_record = await get_short_url_record(slug=body.get("slug"))
        if not existing_record or len(existing_record.keys()) == 0:
            return create_response(404, {"error": "Short URL not found"})

        new_url = body.get("updated_url")
        new_slug = body.get("updated_slug")

        if new_slug:
            conflict_check = await get_short_url_record(slug=new_slug)
            if conflict_check and conflict_check["slug"] != body.get("slug"):
                return create_response(400, {"error": "Slug already in use"})

        if existing_record["url"] == new_url and not new_slug:
            return create_response(200, {"message": "Short URL already exists!", "data": existing_record})

        updated_record = await update_long_url(
            slug=existing_record["slug"],
            new_url=new_url,
            new_slug=new_slug
        )
        
        return create_response(200, {"message": "Short URL updated successfully!", "data": updated_record})

    if method == "DELETE" and path == "/":
        body = parse_body(event)
        await delete_short_url(body.get("slug"))
        return create_response(200, {"message": "Short URL deleted successfully!"})

    return create_response(404, {"error": "Page Not found"})


def handler(event, context):
    event = middleware(event, context)
    if isinstance(event, dict) and "statusCode" in event:
        return event
    return asyncio.run(async_handler(event, context))
