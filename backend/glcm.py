import numpy as np
from skimage.feature import graycomatrix, graycoprops
import cv2
from time import time
from concurrent.futures import ProcessPoolExecutor

images = ["gojo.jpeg", "kojiro.jpg", "yuji.jpeg"]
img_idx = 0
img = cv2.imread(f"./test_images/{images[img_idx]}", cv2.IMREAD_GRAYSCALE)
# glcm = graycomatrix(img, [1], [0])
# contrast = graycoprops(glcm, "contrast")[0, 0]
# cv2.imwrite(f"./result_images/glcm/{images[img_idx]}", contrast)


def compute_glcm_features(
    image,
    distances=[1],
    angles=[0, np.pi / 4, np.pi / 2, 3 * np.pi / 4],
    levels=256,
    symmetric=True,
    normed=True,
):
    # Convert the image to grayscale if it's not already
    if len(image.shape) == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Compute GLCM
    glcm = graycomatrix(
        image,
        distances=distances,
        angles=angles,
        levels=levels,
        symmetric=symmetric,
        normed=normed,
    )

    # Compute GLCM properties
    contrast = graycoprops(glcm, "contrast")
    dissimilarity = graycoprops(glcm, "dissimilarity")
    homogeneity = graycoprops(glcm, "homogeneity")
    energy = graycoprops(glcm, "energy")
    correlation = graycoprops(glcm, "correlation")

    # Compute mean of each property
    features = [
        contrast.mean(),
        dissimilarity.mean(),
        homogeneity.mean(),
        energy.mean(),
        correlation.mean(),
    ]

    return features


def analyze_image_texture(image, patch_size=32, step=16):
    height, width = image.shape[:2]
    texture_map = np.zeros((height, width))

    for y in range(0, height - patch_size, step):
        for x in range(0, width - patch_size, step):
            patch = image[y : y + patch_size, x : x + patch_size]
            features = compute_glcm_features(patch)

            # You might want to focus on specific features or combine them
            texture_score = features[0]  # Using contrast as an example

            texture_map[y : y + patch_size, x : x + patch_size] = texture_score

    # Normalize the texture map
    texture_map = cv2.normalize(texture_map, None, 0, 255, cv2.NORM_MINMAX)
    texture_map = texture_map.astype(np.uint8)

    return texture_map


def compute_glcm_features2(patch):
    glcm = graycomatrix(
        patch, distances=[1], angles=[0], levels=256, symmetric=True, normed=True
    )
    contrast = graycoprops(glcm, "contrast")[0, 0]
    dissimilarity = graycoprops(glcm, "dissimilarity")[0, 0]
    homogeneity = graycoprops(glcm, "homogeneity")[0, 0]
    energy = graycoprops(glcm, "energy")[0, 0]
    correlation = graycoprops(glcm, "correlation")[0, 0]

    # Combine features into a single score
    # You can adjust these weights based on which properties you find most important
    score = (
        contrast * 0.4
        + dissimilarity * 0.3
        + (1 - homogeneity)
        * 0.1  # Invert homogeneity as high homogeneity usually means less texture
        + (1 - energy) * 0.1  # Invert energy for the same reason
        + abs(correlation) * 0.1
    )  # Use absolute correlation

    return score


def process_patch(args):
    image, y, x, patch_size = args
    patch = image[y : y + patch_size, x : x + patch_size]
    return (y, x, compute_glcm_features2(patch))


def analyze_image_texture2(image, patch_size=32, step=32, downscaling=True):
    max_x = 1080
    max_y = 720
    scale_factor = 1
    small_image = image
    if image.shape[0] > max_y and downscaling:
        scale_factor = max_y / image.shape[0]
        small_image = cv2.resize(image, None, fx=scale_factor, fy=scale_factor)
    elif image.shape[1] > max_x and downscaling:
        scale_factor = max_x / image.shape[1]
        small_image = cv2.resize(image, None, fx=scale_factor, fy=scale_factor)

    if len(small_image.shape) == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    height, width = small_image.shape[:2]
    texture_map = np.zeros((height, width), dtype=np.float32)

    # Prepare arguments for multiprocessing
    args_list = [
        (small_image, y, x, patch_size)
        for y in range(0, height - patch_size + 1, step)
        for x in range(0, width - patch_size + 1, step)
    ]

    # Use multiprocessing to compute features
    with ProcessPoolExecutor() as executor:
        results = list(executor.map(process_patch, args_list))

    # Fill the texture map
    for y, x, score in results:
        texture_map[y : y + patch_size, x : x + patch_size] = score

    if scale_factor != 1:
        texture_map = cv2.resize(texture_map, (image.shape[1], image.shape[0]))

    # Normalize the texture map
    texture_map = cv2.normalize(texture_map, None, 0, 255, cv2.NORM_MINMAX)
    texture_map = texture_map.astype(np.uint8)

    return texture_map


start = time()
# Analyze the image
texture_map = analyze_image_texture2(img, patch_size=16, step=128, downscaling=False)
# Apply threshold to find noisy areas
threshold = 200  # Adjust this value based on your needs
_, noisy_areas = cv2.threshold(texture_map, threshold, 255, cv2.THRESH_BINARY)
end = time()
print(f"total time: {end - start}")
cv2.imwrite(f"./result_images/glcm/noisy_areas-{images[img_idx]}", noisy_areas)
