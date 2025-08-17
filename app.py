from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

app = FastAPI()
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
def get_chat_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/chat")
async def chat(message: str = Form(...)):
    # Simple chatbot logic (replace with AI later)
    if "hello" in message.lower():
        reply = "Hi there! How can I help you today?"
    else:
        reply = f"You said: {message}"
    return JSONResponse({"reply": reply})
