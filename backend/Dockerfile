# using ubuntu LTS version
FROM ubuntu:20.04 AS builder-image

# avoid stuck build due to user prompt
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install --no-install-recommends -y \
    python3.8 python3.8-dev python3.8-venv python3-pip python3-wheel build-essential \
    cmake pkg-config \
    git \
    libglib2.0-dev libsm6 libxext6 libxrender-dev libxfixes3 \
    libjpeg-dev libpng-dev libtiff-dev libwebp-dev libopenexr-dev \
    libavcodec-dev libavformat-dev libswscale-dev libv4l-dev libxvidcore-dev libx264-dev \
    libgtk-3-dev \
    libqt5gui5 libqt5widgets5 libqt5core5a qt5-default \
    libgl1-mesa-dev libgl1 \
    libtbb-dev liblapack-dev libblas-dev gfortran \
    && \
	apt-get clean && rm -rf /var/lib/apt/lists/*

# create and activate virtual environment
# using final folder name to avoid path issues with packages
RUN python3.8 -m venv /home/myuser/venv
ENV PATH="/home/myuser/venv/bin:$PATH"

# install requirements
COPY requirements.txt .
RUN pip3 install --no-cache-dir wheel
RUN pip3 install --no-cache-dir -r requirements.txt
RUN pip3 install torch einops opencv-python
RUN python3 -m pip install "git+https://github.com/facebookresearch/detectron2.git"

FROM ubuntu:20.04 AS runner-image
RUN apt-get update && apt-get install --no-install-recommends -y \
    python3.8 python3-venv \
    libgl1 libglib2.0-0 \
    libsm6 libxext6 libxrender1 libxfixes3 \
    libjpeg8 libtiff5 \
    libavcodec58 libavformat58 libswscale5 \
    libgtk-3-0 \
    libqt5gui5 libqt5widgets5 libqt5core5a \
    && \
	apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home myuser
COPY --from=builder-image /home/myuser/venv /home/myuser/venv

USER myuser
RUN mkdir /home/myuser/code
WORKDIR /home/myuser/code
COPY . .

EXPOSE 8000

# make sure all messages always reach console
ENV PYTHONUNBUFFERED=1

# activate virtual environment
ENV VIRTUAL_ENV=/home/myuser/venv
ENV PATH="/home/myuser/venv/bin:$PATH"

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]

