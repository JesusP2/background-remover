import { A, useAction, useNavigate } from '@solidjs/router';
import { Show, createSignal } from 'solid-js';
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

export default function Page() {
  const [editorSelected, setEditorSelected] = createSignal(false);
  const [_, setInitialFile] = initialFileSignal;
  const createWritePresignedUrl = useAction(createWritePresignedUrlAction);
  const uploadImage = useAction(uploadImageAction);
  const navigate = useNavigate();

  return (
    <div>
      <Navbar route="/" />
      <main class="grid place-items-center gap-y-10 mt-10 px-4 max-w-7xl mx-auto h-[20vh] overflow-hidden">
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
        <img src="/img-without-bg-2.jpeg" alt="img-without-bg-2" class="absolute" />
        <img
          src="/collage.png"
          alt="collage"
          class="absolute sm:top-[-130px]"
        />
      </main>
    </div>
  );
}
