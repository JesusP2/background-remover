import numpy as np
import cv2
from time import time
import base64
from svgwrite import Drawing


def image_to_single_line_svg_base64(img):
    
    # Detect edges
    edges = cv2.Canny(img, 100, 200)
    
    # Find non-zero points (edge points)
    points = np.column_stack(np.where(edges > 0))
    
    # Order points to form a continuous path
    ordered_points = order_points(points)
    
    # Create SVG drawing
    dwg = Drawing(size=(img.shape[1], img.shape[0]))
    
    # Create path data
    path_data = "M " + " L ".join([f"{x},{y}" for y, x in ordered_points])
    
    # Add path to SVG with dashed stroke
    dwg.add(dwg.path(d=path_data, fill='none', stroke='yellow', stroke_width=2, 
                     stroke_dasharray='5,5'))
    
    # Convert SVG to string
    svg_string = dwg.tostring()
    
    # Convert SVG string to bytes
    svg_bytes = svg_string.encode('utf-8')
    
    # Convert bytes to base64
    svg_base64 = base64.b64encode(svg_bytes).decode('utf-8')
    
    return svg_base64

def order_points(points):
    # Simple nearest neighbor algorithm to order points
    ordered = [points[0]]
    points = points[1:]
    while len(points) > 0:
        last = ordered[-1]
        distances = np.sum((points - last) ** 2, axis=1)
        nearest_index = np.argmin(distances)
        ordered.append(points[nearest_index])
        points = np.delete(points, nearest_index, axis=0)
    return ordered



def image_to_svg_base64(img):
    # Detect edges
    edges = cv2.Canny(img, 100, 200)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Create SVG drawing
    dwg = Drawing(size=(img.shape[1], img.shape[0]))
    
    # Add each contour as a path in the SVG
    for contour in contours:
        contour = contour.reshape(-1, 2)
        
        # Create path data
        path_data = f"M {contour[0][0]},{contour[0][1]}"
        for point in contour[1:]:
            path_data += f" L {point[0]},{point[1]}"
        path_data += " Z"
        
        # Add path to SVG
        dwg.add(dwg.path(d=path_data, fill='none', stroke='black'))
    
    # Convert SVG to string
    svg_string = dwg.tostring()
    
    # Convert SVG string to bytes
    svg_bytes = svg_string.encode('utf-8')
    
    # Convert bytes to base64
    svg_base64 = base64.b64encode(svg_bytes).decode('utf-8')
    
    return f"data:image/svg+xml;base64,{svg_base64}"

def save_base64_to_file(base64_string, file_path):
    # Remove the data URL prefix if it exists
    if base64_string.startswith('data:image/svg+xml;base64,'):
        base64_string = base64_string.split(',')[1]

    # Decode the base64 string
    svg_bytes = base64.b64decode(base64_string)

    # Write the bytes to a file
    with open(file_path, 'wb') as f:
        f.write(svg_bytes)


# from trimap_generation_attempt_1 import create_trimap, dbscan_clustering
from lib.color_variance import create_alpha_matting_mask
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
image = cv2.imread("./test_images/kojiro.jpg", cv2.IMREAD_COLOR)
_, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)

vicinity = get_vicinity(mask)
cv2.imwrite(f"./result_images/pipeline/vicinity.jpg", vicinity)

# find noise using color variance
color_variance_mask = create_alpha_matting_mask(image, threshold_method="mean_std")

overlap = create_overlap_mask(vicinity, color_variance_mask)
cv2.imwrite(f"./result_images/pipeline/overlap.jpg", overlap)

overlap_trimap = create_trimap(dbscan_clustering(overlap), 70)
trimap = cv2.bitwise_or(mask, overlap_trimap)
cv2.imwrite(f"./result_images/pipeline/trimap.jpg", trimap)

# trimap op
rgb_img = cv2.imread("./test_images/kojiro.jpg", cv2.IMREAD_COLOR)
rgb_img_float = rgb_img.astype(np.float64) / 255.0
trimap_float = trimap.astype(np.float32) / 255.0
alpha, rgba_img = apply_trimap(rgb_img, trimap_float, "RGB")
# ---------------------------
contour_start_time = time()
_, alpha = cv2.threshold(alpha, 127, 255, cv2.THRESH_BINARY)
contours, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
height, width = alpha.shape
contour_image = np.zeros((height, width, 3), dtype=np.uint8)

# Smooth the contours
smoothed_contours = []
for contour in contours:
    # Calculate the perimeter of the contour
    perimeter = cv2.arcLength(contour, True)
    # Approximate the contour
    epsilon = 0.001 * perimeter  # Adjust this value to control smoothness
    approx = cv2.approxPolyDP(contour, epsilon, True)
    smoothed_contours.append(approx)

# Draw the smoothed contours
cv2.drawContours(contour_image, smoothed_contours, -1, (0, 255, 255), 2)

rgb_and = cv2.bitwise_or(rgb_img, contour_image)
svg_base64 = image_to_svg_base64(contour_image)
contour_end_time = time() - contour_start_time
cv2.imwrite(f"./result_images/pipeline/contour.jpg", contour_image)
save_base64_to_file(svg_base64, './result_images/pipeline/contour.svg')

# ----------------------------
svg_base64_2 = image_to_single_line_svg_base64(alpha)
save_base64_to_file(svg_base64_2, './result_images/pipeline/contour2.svg')
# ----------------------------
cv2.imwrite(f"./result_images/pipeline/rgba_img.png", rgba_img)
