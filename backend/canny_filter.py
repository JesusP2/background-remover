## NOT VERY GOOD VS IMAGES WITH A LOT OF NOISE
import numpy as np
import cv2

def detect_complex_regions(image, low_threshold=100, high_threshold=200, kernel_size=5):
    # Convert image to grayscale if it's not already
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # Apply Canny edge detection
    edges = cv2.Canny(gray, low_threshold, high_threshold)

    # Dilate the edges to create regions
    kernel = np.ones((kernel_size, kernel_size), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=1)

    # Create a mask based on edge density
    edge_density = cv2.blur(dilated.astype(float), (kernel_size*2, kernel_size*2))
    
    # Normalize the density to 0-255 range
    edge_density = cv2.normalize(edge_density, None, 0, 255, cv2.NORM_MINMAX)
    
    # Convert back to uint8
    edge_density = edge_density.astype(np.uint8)

    return edge_density

def detect_fine_details(image, edge_threshold=100, variance_threshold=1000):
    # Convert to grayscale if necessary
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # Edge detection
    edges = cv2.Canny(gray, edge_threshold, edge_threshold * 2)

    # Local variance
    kernel_size = 5
    mean, std_dev = cv2.meanStdDev(gray)
    variance = cv2.blur(gray.astype(np.float32)**2, (kernel_size, kernel_size)) - cv2.blur(gray.astype(np.float32), (kernel_size, kernel_size))**2

    # Combine edge detection and local variance
    mask = np.zeros_like(gray)
    mask[(edges > 0) | (variance > variance_threshold)] = 255

    # Apply morphological operations to clean up the mask
    kernel = np.ones((3,3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    return mask

images = ['gojo.jpeg', 'kojiro.jpg', 'yuji.jpeg', 'despeinada.jpg']
img_idx = 2
img = cv2.imread(f'./test_images/{images[img_idx]}', cv2.IMREAD_GRAYSCALE)
v = np.median(img)
sigma = 0.33
#---- apply optimal Canny edge detection using the computed median----
lower_thresh = int(max(0, (1.0 - sigma) * v))
upper_thresh = int(min(255, (1.0 + sigma) * v))
complex_regions = detect_complex_regions(img, lower_thresh, upper_thresh)
# complex_regions = detect_fine_details(img, lower_thresh, upper_thresh)

# Create a binary mask for regions to apply alpha matting
alpha_matting_mask = (complex_regions > 254).astype(np.uint8) * 255

cv2.imwrite(f'./result_images/canny/{sigma}-{images[img_idx]}', alpha_matting_mask)
