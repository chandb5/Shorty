def handler(event, context):
    """
    AWS Lambda function to handle trigger events.
    """
    print(f"Received event: {event}")
    print("Hello from trigger!")
    return "Hello from trigger!"