from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/", StaticFiles(directory="templates", html=True), name="templates")

# @app.get("/")
# async def root():
#     return {"message": "Hello Azure"}