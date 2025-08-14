from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Serve static files from wwwroot
app.mount("/", StaticFiles(directory="wwwroot", html=True), name="static")

# Optional: simple login route
@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    # Dummy check
    if username == "admin" and password == "password":
        return {"message": f"Welcome, {username}!"}
    return {"message": "Invalid credentials"}
