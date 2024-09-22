import {
  AutoModel,
  AutoProcessor,
  RawImage,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0-alpha.15/dist/transformers.min.js";

export class BirefnetSingleton {
  // static model_id = "Xenova/modnet";
  static model_id = "onnx-community/BiRefNet_lite";
  static model;
  static processor;
  static getInstance() {
    if (!this.model) {
      this.model = AutoModel.from_pretrained(this.model_id, {
        quantized: false,
      });
    }
    if (!this.processor) {
      this.processor = AutoProcessor.from_pretrained(this.model_id);
    }
    return Promise.all([this.model, this.processor]);
  }
}
let ready = false;
self.onmessage = async (e) => {
  const [model, processor] = await BirefnetSingleton.getInstance();
  if (!ready) {
    ready = true;
    self.postMessage({
      type: "ready",
    });
  }

  const { type, data } = e.data;
  if (type !== "remove_background") {
    throw new Error(`Unknown message type: ${type}`);
  }
  self.postMessage({
    type: "remove_background_result",
    data: "start",
  });
  const image = await RawImage.fromBlob(data);
  const { pixel_values } = await processor(image);

  const { output_image } = await model({ input_image: pixel_values });
  const mask = await RawImage.fromTensor(
    output_image[0].sigmoid().mul(255).to("uint8"),
  ).resize(image.width, image.height);
  self.postMessage({
    type: "remove_background_result",
    data: {
      mask: mask,
    },
  });
};
