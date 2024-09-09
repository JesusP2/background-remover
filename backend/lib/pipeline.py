import numpy as np
import cv2
from sklearn.cluster import DBSCAN
import pymatting


def get_vicinity(mask, uncertain_width=100, iterations=1, threshold=200):
    kernel = np.ones((uncertain_width, uncertain_width), np.uint8)
    dilated = cv2.dilate(mask, kernel, iterations=iterations)
    eroded = cv2.erode(mask, kernel, iterations=iterations)
    uncertain = cv2.subtract(dilated, eroded)

    truncated = np.zeros(mask.shape, dtype=np.uint8)
    truncated[uncertain > threshold] = 255
    return truncated


def create_overlap_mask(mask_A, mask_B):
    """
    Create a new mask containing the overlapping regions of two input masks.

    Args:
    mask_A (numpy.ndarray): First input mask
    mask_B (numpy.ndarray): Second input mask

    Returns:
    numpy.ndarray: A new mask with the overlapping regions
    """
    # Ensure masks are binary
    _, mask_A_binary = cv2.threshold(mask_A, 127, 255, cv2.THRESH_BINARY)
    _, mask_B_binary = cv2.threshold(mask_B, 127, 255, cv2.THRESH_BINARY)

    # Compute overlap
    overlap_mask = cv2.bitwise_and(mask_A_binary, mask_B_binary)

    return overlap_mask


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


def apply_trimap(image, trimap, image_type="RGB"):
    """
    Applies trimap

    Args:
    img (MatLike): Either RGB or BGR image
    trimap (numpy.ndarray): float32 ndarray [0.0, 1.0]

    Returns:
    numpy.ndarray: A new mask with the overlapping regions
    """
    image_float = image.astype(np.float64) / 255.0
    alpha = pymatting.estimate_alpha_cf(image_float, trimap)
    alpha_uint8 = (alpha * 255).astype(np.uint8)
    if image_type == "RGB":
        rgba_img = cv2.cvtColor(image, cv2.COLOR_RGB2RGBA)
    else:
        rgba_img = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)
    rgba_img[:, :, 3] = alpha_uint8
    return alpha_uint8, rgba_img
