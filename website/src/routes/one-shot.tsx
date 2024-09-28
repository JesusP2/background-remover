import { Match, Switch, createEffect, createSignal } from 'solid-js';
import { DropZone } from '~/components/dropzone';
import { fileToImage } from '~/hooks/use-grabcut-canvas/utils';
import { downscaleImage, removeBackground } from '~/lib/utils/image';

export default function Page() {
  const [originalFileUrl, setOriginalFileUrl] = createSignal<null | string>(
    null,
  );
  const [newFileUrl, setNewFileUrl] = createSignal<null | string>(null);
  createEffect(() => {
    if (newFileUrl() === null) return;
    const slider = document.querySelector<HTMLElement>('.image-slider');
    const sliderImgWrapper = document.querySelector<HTMLElement>('.image-wrapper');
    const sliderHandle = document.querySelector<HTMLElement>('.handle');

    slider?.addEventListener('mousemove', sliderMouseMove);
    slider?.addEventListener('touchmove', sliderMouseMove);

    function sliderMouseMove(event: MouseEvent | TouchEvent) {
      if (isSliderLocked || !slider || !sliderImgWrapper || !sliderHandle) return;

      const sliderLeftX = slider?.offsetLeft;
      const sliderWidth = slider?.clientWidth;
      const sliderHandleWidth = sliderHandle?.clientWidth;

      let mouseX = (event.clientX || event.touches[0].clientX) - sliderLeftX;
      if (mouseX < 0) mouseX = 0;
      else if (mouseX > sliderWidth) mouseX = sliderWidth;

      sliderImgWrapper.style.width = `${((1 - mouseX / sliderWidth) * 100).toFixed(4)}%`;
      sliderHandle.style.left = `calc(${((mouseX / sliderWidth) * 100).toFixed(4)}% - ${sliderHandleWidth / 2}px)`;
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
    <Switch>
      <Match when={originalFileUrl() === null}>
        <DropZone
          onFileChange={async (file) => {
            const downscaledImage = await downscaleImage(file, 3840);
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
            const mask = new File([data], downscaledImage.name, {
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
      </Match>
      <Match when={typeof newFileUrl() === 'string'}>
        <div>
          <div class="image-slider">
            <div class="image-wrapper">
              <img src={originalFileUrl()} alt="GFG_Image" />
              <div class="handle">
                <div class="handle-line" />
                <div class="handle-circle">
                  <i class="fas fa-chevron-left" />
                  <i class="fas fa-chevron-right" />
                </div>
                <div class="handle-line" />
              </div>
            </div>
            <img src={newFileUrl()} alt="GFG_Image" />
          </div>
        </div>
      </Match>
    </Switch>
  );
}
