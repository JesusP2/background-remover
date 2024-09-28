import { AiOutlineLoading } from 'solid-icons/ai';
import { Match, Switch, createEffect, createSignal, onMount } from 'solid-js';
import { DropZone } from '~/components/dropzone';
import { Navbar } from '~/components/nav';
import { Button, buttonVariants } from '~/components/ui/button';
import { fileToImage } from '~/hooks/use-grabcut-canvas/utils';
import { cn } from '~/lib/utils';
import { downscaleImage, removeBackground } from '~/lib/utils/image';

export default function Page() {
  const [originalFileUrl, setOriginalFileUrl] = createSignal<null | string>(
    null,
  );
  const [newFileUrl, setNewFileUrl] = createSignal<null | string>(null);
  const [fileName, setFileName] = createSignal<null | string>(null);
  const [windowSize, setWindowSize] = createSignal({
    height: 0,
    width: 0,
  });

  onMount(() => {
    setWindowSize({
      height: window.innerHeight,
      width: window.innerWidth,
    });
    window.addEventListener('resize', () => {
      setWindowSize({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    });
  });
  createEffect(() => {
    if (newFileUrl() === null) return;
    const slider = document.querySelector<HTMLElement>('.image-slider');
    const sliderImgWrapper =
      document.querySelector<HTMLElement>('.image-wrapper');
    const sliderHandle = document.querySelector<HTMLElement>('.handle');

    slider?.addEventListener('mousemove', sliderMouseMove);
    slider?.addEventListener('touchmove', sliderMouseMove);

    function sliderMouseMove(event: MouseEvent | TouchEvent) {
      if (isSliderLocked || !slider || !sliderImgWrapper || !sliderHandle)
        return;

      const sliderLeftX = slider?.offsetLeft;
      const sliderWidth = slider?.clientWidth;
      const sliderHandleWidth = sliderHandle?.clientWidth;

      // @ts-expect-error idk
      let mouseX = (event.clientX || event.touches[0].clientX) - sliderLeftX;
      if (mouseX < 0) mouseX = 0;
      else if (mouseX > sliderWidth) mouseX = sliderWidth;

      sliderImgWrapper.style.width = `${((mouseX / sliderWidth) * 100).toFixed(4)}%`;
      sliderHandle.style.left = `calc(${mouseX.toFixed(4)}px - ${sliderHandleWidth / 2}px)`;
    }

    let isSliderLocked = false;

    slider?.addEventListener('mousedown', sliderMouseDown);
    slider?.addEventListener('touchstart', sliderMouseDown);
    slider?.addEventListener('mouseup', sliderMouseUp);
    slider?.addEventListener('touchend', sliderMouseUp);
    slider?.addEventListener('mouseleave', sliderMouseLeave);

    function sliderMouseDown(event: MouseEvent | TouchEvent) {
      if (isSliderLocked) isSliderLocked = false;
      sliderMouseMove(event);
    }

    function sliderMouseUp() {
      if (!isSliderLocked) isSliderLocked = true;
    }

    function sliderMouseLeave() {
      if (isSliderLocked) isSliderLocked = false;
    }
  });

  return (
    <>
      <Navbar route="/one-shot" />
      <div class="grid place-items-center my-10">
        <Switch>
          <Match when={originalFileUrl() === null}>
            <div class="max-w-3xl w-full px-10">
              <h1 class="font-gabarito md:text-5xl sm:text-4xl text-3xl font-semibold">
                Background remover
              </h1>
              <DropZone
                class="mt-4"
                onFileChange={async (file) => {
                  const downscaledImage = await downscaleImage(file, 3840);
                  setFileName(file.name);
                  setOriginalFileUrl(URL.createObjectURL(downscaledImage));
                  const formData = new FormData();
                  formData.set('file', downscaledImage);
                  const res = await fetch('/api/remove-background', {
                    method: 'POST',
                    body: formData,
                  });
                  if (!res.ok) {
                    console.error(res);
                    console.error(await res.text());
                    return;
                  }
                  const data = await res.blob();
                  const mask = new File([data], file.name, {
                    type: 'image/jpeg',
                  });
                  const newImg = await removeBackground(
                    await fileToImage(downscaledImage),
                    await fileToImage(mask),
                  );
                  const url = URL.createObjectURL(newImg);
                  setNewFileUrl(url);
                }}
              />
            </div>
          </Match>
          <Match
            when={
              typeof originalFileUrl() === 'string' && newFileUrl() === null
            }
          >
            <div class="relative">
              <img
                alt="loading"
                style={{
                  'max-height': `${(windowSize().height / 5) * 3}px`,
                  'max-width': `${windowSize().width - 80}px`,
                }}
                src={originalFileUrl() ?? ''}
              />
              <div
                class="absolute top-0 grid place-items-center bg-white/30 w-full h-full backdrop-blur-sm"
                style={{
                  'max-height': `${(windowSize().height / 5) * 3}px`,
                  'max-width': `${windowSize().width - 80}px`,
                }}
              >
                <AiOutlineLoading size={50} class="animate-spin text-white" />
              </div>
            </div>
          </Match>
          <Match when={typeof newFileUrl() === 'string'}>
            <div>
              <div class="image-slider svg-bg">
                <div class="image-wrapper">
                  <img
                    src={originalFileUrl() ?? ''}
                    alt="original"
                    style={{
                      'max-height': `${(windowSize().height / 5) * 3}px`,
                      'max-width': `${windowSize().width - 80}px`,
                    }}
                  />
                </div>
                <img
                  src={newFileUrl() ?? ''}
                  alt="backgroundless"
                  class="z-0"
                  style={{
                    'max-height': `${(windowSize().height / 5) * 3}px`,
                    'max-width': `${windowSize().width - 80}px`,
                  }}
                />
                <div class="handle">
                  <div class="handle-line" />
                  <div class="handle-circle">
                    <i class="fas fa-chevron-left" />
                    <i class="fas fa-chevron-right" />
                  </div>
                  <div class="handle-line" />
                </div>
              </div>
              <div class="flex flex-col gap-y-4 items-center">
                <Button
                  class="w-40"
                  onClick={() => {
                    setNewFileUrl(null);
                    setOriginalFileUrl(null);
                  }}
                >
                  Go back
                </Button>
                <a
                  target="_self"
                  class={cn(buttonVariants({ variant: 'default' }), 'w-40')}
                  download={fileName() ?? ''}
                  href={newFileUrl() ?? ''}
                >
                  Download
                </a>
              </div>
            </div>
          </Match>
        </Switch>
      </div>
    </>
  );
}
