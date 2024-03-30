import cv2 as cv
import numpy as np
from matplotlib import pyplot as plt

img = cv.imread("gojo.jpeg")
custom_mask = cv.imread("newmask.png", cv.IMREAD_GRAYSCALE)
mask = np.zeros(img.shape[:2], np.uint8)
mask[:] = cv.GC_PR_BGD
# mask[custom_mask == 147] = cv.GC_BGD
mask[custom_mask == 255] = cv.GC_PR_FGD
bgdModel = np.zeros((1, 65), np.float64)
fgdModel = np.zeros((1, 65), np.float64)
# cv.grabCut(img, mask, None, bgdModel, fgdModel, 5, cv.GC_INIT_WITH_MASK)
mask2 = np.where((mask == 1) + (mask == 3), 255, 0).astype("uint8")
output = cv.bitwise_and(img, img, mask=mask2)
plt.imshow(output)
plt.colorbar()
plt.show()
