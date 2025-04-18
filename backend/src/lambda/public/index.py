import asyncio

from utils.crud.url import (
    get_short_url_record,
)

async def async_handler(event, context):
    """
    AWS Lambda function to handle public events.
    """
    print(f"Received event: {event}")
    print("Hello from public!")

    # Extract the slug from the event
    method = event.get("requestContext", {}).get("http", {}).get("method")
    path = event.get("requestContext", {}).get("http", {}).get("path")
    path = path[:-1] if path.endswith("/") else path
    slug = path.split("/")[-1]
    print(f"method: {method}")
    print(f"path: {path}")
    print(f"slug: {slug}")
    print(f"event: {event}")

    existing_record = await get_short_url_record(slug=slug)
    
    if not (method == "GET" and path == f"/{slug}") or not slug:
        return {
            "statusCode": 400,
            "body": "Invalid request"
        }

    if existing_record:
        return {
            "statusCode": 301,
            "headers": { "Location": existing_record["url"] },
            "body": ""
        }
    else:
        return {
            "statusCode": 404,
            "body": "Short URL not found"
        }

def handler(event, context):
    return asyncio.run(async_handler(event, context))
