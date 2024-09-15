import cv2
import numpy as np
from sklearn.cluster import KMeans


def kmeans_threshold(variance_map):
    kmeans = KMeans(n_clusters=2, random_state=0).fit(variance_map.reshape(-1, 1))
    centers = kmeans.cluster_centers_.flatten()
    return np.mean(centers)


def otsu_threshold(image):
    if image.dtype != np.uint8:
        image = (image * 255).astype(np.uint8)
    threshold, _ = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return threshold / 255.0


def adaptive_threshold(image, block_size=11, C=2):
    if len(image.shape) == 2 or (len(image.shape) == 3 and image.shape[2] == 1):
        gray = image
    else:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = np.uint8(gray * 255)

    adaptive_thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block_size, C
    )
    return adaptive_thresh / 255.0


def mean_std_threshold(variance_map, factor=5):
    mean = np.mean(variance_map)
    std = np.std(variance_map)
    return mean + factor * std


def histogram_threshold(variance_map, percentile=90):
    hist, bins = np.histogram(variance_map, bins=256)
    cumsum = np.cumsum(hist)
    threshold_index = np.searchsorted(cumsum, percentile / 100 * cumsum[-1])
    return bins[threshold_index]


def color_variance(image, window_size):
    image = image.astype(np.float32) / 255.0

    # Calculate local mean
    local_mean = cv2.blur(image, (window_size, window_size))
    # Calculate local squared mean
    local_squared_mean = cv2.blur(image**2, (window_size, window_size))
    # Variance is E[X^2] - E[X]^2
    variance = local_squared_mean - local_mean**2
    # Sum variance across channels
    total_variance = np.sum(variance, axis=2)

    return total_variance


def adaptive_threshold_picker(variance_map, method="otsu"):
    if method == "otsu":
        return otsu_threshold(variance_map)
    elif method == "adaptive":
        return adaptive_threshold(variance_map)
    elif method == "mean_std":
        return mean_std_threshold(variance_map)
    elif method == "histogram":
        return histogram_threshold(variance_map)
    elif method == "kmeans":
        return kmeans_threshold(variance_map)
    else:
        raise ValueError("Unknown method")


def create_alpha_matting_mask(image, window_size=5, threshold_method="otsu"):
    # Calculate color variance
    variance = color_variance(image, window_size)
    # Normalize variance to 0-1 range
    variance_normalized = (variance - variance.min()) / (
        variance.max() - variance.min()
    )
    # Get adaptive threshold
    threshold = adaptive_threshold_picker(variance_normalized, method=threshold_method)
    # Create binary mask based on threshold
    mask = (variance_normalized > threshold).astype(np.uint8) * 255
    # Optional: Apply some morphological operations to clean up the mask
    # kernel = np.ones((2, 2), np.uint8)
    # mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    # mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    return mask
