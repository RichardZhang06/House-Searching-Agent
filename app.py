from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/")
def read_root():
    html_content = """
    <html>
        <head>
            <title>Hello Azure</title>
        </head>
        <body>
            <h1>Hello from FastAPI on Azure!</h1>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)
