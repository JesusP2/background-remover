from PIL import Image, ImageOps
import cv2
import numpy as np
import matplotlib.pyplot as plt

# Load the image
# img = cv2.imread("gojo.jpeg")
_img = Image.open("gojo.jpeg").convert("RGB")
img = cv2.cvtColor(np.array(_img), cv2.COLOR_RGB2BGR)
print(img.shape)

# Create a 0's mask
mask = np.zeros(img.shape[:2], np.uint8)
# Create 2 arrays for background and foreground model
bgdModel = np.zeros((1, 65), np.float64)
fgdModel = np.zeros((1, 65), np.float64)

rect = (1, 1, 736, 1308)
mask, bgdModel, fgdModel = cv2.grabCut(
    img, mask, rect, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_RECT
)
# mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")
# img_seg = img * mask2[:, :, np.newaxis]

_img_mask = Image.open('newmask4.png').convert("RGB")
mask_grey = cv2.cvtColor(np.array(_img_mask), cv2.COLOR_RGB2GRAY)
# img_mask = cv2.imread("newmask4.png")
# Convert the mask to grey and threshold it
# mask_grey = cv2.cvtColor(img_mask, cv2.COLOR_RGB2GRAY)
# ret, mask1 = cv2.threshold(mask_grey, 200, 255, 0)
mask[mask_grey == 76] = cv2.GC_BGD
mask[mask_grey == 255] = cv2.GC_FGD
mask, bgdModel, fgdModel = cv2.grabCut(
    img, mask, None, bgdModel, fgdModel, 1, cv2.GC_INIT_WITH_MASK
)

mask_final = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")
img_out = img * mask_final[:, :, np.newaxis]
plt.imshow(img_out)
plt.show()
