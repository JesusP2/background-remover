import io
import json

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from sam_model import predictor

from backend.utils import (apply_mask, array_to_base64, array_to_blob,
                           create_prompt)

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# base_mask_array = np.zeros((1, 1), np.uint8)
bgdModel = np.zeros((1, 65), np.float64)
fgdModel = np.zeros((1, 65), np.float64)


@app.post("/start")
async def start(image_file: UploadFile = File(...)):
    global bgdModel
    global fgdModel
    stream = io.BytesIO(await image_file.read())
    image = cv2.cvtColor(np.array(Image.open(stream).convert("RGB")), cv2.COLOR_RGB2BGR)
    base_mask_array = np.zeros(image.shape, np.uint8)
    base_mask_array = cv2.cvtColor(base_mask_array, cv2.COLOR_RGB2GRAY)
    rect = (1, 1, image.shape[1], image.shape[0])
    cv2.grabCut(image, base_mask_array, rect, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_RECT)
    new_mask = np.where((base_mask_array == 2) | (base_mask_array == 0), 0, 1).astype("uint8")
    rgba_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)
    img_base64 = array_to_base64(apply_mask(rgba_image, new_mask))
    new_mask = apply_mask(cv2.cvtColor(new_mask * 255, cv2.COLOR_GRAY2RGBA), new_mask)
    new_mask_base64 = array_to_base64(new_mask)
    return {"result": img_base64, "base_mask": new_mask_base64}
    # return Response(content=blob, media_type="image/png")


@app.post("/mask")
async def apply_mask_endpoint(
    mask_file: UploadFile = File(...),
    image_file: UploadFile = File(...),
    base_mask_file: UploadFile = File(...),
):
    global bgdModel
    global fgdModel
    image_file_stream = io.BytesIO(await image_file.read())
    image = cv2.cvtColor(
        np.array(Image.open(image_file_stream).convert("RGB")), cv2.COLOR_RGB2BGR
    )

    mask = Image.open(io.BytesIO(await mask_file.read())).convert("RGB")
    mask_array = cv2.cvtColor(np.array(mask), cv2.COLOR_RGB2GRAY)

    # base_mask = np.zeros(image.shape, np.uint8)
    # base_mask_array = cv2.cvtColor(base_mask, cv2.COLOR_RGB2GRAY)
    base_mask = Image.open(io.BytesIO(await base_mask_file.read())).convert("RGB")
    base_mask_array = cv2.cvtColor(np.array(base_mask), cv2.COLOR_RGB2GRAY)
    base_mask_array_copy = cv2.cvtColor(np.array(base_mask), cv2.COLOR_RGB2GRAY)
    base_mask_array[:] = cv2.GC_PR_BGD
    base_mask_array[base_mask_array_copy == 0] = cv2.GC_PR_BGD
    base_mask_array[base_mask_array_copy == 255] = cv2.GC_PR_FGD
    base_mask_array[mask_array == 76] = cv2.GC_BGD
    base_mask_array[mask_array == 255] = cv2.GC_FGD

    cv2.grabCut(image, base_mask_array, None, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_MASK)
    new_mask = np.where((base_mask_array == 2) | (base_mask_array == 0), 0, 1).astype("uint8")
    rgba_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)
    img_base64 = array_to_base64(apply_mask(rgba_image, new_mask))
    new_mask_base64 = array_to_base64(new_mask * 255)
    return {"result": img_base64, "mask": new_mask_base64}
    # return Response(content=blob, media_type="image/png")


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
