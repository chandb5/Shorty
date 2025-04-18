import hashlib
import json
import jwt
import os
from utils.config import JWT_SECRET, JWT_ALGORITHM

def create_response(status_code, body):
    return {
        "statusCode": status_code,
        "body": json.dumps(body, indent=4, sort_keys=True, default=str),
        "Content-Type": "application/json"
    }

def parse_body(event):
    body = event.get("body")
    if not body:
        return {}
    if isinstance(body, str):
        return json.loads(body)
    elif isinstance(body, bytes):
        return json.loads(body.decode('utf-8'))
    return body

def hash_password(password, salt=None):
    if not salt:
        salt = os.urandom(32).hex()
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return hashed, salt

def verify_jwt_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM]), None
    except jwt.ExpiredSignatureError:
        return None, "Token has expired"
    except jwt.InvalidTokenError:
        return None, "Invalid token"