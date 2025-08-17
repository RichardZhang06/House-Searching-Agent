from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            reply = f"You said '{data}'"
            await ws.send_text(reply)
    except WebSocketDisconnect:
        print("Client disconnected")

app.mount("/", StaticFiles(directory="frontend/build", html=True), name="frontend")
