import asyncio
import boto3
import json
import os
from utils.crud.url import (create_url_visit)

def put_click_object(event):
    client = boto3.client("s3")
    bucket_name = os.environ.get("BUCKET_NAME")
    if not bucket_name:
        raise ValueError("BUCKET_NAME environment variable is not set")
    
    object_key = f"clicks/{event['slug']}/{event['timestamp']}.json"
    object_data = {
        "source_ip": event["source_ip"],
        "long_url": event["long_url"],
        "user_agent": event["user_agent"],
        "timestamp": event["timestamp"]
    }
 
    response = client.put_object(
        Bucket=bucket_name,
        Key=object_key,
        Body=json.dumps(object_data),
        ContentType="application/json"
    )
    if response["ResponseMetadata"]["HTTPStatusCode"] != 200:
        raise Exception(f"Failed to put object to S3: {response}")
    return response

async def async_handler(event, context):
    """
    AWS Lambda function to handle trigger events.
    """
    detail_type = event.get("detail-type")
    source = event.get("source")

    if not detail_type or not source or detail_type != "public" or source != "public-lambda":
        print("Invalid event: ", event)
        return {
            "statusCode": 400,
            "body": "Invalid event"
        }

    slug = event.get("detail", {}).get("slug")
    await create_url_visit(slug=slug)

    source_ip = event.get("detail", {}).get("event", {}).get("requestContext", {}).get("http", {}).get("sourceIp")
    long_url = event.get("detail", {}).get("long_url")
    user_agent = event.get("detail", {}).get("event", {}).get("requestContext", {}).get("http", {}).get("userAgent")
    timestamp = event.get("detail", {}).get("event", {}).get("requestContext", {}).get("timeEpoch")
    response = put_click_object({
        "slug": slug,
        "source_ip": source_ip,
        "long_url": long_url,
        "user_agent": user_agent,
        "timestamp": timestamp
    })
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Click event processed successfully"})
    }

def handler(event, context):
    """
    AWS Lambda function handler.
    """
    return asyncio.run(async_handler(event, context))