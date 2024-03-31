import io
import json

import cv2
import numpy as np
from app2 import predictor
from fastapi import FastAPI, File, Form, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from backend.utils import apply_mask, array_to_blob, create_prompt

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mask = np.zeros((1, 1), np.uint8)
image = np.zeros((1, 1), np.uint8)
bgdModel = np.zeros((1, 65), np.float64)
fgdModel = np.zeros((1, 65), np.float64)


@app.post("/start")
async def start(file: UploadFile = File(...)):
    global image
    global mask
    global bgdModel
    global fgdModel
    stream = io.BytesIO(await file.read())
    image = cv2.cvtColor(np.array(Image.open(stream).convert("RGB")), cv2.COLOR_RGB2BGR)
    mask = np.zeros(image.shape[:2], np.uint8)
    rect = (1, 1, image.shape[1], image.shape[0])
    cv2.grabCut(image, mask, rect, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_RECT)
    new_mask = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")
    rgba_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)
    blob = array_to_blob(apply_mask(rgba_image, new_mask))
    return Response(content=blob, media_type="image/png")


@app.post("/mask")
async def apply_mask_endpoint(file: UploadFile = File(...)):
    global image
    global mask
    global bgdModel
    global fgdModel
    stream = io.BytesIO(await file.read())
    img_mask = Image.open(stream).convert("RGB")
    img_mask_array = cv2.cvtColor(np.array(img_mask), cv2.COLOR_RGB2GRAY)
    mask[:] = cv2.GC_PR_BGD
    mask[img_mask_array == 76] = cv2.GC_BGD
    mask[img_mask_array == 255] = cv2.GC_FGD
    cv2.grabCut(image, mask, None, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_MASK)
    new_mask = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")
    rgba_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)
    blob = array_to_blob(apply_mask(rgba_image, new_mask))
    return Response(content=blob, media_type="image/png")


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
    prompt = create_prompt(_positive_points, _negative_points)
    labels = np.concatenate(
        [np.ones(len(_positive_points)), np.zeros(len(_negative_points))]
    )
    predictor.set_image(img_array[:, :, :3])
    masks = predictor.predict(
        point_coords=prompt,
        point_labels=labels,
        multimask_output=True,
    )[0]
    blob = array_to_blob(apply_mask(img_array, masks[0]))
    return Response(content=blob, media_type="image/png")
