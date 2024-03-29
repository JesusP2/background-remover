import io
import json

import numpy as np
from app2 import predictor
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from backend.utils import apply_mask, createPrompt

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# post endpoint
@app.post("/image")
async def remove_background(
    positive_points: str = Form(...),
    negative_points: str = Form(...),
    file: UploadFile = File(...),
):
    stream = io.BytesIO(await file.read())
    image = Image.open(stream).convert("RGBA")
    img_array = np.array(image)
    _positive_points = np.array(json.loads(positive_points), dtype=np.float32)
    _negative_points = np.array(json.loads(negative_points), dtype=np.float32)
    prompt = createPrompt(_positive_points, _negative_points)
    labels = np.concatenate(
        [np.ones(len(_positive_points)), np.zeros(len(_negative_points))]
    )
    predictor.set_image(img_array[:, :, :3])
    masks = predictor.predict(
        point_coords=prompt,
        point_labels=labels,
        multimask_output=True,
    )[0]
    idk = apply_mask(img_array, masks)
    Image.fromarray(idk).save("output.png")
    return {"message": "completed"}
