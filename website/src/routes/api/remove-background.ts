import type { APIHandler } from "@solidjs/start/server";
import {
  AutoModel,
  AutoProcessor,
  type PreTrainedModel,
  type Processor,
  RawImage,
} from "@xenova/transformers";
import { appendResponseHeader } from "vinxi/http";
import { uploadFile } from "~/lib/r2";

const model_id = "onnx-community/BiRefNet_lite";
let model: PreTrainedModel;
let processor: Processor;

export const GET: APIHandler = async () => {
  return {
    hello: "bye",
  };
};

export const POST: APIHandler = async ({ request, response, nativeEvent }) => {
  const formData = await request.formData();

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const file = formData.get("file") as File;
  if (!model) {
    model = await AutoModel.from_pretrained(model_id, {
      // @ts-expect-error idk
      dtype: "fp16",
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
    output_image[0].sigmoid().mul(255).to("uint8"),
  ).resize(image.width, image.height);
  const buffer = await mask
    .toSharp()
    .toFormat("jpeg")
    .jpeg()
    .toBuffer();
  nativeEvent.node.res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
  }).end(buffer)
};
