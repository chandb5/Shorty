import asyncio
import jwt
from datetime import datetime, timedelta
from utils.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION
from utils.db import run_query_fetchrow, run_query_execute
from utils.helper import create_response, parse_body, hash_password, verify_jwt_token
from utils.crud.user import get_user_by_email, get_user_by_id, create_user
import uuid

async def save_refresh_token(user_id, token, expires_at):
    await run_query_execute("""
        INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
        VALUES ($1, $2, $3, NOW())
    """, user_id, token, expires_at)

async def validate_refresh_token(refresh_token):
    row = await run_query_fetchrow("""
        SELECT user_id FROM refresh_tokens
        WHERE token = $1 AND expires_at > NOW()
    """, refresh_token)
    return row['user_id'] if row else None

async def invalidate_refresh_token(refresh_token):
    await run_query_execute("DELETE FROM refresh_tokens WHERE token = $1", refresh_token)

async def generate_tokens(user):
    now = datetime.now(tz=timedelta(hours=0))
    payload = {
        'sub': str(user['id']),
        'email': user['email'],
        'iat': now,
        'exp': now + timedelta(hours=JWT_EXPIRATION)
    }

    access_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    refresh_token = str(uuid.uuid4())
    refresh_expires = now + timedelta(days=30)

    await save_refresh_token(user['id'], refresh_token, refresh_expires)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": JWT_EXPIRATION * 3600,
        "token_type": "Bearer"
    }

async def handle_register(body):
    if not (body and body.get("email") and body.get("password") is not None):
        return create_response(400, {"message": "Email and password are required"})

    existing_user = await get_user_by_email(body['email'])
    if existing_user:
        return create_response(409, {"message": "User already exists"})

    hashed_password, salt = hash_password(body['password'])

    user_data = {
        "email": body['email'],
        "password_hash": hashed_password,
        "salt": salt,
        "created_at": datetime.now()
    }

    user_id = await create_user(user_data)

    return create_response(201, {
        "message": "User registered successfully",
        "user_id": user_id
    })

async def handle_login(body):
    if not (body and body.get("email") and body.get("password") is not None):
        return create_response(400, {"message": "Email and password are required"})

    user = await get_user_by_email(body['email'])
    if not user:
        return create_response(401, {"message": "Invalid email or password"})

    hashed_input, _ = hash_password(body['password'], user['salt'])
    if hashed_input != user['password_hash']:
        return create_response(401, {"message": "Invalid email or password"})

    tokens = await generate_tokens(user)
    tokens["message"] = "Login successful"

    return create_response(200, tokens)

async def handle_refresh_token(body):
    refresh_token = body.get('refresh_token')
    if not refresh_token:
        return create_response(400, {"message": "Refresh token is required"})

    user_id = await validate_refresh_token(refresh_token)
    if not user_id:
        return create_response(401, {"message": "Invalid or expired refresh token"})

    user = await get_user_by_id(user_id)
    if not user:
        return create_response(401, {"message": "User not found"})

    tokens = await generate_tokens(user)
    return create_response(200, tokens)

async def handle_logout(body):
    refresh_token = body.get('refresh_token')
    if refresh_token:
        await invalidate_refresh_token(refresh_token)

    return create_response(200, {"message": "Logout successful"})

async def handle_verify_token(headers):
    auth_header = headers.get("authorization") or headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return create_response(401, {"message": "Missing or invalid Authorization header"})

    token = auth_header.split(" ")[1]
    payload, error = verify_jwt_token(token)

    if payload:
        return create_response(200, {
            "valid": True,
            "user_id": payload['sub'],
            "email": payload['email']
        })
    else:
        return create_response(401, {
            "valid": False,
            "message": error
        })

async def handle_get_user(headers):
    auth_header = headers.get("authorization") or headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return create_response(401, {"message": "Missing or invalid Authorization header"})

    token = auth_header.split(" ")[1]
    payload, error = verify_jwt_token(token)

    if error:
        return create_response(401, {"message": error})

    user = await get_user_by_id(payload['sub'])
    if not user:
        return create_response(404, {"message": "User not found"})

    user_info = {
        "id": user["id"],
        "email": user["email"]
    }

    return create_response(200, {"user": user_info})

async def async_handler(event, context):
    request_data = event.get("requestContext", {}).get("http", {})
    method = request_data.get("method")
    path = request_data.get("path")
    path = path.replace("/auth", "")
    path = path[:-1] if path.endswith("/") else path

    print(f"Received event: {event}")
    print(f"method: {method}")
    print(f"path: {path}")

    body = parse_body(event)
    print(f"body: {body}")

    if method == "POST":
        if path == "/register":
            return await handle_register(body)
        elif path == "/login":
            return await handle_login(body)
        elif path == "/refresh-token":
            return await handle_refresh_token(body)
        elif path == "/logout":
            return await handle_logout(body)
        elif path == "/verify-token":
            return await handle_verify_token(event.get("headers", {}))

    elif method == "GET":
        if path == "/user":
            return await handle_get_user(event.get("headers", {}))

    return create_response(400, {"message": "Invalid request"})

def handler(event, context):
    return asyncio.run(async_handler(event, context))
