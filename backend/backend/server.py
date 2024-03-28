from fastapi import FastAPI, File
import io
import base64
import numpy as np
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# post endpoint
@app.post("/image")
async def remove_background(file: bytes = File()):
    array = bytesToArray(file)
    positive_points = np.array([[1653, 586]], dtype=np.float32)
    negative_points = np.array([[0, 0]], dtype=np.float32)
    prompt = createPrompt(positive_points, negative_points)
    return { "message": "completed"}


def createPrompt(positive_points: np.ndarray, negative_points: np.ndarray):
    prompt = np.zeros((len(positive_points) + len(negative_points), 2), dtype=np.float32)
    prompt[:len(positive_points)] = positive_points
    prompt[len(positive_points):] = negative_points
    return prompt
    labels = np.concatenate([np.ones(len(positive_points)), np.zeros(len(negative_points))])

def ImgToBase64(image):
    img_buffer = io.BytesIO()
    image.save(img_buffer, format='PNG')
    byte_data = img_buffer.getvalue()
    base64_str = base64.b64encode(byte_data)
    return base64_str


def bytesToArray(bytes):
    stream =io.BytesIO(bytes)
    array = np.array(Image.open(stream).convert('RGB'))
    return array

def TensorToImage(tensor, img_size):
    predict = tensor
    predict = predict.squeeze()
    predict_np = predict.cpu().data.numpy()
    im = Image.fromarray(predict_np*255).convert('RGB')
    return im.resize((img_size[0], img_size[1]), resample=Image.BILINEAR)
