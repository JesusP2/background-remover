import numpy as np
import cv2


def adaptive_threshold_otsu(gradient_magnitude):
    _, mask = cv2.threshold(
        gradient_magnitude, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )
    return mask


def adaptive_threshold_mean(gradient_magnitude, scale_factor=15):
    mean = np.mean(gradient_magnitude)
    threshold = mean * scale_factor
    _, mask = cv2.threshold(gradient_magnitude, threshold, 255, cv2.THRESH_BINARY)
    return mask


def local_adaptive_threshold(gradient_magnitude, block_size=11, C=2):
    return cv2.adaptiveThreshold(
        gradient_magnitude,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        block_size,
        C,
    )


def adaptive_threshold_percentile(gradient_magnitude, percentile=90):
    threshold = np.percentile(gradient_magnitude, percentile)
    _, mask = cv2.threshold(gradient_magnitude, threshold, 255, cv2.THRESH_BINARY)
    return mask


def calculate_gradient_magnitude(image):
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(grad_x**2 + grad_y**2)
    magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    return magnitude

def detect_noisy_areas(image, method='otsu'):
    gradient_magnitude = calculate_gradient_magnitude(image)
    
    if method == 'otsu':
        mask = adaptive_threshold_otsu(gradient_magnitude)
    elif method == 'mean':
        mask = adaptive_threshold_mean(gradient_magnitude)
    elif method == 'percentile':
        mask = adaptive_threshold_percentile(gradient_magnitude)
    elif method == 'local':
        mask = local_adaptive_threshold(gradient_magnitude)
    else:
        raise ValueError("Unknown method. Choose 'otsu', 'mean', 'percentile', or 'local'.")
    
    return mask


images = ["gojo.jpeg", "kojiro.jpg", "yuji.jpeg", "despeinada.jpg"]
img_idx = 2
img = cv2.imread(f"./test_images/{images[img_idx]}", cv2.IMREAD_GRAYSCALE)
noisy_areas_mask = detect_noisy_areas(img, 'mean')

cv2.imwrite(f"./result_images/gradient_magnitude/{images[img_idx]}", noisy_areas_mask)
