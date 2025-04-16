def handler(event, context):
    """
    AWS Lambda function to handle authentication events.
    """
    print(f"Received event: {event}")
    print("Hello from Lambda!")
    return "Hello from Lambda!"