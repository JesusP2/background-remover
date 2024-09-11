import io

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from time import time

from lib.utils import array_to_base64
from lib.pipeline import apply_trimap, get_vicinity2

app = FastAPI()

origins = []
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/mask")
async def apply_mask_endpoint(
    mask_file: UploadFile = File(...),
    image_file: UploadFile = File(...),
):
    timer_1 = time()
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    image_file_stream = io.BytesIO(await image_file.read())
    bgr_image = cv2.cvtColor(
        np.array(Image.open(image_file_stream).convert("RGB")), cv2.COLOR_RGB2BGR
    )

    mask = Image.open(io.BytesIO(await mask_file.read())).convert("RGB")
    mask_array = cv2.cvtColor(np.array(mask), cv2.COLOR_RGB2GRAY)

    base_mask_array = np.zeros(bgr_image.shape, np.uint8)
    base_mask_array = cv2.cvtColor(base_mask_array, cv2.COLOR_RGB2GRAY)
    base_mask_array[:] = cv2.GC_PR_BGD
    base_mask_array[mask_array == 122] = cv2.GC_BGD
    base_mask_array[mask_array == 177] = cv2.GC_FGD

    timer_2 = time()
    cv2.grabCut(
        bgr_image, base_mask_array, None, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_MASK
    )
    timer_3 = time()
    new_mask = np.where((base_mask_array == 2) | (base_mask_array == 0), 0, 1).astype(
        "uint8"
    )
    new_mask = np.array(cv2.blur(new_mask * 255, (2, 2)), dtype=np.uint8)
    new_mask = get_vicinity2(new_mask, uncertain_width=200)
    timer_4 = time()

    cv2.imwrite('./fake_trimap.jpg', new_mask)
    # 11.5, 5.5, 22.2, 11, 38, 39, 42, 139
    # alpha matting
    trimap = new_mask.copy().astype("float32")
    trimap[mask_array == 229] = 128
    trimap = trimap / 255
    alpha, rgba_image = apply_trimap(bgr_image, trimap, 'BGR')
    timer_5 = time()
    print(f"timer 2 {timer_2 - timer_1}")
    print(f"timer 3 {timer_3 - timer_2}")
    print(f"timer 4 {timer_4 - timer_3}")
    print(f"timer 5 {timer_5 - timer_4}")
    img_base64 = array_to_base64(rgba_image)
    return {"result": img_base64}
