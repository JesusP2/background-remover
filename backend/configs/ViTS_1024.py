from .common.train import train
from .common.model import model
from .common.diffusion import diffusion
from .common.difmatte import difmatte
from .common.optimizer import optimizer
from .common.scheduler import lr_multiplier
from .common.dataloader import dataloader
from .common.dataloader import train_dataset
from .common.dataloader import train_dataset
from .common.loss import loss

train.max_iter = int(43100 / 8 / 4 * 200)
train.checkpointer.period = int(43100 / 8 / 4 * 10)
train.self_align_stage1_step = int(43100 / 8 / 4 * 1000)
train.self_align_stage2_step = int(43100 / 8 / 4 * 100)

optimizer.lr=5e-5
lr_multiplier.scheduler.values=[1.0, 0.1, 0.05, 0.01]
lr_multiplier.scheduler.milestones=[int(43100 / 8 / 4 * 60), int(43100 / 8 / 4 * 110), int(43100 / 8 / 4 * 170)]
lr_multiplier.scheduler.num_updates = train.max_iter
lr_multiplier.warmup_length = 250 / train.max_iter

train.init_checkpoint = 'INIT_CHECKPOINT'
train.output_dir = './output_of_train/ViTS_1024'

train_dataset.crop_size = 1024
model.backbone.kwargs['img_size'] = 1024
dataloader.train.batch_size = 8

model.backbone.name = "ViT"
model.decoder_in_channel = 7

dataloader.train.num_workers = 4

loss.use_mse = True
loss.use_mat = True

diffusion.steps = 1
diffusion.noise_schedule = "linear"
diffusion.scale = 0.2

difmatte.args["use_ddim"] = False