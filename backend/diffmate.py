import cv2
from PIL import Image
from re import findall
from os.path import join as opj
from torchvision.transforms import functional as F
from detectron2.engine import default_argument_parser
from detectron2.config import LazyConfig, instantiate
from detectron2.checkpoint import DetectionCheckpointer

def infer_one_image(model, input, save_dir=None):
    """
    Infer the alpha matte of one image.
    Input:
        model: the trained model
        image: the input image
        trimap: the input trimap
    """
    output = model(input)
    # output = cv2.cvtColor(output, cv2.COLOR_GRAY2RGB)
    # cv2.imwrite(opj(save_dir), output)

    return output

def init_model(model, checkpoint, device, sample_strategy):
    """
    Initialize the model.
    Input:
        config: the config file of the model
        checkpoint: the checkpoint of the model
    """
    cfg = LazyConfig.load(model)
    if sample_strategy is not None:
        cfg.difmatte.args["use_ddim"] = True if "ddim" in sample_strategy else False
        cfg.diffusion.steps = int(findall(r"\d+", sample_strategy)[0])
    
    model = instantiate(cfg.model)
    diffusion = instantiate(cfg.diffusion)
    cfg.difmatte.model = model
    cfg.difmatte.diffusion = diffusion
    difmatte = instantiate(cfg.difmatte)
    difmatte.to(device)
    difmatte.eval()
    DetectionCheckpointer(difmatte).load(checkpoint)
    
    return difmatte

def get_data(image, trimap):
    """
    Get the data of one image.
    Input:
        image_dir: the directory of the image
        trimap_dir: the directory of the trimap
    """
    image = F.to_tensor(image).unsqueeze(0)
    trimap = F.to_tensor(trimap).unsqueeze(0)

    # force tri-values in trimap
    trimap[trimap > 0.9] = 1.00000
    trimap[(trimap >= 0.1) & (trimap <= 0.9)] = 0.50000
    trimap[trimap < 0.1] = 0.00000

    return {
        'image': image,
        'trimap': trimap
    }


if __name__ == '__main__':
    parser = default_argument_parser()
    parser.add_argument('--config-dir', type=str, default='configs/ViTS_1024.py')
    parser.add_argument('--checkpoint-dir', type=str, default='checkpoint.pth')
    parser.add_argument('--image-dir', type=str, default='demo/retriever_rgb.png')
    parser.add_argument('--trimap-dir', type=str, default='demo/retriever_trimap.png')
    parser.add_argument('--output-dir', type=str, default='demo/result.png')
    parser.add_argument('--device', type=str, default='cpu')
    parser.add_argument('--sample-strategy', type=str, default="ddim10")

    args = parser.parse_args()
    input = get_data(args.image_dir, args.trimap_dir)
    print('Initializing model...Please wait...')
    model = init_model(args.config_dir, args.checkpoint_dir, args.device, args.sample_strategy)
    print('Model initialized. Start inferencing...')
    alpha = infer_one_image(model, input, args.output_dir)
    print('Inferencing finished.')

