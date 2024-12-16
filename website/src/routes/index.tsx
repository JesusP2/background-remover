import { A, useAction, useNavigate } from '@solidjs/router';
import { Match, Show, Switch, createSignal, onMount } from 'solid-js';
import { ulid } from 'ulidx';
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
import { Drawer, DrawerContent, DrawerTrigger } from '~/components/ui/drawer';
import { CanvasAlphaMaskAnimation } from '~/components/image-animation';

import { Card, CardContent } from '~/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';

const CarouselDemo = () => {
  return (
    <Carousel class="w-full max-w-md">
      <CarouselContent>
        <CarouselItem>
          <div class="p-1">
            <Card>
              <CardContent class="flex aspect-square items-center justify-center p-6">
                <div class="h-full w-full rounded-sm shadow-sm grid place-items-center">
                  <CanvasAlphaMaskAnimation
                    canvasId="myCanvas"
                    url1="/img-without-bg-4.png"
                    url2="/img-with-bg-4.png"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div class="p-1">
            <Card>
              <CardContent class="flex aspect-square items-center justify-center p-6">
                <CanvasAlphaMaskAnimation
                  canvasId="myCanvas2"
                  url1="/img-without-bg-5.png"
                  url2="/img-with-bg-5.png"
                />
              </CardContent>
            </Card>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div class="p-1">
            <Card>
              <CardContent class="flex aspect-square items-center justify-center p-6">
                <CanvasAlphaMaskAnimation
                  canvasId="myCanvas3"
                  url1="/img-without-bg-3.png"
                  url2="/img-without-bg-3.jpg"
                />
              </CardContent>
            </Card>
          </div>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function GetStartedButton(props: any) {
  return (
    <button class="relative h-12" {...props}>
      <div class="border-2 border-black bg-white rounded-lg w-36 h-12 relative">
        <div class="bg-black w-36 h-12 relative top-[-0.7rem] rounded-lg text-white grid place-items-center font-gabarito text-lg group-hover:top-[-0.4rem] group-hover:left-[0.2rem] left-[0.5rem] duration-100">
          Get Started
        </div>
      </div>
    </button>
  );
}

export default function Page() {
  const [editorSelected, setEditorSelected] = createSignal(false);
  const [_, setInitialFile] = initialFileSignal;
  const createWritePresignedUrl = useAction(createWritePresignedUrlAction);
  const uploadImage = useAction(uploadImageAction);
  const navigate = useNavigate();
  const [displayOn, setDisplayOn] = createSignal<'drawer' | 'dialog'>('dialog');

  onMount(() => {
    function onResize() {
      if (window.innerWidth <= 640 && displayOn() === 'dialog') {
        setDisplayOn('drawer');
      } else if (window.innerWidth > 640 && displayOn() === 'drawer') {
        setDisplayOn('dialog');
      }
    }
    onResize();
    window.addEventListener('resize', onResize);
  });

  async function processFile(file: File) {
    const id = ulid();
    navigate(`/canvas/grabcut/${id}`);
    const downscaledImage = await downscaleImage(file, 3840);
    setInitialFile(downscaledImage);
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
  }

  return (
    <div>
      <Navbar route="/" />
      <main class="grid place-items-center gap-y-10 mt-10 px-4 max-w-7xl mx-auto">
        <h1 class="font-gabarito lg:text-6xl md:text-5xl sm:text-4xl text-3xl font-semibold z-10">
          Background Removal App
        </h1>
        <div class="group z-10">
          <Switch>
            <Match when={displayOn() === 'dialog'}>
              <Dialog
                onOpenChange={() => {
                  setEditorSelected(false);
                }}
              >
                <DialogTrigger as={GetStartedButton} />
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
                    <DropZone onFileChange={processFile} />
                  </Show>
                </DialogContentWithoutClose>
              </Dialog>
            </Match>
            <Match when={displayOn() === 'drawer'}>
              <Drawer>
                <DrawerTrigger as={GetStartedButton} variant="outline" />
                <DrawerContent>
                  <div class="mx-auto w-full max-w-sm mb-8">
                    <div class="p-4 pb-0 flex flex-col gap-y-2">
                      <A
                        href="/one-shot"
                        class={buttonVariants({ variant: 'outline' })}
                      >
                        One shot
                      </A>
                      <label
                        for="editorImage"
                        class={buttonVariants({ variant: 'outline' })}
                      >
                        Editor
                      </label>
                      <input
                        id="editorImage"
                        name="editorImage"
                        hidden
                        type="file"
                        onChange={async (e) => {
                          const file = e.currentTarget.files?.[0];
                          if (!file) return;
                          await processFile(file);
                        }}
                      />
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </Match>
          </Switch>
        </div>
        <CarouselDemo />
      </main>
    </div>
  );
}
