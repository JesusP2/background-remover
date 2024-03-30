import numpy as np
import io
from PIL import Image

def apply_mask(raw_image, masks):
    if len(masks.shape) == 4:
      masks = masks[0].squeeze()
    mask = masks[0]
    h, w = mask.shape[-2:]
    mask_image = mask.reshape(h, w) * 255
    raw_image[:, :, 3] = mask_image
    return raw_image

def create_prompt(positive_points: np.ndarray, negative_points: np.ndarray):
    prompt = np.zeros((len(positive_points) + len(negative_points), 2), dtype=np.float32)
    prompt[:len(positive_points)] = positive_points
    prompt[len(positive_points):] = negative_points
    return prompt

def array_to_blob(image):
    img_buffer = io.BytesIO()
    Image.fromarray(image).save(img_buffer, format='PNG')
    return img_buffer.getvalue()
