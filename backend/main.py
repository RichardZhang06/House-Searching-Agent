import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Form, Depends, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config

# For Local
# load_dotenv(".env")

app = FastAPI()

# Sessions
app.add_middleware(SessionMiddleware, secret_key=os.environ.get("SESSION_SECRET", "secret"))

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://housesearchingagent-g6h6b4euaxbhfudr.canadacentral-01.azurewebsites.net"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve React static files
app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")

# OAuth setup
config = Config(".env")
oauth = OAuth(config)
oauth.register(
    name="google",
    client_id=os.environ.get("GOOGLE_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# Login dependency
def require_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user

# Serve SPA index.html (only after login)
@app.get("/")
def serve_index(request: Request):
    user = request.session.get("user")
    if not user:
        return RedirectResponse("/login")
    return FileResponse("frontend/build/index.html")

# Session endpoint
@app.get("/auth/session")
def get_session(request: Request):
    return {"user": request.session.get("user")}

# Login
@app.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for("auth")
    return await oauth.google.authorize_redirect(request, redirect_uri)

# Auth callback
@app.get("/auth")
async def auth(request: Request):
    token = await oauth.google.authorize_access_token(request)
    nonce = token.get("nonce")
    user = await oauth.google.parse_id_token(token, nonce=nonce)
    request.session["user"] = dict(user)
    return RedirectResponse("/")

# Logout
@app.get("/logout")
def logout(request: Request):
    request.session.pop("user", None)
    return RedirectResponse("/login")

# Chat endpoint (requires login)
@app.post("/chat")
async def chat(message: str = Form(...), user: dict = Depends(require_user)):
    if "hello" in message.lower():
        reply = f"Hi {user.get('name')}! How can I help you today?"
    else:
        reply = f"You said: {message}"
    return JSONResponse({"reply": reply})
