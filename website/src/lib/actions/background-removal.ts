import { action } from '@solidjs/router';
import {
  AutoModel,
  AutoProcessor,
  type PreTrainedModel,
  type Processor,
  RawImage,
} from '@xenova/transformers';

const model_id = 'onnx-community/BiRefNet_lite';
let model: PreTrainedModel;
let processor: Processor;
export const removeBackgroundAction = action(async (file: File) => {
  'use server';
  if (!model) {
    model = await AutoModel.from_pretrained(model_id, {
      // @ts-expect-error idk
      dtype: 'fp16',
      quantized: false,
    });
  }
  if (!processor) {
    processor = await AutoProcessor.from_pretrained(model_id);
  }

  const image = await RawImage.fromBlob(file);

  const { pixel_values } = await processor(image);

  const { output_image } = await model({ input_image: pixel_values });

  const mask = await RawImage.fromTensor(
    output_image[0].sigmoid().mul(255).to('uint8'),
  ).resize(image.width, image.height);
  const idk = await mask.toBlob('image/jpeg');
  return idk;
});
