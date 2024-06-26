import io

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import pymatting

from backend.utils import apply_mask, array_to_base64

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    cv2.grabCut(
        image, base_mask_array, rect, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_RECT
    )
    new_mask = np.where((base_mask_array == 2) | (base_mask_array == 0), 0, 1).astype(
        "uint8"
    )
    new_mask = np.array(cv2.blur(new_mask * 255, (1, 2)), dtype=np.uint8)
    rgba_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)
    # if original_res[0] > 1080:
    #     rgba_image = cv2.resize(rgba_image, original_res[::-1])
    #     new_mask = cv2.resize(new_mask, original_res[::-1])
    img_base64 = array_to_base64(apply_mask(rgba_image, new_mask))
    new_mask_base64 = array_to_base64(
        apply_mask(cv2.cvtColor(new_mask, cv2.COLOR_GRAY2RGBA), new_mask)
    )
    return {"result": img_base64, "base_mask": new_mask_base64}


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

    base_mask = Image.open(io.BytesIO(await base_mask_file.read())).convert("RGB")
    base_mask_array = cv2.cvtColor(np.array(base_mask), cv2.COLOR_RGB2GRAY)
    base_mask_array_copy = cv2.cvtColor(np.array(base_mask), cv2.COLOR_RGB2GRAY)

    # 229 = yellow, 177 = green, 122 = red, 128 = gray
    base_mask_array[:] = cv2.GC_PR_BGD
    base_mask_array[base_mask_array_copy == 0] = cv2.GC_PR_BGD
    base_mask_array[base_mask_array_copy == 255] = cv2.GC_PR_FGD
    base_mask_array[mask_array == 122] = cv2.GC_BGD
    base_mask_array[mask_array == 177] = cv2.GC_FGD

    cv2.grabCut(
        image, base_mask_array, None, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_MASK
    )
    new_mask = np.where((base_mask_array == 2) | (base_mask_array == 0), 0, 1).astype(
        "uint8"
    )
    new_mask = np.array(cv2.blur(new_mask * 255, (2, 2)), dtype=np.uint8)

    # 11.5, 5.5, 22.2, 11, 38, 39, 42, 139
    # alpha matting
    trimap = new_mask.copy().astype("float32")
    trimap[mask_array == 229] = 128
    trimap = trimap / 255
    rgba_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)
    rgb_image = np.array(cv2.cvtColor(image, cv2.COLOR_BGR2RGB)).astype("float64") / 255
    alpha = pymatting.estimate_alpha_cf(rgb_image, trimap) * 255
    alpha = alpha.astype("uint8")
    rgba_image[:, :, 3] = alpha
    # if original_res[0] > 1080:
    #     rgba_image = cv2.resize(rgba_image, original_res[::-1])
    #     alpha = cv2.resize(alpha, original_res[::-1])

    # send response
    img_base64 = array_to_base64(rgba_image)
    # new_mask_base64 = array_to_base64(alpha)
    return {"result": img_base64}
    # return {"result": img_base64, "mask": new_mask_base64}
    # return Response(content=blob, media_type="image/png")


# @app.post("/image")
# async def remove_background(
#     positive_points: str = Form(...),
#     negative_points: str = Form(...),
#     file: UploadFile = File(...),
# ):
#     stream = io.BytesIO(await file.read())
#     image = Image.open(stream).convert("RGBA")
#     img_array = np.array(image)
#     _positive_points = np.array(json.loads(positive_points), dtype=np.float32)
#     _negative_points = np.array(json.loads(negative_points), dtype=np.float32)
#     prompt = create_prompt(_positive_points, _negative_points)
#     labels = np.concatenate(
#         [np.ones(len(_positive_points)), np.zeros(len(_negative_points))]
#     )
#     predictor.set_image(img_array[:, :, :3])
#     masks = predictor.predict(
#         point_coords=prompt,
#         point_labels=labels,
#         multimask_output=True,
#     )[0]
#     blob = array_to_blob(apply_mask(img_array, masks[0]))
#     return Response(content=blob, media_type="image/png")
