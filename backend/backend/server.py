from fastapi import FastAPI, WebSocket

app = FastAPI()

# post endpoint
@app.post("/image")
async def remove_background(image: str):
    print(image)
    return { "message": "completed"}
