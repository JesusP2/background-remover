import { A, useAction, useNavigate } from '@solidjs/router';
import { Show, batch, createSignal, onMount } from 'solid-js';
import { ulid } from 'ulidx';
import { DraggableImg } from '~/components/draggable-img';
import { DropZone } from '~/components/dropzone';
import { Navbar } from '~/components/nav';
import { Button, buttonVariants } from '~/components/ui/button';
import {
  Dialog,
  DialogContentWithoutClose,
  DialogTrigger,
} from '~/components/ui/dialog';
import { createWritePresignedUrlAction } from '~/lib/actions/create-presigned-url';
import { uploadImageAction } from '~/lib/actions/init-image-process';
import initialFileSignal from '~/lib/stores/initial-file';
import { downscaleImage } from '~/lib/utils/image';

type Coordinates = {
  x: number;
  y: number;
};
export default function Page() {
  const [editorSelected, setEditorSelected] = createSignal(false);
  const [_, setInitialFile] = initialFileSignal;
  const createWritePresignedUrl = useAction(createWritePresignedUrlAction);
  const uploadImage = useAction(uploadImageAction);
  const navigate = useNavigate();
  const [position1, setPosition1] = createSignal({
    x: -335,
    y: -93,
  });
  const [position2, setPosition2] = createSignal({
    x: -143,
    y: 404,
  });
  const [position3, setPosition3] = createSignal({
    x: 117,
    y: -98,
  });

  onMount(() => {
    const images = document.querySelectorAll('img');
    for (const image of images) {
      image.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });
    }

    function updateImagesPosition({
      img1,
      img2,
      img3,
    }: {
      img1: Coordinates;
      img2: Coordinates;
      img3: Coordinates;
    }) {
      batch(() => {
        setPosition1({
          x: img1.x,
          y: img1.y,
        });
        setPosition2({
          x: img2.x,
          y: img2.y,
        });
        setPosition3({
          x: img3.x,
          y: img3.y,
        });
      });
    }
    function onResize() {
      if (window.innerWidth < 770) {
        updateImagesPosition({
          img1: { x: -270, y: -48 },
          img2: { x: -186, y: 289 },
          img3: { x: 96, y: -28 },
        });
      } else if (window.innerWidth < 1024) {
        updateImagesPosition({
          img1: { x: -295, y: -93 },
          img2: { x: -133, y: 321 },
          img3: { x: 102, y: -99 },
        });
      } else {
        updateImagesPosition({
          img1: { x: -335, y: -93 },
          img2: { x: -143, y: 404 },
          img3: { x: 117, y: -98 },
        });
      }
    }
    onResize();

    window.addEventListener('resize', onResize);
  });

  return (
    <div>
      <Navbar route="/" />
      <main class="grid place-items-center gap-y-10 mt-10 px-4 max-w-7xl mx-auto">
        <h1 class="font-gabarito lg:text-6xl md:text-5xl sm:text-4xl text-3xl font-semibold z-10">
          Background Removal App
        </h1>
        <div class="group z-10">
          <Dialog
            onOpenChange={() => {
              setEditorSelected(false);
            }}
          >
            <DialogTrigger
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              as={(props: any) => (
                <button class="relative h-12" {...props}>
                  <div class="border-2 border-black bg-white rounded-lg w-36 h-12 relative">
                    <div class="bg-black w-36 h-12 relative top-[-0.7rem] rounded-lg text-white grid place-items-center font-gabarito text-lg group-hover:top-[-0.4rem] group-hover:left-[0.2rem] left-[0.5rem] duration-100">
                      Get Started
                    </div>
                  </div>
                </button>
              )}
            />
            <DialogContentWithoutClose>
              <Show when={!editorSelected()}>
                <A
                  href="/one-shot"
                  class={buttonVariants({ variant: 'outline' })}
                >
                  One shot
                </A>
                <Button
                  variant="outline"
                  onClick={() => setEditorSelected(true)}
                >
                  Editor
                </Button>
              </Show>
              <Show when={editorSelected()}>
                <DropZone
                  onFileChange={async (file) => {
                    const id = ulid();
                    const downscaledImage = await downscaleImage(file, 3840);
                    setInitialFile(downscaledImage);
                    navigate(`/canvas/grabcut/${id}`);
                    const [fileUrl, resultUrl] = await Promise.all([
                      createWritePresignedUrl(
                        `${id}-${downscaledImage.name}`,
                        downscaledImage.type,
                        downscaledImage.size,
                      ),
                      createWritePresignedUrl(
                        `${id}-result.png`,
                        downscaledImage.type,
                        downscaledImage.size,
                      ),
                    ]);
                    if (!fileUrl || !resultUrl) return;
                    const config = {
                      method: 'PUT',
                      body: downscaledImage,
                      headers: {
                        'Content-Type': downscaledImage.type,
                      },
                    };
                    await Promise.all([
                      fetch(fileUrl, config),
                      fetch(resultUrl, config),
                      uploadImage(id, downscaledImage.name),
                    ]);
                  }}
                />
              </Show>
            </DialogContentWithoutClose>
          </Dialog>
        </div>
        <div class="relative">
          <DraggableImg
            img1={{
              src: '/img-without-bg-2.png',
              alt: 'img-with-bg-2',
              class: 'w-36 md:w-48 lg:w-56',
            }}
            img2={{
              src: '/img-without-bg-2.jpeg',
              alt: 'img-without-bg-2',
              class: 'w-16 md:w-20 lg:w-28',
            }}
            position={position1}
            setPosition={setPosition1}
          />
          <DraggableImg
            img1={{
              src: '/img-without-bg-6.png',
              alt: 'img-with-bg-6',
              class: 'w-64 lg:w-80',
            }}
            img2={{
              src: '/img-without-bg-6.jpg',
              alt: 'img-without-bg-6',
              class: 'w-28 lg:w-36',
            }}
            position={position2}
            setPosition={setPosition2}
          />
          <DraggableImg
            img1={{
              src: '/img-without-bg-8.png',
              alt: 'img-with-bg-8',
              class: 'w-48 md:w-64 lg:w-80',
            }}
            img2={{
              src: '/img-without-bg-8.jpeg',
              alt: 'img-without-bg-8',
              class: 'w-20 md:w-28 lg:w-36',
            }}
            position={position3}
            setPosition={setPosition3}
          />
        </div>
      </main>
    </div>
  );
}
