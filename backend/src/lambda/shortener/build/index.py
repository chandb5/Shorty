def handler(event, context):
    """
    AWS Lambda function to handle shortener events.
    """
    print(f"Received event: {event}")
    print("Hello from Shortener!")
    return "Hello from Shortener!"