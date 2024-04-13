import pymatting

scale = 1.0

image = pymatting.load_image("cat.png", "RGB", scale, "box")
trimap = pymatting.load_image("cat_trimap.png", "GRAY", scale, "nearest")

# estimate alpha from image and trimap
alpha = pymatting.estimate_alpha_cf(image, trimap)

# estimate foreground from image and alpha
foreground = pymatting.estimate_foreground_ml(image, alpha)

# save cutout
cutout = pymatting.stack_images(foreground, alpha)
pymatting.save_image("withoutbg4.png", cutout)
