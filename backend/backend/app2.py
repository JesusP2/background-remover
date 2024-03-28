from PIL import Image
import requests
from segment_anything import SamPredictor, sam_model_registry
import numpy as np
from backend.utils import show_masks_on_image

sam = sam_model_registry['vit_b'](checkpoint="./sam_vit_b.pth")
predictor = SamPredictor(sam)

# img_url = "https://huggingface.co/ybelkada/segment-anything/resolve/main/assets/car.png"
# raw_image = Image.open(requests.get(img_url, stream=True).raw).convert("RGB")
# image = np.array(raw_image)

# positive_points = np.array([
#     [450, 600],
#     [500, 850],
#     [900,750] ,
#     [950,750],
#     [1000, 750],
#     [1050, 750],
#     [1100, 750],
#     [1150, 750],
#     [1200, 750],
#     [1250, 750],
#     [1300, 750],
#     [1350, 750],
#     [1400, 750],
#     [1450, 750],
#     [1500, 750],
#     [1550, 750],
#     [1600, 750],
#     [1650, 750],
#     [1700, 750],
#     [1750, 750],
#     [1800, 750],
#     [1850, 750],
#     [1900, 750],
#     [1950, 750],
#     [2100, 750],
#     [2200, 750],
# ], dtype=np.float32)
#
# # Create dummy negative points
# negative_points = np.array([[850, 1100], [800, 1000]], dtype=np.float32)
# # Create the prompt for SAM
# prompt = np.zeros((len(positive_points) + len(negative_points), 2), dtype=np.float32)
# prompt[:len(positive_points)] = positive_points
# prompt[len(positive_points):] = negative_points
# labels = np.concatenate([np.ones(len(positive_points)), np.zeros(len(negative_points))])


# predictor.set_image(image)
# masks, scores, logits = predictor.predict(
#     point_coords=prompt,
#     point_labels=labels,
#     multimask_output=True,
# )
#
# print(masks.shape, scores.shape)
# show_masks_on_image(raw_image, masks, scores)
