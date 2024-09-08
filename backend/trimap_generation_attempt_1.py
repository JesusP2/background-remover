import cv2
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.cluster import AgglomerativeClustering
from scipy.spatial import Voronoi
import pymatting


def dbscan_clustering(mask, eps=30, min_samples=5):
    y, x = np.where(mask > 0)
    points = np.column_stack((x, y))

    dbscan = DBSCAN(eps=eps, min_samples=min_samples)
    clusters = dbscan.fit_predict(points)

    new_mask = np.zeros_like(mask)
    for cluster in set(clusters):
        if cluster == -1:  # Noise points
            continue
        cluster_points = points[clusters == cluster]
        hull = cv2.convexHull(cluster_points)
        cv2.drawContours(new_mask, [hull], 0, 255, -1)
    return new_mask


def create_trimap(mask, uncertain_width=5):
    # Create foreground (white in the mask)
    fg = mask.copy()

    # Create uncertain region by dilating the mask and subtracting the original
    kernel = np.ones((uncertain_width, uncertain_width), np.uint8)
    uncertain = cv2.dilate(mask, kernel, iterations=1)
    uncertain = cv2.subtract(uncertain, mask)

    # Combine into a single trimap image
    trimap = np.zeros(mask.shape, dtype=np.uint8)
    trimap[fg > 0] = 255
    trimap[uncertain > 0] = 128

    return trimap


# Load your original mask
original_mask = cv2.imread(
    "./result_images/color_variance/kojiro.jpg", cv2.IMREAD_GRAYSCALE
)

combined_mask = dbscan_clustering(original_mask)

# Create the trimap
trimap = create_trimap(combined_mask, 70)
cv2.imwrite(f"./trimap_results/attempt1/trimap.jpg", trimap)
rgb_img = cv2.imread("./test_images/kojiro.jpg", cv2.IMREAD_COLOR)
rgb_img_float = rgb_img.astype(np.float64) / 255.0
trimap_float = trimap.astype(np.float32) / 255.0
alpha = pymatting.estimate_alpha_cf(rgb_img_float, trimap_float)
alpha_uint8 = (alpha * 255).astype(np.uint8)
rgba_img = cv2.cvtColor(rgb_img, cv2.COLOR_BGR2RGBA)
rgba_img[:, :, 3] = alpha_uint8
cv2.imwrite(f"./trimap_results/attempt1/alpha.png", rgba_img)
