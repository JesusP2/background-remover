import io

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image
import pyamg

import pymatting

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
    sammask_file: UploadFile = File(...),
):
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    image_file_stream = io.BytesIO(await image_file.read())
    original_bgr_image = cv2.cvtColor(
        np.array(Image.open(image_file_stream).convert("RGB")), cv2.COLOR_RGB2BGR
    )

    mask = Image.open(io.BytesIO(await mask_file.read())).convert("RGB")
    mask_array = cv2.cvtColor(np.array(mask), cv2.COLOR_RGB2GRAY)

    base_mask = Image.open(io.BytesIO(await sammask_file.read())).convert("RGB")
    base_mask_array = cv2.cvtColor(np.array(base_mask), cv2.COLOR_RGB2GRAY)

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
        base_mask_array = cv2.resize(
            base_mask_array, None, fx=scale_factor, fy=scale_factor
        )
    elif original_bgr_image.shape[1] > max_x:
        scale_factor = max_x / original_bgr_image.shape[1]
        bgr_image = cv2.resize(
            original_bgr_image, None, fx=scale_factor, fy=scale_factor
        )
        mask_array = cv2.resize(
            mask_array, None, fx=scale_factor, fy=scale_factor
        )
        base_mask_array = cv2.resize(
            base_mask_array, None, fx=scale_factor, fy=scale_factor
        )

    base_mask_array_copy = base_mask_array.copy()

    base_mask_array[:] = cv2.GC_PR_BGD
    base_mask_array[base_mask_array_copy == 0] = cv2.GC_PR_BGD
    base_mask_array[base_mask_array_copy == 255] = cv2.GC_PR_FGD
    base_mask_array[mask_array == 122] = cv2.GC_BGD
    base_mask_array[mask_array == 177] = cv2.GC_FGD

    cv2.grabCut(
        bgr_image, base_mask_array, None, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_MASK
    )
    new_mask = np.where((base_mask_array == 2) | (base_mask_array == 0), 0, 1).astype(
        "uint8"
    )
    new_mask = np.array(cv2.blur(new_mask * 255, (2, 2)), dtype=np.uint8)
    trimap = new_mask.copy().astype("float32")
    trimap[mask_array == 229] = 128
    trimap = trimap / 255

    bgr_image_float = bgr_image.astype(np.float64) / 255.0

    def pyamg_preconditioner(A):
        return pyamg.smoothed_aggregation_solver(A).aspreconditioner()

    alpha = pymatting.estimate_alpha_cf(
        bgr_image_float, trimap, preconditioner=pyamg_preconditioner
    )
    alpha_uint8 = (alpha * 255).astype(np.uint8)

    if scale_factor != 1:
        alpha_uint8 = cv2.resize(
            alpha_uint8, (original_bgr_image.shape[1], original_bgr_image.shape[0])
        )
    bgra_image = cv2.cvtColor(original_bgr_image, cv2.COLOR_BGR2BGRA)
    bgra_image[:, :, 3] = alpha_uint8
    _, encoded_rgba_image = cv2.imencode(".png", bgra_image)
    image_bytes = encoded_rgba_image.tobytes()
    image_stream = io.BytesIO(image_bytes)
    return StreamingResponse(image_stream, media_type="image/png")
