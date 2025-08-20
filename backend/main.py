import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from pydantic import BaseModel
from openai import OpenAI
from sqlalchemy.orm import Session
from .db import Base, engine, SessionLocal
from .models import User, Chat

# -------------------------
# Load environment variables
# -------------------------
if os.path.exists(".env"):
    load_dotenv(".env")

# Create OpenAI client
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY not set")

client = OpenAI(api_key=api_key)

# -------------------------
# FastAPI app setup
# -------------------------
app = FastAPI()

# -------------------------
# Sessions
# -------------------------
app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ.get("SESSION_SECRET", "secret"),
)

# -------------------------
# CORS (adjust in production)
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://housesearchingagent-g6h6b4euaxbhfudr.canadacentral-01.azurewebsites.net"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Serve React static files
# -------------------------
app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")

# -------------------------
# Startup event: create DB tables
# -------------------------
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# -------------------------
# Dependency: DB session
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# OAuth setup
# -------------------------
config = Config(environ=os.environ)
oauth = OAuth(config)
oauth.register(
    name="google",
    client_id=os.environ.get("GOOGLE_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# -------------------------
# Helper: require login
# -------------------------
def require_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user

# -------------------------
# Models
# -------------------------
class ChatRequest(BaseModel):
    message: str

# -------------------------
# Auth routes
# -------------------------
@app.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for("auth")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth")
async def auth(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    nonce = token.get("nonce")
    user_info = await oauth.google.parse_id_token(token, nonce=nonce)

    request.session["user"] = dict(user_info)

    # Save or update user in DB
    db_user = db.query(User).filter(User.email == user_info["email"]).first()
    if not db_user:
        db_user = User(email=user_info["email"], name=user_info.get("name"))
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    return RedirectResponse("/chat")

@app.get("/logout")
def logout(request: Request):
    request.session.pop("user", None)
    return RedirectResponse("/")

@app.get("/auth/session")
def get_session(request: Request):
    return {"user": request.session.get("user")}

# -------------------------
# Chat endpoint using ChatGPT
# -------------------------
@app.post("/chat")
async def chat(
    req: ChatRequest,
    user: dict = Depends(require_user),
    db: Session = Depends(get_db),
):
    system_prompt = (
        "You are a helpful real estate assistant. Answer questions about properties, "
        "neighborhoods, and the home-buying process. If a user query is a property search, "
        "extract structured parameters like location, price, bedrooms, bathrooms, etc."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message},
            ],
            temperature=0.7,
            max_tokens=400,
        )
        reply = response.choices[0].message.content.strip()

        # Find the user in DB
        db_user = db.query(User).filter(User.email == user["email"]).first()

        # Save chat to DB
        chat_entry = Chat(user_id=db_user.id, message=req.message, reply=reply)
        db.add(chat_entry)
        db.commit()

        return JSONResponse({"reply": reply})

    except Exception as e:
        return JSONResponse(
            {"reply": "Sorry, something went wrong.", "error": str(e)},
            status_code=500,
        )

# -------------------------
# Get chat history
# -------------------------
@app.get("/chats")
def get_chats(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user["email"]).first()
    chats = (
        db.query(Chat)
        .filter(Chat.user_id == db_user.id)
        .order_by(Chat.created_at.asc())
        .all()
    )
    return [{"message": c.message, "reply": c.reply, "time": c.created_at} for c in chats]

# -------------------------
# Delete all user messages
# -------------------------
@app.delete("/chats")
def delete_chats(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user["email"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    deleted_count = db.query(Chat).filter(Chat.user_id == db_user.id).delete()
    db.commit()

    return {"deleted": deleted_count, "message": "All chats deleted successfully"}

# -------------------------
# Serve React SPA for all other routes
# -------------------------
@app.get("/{full_path:path}")
def serve_react(full_path: str, request: Request):
    return FileResponse("frontend/build/index.html")
