from segment_anything import SamPredictor, sam_model_registry
sam = sam_model_registry['vit_b'](checkpoint="./sam_vit_b.pth")
predictor = SamPredictor(sam)
