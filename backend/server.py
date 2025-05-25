import io

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image
from diffmate import get_data, infer_one_image, init_model

app = FastAPI()

origins = ['*']
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
    # sammask_file: UploadFile = File(...),
):
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    image_file_stream = io.BytesIO(await image_file.read())
    original_bgr_image = cv2.cvtColor(
        np.array(Image.open(image_file_stream).convert("RGB")), cv2.COLOR_RGB2BGR
    )
    cv2.imwrite('demo/original.png', original_bgr_image)

    mask = Image.open(io.BytesIO(await mask_file.read())).convert("RGB")
    mask_array = cv2.cvtColor(np.array(mask), cv2.COLOR_RGB2GRAY)

    max_x = 1080
    max_y = 720

    bgr_image = original_bgr_image
    scale_factor = 1
    if original_bgr_image.shape[0] > max_y:
        scale_factor = max_y / original_bgr_image.shape[0]
        bgr_image = cv2.resize(
            original_bgr_image, None, fx=scale_factor, fy=scale_factor
        )
        mask_array = cv2.resize(
            mask_array, None, fx=scale_factor, fy=scale_factor
        )
    elif original_bgr_image.shape[1] > max_x:
        scale_factor = max_x / original_bgr_image.shape[1]
        bgr_image = cv2.resize(
            original_bgr_image, None, fx=scale_factor, fy=scale_factor
        )
        mask_array = cv2.resize(
            mask_array, None, fx=scale_factor, fy=scale_factor
        )

    mask_array_copy = mask_array.copy()

    mask_array[:] = cv2.GC_PR_BGD
    mask_array[mask_array_copy == 122] = cv2.GC_BGD
    mask_array[mask_array_copy == 177] = cv2.GC_FGD
    cv2.imwrite('demo/mask.png', mask_array_copy)

    cv2.grabCut(
        bgr_image, mask_array, None, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_MASK
    )
    new_mask = np.where((mask_array == 2) | (mask_array == 0), 0, 1).astype(
        "uint8"
    )
    new_mask = np.array(cv2.blur(new_mask * 255, (2, 2)), dtype=np.uint8)
    trimap = new_mask.copy().astype("float32")
    cv2.imwrite('demo/trimap_before_edit.png', trimap)
    trimap[mask_array_copy == 229] = 128
    cv2.imwrite('demo/trimap_after_edit.png', trimap)
    trimap = trimap / 255

    input = get_data(bgr_image, trimap)
    model = init_model('configs/ViTS_1024.py', 'checkpoint.pth', 'cpu', 'ddim10')
    alpha = infer_one_image(model, input, 'demo/result.png')

    if scale_factor != 1:
        alpha = cv2.resize(
            alpha, (original_bgr_image.shape[1], original_bgr_image.shape[0])
        )
    bgra_image = cv2.cvtColor(original_bgr_image, cv2.COLOR_BGR2BGRA)
    bgra_image[:, :, 3] = alpha
    _, encoded_rgba_image = cv2.imencode(".png", bgra_image)
    image_bytes = encoded_rgba_image.tobytes()
    image_stream = io.BytesIO(image_bytes)
    return StreamingResponse(image_stream, media_type="image/png")
