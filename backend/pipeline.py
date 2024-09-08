import numpy as np
import cv2
from sklearn.cluster import DBSCAN
import pymatting

# from trimap_generation_attempt_1 import create_trimap, dbscan_clustering
from lib.pipeline import (
    apply_trimap,
    create_overlap_mask,
    get_vicinity,
    create_trimap,
    dbscan_clustering,
)


# user uploads image
# image gets processed by SAM
# web sends mask to backend
# convert mask to trimap
### dilate mask
### find noise using color variance
### create a biwise operation so only the noise around the mask remains
### create trimap of the remaining noise + base mask

# user uploads image to web sends mask to backend
mask = cv2.imread("./test_images/kojiro_mask.png", cv2.IMREAD_GRAYSCALE)
_, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)

vicinity = get_vicinity(mask)
cv2.imwrite(f"./result_images/pipeline/vicinity.jpg", vicinity)

# find noise using color variance
color_variance_mask = cv2.imread(
    "./result_images/color_variance/kojiro.jpg", cv2.IMREAD_GRAYSCALE
)


overlap = create_overlap_mask(vicinity, color_variance_mask)
cv2.imwrite(f"./result_images/pipeline/overlap.jpg", overlap)


overlap_trimap = create_trimap(dbscan_clustering(overlap), 70)
trimap = cv2.bitwise_or(mask, overlap_trimap)
cv2.imwrite(f"./result_images/pipeline/trimap.jpg", trimap)

# trimap op
rgb_img = cv2.imread("./test_images/kojiro.jpg", cv2.IMREAD_COLOR)
rgb_img_float = rgb_img.astype(np.float64) / 255.0
trimap_float = trimap.astype(np.float32) / 255.0
rgba_img = apply_trimap(rgb_img, trimap_float, "RGB")
cv2.imwrite(f"./result_images/pipeline/alpha.png", rgba_img)
